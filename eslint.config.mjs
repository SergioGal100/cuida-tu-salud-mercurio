import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import boundaries from "eslint-plugin-boundaries";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Capas de la arquitectura limpia (ver CLAUDE.md).
const capas = [
  { type: "domain", pattern: "src/domain" },
  { type: "application", pattern: "src/application" },
  { type: "infrastructure", pattern: "src/infrastructure" },
  { type: "presentation", pattern: "src/presentation" },
  { type: "composition", pattern: "src/composition" },
  { type: "app", pattern: "src/app" },
  { type: "content", pattern: "content", partialMatch: false },
];

const permite = (from, to) => ({
  from: { element: { type: from } },
  allow: { to: { element: { types: to } } },
});

// domain y application son isomorfos: sin red, navegador, entorno, reloj ni azar.
const isomorfo = {
  files: ["src/domain/**/*.{ts,tsx}", "src/application/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-globals": [
      "error",
      { name: "fetch", message: "Prohibido en domain/application: usar un puerto." },
      { name: "window", message: "Prohibido en domain/application." },
      { name: "document", message: "Prohibido en domain/application." },
      { name: "navigator", message: "Prohibido en domain/application." },
      { name: "localStorage", message: "Prohibido en domain/application." },
      { name: "indexedDB", message: "Prohibido en domain/application." },
      { name: "process", message: "Prohibido en domain/application: la configuración entra por parámetros." },
      { name: "crypto", message: "Prohibido en domain/application: usar el puerto GeneradorId." },
    ],
    "no-restricted-syntax": [
      "error",
      {
        selector: "MemberExpression[object.name='Date'][property.name='now']",
        message: "Prohibido Date.now(): usar el puerto Reloj.",
      },
      {
        selector: "NewExpression[callee.name='Date'][arguments.length=0]",
        message: "Prohibido new Date() sin argumentos: usar el puerto Reloj.",
      },
      {
        selector: "CallExpression[callee.property.name='random'][callee.object.name='Math']",
        message: "Prohibido Math.random(): usar el puerto GeneradorId.",
      },
    ],
    // Solo se permiten imports relativos o con alias del propio proyecto (los vigila boundaries).
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            regex: "^(?!@/|\\.)",
            message: "domain/application no importan librerías externas.",
          },
        ],
      },
    ],
  },
};

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": capas,
      "import/resolver": { typescript: { alwaysTryTypes: true } },
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            permite("domain", ["domain"]),
            permite("application", ["domain", "application"]),
            permite("infrastructure", ["domain", "application", "infrastructure", "content"]),
            permite("presentation", ["domain", "application", "presentation"]),
            permite("composition", ["domain", "application", "infrastructure", "presentation", "composition"]),
            permite("app", ["composition", "presentation", "app"]),
          ],
        },
      ],
    },
  },
  isomorfo,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "public/**",
      ".netlify/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
