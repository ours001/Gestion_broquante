import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MapEditor } from "@/components/map/map-editor";

export default async function MapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const event = await db.event.findUnique({
    where: { id },
    include: { zones: true, spots: true },
  });
  if (!event) notFound();

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4">
        <a href={`/admin/events/${id}`} className="text-amber-600 hover:text-amber-700 text-sm">← Retour</a>
        <h1 className="font-semibold text-gray-800">{event.name} — Éditeur de carte</h1>
      </div>
      <MapEditor
        eventId={id}
        initialZones={event.zones}
        initialSpots={event.spots}
      />
    </div>
  );
}
