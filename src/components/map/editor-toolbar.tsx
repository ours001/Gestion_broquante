"use client";
type Tool = "select" | "create";
export function EditorToolbar({
  activeTool, onToolChange, onDelete, onDuplicate,
  onShowRowGenerator, onSave, saveStatus, hasSelection,
}: {
  activeTool: Tool;
  onToolChange: (t: Tool) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onShowRowGenerator: () => void;
  onSave: () => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
  hasSelection: boolean;
}) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2">
      <button
        onClick={() => onToolChange("select")}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          activeTool === "select" ? "bg-amber-100 text-amber-800" : "hover:bg-gray-100 text-gray-700"
        }`}
        title="Sélectionner (V)"
      >
        ↖ Sélection
      </button>
      <button
        onClick={() => onToolChange("create")}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          activeTool === "create" ? "bg-amber-100 text-amber-800" : "hover:bg-gray-100 text-gray-700"
        }`}
        title="Dessiner un emplacement (R)"
      >
        ▭ Créer
      </button>
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <button
        onClick={onShowRowGenerator}
        className="px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-100 text-gray-700"
        title="Générer une allée"
      >
        ⋮⋮ Allée
      </button>
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <button
        onClick={onDuplicate}
        disabled={!hasSelection}
        className="px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-100 text-gray-700 disabled:opacity-40"
        title="Dupliquer (Ctrl+D)"
      >
        ⊕ Dupliquer
      </button>
      <button
        onClick={onDelete}
        disabled={!hasSelection}
        className="px-3 py-1.5 rounded text-sm font-medium hover:bg-red-50 text-red-600 disabled:opacity-40"
        title="Supprimer (Suppr)"
      >
        🗑 Supprimer
      </button>
      <div className="flex-1" />
      <span className="text-xs text-gray-400">Molette = zoom · Drag = déplacer la vue</span>
      <button
        onClick={onSave}
        disabled={saveStatus === "saving"}
        className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
          saveStatus === "saved" ? "bg-green-600 text-white" :
          saveStatus === "error" ? "bg-red-600 text-white" :
          "bg-amber-600 hover:bg-amber-700 text-white"
        } disabled:opacity-50`}
      >
        {saveStatus === "saving" ? "Sauvegarde..." : saveStatus === "saved" ? "✓ Sauvegardé" : saveStatus === "error" ? "Erreur !" : "💾 Sauvegarder"}
      </button>
    </div>
  );
}
