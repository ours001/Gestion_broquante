import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-amber-800 mb-4">
          Gestion de Brocante
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Organisez et gérez vos vide-greniers en ligne
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/events"
            className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Voir les événements
          </Link>
          <Link
            href="/login"
            className="border border-amber-600 text-amber-600 px-6 py-3 rounded-lg hover:bg-amber-50 transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </main>
  );
}
