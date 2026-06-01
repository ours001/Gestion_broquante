"use client";
import { useRef, useEffect, useState } from "react";
import Konva from "konva";
import { Stage, Layer, Rect, Text, Group } from "react-konva";

const STATUS_COLORS: Record<string, { fill: string; stroke: string }> = {
  AVAILABLE: { fill: "#dcfce7", stroke: "#16a34a" },
  HELD: { fill: "#fef9c3", stroke: "#ca8a04" },
  RESERVED: { fill: "#fee2e2", stroke: "#dc2626" },
};

interface SpotData {
  id: string;
  label: string;
  zoneId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  status: string;
}

interface ZoneData {
  id: string;
  color: string;
  name: string;
}

export function ReadOnlyCanvas({
  zones,
  spots,
  selectedIds,
  onSelectSpots,
}: {
  zones: ZoneData[];
  spots: SpotData[];
  selectedIds: string[];
  onSelectSpots: (ids: string[]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 400 });
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setSize({ width: el.offsetWidth, height: el.offsetHeight })
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const scaleBy = 1.1;
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition()!;
    const to = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };
    const newScale = Math.min(
      Math.max(e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy, 0.2),
      5
    );
    setStageScale(newScale);
    setStagePos({
      x: pointer.x - to.x * newScale,
      y: pointer.y - to.y * newScale,
    });
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        draggable
        onDragEnd={(e) => {
          if (e.target === stageRef.current)
            setStagePos({ x: e.target.x(), y: e.target.y() });
        }}
      >
        <Layer>
          {spots.map((spot) => {
            const isSelected = selectedIds.includes(spot.id);
            const colors = isSelected
              ? { fill: "#fef3c7", stroke: "#f59e0b" }
              : STATUS_COLORS[spot.status] ?? STATUS_COLORS.AVAILABLE;
            const canSelect = spot.status === "AVAILABLE";
            return (
              <Group
                key={spot.id}
                x={spot.x}
                y={spot.y}
                rotation={spot.rotation}
                onClick={() =>
                  canSelect &&
                  onSelectSpots(
                    selectedIds.includes(spot.id)
                      ? selectedIds.filter((id) => id !== spot.id)
                      : [...selectedIds, spot.id]
                  )
                }
              >
                <Rect
                  width={spot.width}
                  height={spot.height}
                  fill={colors.fill}
                  stroke={isSelected ? "#f59e0b" : colors.stroke}
                  strokeWidth={isSelected ? 2 : 1}
                  cornerRadius={2}
                />
                <Text
                  text={spot.label}
                  width={spot.width}
                  height={spot.height}
                  align="center"
                  verticalAlign="middle"
                  fontSize={Math.min(12, spot.width / 4)}
                  fill={colors.stroke}
                  fontStyle="bold"
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
