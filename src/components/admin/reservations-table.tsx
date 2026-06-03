"use client";
import { useState, useMemo } from "react";
import { formatPrice } from "@/lib/utils";

interface Reservation {
  id: string;
  status: string;
  mode: string;
  totalPrice: number;
  checkedInAt: string | null;
  createdAt: string;
  paid: boolean;
  user: { name: string | null; email: string | null; phone: string | null };
  spots: { label: string; zoneName: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmée", HELD: "En attente", CANCELLED: "Annulée", PENDING: "En cours",
};
const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-700",
  HELD: "bg-yellow-100 text-yellow-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  PENDING: "bg-blue-100 text-blue-700",
};

export function ReservationsTable({
  reservations,
  zones,
  eventId,
}: {
  reservations: Reservation[];
  zones: { id: string; name: string }[];
  eventId: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paidFilter, setPaidFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (paidFilter === "yes" && !r.paid) return false;
      if (paidFilter === "no" && r.paid) return false;
      if (zoneFilter !== "all" && !r.spots.some((s) => s.zoneName === zoneFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.user.name?.toLowerCase().includes(q) ||
          r.user.email?.toLowerCase().includes(q) ||
          r.spots.some((s) => s.label.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [reservations, search, statusFilter, paidFilter, zoneFilter]);

  const allZoneNames = [...new Set(reservations.flatMap((r) => r.spots.map((s) => s.zoneName)))];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Filter bar */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Rechercher exposant, emplacement…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400 flex-1 min-w-40"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400">
          <option value="all">Tous statuts</option>
          <option value="CONFIRMED">Confirmées</option>
          <option value="HELD">En attente</option>
          <option value="CANCELLED">Annulées</option>
        </select>
        <select value={paidFilter} onChange={(e) => setPaidFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400">
          <option value="all">Paiement : tous</option>
          <option value="yes">Payé</option>
          <option value="no">Non payé</option>
        </select>
        <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400">
          <option value="all">Toutes zones</option>
          {allZoneNames.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
        <span className="text-sm text-gray-400 self-center">{filtered.length} résultat(s)</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-gray-400">Aucune réservation ne correspond aux filtres</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Exposant", "Emplacement(s)", "Mode", "Total", "Paiement", "Statut", "Check-in", "Date"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{r.user.name ?? "—"}</div>
                    <div className="text-xs text-gray-400">{r.user.email}</div>
                    {r.user.phone && <div className="text-xs text-gray-400">{r.user.phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.spots.map((s) => (
                        <span key={s.label} className="bg-amber-50 text-amber-800 text-xs px-2 py-0.5 rounded-full border border-amber-200">
                          {s.label}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{r.spots[0]?.zoneName}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.mode === "CHOSEN" ? "Choix" : "Auto"}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{formatPrice(r.totalPrice)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.paid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {r.paid ? "Payé" : "En attente"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? ""}`}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.checkedInAt ? (
                      <span className="text-xs text-green-600 font-medium">
                        ✓ {new Date(r.checkedInAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
