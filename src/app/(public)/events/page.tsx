import { db } from "@/lib/db";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils";

export default async function EventsPage() {
  const events = await db.event.findMany({
    where: { status: "OPEN" },
    orderBy: { date: "asc" },
    include: {
      _count: { select: { spots: true } },
      spots: { where: { status: "AVAILABLE" }, select: { id: true } },
    },
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-amber-800 mb-2">Brocantes &amp; Vide-greniers</h1>
      <p className="text-gray-500 mb-8">Réservez votre emplacement en ligne</p>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-amber-100 p-12 text-center">
          <div className="text-4xl mb-4">🏷️</div>
          <h2 className="text-lg font-semibold text-gray-700">Aucun événement ouvert</h2>
          <p className="text-gray-500 mt-1">Revenez bientôt !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const available = event.spots.length;
            const total = event._count.spots;
            const pct = total > 0 ? Math.round(((total - available) / total) * 100) : 0;
            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="bg-white rounded-xl border border-amber-100 p-6 hover:shadow-md transition-shadow group"
              >
                <h2 className="font-bold text-lg text-gray-800 group-hover:text-amber-700 mb-1">{event.name}</h2>
                <p className="text-sm text-gray-500 mb-1">📍 {event.location}</p>
                <p className="text-sm text-gray-500 mb-4">📅 {formatDate(event.date)}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className={available > 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                    {available > 0 ? `${available} place(s) disponible(s)` : "Complet"}
                  </span>
                  <span className="text-gray-400">{pct}% rempli</span>
                </div>
                {total > 0 && (
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
