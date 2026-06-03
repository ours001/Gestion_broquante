"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-sm text-amber-600 hover:text-amber-700 underline print:hidden"
    >
      🖨️ Imprimer ce billet
    </button>
  );
}
