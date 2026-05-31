interface AdminEventReservationsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEventReservationsPage({ params }: AdminEventReservationsPageProps) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Réservations de l&apos;événement
        </h1>
        <p className="text-gray-500">Événement #{id} — Liste des réservations en construction</p>
      </div>
    </main>
  );
}
