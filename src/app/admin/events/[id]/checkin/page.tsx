import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { CheckinScanner } from "@/components/admin/checkin-scanner";

export default async function CheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const event = await db.event.findUnique({ where: { id } });
  if (!event) notFound();

  const totalConfirmed = await db.reservation.count({ where: { eventId: id, status: "CONFIRMED" } });
  const totalCheckedIn = await db.reservation.count({
    where: { eventId: id, status: "CONFIRMED", checkedInAt: { not: null } },
  });

  return (
    <main className="container mx-auto px-4 py-8 max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/events/${id}/reservations`} className="text-amber-600 hover:text-amber-700 text-sm">← Réservations</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Check-in — {event.name}</h1>
      <p className="text-gray-500 text-sm mb-6">Scannez le QR code du billet exposant</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{totalCheckedIn}</p>
          <p className="text-xs text-green-600 mt-1">Enregistrés</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{totalConfirmed - totalCheckedIn}</p>
          <p className="text-xs text-gray-500 mt-1">En attente</p>
        </div>
      </div>

      <CheckinScanner eventId={id} />
    </main>
  );
}
