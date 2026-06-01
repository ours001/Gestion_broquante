"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import Konva from "konva";
import { Stage, Layer, Rect, Text, Group, Transformer, Line } from "react-konva";
import type { ZoneData, SpotData } from "@/app/actions/map";

const GRID_SIZE = 20;
const snapToGrid = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;

interface MapCanvasProps {
  zones: ZoneData[];
  spots: SpotData[];
  selectedIds: string[];
  activeTool: "select" | "create";
  activeZoneId: string | null;
  onSelectSpots: (ids: string[]) => void;
  onAddSpot: (spot: Omit<SpotData, "tempId">) => void;
  onUpdateSpot: (tempId: string, updates: Partial<SpotData>) => void;
}

export function MapCanvas({
  zones,
  spots,
  selectedIds,
  activeTool,
  activeZoneId,
  onSelectSpots,
  onAddSpot,
  onUpdateSpot,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const isDrawing = useRef(false);
  const drawStart = useRef({ x: 0, y: 0 });
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ width: el.offsetWidth, height: el.offsetHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Sync transformer with selection
  useEffect(() => {
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const nodes = selectedIds
      .map((id) => stage.findOne(`#spot-${id}`))
      .filter((n): n is Konva.Node => n !== undefined);
    tr.nodes(nodes);
  }, [selectedIds, spots]);

  const getZoneColor = useCallback(
    (zoneId: string) => zones.find((z) => z.tempId === zoneId || z.id === zoneId)?.color ?? "#94A3B8",
    [zones]
  );

  const getSpotKey = (s: SpotData) => s.tempId ?? s.id ?? "";

  // Mouse wheel zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const scaleBy = 1.1;
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.min(Math.max(newScale, 0.2), 5);
    setStageScale(clampedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  // Stage mouse events for drawing
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== "create") return;
    if (e.target !== stageRef.current) return;
    isDrawing.current = true;
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getRelativePointerPosition();
    if (!pos) return;
    const snapped = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) };
    drawStart.current = snapped;
    setDrawRect({ x: snapped.x, y: snapped.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current || activeTool !== "create") return;
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getRelativePointerPosition();
    if (!pos) return;
    const snapped = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) };
    setDrawRect({
      x: Math.min(drawStart.current.x, snapped.x),
      y: Math.min(drawStart.current.y, snapped.y),
      w: Math.abs(snapped.x - drawStart.current.x),
      h: Math.abs(snapped.y - drawStart.current.y),
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing.current || activeTool !== "create") return;
    isDrawing.current = false;
    if (drawRect && drawRect.w > GRID_SIZE && drawRect.h > GRID_SIZE && activeZoneId) {
      const zoneSpots = spots.filter((s) => s.zoneId === activeZoneId);
      onAddSpot({
        zoneId: activeZoneId,
        label: `E${spots.length + 1}`,
        position: zoneSpots.length,
        x: drawRect.x,
        y: drawRect.y,
        width: drawRect.w,
        height: drawRect.h,
        rotation: 0,
        type: "STANDARD",
        basePrice: 10,
        hasElectricity: false,
        hasTable: false,
        hasShelter: false,
        allowsVehicle: false,
      });
    }
    setDrawRect(null);
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== "select") return;
    if (e.target === stageRef.current) {
      onSelectSpots([]);
    }
  };

  // Grid lines
  const gridLines = () => {
    const lines = [];
    const w = size.width / stageScale;
    const h = size.height / stageScale;
    for (let i = 0; i < w * 2; i += GRID_SIZE) {
      lines.push(<Line key={`v${i}`} points={[i, 0, i, h * 2]} stroke="#e5e7eb" strokeWidth={0.5} />);
    }
    for (let j = 0; j < h * 2; j += GRID_SIZE) {
      lines.push(<Line key={`h${j}`} points={[0, j, w * 2, j]} stroke="#e5e7eb" strokeWidth={0.5} />);
    }
    return lines;
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleStageClick}
        draggable={activeTool === "select"}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
        style={{ cursor: activeTool === "create" ? "crosshair" : "default" }}
      >
        <Layer>
          {/* Grid */}
          {gridLines()}

          {/* Spots */}
          {spots.map((spot) => {
            const key = getSpotKey(spot);
            const color = getZoneColor(spot.zoneId);
            const isSelected = selectedIds.includes(key);
            return (
              <Group
                key={key}
                id={`spot-${key}`}
                x={spot.x}
                y={spot.y}
                rotation={spot.rotation}
                draggable={activeTool === "select"}
                onClick={(e) => {
                  e.cancelBubble = true;
                  if (e.evt.shiftKey) {
                    onSelectSpots(
                      selectedIds.includes(key)
                        ? selectedIds.filter((id) => id !== key)
                        : [...selectedIds, key]
                    );
                  } else {
                    onSelectSpots([key]);
                  }
                }}
                onDragEnd={(e) => {
                  onUpdateSpot(key, {
                    x: snapToGrid(e.target.x()),
                    y: snapToGrid(e.target.y()),
                  });
                  e.target.position({ x: snapToGrid(e.target.x()), y: snapToGrid(e.target.y()) });
                }}
                onTransformEnd={(e) => {
                  const node = e.target;
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();
                  node.scaleX(1);
                  node.scaleY(1);
                  onUpdateSpot(key, {
                    x: snapToGrid(node.x()),
                    y: snapToGrid(node.y()),
                    width: snapToGrid(Math.max(GRID_SIZE, spot.width * scaleX)),
                    height: snapToGrid(Math.max(GRID_SIZE, spot.height * scaleY)),
                    rotation: node.rotation(),
                  });
                }}
              >
                <Rect
                  width={spot.width}
                  height={spot.height}
                  fill={color + "33"}
                  stroke={isSelected ? "#f59e0b" : color}
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
                  fill={color}
                  fontStyle="bold"
                />
              </Group>
            );
          })}

          {/* Draw preview */}
          {drawRect && drawRect.w > 0 && (
            <Rect
              x={drawRect.x}
              y={drawRect.y}
              width={drawRect.w}
              height={drawRect.h}
              fill="#f59e0b22"
              stroke="#f59e0b"
              strokeWidth={1}
              dash={[4, 4]}
            />
          )}

          {/* Transformer */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < GRID_SIZE || newBox.height < GRID_SIZE) return oldBox;
              return newBox;
            }}
            rotateEnabled
            keepRatio={false}
          />
        </Layer>
      </Stage>
    </div>
  );
}
