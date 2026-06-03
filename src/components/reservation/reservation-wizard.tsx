"use client";
import { useState, useTransition } from "react";
import {
  findConsecutiveSpotsAction,
  holdSpotsAction,
  confirmReservationAction,
  validateConsecutiveSelectionAction,
} from "@/app/actions/reservations";
import { createCheckoutSessionAction } from "@/app/actions/payments";
import { SpotPicker } from "./spot-picker";
import { formatPrice } from "@/lib/utils";

type Step = "mode" | "pick" | "confirm" | "success";
type Mode = "AUTO" | "CHOSEN";

interface SpotData {
  id: string;
  label: string;
  zoneId: string;
  position: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  status: string;
  basePrice: number;
  heldUntil: string | null;
}

interface ZoneData {
  id: string;
  name: string;
  color: string;
  priceModifier: number;
}

interface EventData {
  id: string;
  name: string;
  choiceSupplement: number;
  onlinePaymentEnabled: boolean;
}

export function ReservationWizard({
  event,
  zones,
  spots,
}: {
  event: EventData;
  zones: ZoneData[];
  spots: SpotData[];
}) {
  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<Mode>("AUTO");
  const [count, setCount] = useState(1);
  const [selectedSpotIds, setSelectedSpotIds] = useState<string[]>([]);
  const [assignedSpotIds, setAssignedSpotIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Derived
  const effectiveSpotIds = mode === "AUTO" ? assignedSpotIds : selectedSpotIds;
  const selectedSpots = spots.filter((s) => effectiveSpotIds.includes(s.id));
  const spotsPrice = selectedSpots.reduce((sum, s) => {
    const zone = zones.find((z) => z.id === s.zoneId);
    return sum + s.basePrice + (zone?.priceModifier ?? 0);
  }, 0);
  const supplement = mode === "CHOSEN" ? event.choiceSupplement : 0;
  const totalPrice = spotsPrice + supplement;

  const handleModeNext = () => {
    setError(null);
    if (mode === "AUTO") {
      startTransition(async () => {
        const result = await findConsecutiveSpotsAction(event.id, count);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        setAssignedSpotIds(result.spotIds);
        setStep("confirm");
      });
    } else {
      setStep("pick");
    }
  };

  const handlePickNext = () => {
    setError(null);
    startTransition(async () => {
      if (selectedSpotIds.length === 0) {
        setError("Sélectionnez au moins un emplacement");
        return;
      }
      if (selectedSpotIds.length > 1) {
        const validation = await validateConsecutiveSelectionAction(selectedSpotIds);
        if (!validation.valid) {
          setError(validation.error ?? "Emplacements non consécutifs");
          return;
        }
      }
      setStep("confirm");
    });
  };

  const handleHold = () => {
    setError(null);
    startTransition(async () => {
      const result = await holdSpotsAction(event.id, effectiveSpotIds, mode);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (event.onlinePaymentEnabled) {
        // Redirect to Stripe Checkout
        const checkout = await createCheckoutSessionAction(result.reservationId);
        if (!checkout.ok) {
          setError(checkout.error);
          return;
        }
        window.location.href = checkout.url;
      } else {
        // No payment — confirm directly
        const confirm = await confirmReservationAction(result.reservationId);
        if (!confirm.ok) {
          setError(confirm.error ?? "Erreur confirmation");
          return;
        }
        setStep("success");
      }
    });
  };

  // --- RENDER ---
  if (step === "success") {
    return (
      <div className="bg-white rounded-xl border border-green-200 p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-green-700 mb-2">Réservation confirmée !</h2>
        <p className="text-gray-600 mb-2">
          Emplacement{selectedSpots.length > 1 ? "s" : ""} :{" "}
          <strong>{selectedSpots.map((s) => s.label).join(", ")}</strong>
        </p>
        <p className="text-gray-600 mb-6">
          Total : <strong>{formatPrice(totalPrice)}</strong>
        </p>
        <a
          href="/dashboard/reservations"
          className="inline-block bg-amber-600 text-white px-6 py-2.5 rounded-lg hover:bg-amber-700 transition-colors"
        >
          Voir mes réservations
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        {(["mode", "pick", "confirm"] as Step[]).map((s, i) => {
          if (mode === "AUTO" && s === "pick") return null;
          const stepOrder: Step[] =
            mode === "AUTO" ? ["mode", "confirm"] : ["mode", "pick", "confirm"];
          const currentIdx = stepOrder.indexOf(step);
          const thisIdx = stepOrder.indexOf(s);
          return (
            <span
              key={s}
              className={`px-3 py-1 rounded-full ${
                thisIdx === currentIdx
                  ? "bg-amber-600 text-white font-medium"
                  : thisIdx < currentIdx
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {i + 1}. {s === "mode" ? "Mode" : s === "pick" ? "Choix" : "Confirmation"}
            </span>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Mode */}
      {step === "mode" && (
        <div className="bg-white rounded-xl border border-amber-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Choisissez votre mode de réservation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setMode("AUTO")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                mode === "AUTO"
                  ? "border-amber-500 bg-amber-50"
                  : "border-gray-200 hover:border-amber-200"
              }`}
            >
              <div className="text-2xl mb-2">🎲</div>
              <h3 className="font-semibold text-gray-800">Attribution automatique</h3>
              <p className="text-sm text-gray-500 mt-1">
                Le système choisit pour vous des places consécutives disponibles.
              </p>
              <p className="text-sm font-medium text-green-600 mt-2">Prix de base uniquement</p>
            </button>
            <button
              onClick={() => setMode("CHOSEN")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                mode === "CHOSEN"
                  ? "border-amber-500 bg-amber-50"
                  : "border-gray-200 hover:border-amber-200"
              }`}
            >
              <div className="text-2xl mb-2">🗺️</div>
              <h3 className="font-semibold text-gray-800">Je choisis ma place</h3>
              <p className="text-sm text-gray-500 mt-1">
                Sélectionnez vous-même votre emplacement sur la carte.
              </p>
              {event.choiceSupplement > 0 && (
                <p className="text-sm font-medium text-amber-600 mt-2">
                  + {formatPrice(event.choiceSupplement)} supplément
                </p>
              )}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre d&apos;emplacements
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCount((c) => Math.max(1, c - 1))}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-lg"
              >
                −
              </button>
              <span className="w-8 text-center font-semibold text-lg">{count}</span>
              <button
                onClick={() => setCount((c) => Math.min(5, c + 1))}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-lg"
              >
                +
              </button>
              <span className="text-sm text-gray-500 ml-2">(max 5 consécutifs)</span>
            </div>
          </div>
          <button
            onClick={handleModeNext}
            disabled={isPending}
            className="w-full bg-amber-600 text-white py-2.5 rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:opacity-50"
          >
            {isPending ? "Recherche..." : "Continuer →"}
          </button>
        </div>
      )}

      {/* Step 2: Pick spots (CHOSEN mode) */}
      {step === "pick" && mode === "CHOSEN" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-amber-100 p-4">
            <h2 className="font-semibold text-gray-800 mb-1">
              Sélectionnez {count} emplacement{count > 1 ? "s" : ""} sur la carte
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              {count > 1
                ? "Les emplacements doivent être consécutifs dans la même allée. "
                : ""}
              Cliquez sur un emplacement vert pour le sélectionner.
            </p>
            <div className="h-96 rounded-lg overflow-hidden bg-gray-50">
              <SpotPicker
                zones={zones}
                spots={spots}
                selectedIds={selectedSpotIds}
                onSelectionChange={setSelectedSpotIds}
                maxSelect={count}
              />
            </div>
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-green-200 border border-green-400 inline-block" />{" "}
                Disponible
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-amber-200 border border-amber-500 inline-block" />{" "}
                Sélectionné
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-red-200 border border-red-400 inline-block" />{" "}
                Non disponible
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep("mode")}
              className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Retour
            </button>
            <button
              onClick={handlePickNext}
              disabled={isPending || selectedSpotIds.length === 0}
              className="flex-[2] bg-amber-600 text-white py-2.5 px-6 rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:opacity-50"
            >
              {isPending
                ? "Vérification..."
                : `Confirmer (${selectedSpotIds.length}/${count}) →`}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === "confirm" && (
        <div className="bg-white rounded-xl border border-amber-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Récapitulatif de votre réservation</h2>
          <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
            {selectedSpots.map((spot) => {
              const zone = zones.find((z) => z.id === spot.zoneId);
              return (
                <div key={spot.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <span className="font-medium text-gray-800">{spot.label}</span>
                    {zone && (
                      <span className="ml-2 text-xs text-gray-500">({zone.name})</span>
                    )}
                  </div>
                  <span className="text-gray-700">
                    {formatPrice(spot.basePrice + (zone?.priceModifier ?? 0))}
                  </span>
                </div>
              );
            })}
            {supplement > 0 && (
              <div className="flex items-center justify-between px-4 py-3 bg-amber-50">
                <span className="text-amber-700">Supplément choix de place</span>
                <span className="text-amber-700 font-medium">+{formatPrice(supplement)}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 font-semibold">
              <span>Total</span>
              <span className="text-amber-700 text-lg">{formatPrice(totalPrice)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Mode : {mode === "AUTO" ? "Attribution automatique" : "Choix libre"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(mode === "AUTO" ? "mode" : "pick")}
              className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50"
            >
              ← Retour
            </button>
            <button
              onClick={handleHold}
              disabled={isPending}
              className="flex-[2] bg-amber-600 text-white py-2.5 px-6 rounded-lg hover:bg-amber-700 font-medium disabled:opacity-50"
            >
              {isPending
                ? "Réservation..."
                : event.onlinePaymentEnabled
                ? "Confirmer la réservation →"
                : "Confirmer sans paiement →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
