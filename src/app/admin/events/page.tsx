import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function AdminEventsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const events = await db.event.findMany({ orderBy: { date: "desc" } });

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-amber-800">Événements</h1>
          <p className="text-gray-500">Gérez vos brocantes et vide-greniers</p>
        </div>
        <button className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium">
          + Nouvel événement
        </button>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-amber-100 p-12 text-center">
          <div className="text-4xl mb-4">🏷️</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Aucun événement
          </h2>
          <p className="text-gray-500">
            Créez votre premier événement pour commencer.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl border border-amber-100 p-6 flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-gray-800">{event.name}</h3>
                <p className="text-sm text-gray-500">
                  {event.location} ·{" "}
                  {new Date(event.date).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  event.status === "OPEN"
                    ? "bg-green-100 text-green-700"
                    : event.status === "DRAFT"
                      ? "bg-gray-100 text-gray-600"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {event.status === "OPEN"
                  ? "Ouvert"
                  : event.status === "DRAFT"
                    ? "Brouillon"
                    : "Fermé"}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
