"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Next.js App Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center">
      <h2 className="text-2xl font-bold text-red-500 mb-4">Algo salió mal</h2>
      <div className="bg-zinc-900 p-4 rounded-xl max-w-md w-full overflow-auto text-left mb-6 border border-zinc-800">
        <p className="text-sm font-mono text-zinc-300">
          {error.name}: {error.message}
        </p>
      </div>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-amber-500 text-black font-bold rounded-xl active:scale-95 transition-all"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
