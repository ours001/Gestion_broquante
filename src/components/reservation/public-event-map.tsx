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

interface PublicSpot {
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

interface PublicZone {
  id: string;
  name: string;
  color: string;
  priceModifier: number;
}

export function PublicEventMap({
  zones,
  spots,
}: {
  zones: PublicZone[];
  spots: PublicSpot[];
  readOnly?: boolean;
}) {
  return (
    <ReadOnlyCanvas
      zones={zones}
      spots={spots}
      selectedIds={[]}
      onSelectSpots={() => {}}
    />
  );
}
