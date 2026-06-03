"use client";
import { useState, useRef, useEffect, useTransition } from "react";
import { checkInAction } from "@/app/actions/admin";

// Parse reservation ID from QR code text
// QR can be: full URL "https://.../reservations/abc123/ticket" or just "abc123"
function parseReservationId(text: string): string | null {
  const urlMatch = text.match(/\/reservations\/([a-z0-9]+)\/ticket/i);
  if (urlMatch) return urlMatch[1];
  // Fallback: if it looks like a cuid/id itself
  if (/^[a-z0-9]{20,}$/i.test(text.trim())) return text.trim();
  return null;
}

type ScanResult = {
  ok: boolean;
  message: string;
  type: "success" | "error" | "warning";
};

export function CheckinScanner({ eventId }: { eventId: string }) {
  const [mode, setMode] = useState<"manual" | "camera">("manual");
  const [manualInput, setManualInput] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [isPending, startTransition] = useTransition();
  const scannerRef = useRef<any>(null);
  const scannerDivId = "qr-reader";

  const handleCheckIn = (reservationId: string) => {
    if (!reservationId) return;
    setResult(null);
    startTransition(async () => {
      const res = await checkInAction(reservationId);
      if (res.ok && res.reservation) {
        setResult({
          ok: true,
          type: "success",
          message: `✅ Bienvenue ${res.reservation.userName ?? ""} ! Place(s) : ${res.reservation.spotLabels.join(", ")}`,
        });
        setManualInput("");
      } else {
        setResult({
          ok: false,
          type: "error",
          message: `❌ ${res.error ?? "Erreur inconnue"}`,
        });
      }
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseReservationId(manualInput);
    if (!id) {
      setResult({ ok: false, type: "error", message: "Format invalide. Collez l'URL ou l'ID de la réservation." });
      return;
    }
    handleCheckIn(id);
  };

  // Camera scanner setup
  useEffect(() => {
    if (mode !== "camera") return;

    let html5QrCode: any;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        html5QrCode = new Html5Qrcode(scannerDivId);
        scannerRef.current = html5QrCode;
        setScanning(true);

        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 5, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            const id = parseReservationId(decodedText);
            if (id) {
              html5QrCode.pause();
              handleCheckIn(id);
              setTimeout(() => {
                if (html5QrCode && html5QrCode.isScanning) html5QrCode.resume();
              }, 3000);
            }
          },
          undefined
        );
      } catch (err) {
        console.error("Camera error:", err);
        setResult({ ok: false, type: "error", message: "Impossible d'accéder à la caméra. Utilisez la saisie manuelle." });
        setMode("manual");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [mode]);

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
        {(["manual", "camera"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResult(null); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === m ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {m === "manual" ? "✏️ Saisie manuelle" : "📷 Caméra"}
          </button>
        ))}
      </div>

      {/* Result banner */}
      {result && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          result.type === "success" ? "bg-green-50 border border-green-200 text-green-800" :
          result.type === "warning" ? "bg-yellow-50 border border-yellow-200 text-yellow-800" :
          "bg-red-50 border border-red-200 text-red-800"
        }`}>
          {result.message}
        </div>
      )}

      {/* Manual input */}
      {mode === "manual" && (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coller l&apos;URL du billet ou l&apos;identifiant de réservation
            </label>
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="https://votre-app.vercel.app/reservations/abc123/ticket"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !manualInput.trim()}
            className="w-full bg-amber-600 text-white py-2.5 rounded-lg hover:bg-amber-700 font-medium disabled:opacity-50"
          >
            {isPending ? "Vérification…" : "Valider le check-in"}
          </button>
        </form>
      )}

      {/* Camera scanner */}
      {mode === "camera" && (
        <div>
          <div id={scannerDivId} className="rounded-xl overflow-hidden" />
          {!scanning && (
            <p className="text-sm text-gray-400 text-center mt-2">Démarrage de la caméra…</p>
          )}
          {scanning && (
            <p className="text-sm text-gray-500 text-center mt-2">Pointez la caméra vers le QR code du billet</p>
          )}
        </div>
      )}
    </div>
  );
}
