import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import { contentPack } from "@/composition/contenido";
import "./globals.css";

// next/font descarga la fuente al compilar y la sirve desde el propio sitio
// (queda alojada localmente y en la caché del service worker).
const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: contentPack.app.nombre,
  description: contentPack.app.descripcion,
  applicationName: contentPack.app.nombreCorto,
  appleWebApp: { capable: true, title: contentPack.app.nombreCorto, statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0F6E63",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-BO" className={atkinson.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
