import type { FactorRiesgo, NivelRiesgo, ResultadoRiesgo } from './types'

// --- Lógica de riesgo académico: reglas sencillas y transparentes ---
// Diseñada para una feria universitaria: explicable y auditable.

const NOTA_APROBATORIA = 51 // >= 51 aprueba (escala 0-100)
const PROMEDIO_RIESGO_ALTO = 60
const PROMEDIO_RIESGO_MEDIO = 70

// Tramos del puntaje (0-100): 0-30 bajo · 31-60 medio · 61-100 alto
export const UMBRAL_MEDIO = 31
export const UMBRAL_ALTO = 61

export function nivelDesdePuntaje(puntaje: number): NivelRiesgo {
  if (puntaje >= UMBRAL_ALTO) return 'alto'
  if (puntaje >= UMBRAL_MEDIO) return 'medio'
  return 'bajo'
}

interface EntradaCalculo {
  estudianteId: string
  estudianteNombre: string
  materiaId: string | null
  materiaNombre: string | null
  materiaColor: string | null
  // notas ordenadas por fecha asc: { valor, peso, nombre, tema, fecha }
  notas: { valor: number; peso: number; nombre: string; tema: string; fecha: string }[]
}

function promedioPonderado(notas: { valor: number; peso: number }[]): number {
  if (notas.length === 0) return 0
  const sumaPesos = notas.reduce((s, n) => s + n.peso, 0)
  if (sumaPesos === 0) return 0
  const sumaPonderada = notas.reduce((s, n) => s + n.valor * n.peso, 0)
  return Math.round((sumaPonderada / sumaPesos) * 10) / 10
}

function desviacionEstandar(valores: number[]): number {
  if (valores.length === 0) return 0
  const media = valores.reduce((a, b) => a + b, 0) / valores.length
  const varianza = valores.reduce((s, v) => s + (v - media) ** 2, 0) / valores.length
  return Math.sqrt(varianza)
}

