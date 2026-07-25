import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Mi Cancionero",
  description: "Repertorio offline de letras",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mi Cancionero",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.className} h-full bg-black text-zinc-100 antialiased overflow-hidden flex flex-col`}>
        <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto h-full">
          {children}
        </main>
        <BottomNav />
        <Toaster theme="dark" position="top-center" richColors />
      </body>
    </html>
  );
}
