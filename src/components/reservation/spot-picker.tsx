"use client";
import dynamic from "next/dynamic";

const ReadOnlyCanvas = dynamic(
  () => import("./read-only-canvas").then((m) => ({ default: m.ReadOnlyCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Chargement...
      </div>
    ),
  }
);

interface SpotPickerZone {
  id: string;
  name: string;
  color: string;
  priceModifier: number;
}

interface SpotPickerSpot {
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

export function SpotPicker({
  zones,
  spots,
  selectedIds,
  onSelectionChange,
  maxSelect,
}: {
  zones: SpotPickerZone[];
  spots: SpotPickerSpot[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxSelect: number;
}) {
  const handleSelect = (ids: string[]) => {
    // Only allow selecting AVAILABLE spots
    const availableIds = ids.filter((id) => {
      const spot = spots.find((s) => s.id === id);
      return spot?.status === "AVAILABLE";
    });
    // Cap at maxSelect
    if (availableIds.length > maxSelect) {
      onSelectionChange(availableIds.slice(-maxSelect));
    } else {
      onSelectionChange(availableIds);
    }
  };

  return (
    <ReadOnlyCanvas
      zones={zones}
      spots={spots}
      selectedIds={selectedIds}
      onSelectSpots={handleSelect}
    />
  );
}
