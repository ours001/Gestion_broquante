"use client";
import { useState } from "react";
import type { ZoneData } from "@/app/actions/map";

export function ZonePanel({ zones, activeZoneId, onSelectZone, onAddZone, onUpdateZone, onDeleteZone }: {
  zones: ZoneData[];
  activeZoneId: string | null;
  onSelectZone: (id: string) => void;
  onAddZone: () => void;
  onUpdateZone: (id: string, updates: Partial<ZoneData>) => void;
  onDeleteZone: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="w-48 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Zones</span>
        <button onClick={onAddZone} className="text-amber-600 hover:text-amber-700 text-lg leading-none" title="Ajouter une zone">+</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {zones.length === 0 && (
          <p className="text-xs text-gray-400 p-3">Aucune zone. Cliquez + pour ajouter.</p>
        )}
        {zones.map((zone) => {
          const zoneKey = zone.tempId ?? zone.id ?? "";
          const isActive = activeZoneId === zoneKey;
          return (
            <div
              key={zoneKey}
              className={`group flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 ${isActive ? "bg-amber-50" : ""}`}
              onClick={() => onSelectZone(zoneKey)}
            >
              <input
                type="color"
                value={zone.color}
                onChange={(e) => onUpdateZone(zoneKey, { color: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                style={{ appearance: "none", background: "none" }}
              />
              {editingId === zoneKey ? (
                <input
                  autoFocus
                  defaultValue={zone.name}
                  onBlur={(e) => { onUpdateZone(zoneKey, { name: e.target.value }); setEditingId(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 text-sm border-b border-amber-400 outline-none bg-transparent"
                />
              ) : (
                <span
                  className="flex-1 text-sm text-gray-700 truncate"
                  onDoubleClick={(e) => { e.stopPropagation(); setEditingId(zoneKey); }}
                >
                  {zone.name}
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteZone(zoneKey); }}
                className="text-gray-300 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 ml-1"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
