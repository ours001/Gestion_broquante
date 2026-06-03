import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils";
import QRCode from "qrcode";

export default async function ReservationSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { id } = await params;
  await searchParams; // consumed to satisfy Next.js 16 requirement

  const session = await auth();
  if (!session?.user) redirect("/login");

  const reservation = await db.reservation.findUnique({
    where: { id, userId: session.user.id },
    include: {
      event: true,
      spots: { include: { spot: true } },
      payment: true,
    },
  });

  if (!reservation) notFound();

  // QR code as data URL
  let qrDataUrl = "";
  if (reservation.qrToken) {
    qrDataUrl = await QRCode.toDataURL(
      `${process.env.NEXTAUTH_URL}/reservations/${id}/ticket`,
      { width: 200, margin: 2 }
    );
  }

  const isConfirmed = reservation.status === "CONFIRMED";
  const isHeld = reservation.status === "HELD";

  return (
    <main className="container mx-auto px-4 py-8 max-w-lg">
      {isConfirmed ? (
        <div className="bg-white rounded-xl border border-green-200 p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-green-700 mb-2">
            Paiement confirmé !
          </h1>
          <p className="text-gray-600 mb-6">
            Votre réservation pour{" "}
            <strong>{reservation.event.name}</strong> est validée.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-1">
              📍 {reservation.event.location}
            </p>
            <p className="text-sm text-gray-600 mb-3">
              📅 {formatDate(reservation.event.date)}
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {reservation.spots.map((rs) => (
                <span
                  key={rs.id}
                  className="bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full border border-amber-300"
                >
                  {rs.spot.label}
                </span>
              ))}
            </div>
            <p className="text-sm font-semibold text-gray-700">
              Total : {formatPrice(reservation.totalPrice)}
            </p>
          </div>

          {qrDataUrl && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-3">
                Votre billet — présentez ce QR code le jour J
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="QR Code billet"
                className="mx-auto w-40 h-40"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Link
              href={`/reservations/${id}/ticket`}
              className="block w-full text-center bg-amber-600 text-white py-2.5 rounded-lg hover:bg-amber-700 font-medium"
            >
              🎟️ Voir mon billet complet
            </Link>
            <Link
              href="/dashboard/reservations"
              className="block w-full text-center border border-amber-200 text-amber-700 py-2.5 rounded-lg hover:bg-amber-50"
            >
              Mes réservations
            </Link>
          </div>
        </div>
      ) : isHeld ? (
        <div className="bg-white rounded-xl border border-yellow-200 p-8 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-xl font-bold text-yellow-700 mb-2">
            Paiement en cours de traitement
          </h1>
          <p className="text-gray-600 mb-4">
            Votre paiement a été reçu. Votre réservation sera confirmée dans
            quelques secondes.
          </p>
          <Link
            href="/dashboard/reservations"
            className="text-amber-600 hover:text-amber-700 underline text-sm"
          >
            Vérifier le statut →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-red-700 mb-2">
            Réservation annulée
          </h1>
          <Link
            href="/events"
            className="text-amber-600 hover:text-amber-700 underline text-sm"
          >
            Retour aux événements
          </Link>
        </div>
      )}
    </main>
  );
}
