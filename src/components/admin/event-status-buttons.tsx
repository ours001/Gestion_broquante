"use client";
import { useTransition } from "react";
import { updateEventStatusAction } from "@/app/actions/admin";

export function EventStatusButtons({ eventId, currentStatus }: { eventId: string; currentStatus: "DRAFT" | "OPEN" | "CLOSED" }) {
  const [isPending, startTransition] = useTransition();

  const changeStatus = (status: "DRAFT" | "OPEN" | "CLOSED") => {
    startTransition(() => updateEventStatusAction(eventId, status));
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {currentStatus === "DRAFT" && (
        <button onClick={() => changeStatus("OPEN")} disabled={isPending}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
          {isPending ? "…" : "✅ Ouvrir les réservations"}
        </button>
      )}
      {currentStatus === "OPEN" && (
        <button onClick={() => changeStatus("CLOSED")} disabled={isPending}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
          {isPending ? "…" : "🔒 Fermer les réservations"}
        </button>
      )}
      {currentStatus === "CLOSED" && (
        <button onClick={() => changeStatus("DRAFT")} disabled={isPending}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50">
          {isPending ? "…" : "↩ Repasser en brouillon"}
        </button>
      )}
    </div>
  );
}
