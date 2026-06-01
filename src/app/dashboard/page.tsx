import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-amber-800 mb-2">
        Bonjour, {session.user.name} 👋
      </h1>
      <p className="text-gray-500 mb-8">Bienvenue sur votre espace exposant</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-amber-100 p-6">
          <h2 className="font-semibold text-lg text-gray-800 mb-1">
            Mes réservations
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Consultez et gérez vos emplacements
          </p>
          <Link
            href="/dashboard/reservations"
            className="inline-block bg-amber-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-700 transition-colors"
          >
            Voir mes réservations
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-amber-100 p-6">
          <h2 className="font-semibold text-lg text-gray-800 mb-1">
            Événements à venir
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Réservez votre emplacement pour la prochaine brocante
          </p>
          <Link
            href="/events"
            className="inline-block bg-amber-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-700 transition-colors"
          >
            Voir les événements
          </Link>
        </div>
      </div>
    </main>
  );
}
