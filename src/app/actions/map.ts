"use server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type SpotData = {
  id?: string;
  tempId?: string;
  zoneId: string;
  label: string;
  position: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  type: "STANDARD" | "PREMIUM" | "VEHICLE";
  basePrice: number;
  hasElectricity: boolean;
  hasTable: boolean;
  hasShelter: boolean;
  allowsVehicle: boolean;
};

export type ZoneData = {
  id?: string;
  tempId?: string;
  name: string;
  color: string;
  priceModifier: number;
};

export async function saveMapAction(
  eventId: string,
  zones: ZoneData[],
  spots: SpotData[]
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  // Build zone id mapping (tempId -> real id)
  const zoneIdMap = new Map<string, string>();

  await db.$transaction(async (tx) => {
    // 1. Delete existing spots and zones for this event
    await tx.spot.deleteMany({ where: { eventId } });
    await tx.zone.deleteMany({ where: { eventId } });

    // 2. Create zones
    for (const zone of zones) {
      const created = await tx.zone.create({
        data: {
          eventId,
          name: zone.name,
          color: zone.color,
          priceModifier: zone.priceModifier,
        },
      });
      const key = zone.id || zone.tempId || "";
      zoneIdMap.set(key, created.id);
    }

    // 3. Create spots
    for (const spot of spots) {
      const realZoneId = zoneIdMap.get(spot.zoneId) ?? spot.zoneId;
      await tx.spot.create({
        data: {
          eventId,
          zoneId: realZoneId,
          label: spot.label,
          position: spot.position,
          x: spot.x,
          y: spot.y,
          width: spot.width,
          height: spot.height,
          rotation: spot.rotation,
          type: spot.type,
          basePrice: spot.basePrice,
          hasElectricity: spot.hasElectricity,
          hasTable: spot.hasTable,
          hasShelter: spot.hasShelter,
          allowsVehicle: spot.allowsVehicle,
          status: "AVAILABLE",
        },
      });
    }
  });

  revalidatePath(`/admin/events/${eventId}/map`);
  return { ok: true };
}
