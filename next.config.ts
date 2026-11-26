import { randomUUID } from "node:crypto";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";
import pack from "./content/content_pack.json";

// Cambia en cada despliegue para que el service worker baje la versión nueva.
const revision = `${pack.version}-${process.env.VERCEL_GIT_COMMIT_SHA ?? randomUUID()}`;

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // El test y sus respaldos quedan en caché desde la primera visita.
  additionalPrecacheEntries: ["/", "/test", "/sin-conexion"].map((url) => ({ url, revision })),
  // Serwist no corre con next dev: probar con next build && next start.
  disable: process.env.NODE_ENV === "development",
  // No recargar al volver la señal: borraría un test a medio responder.
  reloadOnOnline: false,
});

const nextConfig: NextConfig = {
  // Asegura que el motor de Prisma para Linux viaje dentro de las funciones del servidor.
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node",
      "./node_modules/.prisma/client/schema.prisma",
    ],
  },
};

export default withSerwist(nextConfig);
