import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ReservationWizard } from "@/components/reservation/reservation-wizard";

export default async function ReservePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?redirect=/events/${id}/reserve`);

  // Expire held first
  await db.spot.updateMany({
    where: { eventId: id, status: "HELD", heldUntil: { lt: new Date() } },
    data: { status: "AVAILABLE", heldUntil: null },
  });

  const event = await db.event.findUnique({
    where: { id, status: "OPEN" },
    include: {
      zones: true,
      spots: { orderBy: [{ zoneId: "asc" }, { position: "asc" }] },
    },
  });
  if (!event) notFound();

  const available = event.spots.filter((s) => s.status === "AVAILABLE").length;
  if (available === 0) redirect(`/events/${id}`);

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <a href={`/events/${id}`} className="text-amber-600 hover:text-amber-700 text-sm">
          ← Retour à l&apos;événement
        </a>
      </div>
      <h1 className="text-2xl font-bold text-amber-800 mb-6">
        Réserver un emplacement — {event.name}
      </h1>
      <ReservationWizard
        event={{
          id: event.id,
          name: event.name,
          choiceSupplement: event.choiceSupplement,
          onlinePaymentEnabled: event.onlinePaymentEnabled,
        }}
        zones={event.zones}
        spots={event.spots.map((s) => ({
          ...s,
          heldUntil: s.heldUntil?.toISOString() ?? null,
        }))}
      />
    </main>
  );
}
