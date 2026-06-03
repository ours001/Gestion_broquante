"use server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createCheckoutSessionAction(
  reservationId: string
): Promise<CheckoutResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Non authentifié" };

  const reservation = await db.reservation.findUnique({
    where: { id: reservationId, userId: session.user.id, status: "HELD" },
    include: {
      event: true,
      spots: { include: { spot: true } },
      user: true,
    },
  });

  if (!reservation)
    return { ok: false, error: "Réservation introuvable ou expirée" };

  const spotLabels = reservation.spots.map((rs) => rs.spot.label).join(", ");

  // Stripe requires expires_at to be at least 30 minutes in the future
  const minExpiry = Math.floor(Date.now() / 1000) + 1800;
  const heldExpiry = reservation.heldUntil
    ? Math.floor(reservation.heldUntil.getTime() / 1000)
    : minExpiry;
  const expiresAt = Math.max(heldExpiry, minExpiry);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: reservation.user.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `Emplacement(s) — ${reservation.event.name}`,
            description: `Place(s) : ${spotLabels}`,
          },
          unit_amount: Math.round(reservation.totalPrice * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      reservationId: reservation.id,
    },
    success_url: `${BASE_URL}/reservations/${reservation.id}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/events/${reservation.eventId}`,
    expires_at: expiresAt,
  });

  return { ok: true, url: checkoutSession.url! };
}
