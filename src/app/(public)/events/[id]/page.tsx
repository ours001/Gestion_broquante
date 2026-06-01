import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils";
import { PublicEventMap } from "@/components/reservation/public-event-map";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  // Expire held spots first (lazy)
  await db.spot.updateMany({
    where: { eventId: id, status: "HELD", heldUntil: { lt: new Date() } },
    data: { status: "AVAILABLE", heldUntil: null },
  });

  const event = await db.event.findUnique({
    where: { id },
    include: {
      zones: true,
      spots: {
        orderBy: [{ zoneId: "asc" }, { position: "asc" }],
      },
    },
  });
  if (!event) notFound();

  const available = event.spots.filter((s) => s.status === "AVAILABLE").length;
  const total = event.spots.length;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/events" className="text-amber-600 hover:text-amber-700 text-sm">
          ← Tous les événements
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info + CTA */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-amber-100 p-6">
            <div className="flex items-start justify-between mb-3">
              <h1 className="text-xl font-bold text-gray-800">{event.name}</h1>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  event.status === "OPEN"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {event.status === "OPEN" ? "Ouvert" : "Fermé"}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">📍 {event.location}</p>
            <p className="text-sm text-gray-600 mb-4">📅 {formatDate(event.date)}</p>
            {event.description && (
              <p className="text-sm text-gray-500 mb-4">{event.description}</p>
            )}

            <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Emplacements disponibles</span>
                <span className="font-medium text-green-600">
                  {available} / {total}
                </span>
              </div>
              {event.choiceSupplement > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Supplément choix de place</span>
                  <span className="font-medium text-amber-600">
                    +{formatPrice(event.choiceSupplement)}
                  </span>
                </div>
              )}
            </div>

            {event.status === "OPEN" && available > 0 && (
              <div className="mt-5">
                {session?.user ? (
                  <Link
                    href={`/events/${id}/reserve`}
                    className="block w-full text-center bg-amber-600 text-white py-2.5 rounded-lg hover:bg-amber-700 transition-colors font-medium"
                  >
                    Réserver un emplacement
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href={`/login?redirect=/events/${id}/reserve`}
                      className="block w-full text-center bg-amber-600 text-white py-2.5 rounded-lg hover:bg-amber-700 transition-colors font-medium"
                    >
                      Se connecter pour réserver
                    </Link>
                    <Link
                      href={`/register?redirect=/events/${id}/reserve`}
                      className="block w-full text-center border border-amber-200 text-amber-700 py-2.5 rounded-lg hover:bg-amber-50 transition-colors text-sm"
                    >
                      Créer un compte
                    </Link>
                  </div>
                )}
              </div>
            )}
            {available === 0 && (
              <p className="mt-4 text-center text-sm text-red-500 font-medium">
                Événement complet
              </p>
            )}
          </div>
        </div>

        {/* Map preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-amber-100 p-4">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">
              Plan des emplacements
            </h2>
            <div className="h-96 rounded-lg overflow-hidden bg-gray-50">
              <PublicEventMap
                zones={event.zones}
                spots={event.spots.map((s) => ({
                  ...s,
                  heldUntil: s.heldUntil?.toISOString() ?? null,
                }))}
                readOnly
              />
            </div>
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-green-200 border border-green-400 inline-block" />{" "}
                Disponible
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-yellow-200 border border-yellow-400 inline-block" />{" "}
                Réservé provisoirement
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-red-200 border border-red-400 inline-block" />{" "}
                Réservé
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
