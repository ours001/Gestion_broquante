"use client";
import type { ZoneData, SpotData } from "@/app/actions/map";

export function SpotProperties({ selectedSpots, zones, onUpdateSpot }: {
  selectedSpots: SpotData[];
  zones: ZoneData[];
  onUpdateSpot: (id: string, updates: Partial<SpotData>) => void;
}) {
  if (selectedSpots.length === 0) {
    return (
      <div className="w-56 bg-white border-l border-gray-200 flex flex-col">
        <div className="px-3 py-2 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Propriétés</span>
        </div>
        <p className="text-xs text-gray-400 p-3">Sélectionnez un emplacement</p>
      </div>
    );
  }

  const spot = selectedSpots[0];
  const isBatch = selectedSpots.length > 1;

  const update = (updates: Partial<SpotData>) => {
    if (isBatch) {
      selectedSpots.forEach((s) => onUpdateSpot(s.tempId ?? s.id ?? "", updates));
    } else {
      onUpdateSpot(spot.tempId ?? spot.id ?? "", updates);
    }
  };

  return (
    <div className="w-56 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
      <div className="px-3 py-2 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Propriétés {isBatch ? `(${selectedSpots.length} sélectionnés)` : ""}
        </span>
      </div>
      <div className="p-3 space-y-3">
        {!isBatch && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Libellé</label>
            <input
              value={spot.label}
              onChange={(e) => update({ label: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-amber-400"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Zone</label>
          <select
            value={spot.zoneId}
            onChange={(e) => update({ zoneId: e.target.value })}
            className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-amber-400"
          >
            {zones.map((z) => {
              const zid = z.tempId ?? z.id ?? "";
              return <option key={zid} value={zid}>{z.name}</option>;
            })}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Prix de base (€)</label>
          <input
            type="number"
            value={spot.basePrice}
            onChange={(e) => update({ basePrice: parseFloat(e.target.value) || 0 })}
            className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-amber-400"
            min={0}
            step={0.5}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
          <select
            value={spot.type}
            onChange={(e) => update({ type: e.target.value as "STANDARD" | "PREMIUM" | "VEHICLE" })}
            className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-amber-400"
          >
            <option value="STANDARD">Standard</option>
            <option value="PREMIUM">Premium</option>
            <option value="VEHICLE">Véhicule</option>
          </select>
        </div>
        <div>
          <span className="block text-xs font-medium text-gray-500 mb-2">Options</span>
          <div className="space-y-1.5">
            {[
              { key: "hasElectricity", label: "⚡ Électricité" },
              { key: "hasTable", label: "🪑 Table fournie" },
              { key: "hasShelter", label: "⛱ Abri/couvert" },
              { key: "allowsVehicle", label: "🚗 Voiture autorisée" },
            ].map(({ key: optKey, label }) => (
              <label key={optKey} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!(spot as unknown as Record<string, unknown>)[optKey]}
                  onChange={(e) => update({ [optKey]: e.target.checked } as Partial<SpotData>)}
                  className="accent-amber-600"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        {!isBatch && (
          <div className="pt-2 border-t border-gray-100 text-xs text-gray-400 space-y-0.5">
            <p>Position: ({Math.round(spot.x)}, {Math.round(spot.y)})</p>
            <p>Taille: {Math.round(spot.width)} × {Math.round(spot.height)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
