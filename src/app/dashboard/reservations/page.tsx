import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardReservationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-amber-800 mb-2">
        Mes réservations
      </h1>
      <p className="text-gray-500 mb-8">
        Gérez vos emplacements de brocante
      </p>

      <div className="bg-white rounded-xl border border-amber-100 p-12 text-center">
        <div className="text-4xl mb-4">📋</div>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Aucune réservation pour le moment
        </h2>
        <p className="text-gray-500 mb-6">
          Vous n&apos;avez pas encore réservé d&apos;emplacement.
        </p>
        <Link
          href="/events"
          className="inline-block bg-amber-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-amber-700 transition-colors"
        >
          Voir les événements disponibles
        </Link>
      </div>
    </main>
  );
}
