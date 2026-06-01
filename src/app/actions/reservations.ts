"use server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import type { Prisma } from "@prisma/client";

const HOLD_MINUTES = 10;

// Lazy cleanup: called at start of every reservation transaction
async function expireHeldSpots(tx: Prisma.TransactionClient) {
  await tx.spot.updateMany({
    where: { status: "HELD", heldUntil: { lt: new Date() } },
    data: { status: "AVAILABLE", heldUntil: null },
  });
  // Also release reservations whose hold expired
  await tx.reservation.updateMany({
    where: { status: "HELD", heldUntil: { lt: new Date() } },
    data: { status: "CANCELLED" },
  });
}

// Find N consecutive spots in a zone (same zone, consecutive positions, all AVAILABLE)
export async function findConsecutiveSpotsAction(
  eventId: string,
  count: number
): Promise<{ spotIds: string[]; zoneId: string; totalPrice: number } | { error: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Non authentifié" };

  // Expire held spots first (lazy)
  await db.spot.updateMany({
    where: { eventId, status: "HELD", heldUntil: { lt: new Date() } },
    data: { status: "AVAILABLE", heldUntil: null },
  });

  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "OPEN") return { error: "Événement non disponible" };

  // Get all available spots grouped by zone, sorted by position
  const spots = await db.spot.findMany({
    where: { eventId, status: "AVAILABLE" },
    include: { zone: true },
    orderBy: [{ zoneId: "asc" }, { position: "asc" }],
  });

  // Find a window of `count` consecutive positions in a single zone
  const byZone = new Map<string, typeof spots>();
  for (const s of spots) {
    if (!byZone.has(s.zoneId)) byZone.set(s.zoneId, []);
    byZone.get(s.zoneId)!.push(s);
  }

  for (const [zoneId, zoneSpots] of byZone) {
    if (zoneSpots.length < count) continue;
    // Slide window looking for `count` consecutive positions
    for (let i = 0; i <= zoneSpots.length - count; i++) {
      const window = zoneSpots.slice(i, i + count);
      const consecutive = window.every(
        (s, idx) => idx === 0 || s.position === window[idx - 1].position + 1
      );
      if (consecutive) {
        const spotIds = window.map((s) => s.id);
        const totalPrice = window.reduce(
          (sum, s) => sum + s.basePrice + s.zone.priceModifier,
          0
        );
        return { spotIds, zoneId, totalPrice };
      }
    }
  }

  return { error: `Aucun emplacement disponible pour ${count} place(s) consécutive(s)` };
}

// Validate that selected spot IDs are consecutive (same zone, consecutive positions)
export async function validateConsecutiveSelectionAction(
  spotIds: string[]
): Promise<{ valid: boolean; error?: string }> {
  if (spotIds.length <= 1) return { valid: true };

  const spots = await db.spot.findMany({
    where: { id: { in: spotIds } },
    orderBy: { position: "asc" },
  });

  const zoneIds = new Set(spots.map((s) => s.zoneId));
  if (zoneIds.size > 1) return { valid: false, error: "Tous les emplacements doivent être dans la même allée" };

  for (let i = 1; i < spots.length; i++) {
    if (spots[i].position !== spots[i - 1].position + 1) {
      return { valid: false, error: "Les emplacements doivent être consécutifs" };
    }
  }
  return { valid: true };
}

export type HoldResult =
  | { ok: true; reservationId: string; heldUntil: Date }
  | { ok: false; error: string };

// Atomically hold spots and create reservation
export async function holdSpotsAction(
  eventId: string,
  spotIds: string[],
  mode: "AUTO" | "CHOSEN"
): Promise<HoldResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Non authentifié" };
  if (spotIds.length === 0) return { ok: false, error: "Aucun emplacement sélectionné" };

  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "OPEN") return { ok: false, error: "Événement non disponible" };

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Lazy expire
      await expireHeldSpots(tx);

      // 2. Check all spots are AVAILABLE
      const spots = await tx.spot.findMany({
        where: { id: { in: spotIds }, status: "AVAILABLE", eventId },
        include: { zone: true },
      });

      if (spots.length !== spotIds.length) {
        throw new Error("SPOTS_UNAVAILABLE");
      }

      // 3. Calculate price
      const spotsPrice = spots.reduce(
        (sum, s) => sum + s.basePrice + s.zone.priceModifier,
        0
      );
      const supplement = mode === "CHOSEN" ? event.choiceSupplement : 0;
      const totalPrice = spotsPrice + supplement;

      // 4. Hold spots
      const heldUntil = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);
      await tx.spot.updateMany({
        where: { id: { in: spotIds } },
        data: { status: "HELD", heldUntil },
      });

      // 5. Create reservation (HELD)
      const reservation = await tx.reservation.create({
        data: {
          eventId,
          userId: session.user!.id,
          mode,
          choiceSupplement: supplement,
          totalPrice,
          status: "HELD",
          heldUntil,
          qrToken: nanoid(),
          spots: {
            create: spotIds.map((spotId) => ({ spotId })),
          },
        },
      });

      return { reservationId: reservation.id, heldUntil };
    });

    return { ok: true, ...result };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "SPOTS_UNAVAILABLE") {
      return { ok: false, error: "Un ou plusieurs emplacements viennent d'être réservés. Veuillez en choisir d'autres." };
    }
    console.error("holdSpotsAction error:", err);
    return { ok: false, error: "Erreur lors de la réservation. Réessayez." };
  }
}

// Confirm a held reservation (placeholder for M4 — sets CONFIRMED without payment)
export async function confirmReservationAction(
  reservationId: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Non authentifié" };

  try {
    await db.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId, userId: session.user!.id },
        include: { spots: true },
      });

      if (!reservation) throw new Error("NOT_FOUND");
      if (reservation.status !== "HELD") throw new Error("NOT_HELD");
      if (reservation.heldUntil && reservation.heldUntil < new Date()) {
        throw new Error("EXPIRED");
      }

      // Confirm reservation + spots
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: "CONFIRMED", heldUntil: null },
      });

      await tx.spot.updateMany({
        where: { id: { in: reservation.spots.map((rs) => rs.spotId) } },
        data: { status: "RESERVED", heldUntil: null },
      });
    });

    revalidatePath("/dashboard/reservations");
    return { ok: true };
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "EXPIRED") return { ok: false, error: "Votre réservation a expiré. Recommencez." };
      if (err.message === "NOT_FOUND") return { ok: false, error: "Réservation introuvable." };
    }
    return { ok: false, error: "Erreur lors de la confirmation." };
  }
}

// Cancel a held/confirmed reservation
export async function cancelReservationAction(
  reservationId: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Non authentifié" };

  try {
    await db.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId, userId: session.user!.id },
        include: { spots: true },
      });
      if (!reservation) throw new Error("NOT_FOUND");
      if (!["HELD", "CONFIRMED"].includes(reservation.status)) throw new Error("CANNOT_CANCEL");

      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: "CANCELLED" },
      });

      await tx.spot.updateMany({
        where: { id: { in: reservation.spots.map((rs) => rs.spotId) } },
        data: { status: "AVAILABLE", heldUntil: null },
      });
    });

    revalidatePath("/dashboard/reservations");
    return { ok: true };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { ok: false, error: err.message === "NOT_FOUND" ? "Introuvable" : "Erreur annulation" };
    }
    return { ok: false, error: "Erreur annulation" };
  }
}
