"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Plus, Search, MicVocal, Trash2, Play, Pencil } from "lucide-react";
import Link from "next/link";
import SongEditorModal from "@/components/library/SongEditorModal";
import { toast } from "sonner";
import clsx from "clsx";

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSongId, setEditingSongId] = useState<number | null>(null);

  const songs = useLiveQuery(() => db.songs.orderBy("title").toArray());

  const filteredSongs = songs?.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteSong = (e: React.MouseEvent, songId: number, songTitle: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    toast(`¿Eliminar "${songTitle}"?`, {
      description: "Esta acción no se puede deshacer.",
      action: {
        label: "Eliminar",
        onClick: async () => {
          await db.songs.delete(songId);
          
          const setlistsToUpdate = await db.setlists.toArray();
          for (const sl of setlistsToUpdate) {
            if (sl.songs.includes(songId)) {
              await db.setlists.update(sl.id!, {
                songs: sl.songs.filter(id => id !== songId)
              });
            }
          }
          
          toast.success("Canción eliminada exitosamente");
        }
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {}
      },
      duration: 5000,
    });
  };

  return (
    <div className="flex flex-col min-h-full space-y-6 pb-24 px-4 sm:px-6">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-2xl pt-5 pb-4 border-b border-white/5 shadow-sm -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-white">Biblioteca</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200",
                isEditMode 
                  ? "bg-zinc-800 text-white" 
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
              )}
            >
              {isEditMode ? "Hecho" : "Editar"}
            </button>
            <button 
              onClick={() => {
                setEditingSongId(null);
                setIsEditorOpen(true);
              }}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black active:scale-95 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 shadow-[0_2px_15px_rgba(245,158,11,0.2)]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva</span>
            </button>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar canción o artista..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 focus:bg-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-zinc-100 placeholder-zinc-500 outline-none transition-all duration-300"
          />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 animate-in fade-in duration-500 pt-2">
        {!songs ? (
          <div className="flex items-center justify-center h-64 text-zinc-600 font-medium animate-pulse">
            Cargando repertorio...
          </div>
        ) : filteredSongs?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 text-center space-y-5">
            <div className="w-20 h-20 bg-zinc-900/50 rounded-full flex items-center justify-center border border-zinc-800/50">
              <MicVocal className="w-10 h-10 text-zinc-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-zinc-300">Sin resultados</h3>
              <p className="text-zinc-500 max-w-xs mx-auto text-sm">No encontramos canciones que coincidan con tu búsqueda.</p>
            </div>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="text-amber-500 text-sm font-semibold hover:text-amber-400 transition-colors active:scale-95 px-4 py-2 bg-amber-500/10 rounded-xl"
              >
                Limpiar filtro
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSongs?.map((song) => {
              const cardContent = (
                <>
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-lg font-bold text-zinc-100 mb-0.5 truncate group-hover:text-amber-400 transition-colors">{song.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-zinc-400 truncate">
                      <span className="truncate">{song.artist}</span>
                      {song.referenceKey && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-zinc-700 flex-shrink-0"></span>
                          <span className="font-semibold text-zinc-500 flex-shrink-0">{song.referenceKey}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {isEditMode ? (
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="p-2 text-zinc-500 group-hover:text-amber-500 transition-colors">
                        <Pencil className="w-5 h-5" />
                      </div>
                      <button
                        onClick={(e) => handleDeleteSong(e, song.id!, song.title)}
                        className="p-2 text-red-500/70 hover:text-red-400 hover:bg-red-400/20 bg-red-500/10 rounded-xl transition-all duration-200 z-10"
                        title="Eliminar canción"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-all shadow-sm">
                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                      </div>
                    </div>
                  )}
                </>
              );

              return isEditMode ? (
                <div
                  key={song.id}
                  onClick={() => {
                    setEditingSongId(song.id!);
                    setIsEditorOpen(true);
                  }}
                  className="group relative bg-zinc-900/20 border border-zinc-700 hover:border-amber-500/50 rounded-2xl p-4 transition-all duration-300 flex items-center justify-between cursor-pointer"
                >
                  {cardContent}
                </div>
              ) : (
                <Link
                  key={song.id}
                  href={`/gig?id=${song.id}`}
                  className="group relative bg-zinc-900/40 border border-zinc-800 hover:border-amber-500/30 hover:bg-zinc-900/80 rounded-2xl p-4 transition-all duration-300 flex items-center justify-between"
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Signature Footer */}
      <div className="pt-8 pb-4 text-center">
        <p className="text-xs text-zinc-600 font-medium tracking-wide">
          Desarrollado por <a href="https://idev.pe" target="_blank" rel="noopener noreferrer" className="text-amber-500/80 hover:text-amber-400 transition-colors underline decoration-amber-500/30 underline-offset-4">Yofré López</a>
        </p>
      </div>

      <SongEditorModal 
        isOpen={isEditorOpen} 
        onClose={() => {
          setIsEditorOpen(false);
          // Opcional: resetear editingSongId tras cerrar, aunque no es estrictamente necesario 
          // porque Nueva Canción siempre fuerza setEditingSongId(null)
        }} 
        editingSongId={editingSongId}
      />
    </div>
  );
}
