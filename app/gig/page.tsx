"use client";

import { useState, useEffect, use, useRef, Suspense } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useWakeLock } from "@/lib/wakelock";
import { ArrowLeft, Play, Square, Plus, Minus, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";

function GigModeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setlistIdParam = searchParams.get("setlist");
  const idParam = searchParams.get("id");
  
  const songId = idParam ? parseInt(idParam, 10) : -1;

  const [fontSize, setFontSize] = useState(24); // px
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1); // multiplier
  const [showControls, setShowControls] = useState(true);

  // Wake lock
  const { request: requestWakeLock, release: releaseWakeLock } = useWakeLock();

  // Queries
  const song = useLiveQuery(() => db.songs.get(songId), [songId]);
  const setlist = useLiveQuery(() => 
    setlistIdParam ? db.setlists.get(parseInt(setlistIdParam, 10)) : undefined
  , [setlistIdParam]);

  // Sub-pixel scroll accumulator
  const scrollAccumulator = useRef(0);

  // Handle Wake Lock
  useEffect(() => {
    requestWakeLock();
    return () => { releaseWakeLock(); };
  }, [requestWakeLock, releaseWakeLock]);

  // Handle Auto Scroll
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const scrollStep = (time: number) => {
      const delta = time - lastTime;
      // Scroll speed modifier (adjust 16ms approx 60fps base)
      if (delta >= 16) {
        const moveAmount = scrollSpeed * (delta / 16) * 0.5;
        scrollAccumulator.current += moveAmount;

        if (scrollAccumulator.current >= 1) {
          const pixels = Math.floor(scrollAccumulator.current);
          window.scrollBy(0, pixels);
          scrollAccumulator.current -= pixels;
        }
        
        lastTime = time;
      }
      if (isScrolling) {
        animationFrameId = requestAnimationFrame(scrollStep);
      }
    };

    if (isScrolling) {
      lastTime = performance.now();
      scrollAccumulator.current = 0; // Reset accumulator on play
      animationFrameId = requestAnimationFrame(scrollStep);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isScrolling, scrollSpeed]);

  // Touch handlers to show/hide controls
  const handleScreenTap = (e: React.MouseEvent) => {
    // If we click on a control button, don't toggle
    if ((e.target as HTMLElement).closest('.controls-overlay')) return;
    
    // Panic stop: If scrolling, any tap stops it immediately and shows controls
    if (isScrolling) {
      setIsScrolling(false);
      setShowControls(true);
      return;
    }
    
    // Otherwise toggle controls
    setShowControls(!showControls);
  };

  // Setlist Navigation
  const currentIndex = setlist?.songs.indexOf(songId) ?? -1;
  const prevSongId = currentIndex > 0 ? setlist?.songs[currentIndex - 1] : null;
  const nextSongId = currentIndex !== -1 && currentIndex < (setlist?.songs.length ?? 0) - 1 ? setlist?.songs[currentIndex + 1] : null;

  if (song === undefined) return <div className="h-screen bg-black flex items-center justify-center text-zinc-500">Cargando modo show...</div>;
  if (song === null) return <div className="h-screen bg-black flex items-center justify-center text-red-500">Canción no encontrada</div>;

  return (
    <div 
      className="min-h-screen bg-black text-amber-500 selection:bg-amber-500/20 pb-[50vh]"
      onClick={handleScreenTap}
    >
      {/* Invisible navigation areas (left/right) if in setlist mode */}
      {setlist && (
        <>
          {prevSongId && (
            <div 
              className="fixed left-0 top-[20%] bottom-[20%] w-[15vw] z-10 flex items-center justify-start opacity-0 hover:opacity-10 active:opacity-100 transition-opacity bg-gradient-to-r from-zinc-900/40 to-transparent cursor-pointer"
              onClick={(e) => { e.stopPropagation(); router.push(`/gig?id=${prevSongId}&setlist=${setlistIdParam}`); }}
            >
              <ChevronLeft className="w-16 h-16 text-zinc-300 ml-2" />
            </div>
          )}
          {nextSongId && (
            <div 
              className="fixed right-0 top-[20%] bottom-[20%] w-[15vw] z-10 flex items-center justify-end opacity-0 hover:opacity-10 active:opacity-100 transition-opacity bg-gradient-to-l from-zinc-900/40 to-transparent cursor-pointer"
              onClick={(e) => { e.stopPropagation(); router.push(`/gig?id=${nextSongId}&setlist=${setlistIdParam}`); }}
            >
              <ChevronRight className="w-16 h-16 text-zinc-300 mr-2" />
            </div>
          )}
        </>
      )}

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-6 pt-24">
        <div className="text-center pt-8 pb-10 border-b border-white/5 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-amber-500/90 mb-3 drop-shadow-sm">
            {song.title}
          </h1>
          <div className="flex items-center justify-center gap-3 text-lg font-medium text-zinc-400">
            <span>{song.artist}</span>
            {song.referenceKey && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span className="text-amber-500">{song.referenceKey}</span>
              </>
            )}
          </div>
        </div>

        <div 
          className="font-mono whitespace-pre-wrap leading-relaxed tracking-wide pb-12 text-center"
          style={{ fontSize: `${fontSize}px` }}
        >
          {(() => {
            let currentMode = "normal";
            const lines = song.lyrics.split('\n');
            
            return lines.map((line, idx) => {
              const trimmed = line.trim();
              const isTag = trimmed.startsWith('[') && trimmed.endsWith(']');
              
              if (isTag) {
                const tagLower = trimmed.toLowerCase();
                if (tagLower.includes('coro') || tagLower.includes('estribillo') || tagLower.includes('chorus')) {
                  currentMode = "chorus";
                } else {
                  currentMode = "normal";
                }
                
                return (
                  <div key={idx} className="text-amber-500 font-black tracking-widest uppercase text-[0.75em] mt-8 mb-2 opacity-100">
                    {trimmed}
                  </div>
                );
              }

              if (trimmed === '') {
                currentMode = "normal"; // Resetear el modo después del salto de estrofa
                return <div key={idx} className="h-4"></div>;
              }

              return (
                <div 
                  key={idx} 
                  className={clsx(
                    "transition-colors",
                    currentMode === "chorus" 
                      ? "text-amber-400 font-bold drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]" 
                      : "text-zinc-300"
                  )}
                >
                  {line}
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* FIXED CONTROLS OVERLAY */}
      {/* 
        El contenedor de los controles es z-50.
        Si showControls es false, lo ocultamos visualmente (opacity-0 y pointer-events-none),
        EXCEPTO el botón central de Play/Pause que mantenemos fantasma.
      */}
      
      {/* Top Bar (Only visible when controls are shown) */}
      <div className={clsx(
        "controls-overlay fixed top-0 left-0 right-0 p-4 bg-gradient-to-b from-black via-black/80 to-transparent transition-opacity duration-300 z-50 pointer-events-auto flex items-center justify-between",
        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <button 
          onClick={() => router.back()}
          className="w-12 h-12 flex items-center justify-center bg-zinc-900/80 backdrop-blur-md rounded-full border border-white/10 text-white active:scale-95 transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="flex bg-zinc-900/80 backdrop-blur-md rounded-full border border-white/10 p-1">
          <button 
            onClick={() => setFontSize(f => Math.max(16, f - 2))}
            className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 rounded-full active:scale-95 transition-all"
          >
            <Minus className="w-6 h-6" />
          </button>
          <div className="w-12 h-12 flex items-center justify-center font-bold text-lg text-amber-500">
            Aa
          </div>
          <button 
            onClick={() => setFontSize(f => Math.min(60, f + 2))}
            className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 rounded-full active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Bottom Control Bar */}
      {/* El botón Play SIEMPRE es clickable, incluso como fantasma */}
      <div className="controls-overlay fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex flex-col items-center gap-4 w-full max-w-sm px-4">
        
        {/* Speed Slider Panel (Hides when playing/controls hidden) */}
        <div className={clsx(
          "w-full bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl transition-all duration-300 transform",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Velocidad</span>
            <span className="text-xs font-bold text-amber-500">{scrollSpeed.toFixed(1)}x</span>
          </div>
          <input 
            type="range" 
            min="0.2" 
            max="3" 
            step="0.1" 
            value={scrollSpeed}
            onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Master Play/Stop Button (Ghost mode when controls hidden) */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering background tap
            const willPlay = !isScrolling;
            setIsScrolling(willPlay);
            if (willPlay) setShowControls(false); // Auto-hide controls on play
          }}
          className={clsx(
            "w-20 h-20 flex items-center justify-center rounded-full transition-all duration-300 active:scale-95",
            isScrolling 
              ? showControls 
                ? "bg-red-500/20 text-red-500 border border-red-500/30 backdrop-blur-md" // Stop state (visible)
                : "bg-black/20 text-white/20 border border-white/5 backdrop-blur-sm shadow-none" // Stop state (GHOST)
              : "bg-amber-500 text-black shadow-[0_4px_30px_rgba(245,158,11,0.4)]" // Play state
          )}
        >
          {isScrolling ? <Square className="w-8 h-8 fill-current" /> : <Play className="w-10 h-10 ml-2 fill-current" />}
        </button>

      </div>

    </div>
  );
}

export default function GigModePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-zinc-500 font-medium">Preparando escenario...</div>}>
      <GigModeContent />
    </Suspense>
  );
}
