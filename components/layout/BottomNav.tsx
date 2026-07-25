"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Library, ListMusic } from "lucide-react";
import clsx from "clsx";

export default function BottomNav() {
  const pathname = usePathname();

  // Ocultar BottomNav si estamos en el modo "Show/Gig"
  if (pathname === "/gig" || pathname.startsWith("/gig/")) return null;

  const links = [
    { href: "/library", label: "Biblioteca", icon: Library },
    { href: "/setlists", label: "Setlists", icon: ListMusic },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-black/60 backdrop-blur-2xl border-t border-white/10 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
      {links.map((link) => {
        const isActive = pathname === link.href || (pathname === "/" && link.href === "/library");
        const Icon = link.icon;
        
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "flex flex-col items-center justify-center w-full py-4 text-xs font-semibold transition-all duration-200 active:scale-95",
              isActive ? "text-amber-500" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <div className={clsx(
              "p-1.5 rounded-full transition-all duration-300 mb-1",
              isActive ? "bg-amber-500/10" : "bg-transparent"
            )}>
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
            </div>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
