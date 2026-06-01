"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createEventAction, type EventFormState } from "@/app/actions/events";

export function CreateEventForm() {
  const [state, action, pending] = useActionState<EventFormState, FormData>(
    createEventAction,
    undefined
  );

  return (
    <form action={action} className="space-y-5">
      {state?.errors?.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {state.errors.general[0]}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nom de l&apos;événement
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Brocante de la Place du Village"
        />
        {state?.errors?.name && (
          <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          Date et heure
        </label>
        <input
          id="date"
          name="date"
          type="datetime-local"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        {state?.errors?.date && (
          <p className="mt-1 text-sm text-red-600">{state.errors.date[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Lieu
        </label>
        <input
          id="location"
          name="location"
          type="text"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Place du Village, 75001 Paris"
        />
        {state?.errors?.location && (
          <p className="mt-1 text-sm text-red-600">{state.errors.location[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-gray-400 font-normal">(optionnel)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
          placeholder="Informations supplémentaires sur l'événement..."
        />
      </div>

      <div>
        <label htmlFor="choiceSupplement" className="block text-sm font-medium text-gray-700 mb-1">
          Supplément choix d&apos;emplacement (€)
        </label>
        <input
          id="choiceSupplement"
          name="choiceSupplement"
          type="number"
          min="0"
          step="0.5"
          defaultValue="5"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          id="onlinePaymentEnabled"
          name="onlinePaymentEnabled"
          type="checkbox"
          defaultChecked
          value="true"
          className="w-4 h-4 accent-amber-600"
        />
        <label htmlFor="onlinePaymentEnabled" className="text-sm font-medium text-gray-700">
          Paiement en ligne activé
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <Link
          href="/admin/events"
          className="flex-1 text-center border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Annuler
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 bg-amber-600 text-white px-4 py-2.5 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {pending ? "Création..." : "Créer l'événement"}
        </button>
      </div>
    </form>
  );
}
