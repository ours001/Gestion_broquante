"use client";
import { useState } from "react";
import type { ZoneData } from "@/app/actions/map";

interface RowConfig {
  count: number;
  direction: "horizontal" | "vertical";
  spotWidth: number;
  spotHeight: number;
  spacing: number;
  labelPrefix: string;
  startNumber: number;
  basePrice: number;
  zoneId: string;
}

export function RowGenerator({ zones, activeZoneId, onGenerate, onClose }: {
  zones: ZoneData[];
  activeZoneId: string | null;
  onGenerate: (config: RowConfig) => void;
  onClose: () => void;
}) {
  const [config, setConfig] = useState<RowConfig>({
    count: 10,
    direction: "horizontal",
    spotWidth: 80,
    spotHeight: 60,
    spacing: 5,
    labelPrefix: "A",
    startNumber: 1,
    basePrice: 10,
    zoneId: activeZoneId ?? zones[0]?.tempId ?? zones[0]?.id ?? "",
  });

  const set = <K extends keyof RowConfig>(k: K, v: RowConfig[K]) =>
    setConfig((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-96 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Générer une allée</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre de places</label>
              <input type="number" min={1} max={100} value={config.count}
                onChange={(e) => set("count", parseInt(e.target.value) || 1)}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Direction</label>
              <select value={config.direction} onChange={(e) => set("direction", e.target.value as "horizontal" | "vertical")}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-400">
                <option value="horizontal">Horizontal →</option>
                <option value="vertical">Vertical ↓</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Largeur (px)</label>
              <input type="number" min={20} value={config.spotWidth}
                onChange={(e) => set("spotWidth", parseInt(e.target.value) || 60)}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hauteur (px)</label>
              <input type="number" min={20} value={config.spotHeight}
                onChange={(e) => set("spotHeight", parseInt(e.target.value) || 60)}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Espacement (px)</label>
              <input type="number" min={0} value={config.spacing}
                onChange={(e) => set("spacing", parseInt(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Prix de base (€)</label>
              <input type="number" min={0} step={0.5} value={config.basePrice}
                onChange={(e) => set("basePrice", parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Préfixe</label>
              <input value={config.labelPrefix} onChange={(e) => set("labelPrefix", e.target.value)}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Début numérotation</label>
              <input type="number" min={1} value={config.startNumber}
                onChange={(e) => set("startNumber", parseInt(e.target.value) || 1)}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Zone</label>
            <select value={config.zoneId} onChange={(e) => set("zoneId", e.target.value)}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-400">
              {zones.map((z) => {
                const zid = z.tempId ?? z.id ?? "";
                return <option key={zid} value={zid}>{z.name}</option>;
              })}
            </select>
          </div>
          <p className="text-xs text-gray-400">
            Aperçu : {config.labelPrefix}{config.startNumber} → {config.labelPrefix}{config.startNumber + config.count - 1}
          </p>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={() => onGenerate(config)}
            className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-700">
            Générer {config.count} emplacements
          </button>
        </div>
      </div>
    </div>
  );
}