export function calcularRiesgo(entrada: EntradaCalculo): ResultadoRiesgo {
  const { notas } = entrada

  // Caso sin notas: estado "sin calificaciones" (distinto de "riesgo bajo")
  if (notas.length === 0) {
    return {
      estudianteId: entrada.estudianteId,
      estudianteNombre: entrada.estudianteNombre,
      materiaId: entrada.materiaId,
      materiaNombre: entrada.materiaNombre,
      materiaColor: entrada.materiaColor,
      promedio: 0,
      nivel: 'bajo',
      puntaje: 0,
      factores: [],
      reprobadas: 0,
      totalEvaluaciones: 0,
      tieneDatos: false,
    }
  }

  const promedio = promedioPonderado(notas)
  const valores = notas.map((n) => n.valor)
  const reprobadas = notas.filter((n) => n.valor < NOTA_APROBATORIA).length

  const factores: FactorRiesgo[] = []

  // Factor 1: promedio bajo
  if (promedio < NOTA_APROBATORIA) {
    factores.push({
      tipo: 'promedio',
      descripcion: 'Promedio general reprobatorio',
      evidencia: `Promedio ponderado de ${promedio}/100, por debajo del mínimo aprobatorio (${NOTA_APROBATORIA}).`,
    })
  } else if (promedio < PROMEDIO_RIESGO_MEDIO) {
    factores.push({
      tipo: 'promedio',
      descripcion: 'Promedio en zona de riesgo',
      evidencia: `Promedio ponderado de ${promedio}/100, en el rango ${NOTA_APROBATORIA}-${PROMEDIO_RIESGO_MEDIO - 1}.`,
    })
  }

  // Factor 2: evaluaciones reprobadas
  if (reprobadas >= 2) {
    factores.push({
      tipo: 'reprobadas',
      descripcion: `${reprobadas} evaluaciones reprobadas`,
      evidencia: `El estudiante reprobó ${reprobadas} de ${notas.length} evaluaciones.`,
    })
  } else if (reprobadas === 1) {
    const r = notas.find((n) => n.valor < NOTA_APROBATORIA)
    factores.push({
      tipo: 'reprobadas',
      descripcion: '1 evaluación reprobada',
      evidencia: `Reprobó "${r?.nombre}" (${r?.valor}/100, tema: ${r?.tema}).`,
    })
  }

  // Factor 3: tendencia descendente (última vs penúltima)
  if (notas.length >= 2) {
    const ultimas = [...notas].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    )
    const penultima = ultimas[ultimas.length - 2]
    const ultima = ultimas[ultimas.length - 1]
    const delta = ultima.valor - penultima.valor
    if (delta <= -10) {
      factores.push({
        tipo: 'tendencia',
        descripcion: 'Tendencia descendente',
        evidencia: `Caída de ${Math.abs(delta)} puntos entre "${penultima.nombre}" (${penultima.valor}) y "${ultima.nombre}" (${ultima.valor}).`,
      })
    }
  }

  // Factor 4: baja nota en evaluación de alto peso (>= 30%)
  const altaPesoReprobada = notas.find((n) => n.peso >= 30 && n.valor < NOTA_APROBATORIA)
  if (altaPesoReprobada) {
    factores.push({
      tipo: 'peso_alto',
      descripcion: 'Reprobó una evaluación de alto peso',
      evidencia: `"${altaPesoReprobada.nombre}" pesa ${altaPesoReprobada.peso}% y obtuvo ${altaPesoReprobada.valor}/100.`,
    })
  }

  // Factor 5: variabilidad alta (inconsistencia)
  const desv = desviacionEstandar(valores)
  if (desv > 20 && valores.length >= 3) {
    factores.push({
      tipo: 'variabilidad',
      descripcion: 'Desempeño inconsistente',
      evidencia: `Desviación estándar de ${Math.round(desv)} puntos entre evaluaciones.`,
    })
  }

  // --- Puntaje de riesgo 0-100: ÚNICA fuente del nivel ---
  // Suma ponderada de factores; luego se aplican pisos mínimos (reglas duras).
  // El nivel se deriva SIEMPRE del puntaje final, por lo que no pueden contradecirse.
  let puntaje = 0
  if (promedio < NOTA_APROBATORIA) puntaje += 45
  else if (promedio < PROMEDIO_RIESGO_ALTO) puntaje += 30
  else if (promedio < PROMEDIO_RIESGO_MEDIO) puntaje += 18
  puntaje += reprobadas * 12
  if (altaPesoReprobada) puntaje += 15
  if (factores.some((f) => f.tipo === 'tendencia')) puntaje += 12
  if (factores.some((f) => f.tipo === 'variabilidad')) puntaje += 8
  puntaje = Math.min(100, puntaje)

  // Pisos mínimos: elevan el puntaje hasta el inicio del tramo correspondiente.
  const pisoAlto =
    promedio < PROMEDIO_RIESGO_ALTO || reprobadas >= 2 || Boolean(altaPesoReprobada)
  const pisoMedio =
    promedio < PROMEDIO_RIESGO_MEDIO ||
    reprobadas === 1 ||
    factores.some((f) => f.tipo === 'tendencia' || f.tipo === 'variabilidad')
  if (pisoAlto) puntaje = Math.max(puntaje, UMBRAL_ALTO)
  else if (pisoMedio) puntaje = Math.max(puntaje, UMBRAL_MEDIO)

  const nivel = nivelDesdePuntaje(puntaje)

  return {
    estudianteId: entrada.estudianteId,
    estudianteNombre: entrada.estudianteNombre,
    materiaId: entrada.materiaId,
    materiaNombre: entrada.materiaNombre,
    materiaColor: entrada.materiaColor,
    promedio,
    nivel,
    puntaje,
    factores,
    reprobadas,
    totalEvaluaciones: notas.length,
    tieneDatos: true,
  }
}

export function estadoAprobacion(promedio: number): {
  estado: 'aprobado' | 'en_riesgo' | 'reprobado'
  label: string
} {
  if (promedio < NOTA_APROBATORIA) return { estado: 'reprobado', label: 'Reprobado' }
  if (promedio < PROMEDIO_RIESGO_MEDIO) return { estado: 'en_riesgo', label: 'En riesgo' }
  return { estado: 'aprobado', label: 'Aprobado' }
}

export function colorNivelRiesgo(nivel: NivelRiesgo): {
  badge: string
  dot: string
  text: string
} {
  switch (nivel) {
    case 'alto':
      return {
        badge: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900',
        dot: 'bg-rose-500',
        text: 'text-rose-600 dark:text-rose-400',
      }
    case 'medio':
      return {
        badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
        dot: 'bg-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
      }
    case 'bajo':
      return {
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
        dot: 'bg-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
      }
  }
}
