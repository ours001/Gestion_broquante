import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendReservationConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.text(); // raw body required for signature verification
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const reservationId = session.metadata?.reservationId;

    if (!reservationId) {
      return NextResponse.json(
        { error: "No reservationId in metadata" },
        { status: 400 }
      );
    }

    try {
      // Confirm reservation in a transaction
      const reservation = await db.$transaction(async (tx) => {
        const res = await tx.reservation.findUnique({
          where: { id: reservationId },
          include: {
            spots: { include: { spot: true } },
            event: true,
            user: true,
          },
        });

        if (!res || res.status === "CONFIRMED") return res; // idempotent

        // Confirm reservation
        const confirmed = await tx.reservation.update({
          where: { id: reservationId },
          data: { status: "CONFIRMED", heldUntil: null },
          include: {
            spots: { include: { spot: true } },
            event: true,
            user: true,
          },
        });

        // Mark spots as RESERVED
        await tx.spot.updateMany({
          where: { id: { in: res.spots.map((rs) => rs.spotId) } },
          data: { status: "RESERVED", heldUntil: null },
        });

        // Create payment record
        await tx.payment.create({
          data: {
            reservationId: reservationId,
            provider: "stripe",
            amount: (session.amount_total ?? 0) / 100,
            status: "PAID",
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            stripeSessionId: session.id,
          },
        });

        return confirmed;
      });

      // Send confirmation email (outside transaction)
      if (
        reservation &&
        reservation.status === "CONFIRMED" &&
        reservation.user.email
      ) {
        await sendReservationConfirmationEmail({
          to: reservation.user.email,
          userName: reservation.user.name,
          eventName: reservation.event.name,
          eventDate: reservation.event.date,
          eventLocation: reservation.event.location,
          spotLabels: reservation.spots.map((rs) => rs.spot.label),
          totalPrice: reservation.totalPrice,
          qrToken: reservation.qrToken!,
          reservationId: reservation.id,
        });
      }
    } catch (err) {
      console.error("Webhook processing error:", err);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
