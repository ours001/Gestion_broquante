import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils";
import { ReservationsTable } from "@/components/admin/reservations-table";

export default async function AdminReservationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; zone?: string; paid?: string }>;
}) {
  const { id } = await params;
  const filters = await searchParams;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const event = await db.event.findUnique({
    where: { id },
    include: { zones: true },
  });
  if (!event) notFound();

  // Build where clause
  const where: Record<string, unknown> = {
    eventId: id,
    status: { in: ["CONFIRMED", "HELD", "CANCELLED"] },
  };
  if (filters.status && filters.status !== "all") {
    where.status = filters.status.toUpperCase();
  }
  if (filters.paid === "yes") {
    where.payment = { status: "PAID" };
  } else if (filters.paid === "no") {
    where.payment = null;
  }

  const reservations = await db.reservation.findMany({
    where,
    include: {
      user: true,
      spots: {
        include: {
          spot: { include: { zone: true } },
        },
      },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Stats
  const allSpots = await db.spot.count({ where: { eventId: id } });
  const reservedSpots = await db.spot.count({ where: { eventId: id, status: "RESERVED" } });
  const heldSpots = await db.spot.count({ where: { eventId: id, status: "HELD" } });
  const revenue = reservations
    .filter((r) => r.status === "CONFIRMED")
    .reduce((sum, r) => sum + r.totalPrice, 0);
  const checkedIn = reservations.filter((r) => r.checkedInAt).length;

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/events/${id}`} className="text-amber-600 hover:text-amber-700 text-sm">← Retour</Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{event.name}</h1>
          <p className="text-gray-500 text-sm">Gestion des réservations</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Taux de remplissage", value: allSpots > 0 ? `${Math.round((reservedSpots / allSpots) * 100)}%` : "0%", sub: `${reservedSpots}/${allSpots} places`, color: "bg-green-50 border-green-200" },
          { label: "Revenus confirmés", value: formatPrice(revenue), sub: `${reservations.filter(r => r.status === "CONFIRMED").length} réservations`, color: "bg-amber-50 border-amber-200" },
          { label: "En attente", value: String(heldSpots), sub: "places verrouillées", color: "bg-yellow-50 border-yellow-200" },
          { label: "Check-ins", value: String(checkedIn), sub: `sur ${reservations.filter(r => r.status === "CONFIRMED").length} confirmées`, color: "bg-blue-50 border-blue-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Link href={`/admin/events/${id}/checkin`}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
          📱 Check-in QR
        </Link>
        <a href={`/api/admin/events/${id}/export`}
          className="border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors">
          ⬇️ Export CSV
        </a>
      </div>

      {/* Filters + Table */}
      <ReservationsTable
        reservations={reservations.map((r) => ({
          id: r.id,
          status: r.status,
          mode: r.mode,
          totalPrice: r.totalPrice,
          checkedInAt: r.checkedInAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
          paid: r.payment?.status === "PAID",
          user: { name: r.user.name, email: r.user.email, phone: r.user.phone ?? null },
          spots: r.spots.map((rs) => ({
            label: rs.spot.label,
            zoneName: rs.spot.zone.name,
          })),
        }))}
        zones={event.zones.map((z) => ({ id: z.id, name: z.name }))}
        eventId={id}
      />
    </main>
  );
}
