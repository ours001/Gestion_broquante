interface AdminEventMapPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEventMapPage({ params }: AdminEventMapPageProps) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Plan de l&apos;événement
        </h1>
        <p className="text-gray-500">Événement #{id} — Plan interactif en construction</p>
      </div>
    </main>
  );
}
