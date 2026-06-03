import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils";
import { EventStatusButtons } from "@/components/admin/event-status-buttons";

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const event = await db.event.findUnique({
    where: { id },
    include: {
      _count: { select: { spots: true, reservations: true } },
    },
  });
  if (!event) notFound();

  const statusLabels = { DRAFT: "Brouillon", OPEN: "Ouvert", CLOSED: "Fermé" };
  const statusColors = {
    DRAFT: "bg-gray-100 text-gray-700",
    OPEN: "bg-green-100 text-green-700",
    CLOSED: "bg-red-100 text-red-700",
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/events" className="text-amber-600 hover:text-amber-700">← Événements</Link>
      </div>
      <div className="bg-white rounded-xl border border-amber-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">{event.name}</h1>
            <p className="text-gray-500">{event.location} · {formatDate(event.date)}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[event.status]}`}>
            {statusLabels[event.status]}
          </span>
        </div>
        {event.description && <p className="mt-4 text-gray-600">{event.description}</p>}
        <div className="mt-4 flex gap-6 text-sm text-gray-500">
          <span>{event._count.spots} emplacements</span>
          <span>{event._count.reservations} réservations</span>
          <span>Supplément choix : {formatPrice(event.choiceSupplement)}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href={`/admin/events/${id}/map`}
          className="bg-amber-600 text-white px-5 py-2.5 rounded-lg hover:bg-amber-700 transition-colors font-medium">
          🗺️ Modifier la carte
        </Link>
        <Link href={`/admin/events/${id}/reservations`}
          className="bg-white border border-amber-200 text-amber-700 px-5 py-2.5 rounded-lg hover:bg-amber-50 transition-colors font-medium">
          📋 Réservations
        </Link>
        <EventStatusButtons eventId={id} currentStatus={event.status} />
      </div>
    </main>
  );
}
