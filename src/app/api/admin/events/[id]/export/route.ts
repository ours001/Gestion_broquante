import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const event = await db.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reservations = await db.reservation.findMany({
    where: { eventId: id, status: { in: ["CONFIRMED", "HELD"] } },
    include: {
      user: true,
      spots: { include: { spot: { include: { zone: true } } } },
      payment: true,
    },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  const escape = (v: string | null | undefined) =>
    `"${(v ?? "").replace(/"/g, '""')}"`;

  const headers = ["N°", "Exposant", "Email", "Téléphone", "Emplacement(s)", "Zone(s)", "Mode", "Total (€)", "Paiement", "Statut", "Check-in", "Date réservation"];

  const rows = reservations.map((r, i) => {
    const spotLabels = r.spots.map((rs) => rs.spot.label).join(" / ");
    const zoneNames = [...new Set(r.spots.map((rs) => rs.spot.zone.name))].join(" / ");
    return [
      String(i + 1),
      escape(r.user.name),
      escape(r.user.email),
      escape(r.user.phone),
      escape(spotLabels),
      escape(zoneNames),
      r.mode === "CHOSEN" ? "Choix libre" : "Attribution auto",
      r.totalPrice.toFixed(2),
      r.payment?.status === "PAID" ? "Payé" : "Non payé",
      r.status === "CONFIRMED" ? "Confirmée" : "En attente",
      r.checkedInAt ? r.checkedInAt.toLocaleString("fr-FR") : "",
      r.createdAt.toLocaleDateString("fr-FR"),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `exposants-${event.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse("﻿" + csv, { // BOM for Excel UTF-8
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
