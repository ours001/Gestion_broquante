import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/utils";
import QRCode from "qrcode";
import { PrintButton } from "@/components/reservation/print-button";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const reservation = await db.reservation.findUnique({
    where: { id, userId: session.user.id, status: "CONFIRMED" },
    include: {
      event: true,
      spots: { include: { spot: true } },
    },
  });
  if (!reservation) notFound();

  const qrDataUrl = await QRCode.toDataURL(reservation.qrToken!, {
    width: 250,
    margin: 2,
  });

  return (
    <main className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm overflow-hidden print:shadow-none">
        <div className="bg-amber-600 px-6 py-4 text-center">
          <h1 className="text-xl font-bold text-white">🏷️ Billet Brocante</h1>
          <p className="text-amber-100 text-sm mt-1">{reservation.event.name}</p>
        </div>
        <div className="px-6 py-5 border-b border-dashed border-amber-200">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <span>📍</span>
              <span>{reservation.event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span>📅</span>
              <span>{formatDate(reservation.event.date)}</span>
            </div>
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">
                Emplacement(s)
              </p>
              <div className="flex flex-wrap gap-2">
                {reservation.spots.map((rs) => (
                  <span
                    key={rs.id}
                    className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-sm border border-amber-300"
                  >
                    {rs.spot.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-500 text-xs">Total payé</span>
              <span className="font-bold text-gray-800">
                {formatPrice(reservation.totalPrice)}
              </span>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 text-center">
          <p className="text-xs text-gray-400 mb-3">Scannez ce code le jour J</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR Code" className="mx-auto w-48 h-48" />
          <p className="text-xs text-gray-300 mt-2 font-mono">
            {reservation.qrToken?.slice(0, 16)}…
          </p>
        </div>
        <div className="px-6 pb-4 text-center">
          <PrintButton />
        </div>
      </div>
    </main>
  );
}
