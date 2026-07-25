"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { X, Save, ListMusic } from "lucide-react";
import clsx from "clsx";

interface SetlistEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SetlistEditorModal({ isOpen, onClose }: SetlistEditorModalProps) {
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await db.setlists.add({
        title: title.trim(),
        songs: [], // Initially empty, user adds songs from the setlist details page
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setTitle("");
      onClose();
    } catch (error) {
      console.error("Error saving setlist:", error);
      alert("Hubo un error al crear el setlist.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center bg-black/80 backdrop-blur-md sm:p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full h-auto max-h-[85vh] sm:max-w-md bg-zinc-950 sm:rounded-[2rem] sm:border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-zinc-900/40">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/10 rounded-full">
              <ListMusic className="w-5 h-5 text-amber-500" />
            </div>
            Crear Setlist
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-400 ml-1">Nombre del Setlist *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-2xl px-4 py-3.5 text-zinc-100 placeholder-zinc-600 outline-none transition-all"
              placeholder="Ej. Show en Bar 2026"
            />
          </div>

          <p className="text-sm text-zinc-500 ml-1">
            Podrás agregar y reordenar canciones una vez creado el setlist.
          </p>

          {/* Actions */}
          <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className={clsx(
                "flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 active:scale-95",
                (isSaving || !title.trim())
                  ? "bg-zinc-800/50 text-zinc-500 cursor-not-allowed"
                  : "bg-amber-500/90 hover:bg-amber-400 text-black shadow-sm"
              )}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
