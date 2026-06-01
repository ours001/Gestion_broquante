"use client";
import { useState, useTransition, useCallback } from "react";
import dynamic from "next/dynamic";
import { ZonePanel } from "./zone-panel";
import { SpotProperties } from "./spot-properties";
import { EditorToolbar } from "./editor-toolbar";
import { RowGenerator } from "./row-generator";
import { saveMapAction, type ZoneData, type SpotData } from "@/app/actions/map";
import { nanoid } from "nanoid";

type Tool = "select" | "create";

// Dynamic import at module level to avoid re-creating on each render
const MapCanvas = dynamic(
  () => import("./map-canvas").then((m) => ({ default: m.MapCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <span className="text-gray-400">Chargement du canvas...</span>
      </div>
    ),
  }
);

export function MapEditor({
  eventId,
  initialZones,
  initialSpots,
}: {
  eventId: string;
  initialZones: ZoneData[];
  initialSpots: SpotData[];
}) {
  const [zones, setZones] = useState<ZoneData[]>(
    initialZones.map((z) => ({ ...z, tempId: z.id }))
  );
  const [spots, setSpots] = useState<SpotData[]>(
    initialSpots.map((s) => ({ ...s, tempId: s.id }))
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [activeZoneId, setActiveZoneId] = useState<string | null>(
    initialZones[0]?.id ?? null
  );
  const [showRowGenerator, setShowRowGenerator] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [, startTransition] = useTransition();

  const selectedSpots = spots.filter((s) => selectedIds.includes(s.tempId ?? s.id ?? ""));

  // ZONE operations
  const addZone = useCallback(() => {
    const tempId = nanoid();
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];
    const color = colors[zones.length % colors.length];
    const newZone: ZoneData = { tempId, name: `Zone ${zones.length + 1}`, color, priceModifier: 0 };
    setZones((prev) => [...prev, newZone]);
    setActiveZoneId(tempId);
  }, [zones.length]);

  const updateZone = useCallback((tempId: string, updates: Partial<ZoneData>) => {
    setZones((prev) => prev.map((z) => (z.tempId === tempId || z.id === tempId) ? { ...z, ...updates } : z));
  }, []);

  const deleteZone = useCallback((tempId: string) => {
    setZones((prev) => prev.filter((z) => z.tempId !== tempId && z.id !== tempId));
    setSpots((prev) => prev.filter((s) => s.zoneId !== tempId));
    setActiveZoneId((prev) => {
      if (prev === tempId) {
        return zones.find((z) => z.tempId !== tempId && z.id !== tempId)?.tempId ?? null;
      }
      return prev;
    });
  }, [zones]);

  // SPOT operations
  const addSpot = useCallback((spot: Omit<SpotData, "tempId">) => {
    const tempId = nanoid();
    setSpots((prev) => [...prev, { ...spot, tempId }]);
    setSelectedIds([tempId]);
  }, []);

  const updateSpot = useCallback((tempId: string, updates: Partial<SpotData>) => {
    setSpots((prev) => prev.map((s) => (s.tempId === tempId || s.id === tempId) ? { ...s, ...updates } : s));
  }, []);

  const deleteSelected = useCallback(() => {
    setSpots((prev) => prev.filter((s) => !selectedIds.includes(s.tempId ?? s.id ?? "")));
    setSelectedIds([]);
  }, [selectedIds]);

  const duplicateSelected = useCallback(() => {
    const newSpots = spots
      .filter((s) => selectedIds.includes(s.tempId ?? s.id ?? ""))
      .map((s) => ({ ...s, tempId: nanoid(), id: undefined, x: s.x + 20, y: s.y + 20 }));
    setSpots((prev) => [...prev, ...newSpots]);
    setSelectedIds(newSpots.map((s) => s.tempId!));
  }, [spots, selectedIds]);

  const generateRow = useCallback((config: {
    count: number;
    direction: "horizontal" | "vertical";
    spotWidth: number;
    spotHeight: number;
    spacing: number;
    labelPrefix: string;
    startNumber: number;
    basePrice: number;
    zoneId: string;
  }) => {
    const zone = zones.find((z) => z.tempId === config.zoneId || z.id === config.zoneId);
    if (!zone) return;
    const startX = 100;
    const startY = 100;
    const newSpots: SpotData[] = Array.from({ length: config.count }, (_, i) => ({
      tempId: nanoid(),
      zoneId: config.zoneId,
      label: `${config.labelPrefix}${config.startNumber + i}`,
      position: i,
      x: config.direction === "horizontal"
        ? startX + i * (config.spotWidth + config.spacing)
        : startX,
      y: config.direction === "vertical"
        ? startY + i * (config.spotHeight + config.spacing)
        : startY,
      width: config.spotWidth,
      height: config.spotHeight,
      rotation: 0,
      type: "STANDARD" as const,
      basePrice: config.basePrice,
      hasElectricity: false,
      hasTable: false,
      hasShelter: false,
      allowsVehicle: false,
    }));
    setSpots((prev) => [...prev, ...newSpots]);
    setShowRowGenerator(false);
  }, [zones]);

  // SAVE
  const handleSave = useCallback(() => {
    setSaveStatus("saving");
    startTransition(async () => {
      try {
        await saveMapAction(eventId, zones, spots);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
      }
    });
  }, [eventId, zones, spots]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <EditorToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onDelete={deleteSelected}
        onDuplicate={duplicateSelected}
        onShowRowGenerator={() => setShowRowGenerator(true)}
        onSave={handleSave}
        saveStatus={saveStatus}
        hasSelection={selectedIds.length > 0}
      />
      <div className="flex flex-1 overflow-hidden">
        <ZonePanel
          zones={zones}
          activeZoneId={activeZoneId}
          onSelectZone={setActiveZoneId}
          onAddZone={addZone}
          onUpdateZone={updateZone}
          onDeleteZone={deleteZone}
        />
        <div className="flex-1 overflow-hidden bg-gray-100">
          <MapCanvas
            zones={zones}
            spots={spots}
            selectedIds={selectedIds}
            activeTool={activeTool}
            activeZoneId={activeZoneId}
            onSelectSpots={setSelectedIds}
            onAddSpot={addSpot}
            onUpdateSpot={updateSpot}
          />
        </div>
        <SpotProperties
          selectedSpots={selectedSpots}
          zones={zones}
          onUpdateSpot={updateSpot}
        />
      </div>
      {showRowGenerator && (
        <RowGenerator
          zones={zones}
          activeZoneId={activeZoneId}
          onGenerate={generateRow}
          onClose={() => setShowRowGenerator(false)}
        />
      )}
    </div>
  );
}
