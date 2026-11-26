// Genera los PNG del manifest desde los SVG de public/icons. Uso: node scripts/generar-iconos.mjs
import sharp from "sharp";
const salidas = [
  ["icon.svg", "icon-192.png", 192],
  ["icon.svg", "icon-512.png", 512],
  ["maskable.svg", "maskable-512.png", 512],
  ["icon.svg", "apple-touch-icon.png", 180],
];
for (const [src, out, size] of salidas) {
  await sharp(`public/icons/${src}`).resize(size, size).png().toFile(`public/icons/${out}`);
  console.log("ok", out);
}
