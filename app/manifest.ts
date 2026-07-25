import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mi Cancionero PWA",
    short_name: "Cancionero",
    description: "Cancionero Minimalista y Offline para letras de canciones",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    orientation: "portrait",
    icons: [
      {
        src: "/3844720.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
