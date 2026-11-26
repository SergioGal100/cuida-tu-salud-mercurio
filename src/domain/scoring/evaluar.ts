import type { ContentPack, MuestraSugeridaId, NivelId } from "../contenido/ContentPack";
import {
  condiciones,
  exposicionVapor,
  pescadoFrecuente,
  respuestaExposicion,
  sintomasMarcados,
} from "./condiciones";
import { evaluarLaboratorio } from "./laboratorio";
import { nivelMayor, nivelPorPuntaje } from "./niveles";
import type {
  Advertencia,
  Motivo,
  OpcionesEvaluacion,
  Respuestas,
  ResultadoEvaluacion,
} from "./tipos";

/**
 * Motor de puntaje. Función pura: no usa reloj, red ni almacenamiento.
 * Puntajes, cortes, reglas y textos vienen del pack.
 */
export function evaluar(
  respuestas: Respuestas,
  pack: ContentPack,
  opciones: OpcionesEvaluacion = {},
): ResultadoEvaluacion {
  const motivos: Motivo[] = [];

  // 1. Exposición: suma de cada grupo, con tope.
  let sumaExposicion = 0;
  for (const grupo of pack.exposicion.grupos) {
    const elegida = respuestaExposicion(respuestas, grupo.id);
    const opcion = grupo.opciones.find((o) => o.id === elegida);
    if (!opcion) continue;
    sumaExposicion += opcion.puntos;
    if (opcion.puntos > 0 && opcion.motivo) {
      motivos.push({ tipo: "exposicion", id: grupo.id, texto: opcion.motivo });
    }
  }
  const puntajeExposicion = Math.min(sumaExposicion, pack.exposicion.tope);

  // 2. Síntomas: cada grupo suma una vez; "duda" suma 0 y se anota.
  let sumaSintomas = 0;
  const dudas: string[] = [];
  for (const grupo of pack.sintomas.grupos) {
    const r = respuestas.sintomas?.[grupo.id];
    if (r === "si") {
      sumaSintomas += grupo.puntos;
      motivos.push({ tipo: "sintoma", id: grupo.id, texto: grupo.etiqueta });
    } else if (r === "duda") {
      dudas.push(grupo.id);
    }
  }
  const puntajeSintomas = Math.min(sumaSintomas, pack.sintomas.tope);

  // 3. Nivel base por rangos.
  const puntaje = puntajeExposicion + puntajeSintomas;
  let nivel: NivelId = nivelPorPuntaje(puntaje, pack);
  let urgente = false;

  // 4. Laboratorio (solo si viene en opciones).
  let nivelLaboratorio: NivelId | null = null;
  const advertencias: Advertencia[] = [];
  if (opciones.laboratorio) {
    if (opciones.fechaReferencia === undefined) {
      throw new Error("evaluar: con laboratorio se necesita opciones.fechaReferencia");
    }
    const lab = evaluarLaboratorio(opciones.laboratorio, opciones.fechaReferencia, pack);
    nivelLaboratorio = lab.nivel;
    advertencias.push(...lab.advertencias);
  }

  // 5. Reglas en orden de prioridad. Solo suben el nivel.
  const reglas: string[] = [];
  const activas = pack.reglas.filter((r) => r.activa).sort((a, b) => a.prioridad - b.prioridad);
  for (const regla of activas) {
    const condicion = condiciones[regla.id];
    if (!condicion) throw new Error(`evaluar: la regla "${regla.id}" del pack no tiene condición en el código`);
    const cumple = condicion({
      respuestas,
      pack,
      puntajeExposicion,
      hayLaboratorioVigente: nivelLaboratorio !== null,
    });
    if (!cumple) continue;

    reglas.push(regla.id);
    motivos.push({ tipo: "regla", id: regla.id, texto: regla.motivo });

    const { efecto } = regla;
    if (efecto.nivelMinimo) nivel = nivelMayor(nivel, efecto.nivelMinimo, pack);
    if (efecto.urgente) urgente = true;
    if (nivelLaboratorio !== null) {
      if (efecto.subeSiMayor) nivel = nivelMayor(nivel, nivelLaboratorio, pack);
      if (
        efecto.siNormalYSintomasMarcados &&
        nivelLaboratorio === pack.ordenNiveles[0] &&
        sintomasMarcados(respuestas)
      ) {
        nivel = nivelMayor(nivel, efecto.siNormalYSintomasMarcados, pack);
      }
    }
  }

  return {
    versionPack: pack.version,
    puntajeExposicion,
    puntajeSintomas,
    puntaje,
    nivel,
    urgente,
    reglas,
    motivos,
    muestraSugerida: muestraSugerida(respuestas, pack),
    dudas,
    nivelLaboratorio,
    advertencias,
  };
}

/** Se calcula siempre; la interfaz decide si la muestra (pack.muestraSugerida.mostrarDesdeNivel). */
function muestraSugerida(respuestas: Respuestas, pack: ContentPack): MuestraSugeridaId | null {
  const vapor = exposicionVapor(respuestas);
  const pescado = pescadoFrecuente(respuestas, pack);
  const m = pack.muestraSugerida;
  if (vapor && pescado) return m.ambas;
  if (vapor) return m.soloExposicionVapor;
  if (pescado) return m.soloPescadoFrecuente;
  return m.ninguna;
}
