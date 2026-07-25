"use client";

import { useState, use, Suspense } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { ArrowLeft, Play, Plus, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";

function SetlistDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const setlistId = idParam ? parseInt(idParam, 10) : -1;
  
  const [isAddingMode, setIsAddingMode] = useState(false);

  // Fetch the setlist
  const setlist = useLiveQuery(() => db.setlists.get(setlistId), [setlistId]);
  
  // Fetch all songs to allow adding
  const allSongs = useLiveQuery(() => db.songs.orderBy("title").toArray());

  if (!setlist) return <div className="p-10 text-center text-zinc-500 animate-pulse">Cargando setlist...</div>;

  // Derive the current songs in the setlist
  const setlistSongs = setlist.songs.map(songId => 
    allSongs?.find(s => s.id === songId)
  ).filter(Boolean); // Filter out any undefined if a song was deleted

  const handleAddSong = async (songId: number) => {
    if (setlist.songs.includes(songId)) return; // Already in setlist
    await db.setlists.update(setlistId, {
      songs: [...setlist.songs, songId]
    });
  };

  const handleRemoveSong = async (songId: number) => {
    await db.setlists.update(setlistId, {
      songs: setlist.songs.filter(id => id !== songId)
    });
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newSongs = [...setlist.songs];
    const temp = newSongs[index];
    newSongs[index] = newSongs[index - 1];
    newSongs[index - 1] = temp;
    await db.setlists.update(setlistId, { songs: newSongs });
  };

  const handleMoveDown = async (index: number) => {
    if (index === setlist.songs.length - 1) return;
    const newSongs = [...setlist.songs];
    const temp = newSongs[index];
    newSongs[index] = newSongs[index + 1];
    newSongs[index + 1] = temp;
    await db.setlists.update(setlistId, { songs: newSongs });
  };

  return (
    <div className="flex flex-col min-h-full space-y-6 pb-24 animate-in fade-in duration-500">
      
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-2xl pt-5 pb-4 border-b border-white/5 shadow-sm -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/setlists" className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-semibold tracking-wide text-zinc-200 flex-1 truncate">{setlist.title}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddingMode(!isAddingMode)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 flex-1 justify-center border",
              isAddingMode 
                ? "bg-zinc-800 border-zinc-700 text-zinc-300"
                : "bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20"
            )}
          >
            <Plus className={clsx("w-4 h-4 transition-transform", isAddingMode && "rotate-45")} />
            {isAddingMode ? "Cerrar catálogo" : "Añadir Canciones"}
          </button>
          
          <Link 
            href={setlist.songs.length > 0 ? `/gig?id=${setlist.songs[0]}&setlist=${setlist.id}` : "#"}
            className={clsx(
              "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 flex-1 justify-center",
              setlist.songs.length > 0 
                ? "bg-amber-500 text-black shadow-[0_4px_20px_rgba(245,158,11,0.2)] hover:bg-amber-400"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
            )}
          >
            <Play className="w-4 h-4 fill-current" />
            Tocar Show
          </Link>
        </div>
      </header>

      {/* Adding Mode: Library Catalog */}
      {isAddingMode && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5 animate-in slide-in-from-top-4">
          <h3 className="text-sm font-bold text-zinc-400 mb-4 uppercase tracking-wider">Catálogo Disponible</h3>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2">
            {allSongs?.filter(s => s.id && !setlist.songs.includes(s.id)).map(song => (
              <div key={song.id} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                <div className="truncate pr-4">
                  <p className="font-semibold text-zinc-200 truncate">{song.title}</p>
                  <p className="text-xs text-zinc-500 truncate">{song.artist}</p>
                </div>
                <button 
                  onClick={() => song.id && handleAddSong(song.id)}
                  className="p-2 bg-amber-500/10 text-amber-500 rounded-full hover:bg-amber-500 hover:text-black transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            ))}
            {allSongs?.filter(s => s.id && !setlist.songs.includes(s.id)).length === 0 && (
              <p className="text-zinc-500 text-sm text-center py-4">No hay más canciones para añadir.</p>
            )}
          </div>
        </div>
      )}

      {/* Setlist Songs Reordering */}
      <div>
        <h3 className="text-sm font-bold text-zinc-500 mb-4 uppercase tracking-wider">Repertorio del Show</h3>
        
        {setlistSongs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-3xl">
            <p className="text-zinc-500">Este setlist está vacío.</p>
            <p className="text-sm text-zinc-600 mt-2">Añade canciones para empezar el show.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {setlistSongs.map((song, index) => {
              if (!song || !song.id) return null;
              return (
                <div 
                  key={`${song.id}-${index}`} 
                  className="flex items-center bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 gap-4"
                >
                  {/* Reorder controls */}
                  <div className="flex flex-col items-center justify-center gap-1">
                    <button 
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-zinc-600 hover:text-white disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button 
                      onClick={() => handleMoveDown(index)}
                      disabled={index === setlistSongs.length - 1}
                      className="p-1 text-zinc-600 hover:text-white disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                  
                  <div className="flex-1 truncate">
                    <h4 className="font-bold text-zinc-200 truncate">{song.title}</h4>
                    <p className="text-sm text-zinc-500 truncate">{song.artist}</p>
                  </div>
                  
                  <button 
                    onClick={() => song.id && handleRemoveSong(song.id)}
                    className="p-3 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
    </div>
  );
}

export default function SetlistDetailPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-zinc-500 font-medium">Cargando repertorio...</div>}>
      <SetlistDetailContent />
    </Suspense>
  );
}
