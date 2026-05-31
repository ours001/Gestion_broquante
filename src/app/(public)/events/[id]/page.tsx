interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-amber-50">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-amber-800 mb-4">
          Détails de l&apos;événement
        </h1>
        <p className="text-gray-500">Événement #{id} — Page en construction</p>
      </div>
    </main>
  );
}
