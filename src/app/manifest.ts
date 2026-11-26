import type { MetadataRoute } from "next";
import { contentPack } from "@/composition/contenido";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const { app } = contentPack;
  return {
    name: app.nombre,
    short_name: app.nombreCorto,
    description: app.descripcion,
    lang: contentPack.idioma,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF7F2",
    theme_color: "#0F6E63",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
