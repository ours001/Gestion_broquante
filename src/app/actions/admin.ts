"use server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Check-in by reservation ID (extracted from QR code URL)
export async function checkInAction(
  reservationId: string
): Promise<{ ok: boolean; error?: string; reservation?: { spotLabels: string[]; userName: string | null } }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return { ok: false, error: "Non autorisé" };

  const reservation = await db.reservation.findUnique({
    where: { id: reservationId, status: "CONFIRMED" },
    include: {
      user: true,
      spots: { include: { spot: true } },
    },
  });

  if (!reservation) return { ok: false, error: "Réservation introuvable ou non confirmée" };
  if (reservation.checkedInAt) {
    return {
      ok: false,
      error: `Déjà enregistré à ${reservation.checkedInAt.toLocaleTimeString("fr-FR")}`,
    };
  }

  await db.reservation.update({
    where: { id: reservationId },
    data: { checkedInAt: new Date() },
  });

  revalidatePath(`/admin/events/${reservation.eventId}/checkin`);

  return {
    ok: true,
    reservation: {
      spotLabels: reservation.spots.map((rs) => rs.spot.label),
      userName: reservation.user.name,
    },
  };
}

export async function updateEventStatusAction(eventId: string, status: "DRAFT" | "OPEN" | "CLOSED") {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  await db.event.update({ where: { id: eventId }, data: { status } });
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin/events");
}
