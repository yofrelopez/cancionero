"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Plus, ListMusic, ChevronRight } from "lucide-react";
import Link from "next/link";
import SetlistEditorModal from "@/components/setlists/SetlistEditorModal";

export default function SetlistsPage() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const setlists = useLiveQuery(() => db.setlists.orderBy("createdAt").reverse().toArray());

  return (
    <div className="flex flex-col min-h-full space-y-6 pb-24">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-2xl pt-5 pb-4 border-b border-white/5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold tracking-wide text-zinc-200">Mis Setlists</h1>
          <button 
            onClick={() => setIsEditorOpen(true)}
            className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-500 active:scale-95 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Crear Setlist</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 animate-in fade-in duration-500">
        {!setlists ? (
          <div className="flex items-center justify-center h-64 text-zinc-600 font-medium animate-pulse">
            Cargando setlists...
          </div>
        ) : setlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 text-center space-y-5">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
              <ListMusic className="w-10 h-10 text-zinc-700" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-zinc-300">Aún no hay setlists</h3>
              <p className="text-zinc-500 max-w-xs mx-auto">Crea tu primer repertorio para tocar en vivo sin interrupciones.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {setlists.map((setlist) => (
              <Link
                key={setlist.id}
                href={`/setlists/detail?id=${setlist.id}`}
                className="group flex items-center justify-between bg-zinc-900/40 border border-zinc-800 hover:border-amber-500/30 rounded-3xl p-5 transition-all duration-300"
              >
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 mb-1">{setlist.title}</h3>
                  <p className="text-sm text-zinc-500">
                    {setlist.songs.length} {setlist.songs.length === 1 ? 'canción' : 'canciones'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-800 group-hover:bg-amber-500/20 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-amber-500" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <SetlistEditorModal 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)} 
      />
    </div>
  );
}
