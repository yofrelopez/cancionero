"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { processLyrics } from "@/lib/lyricsParser";
import { X, Save, FileText, Search, Loader2 } from "lucide-react";
import clsx from "clsx";

interface SongEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSongId?: number | null;
}

export default function SongEditorModal({ isOpen, onClose, editingSongId }: SongEditorModalProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [referenceKey, setReferenceKey] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Cargar datos si estamos editando
  useEffect(() => {
    if (isOpen) {
      if (editingSongId) {
        db.songs.get(editingSongId).then((song) => {
          if (song) {
            setTitle(song.title);
            setArtist(song.artist);
            setLyrics(song.lyrics);
            setReferenceKey(song.referenceKey || "");
          }
        });
      } else {
        // Reset para nueva canción
        setTitle("");
        setArtist("");
        setLyrics("");
        setReferenceKey("");
      }
    }
  }, [isOpen, editingSongId]);

  const searchLyrics = async () => {
    if (!title.trim()) {
      alert("Por favor, ingresa al menos el Título de la canción.");
      return;
    }

    setIsSearching(true);
    try {
      let artistToSearch = artist.trim();
      let titleToSearch = title.trim();

      // Autocomplete if artist is missing
      if (!artistToSearch) {
        const suggestRes = await fetch(`https://api.lyrics.ovh/suggest/${encodeURIComponent(titleToSearch)}`);
        if (suggestRes.ok) {
          const suggestData = await suggestRes.json();
          if (suggestData.data && suggestData.data.length > 0) {
            artistToSearch = suggestData.data[0].artist.name;
            titleToSearch = suggestData.data[0].title;
            setArtist(artistToSearch);
            setTitle(titleToSearch);
          } else {
            throw new Error("No se encontró ningún artista para este título. Por favor, escríbelo manualmente.");
          }
        }
      }

      let foundLyrics = "";
      const artistQuery = artistToSearch ? `&artist_name=${encodeURIComponent(artistToSearch)}` : "";
      
      // 1. Intentar con LRCLIB (Mejor para música latina global)
      const lrcRes = await fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(titleToSearch)}${artistQuery}`);
      if (lrcRes.ok) {
        const results = await lrcRes.json();
        if (results && results.length > 0) {
          // Preferir letras que ya traigan etiquetas estructuradas
          let best = results.find((r: any) => r.plainLyrics && r.plainLyrics.includes('['));
          if (!best) best = results.find((r: any) => r.plainLyrics);
          
          if (best && best.plainLyrics) {
            foundLyrics = best.plainLyrics;
            // Corregir automáticamente la ortografía y mayúsculas
            setTitle(best.trackName);
            setArtist(best.artistName);
          }
        }
      }

      // 2. Fallback a Lyrics.ovh si LRCLIB falló
      if (!foundLyrics && artistToSearch) {
        const ovhRes = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artistToSearch)}/${encodeURIComponent(titleToSearch)}`);
        if (ovhRes.ok) {
          const ovhData = await ovhRes.json();
          if (ovhData.lyrics) {
            foundLyrics = ovhData.lyrics.replace(/Paroles de la chanson.*?\r?\n/i, "");
          }
        }
      }

      if (foundLyrics) {
        const cleanLyrics = processLyrics(foundLyrics);
        setLyrics(cleanLyrics);
      } else {
        throw new Error("No se encontró la letra.");
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "No se pudo encontrar la letra. Intenta revisar la ortografía.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !lyrics.trim()) return;

    setIsSaving(true);
    try {
      if (editingSongId) {
        await db.songs.update(editingSongId, {
          title: title.trim(),
          artist: artist.trim() || "Desconocido",
          lyrics: lyrics.trim(),
          referenceKey: referenceKey.trim(),
        });
      } else {
        await db.songs.add({
          title: title.trim(),
          artist: artist.trim() || "Desconocido",
          referenceKey: referenceKey.trim(),
          lyrics: lyrics.trim(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving song:", error);
      alert("Hubo un error al guardar la canción.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center bg-black/80 backdrop-blur-md sm:p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full h-full sm:h-[85vh] sm:max-w-2xl bg-zinc-950 sm:rounded-[2rem] sm:border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-zinc-900/40">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-500" />
            </div>
            {editingSongId ? "Editar Canción" : "Añadir Canción"}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0">
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-400 ml-1">Título *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-2xl px-4 py-3.5 text-zinc-100 placeholder-zinc-600 outline-none transition-all"
                  placeholder="Ej. De Música Ligera"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-400 ml-1">Artista</label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-2xl px-4 py-3.5 text-zinc-100 placeholder-zinc-600 outline-none transition-all"
                  placeholder="Ej. Soda Stereo"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-semibold text-zinc-400 ml-1">Tono de Referencia (Opcional)</label>
                <input
                  type="text"
                  value={referenceKey}
                  onChange={(e) => setReferenceKey(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-2xl px-4 py-3.5 text-zinc-100 placeholder-zinc-600 outline-none transition-all"
                  placeholder="Ej. Sim, G, Do Mayor"
                />
              </div>
              
              <button
                type="button"
                onClick={searchLyrics}
                disabled={isSearching || !title.trim()}
                className={clsx(
                  "flex items-center justify-center gap-2 px-4 py-2.5 h-[42px] text-sm font-medium rounded-xl transition-all duration-200",
                  (isSearching || !title.trim())
                    ? "bg-zinc-800/50 text-zinc-500 cursor-not-allowed"
                    : "bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 active:scale-95"
                )}
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {isSearching ? "Buscando..." : "Buscar Letra"}
              </button>
            </div>

            <div className="space-y-2 flex-1 flex flex-col min-h-[350px]">
              <label className="text-sm font-semibold text-zinc-400 ml-1">Letra *</label>
              <textarea
                required
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="flex-1 w-full bg-zinc-900/50 border border-zinc-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-2xl p-5 text-zinc-100 placeholder-zinc-600 outline-none transition-all resize-none font-mono text-[15px] leading-loose shadow-inner"
                placeholder="Pega aquí la letra o búscala automáticamente con el botón de arriba..."
              ></textarea>
            </div>
          </div>

          {/* Sticky Actions Footer */}
          <div className="p-4 sm:px-6 bg-zinc-900/40 border-t border-white/5 flex justify-end gap-3 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim() || !lyrics.trim()}
              className={clsx(
                "flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 active:scale-95",
                (isSaving || !title.trim() || !lyrics.trim())
                  ? "bg-zinc-800/50 text-zinc-500 cursor-not-allowed"
                  : "bg-amber-500/90 hover:bg-amber-400 text-black shadow-sm"
              )}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Guardando..." : (editingSongId ? "Actualizar Canción" : "Guardar Canción")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
