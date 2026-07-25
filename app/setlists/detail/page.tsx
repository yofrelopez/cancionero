"use client";

import { useState, Suspense } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { ArrowLeft, Play, Plus, Trash2, GripVertical, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableSongItem({ song, onRemove, isEditMode, setlistId }: { song: any, onRemove: (id: number) => void, isEditMode: boolean, setlistId: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: song.id,
    disabled: !isEditMode 
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.9 : 1,
  };

  const InnerContent = () => (
    <>
      {isEditMode && (
        <button 
          {...attributes} 
          {...listeners} 
          className="p-3 -ml-3 text-zinc-500 hover:text-zinc-300 touch-none active:text-amber-500 transition-colors cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-5 h-5" />
        </button>
      )}
      
      <div className={clsx("flex-1 min-w-0 pr-2", !isEditMode && "pl-2")}>
        <h4 className="font-bold text-zinc-100 truncate text-base">{song.title}</h4>
        <p className="text-sm text-zinc-500 truncate">{song.artist}</p>
      </div>
      
      {isEditMode ? (
        <button 
          onClick={(e) => { e.preventDefault(); onRemove(song.id); }}
          className="p-2.5 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200"
          title="Quitar del repertorio"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ) : (
        <div className="p-2.5 text-zinc-600 group-hover:text-amber-500 transition-colors">
          <Play className="w-4 h-4" />
        </div>
      )}
    </>
  );

  const containerClasses = clsx(
    "flex items-center bg-zinc-900/50 backdrop-blur-sm border rounded-2xl p-4 gap-4 transition-colors group", 
    isDragging ? "border-amber-500/50 shadow-[0_4px_20px_rgba(245,158,11,0.15)] bg-zinc-900" : "border-white/5 hover:border-white/10",
    !isEditMode && "cursor-pointer active:scale-[0.98]"
  );

  if (!isEditMode) {
    return (
      <Link href={`/gig?id=${song.id}&setlist=${setlistId}`} style={style} className={containerClasses}>
        <InnerContent />
      </Link>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className={containerClasses}>
      <InnerContent />
    </div>
  );
}

function SetlistDetailContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const setlistId = idParam ? parseInt(idParam, 10) : -1;
  
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch the setlist
  const setlist = useLiveQuery(() => db.setlists.get(setlistId), [setlistId]);
  
  // Fetch all songs to allow adding
  const allSongs = useLiveQuery(() => db.songs.orderBy("title").toArray());

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), 
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!setlist) return <div className="flex h-screen items-center justify-center text-zinc-500 font-medium animate-pulse">Cargando setlist...</div>;

  // Derive the current songs in the setlist (maintain correct order)
  const setlistSongs = setlist.songs.map(songId => 
    allSongs?.find(s => s.id === songId)
  ).filter(Boolean);

  const handleAddSong = async (songId: number) => {
    if (setlist.songs.includes(songId)) return;
    await db.setlists.update(setlistId, {
      songs: [...setlist.songs, songId]
    });
  };

  const handleRemoveSong = async (songId: number) => {
    await db.setlists.update(setlistId, {
      songs: setlist.songs.filter(id => id !== songId)
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = setlist.songs.indexOf(active.id as number);
      const newIndex = setlist.songs.indexOf(over.id as number);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newSongs = arrayMove(setlist.songs, oldIndex, newIndex);
        await db.setlists.update(setlistId, { songs: newSongs });
      }
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-32 animate-in fade-in duration-500">
      
      {/* Premium Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-2xl pt-5 pb-4 border-b border-white/5 shadow-sm px-4 sm:px-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <Link href="/setlists" className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-900">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white truncate">{setlist.title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={clsx(
                "px-4 py-2 text-sm font-bold rounded-full transition-colors",
                isEditMode ? "bg-amber-500 text-black" : "bg-zinc-900 text-amber-500 hover:bg-zinc-800"
              )}
            >
              {isEditMode ? "Hecho" : "Editar"}
            </button>
            <button 
              onClick={() => setIsAddingMode(true)}
              className="flex items-center justify-center p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-500 rounded-full transition-all duration-200 active:scale-95 flex-shrink-0"
              title="Añadir Canciones"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
        <p className="text-sm text-zinc-500 font-medium">
          {setlistSongs.length} {setlistSongs.length === 1 ? "canción" : "canciones"} en el repertorio
        </p>
      </header>

      {/* Setlist Songs Reordering */}
      <div className="px-4 sm:px-6 pt-6">
        
        {setlistSongs.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
            <p className="text-zinc-400 font-medium text-lg mb-2">Este setlist está vacío.</p>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto mb-6">Añade canciones a tu repertorio para comenzar el show.</p>
            <button 
              onClick={() => setIsAddingMode(true)}
              className="inline-flex items-center gap-2 bg-zinc-800 text-amber-500 hover:bg-zinc-700 px-6 py-3 rounded-xl text-sm font-bold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Explorar Biblioteca
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={setlist.songs} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">
                {setlistSongs.map((song) => {
                  if (!song || !song.id) return null;
                  return (
                    <SortableSongItem 
                      key={song.id} 
                      song={song} 
                      onRemove={handleRemoveSong} 
                      isEditMode={isEditMode} 
                      setlistId={setlistId}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
      
      {/* Catalog Bottom Sheet / Overlay */}
      {isAddingMode && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" 
            onClick={() => setIsAddingMode(false)} 
          />
          <div className="relative bg-[#111111] border-t border-zinc-800 rounded-t-[2.5rem] p-6 pb-safe w-full max-h-[85vh] flex flex-col pointer-events-auto animate-in slide-in-from-bottom-full duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6" />
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white tracking-wide">Añadir Canciones</h3>
              <button 
                onClick={() => setIsAddingMode(false)} 
                className="p-2.5 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2 overflow-y-auto pr-2 pb-8 flex-1 scrollbar-hide">
              {allSongs?.filter(s => s.id && !setlist.songs.includes(s.id)).map(song => (
                <div key={song.id} className="flex items-center justify-between p-3.5 bg-zinc-900/50 hover:bg-zinc-900 rounded-2xl border border-white/5 transition-colors">
                  <div className="truncate pr-4 flex-1">
                    <p className="font-bold text-zinc-200 truncate">{song.title}</p>
                    <p className="text-xs font-medium text-zinc-500 truncate mt-0.5">{song.artist}</p>
                  </div>
                  <button 
                    onClick={() => song.id && handleAddSong(song.id)}
                    className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-black transition-all font-bold active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              {allSongs?.filter(s => s.id && !setlist.songs.includes(s.id)).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-zinc-500 font-medium">No hay más canciones para añadir.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (Play Show) */}
      {setlist.songs.length > 0 && (
        <div className={clsx(
          "fixed bottom-24 right-6 z-40 transition-all duration-500",
          isAddingMode ? "translate-y-32 opacity-0" : "translate-y-0 opacity-100"
        )}>
          <Link 
            href={`/gig?id=${setlist.songs[0]}&setlist=${setlist.id}`}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black pl-5 pr-6 py-4 rounded-full font-extrabold shadow-[0_8px_30px_rgba(245,158,11,0.4)] active:scale-95 transition-all group"
          >
            <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
            <span className="tracking-wide">Tocar Show</span>
          </Link>
        </div>
      )}

    </div>
  );
}

export default function SetlistDetailPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-zinc-500 font-medium animate-pulse">Cargando setlist...</div>}>
      <SetlistDetailContent />
    </Suspense>
  );
}
