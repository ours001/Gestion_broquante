import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/utils";

export default async function DashboardReservationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Expire held first
  await db.reservation.updateMany({
    where: { userId: session.user.id, status: "HELD", heldUntil: { lt: new Date() } },
    data: { status: "CANCELLED" },
  });

  const reservations = await db.reservation.findMany({
    where: { userId: session.user.id, status: { in: ["HELD", "CONFIRMED"] } },
    include: {
      event: true,
      spots: { include: { spot: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const STATUS_LABELS: Record<string, string> = {
    HELD: "En attente",
    CONFIRMED: "Confirmée",
    CANCELLED: "Annulée",
    PENDING: "En cours",
  };
  const STATUS_COLORS: Record<string, string> = {
    HELD: "bg-yellow-100 text-yellow-700",
    CONFIRMED: "bg-green-100 text-green-700",
    CANCELLED: "bg-gray-100 text-gray-500",
    PENDING: "bg-blue-100 text-blue-700",
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-amber-800 mb-2">Mes réservations</h1>
      <p className="text-gray-500 mb-8">Gérez vos emplacements de brocante</p>

      {reservations.length === 0 ? (
        <div className="bg-white rounded-xl border border-amber-100 p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Aucune réservation</h2>
          <Link
            href="/events"
            className="inline-block mt-2 bg-amber-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-amber-700"
          >
            Voir les événements
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-amber-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{r.event.name}</h3>
                  <p className="text-sm text-gray-500">
                    {r.event.location} · {formatDate(r.event.date)}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-500"
                  }`}
                >
                  {STATUS_LABELS[r.status] ?? r.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {r.spots.map((rs) => (
                  <span
                    key={rs.id}
                    className="bg-amber-50 text-amber-800 text-sm px-3 py-1 rounded-full border border-amber-200"
                  >
                    {rs.spot.label}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-700">
                  Total : {formatPrice(r.totalPrice)}
                </span>
                <span className="text-gray-400">
                  {r.mode === "CHOSEN" ? "Choix libre" : "Attribution auto"}
                </span>
              </div>
              {r.status === "HELD" && r.heldUntil && (
                <p className="text-xs text-yellow-600 mt-2">
                  ⏱ Réservation provisoire jusqu&apos;à {formatDate(r.heldUntil)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
