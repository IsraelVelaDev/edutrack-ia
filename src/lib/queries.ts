import { db } from './db'
import { calcularRiesgo } from './risk'
import type { ResultadoRiesgo } from './types'

// --- Consultas y agregaciones de datos académicos ---

export async function getMateriasConEvaluaciones() {
  return db.materia.findMany({
    include: {
      evaluaciones: { orderBy: { fecha: 'asc' } },
    },
    orderBy: { semestre: 'asc' },
  })
}

// Nunca se expone passwordHash fuera de /api/auth.
const CAMPOS_PUBLICOS_ESTUDIANTE = {
  id: true, codigo: true, nombre: true, apellido: true, semestre: true, carrera: true, createdAt: true,
} as const

export async function getEstudiantes() {
  return db.estudiante.findMany({ orderBy: { codigo: 'asc' }, select: CAMPOS_PUBLICOS_ESTUDIANTE })
}

export async function getNotas() {
  return db.nota.findMany()
}

// Notas con contexto (evaluación + materia) para un estudiante
export async function getNotasDeEstudiante(estudianteId: string) {
  return db.nota.findMany({
    where: { estudianteId },
    include: {
      evaluacion: {
        include: { materia: true },
      },
    },
    orderBy: { evaluacion: { fecha: 'asc' } },
  })
}

// Riesgo general por estudiante (promediando todas sus materias combinadas)
export async function calcularRiesgoGeneralEstudiantes(): Promise<ResultadoRiesgo[]> {
  const estudiantes = await getEstudiantes()
  const notas = await db.nota.findMany({
    include: { evaluacion: true },
  })

  const resultados: ResultadoRiesgo[] = []

  for (const est of estudiantes) {
    const notasEst = notas
      .filter((n) => n.estudianteId === est.id)
      .map((n) => ({
        valor: n.valor,
        peso: n.evaluacion.peso,
        nombre: n.evaluacion.nombre,
        tema: n.evaluacion.tema,
        fecha: n.evaluacion.fecha.toISOString(),
      }))

    if (notasEst.length === 0) continue
    const res = calcularRiesgo({
      estudianteId: est.id,
      estudianteNombre: `${est.nombre} ${est.apellido}`,
      materiaId: null,
      materiaNombre: null,
      materiaColor: null,
      notas: notasEst,
    })
    resultados.push(res)
  }

  return resultados.sort((a, b) => b.puntaje - a.puntaje)
}

// Riesgo por materia para un estudiante específico
export async function calcularRiesgoEstudiante(estudianteId: string) {
  const estudiante = await db.estudiante.findUnique({
    where: { id: estudianteId },
    select: CAMPOS_PUBLICOS_ESTUDIANTE,
  })
  if (!estudiante) return null

  const notas = await db.nota.findMany({
    where: { estudianteId },
    include: {
      evaluacion: { include: { materia: true } },
    },
  })

  // Agrupar por materia
  const porMateria = new Map<string, {
    materia: { id: string; nombre: string; color: string }
    notas: { valor: number; peso: number; nombre: string; tema: string; fecha: string; respuestaEjemplo: string | null; observacion: string | null }[]
  }>()

  for (const n of notas) {
    const m = n.evaluacion.materia
    if (!porMateria.has(m.id)) {
      porMateria.set(m.id, {
        materia: { id: m.id, nombre: m.nombre, color: m.color },
        notas: [],
      })
    }
    porMateria.get(m.id)!.notas.push({
      valor: n.valor,
      peso: n.evaluacion.peso,
      nombre: n.evaluacion.nombre,
      tema: n.evaluacion.tema,
      fecha: n.evaluacion.fecha.toISOString(),
      respuestaEjemplo: n.respuestaEjemplo,
      observacion: n.observacion,
    })
  }

  const riesgoPorMateria: ResultadoRiesgo[] = []
  let notasGenerales: { valor: number; peso: number; nombre: string; tema: string; fecha: string }[] = []

  for (const [, grupo] of porMateria) {
    riesgoPorMateria.push(
      calcularRiesgo({
        estudianteId,
        estudianteNombre: `${estudiante.nombre} ${estudiante.apellido}`,
        materiaId: grupo.materia.id,
        materiaNombre: grupo.materia.nombre,
        materiaColor: grupo.materia.color,
        notas: grupo.notas.map((n) => ({
          valor: n.valor,
          peso: n.peso,
          nombre: n.nombre,
          tema: n.tema,
          fecha: n.fecha,
        })),
      })
    )
    notasGenerales = notasGenerales.concat(
      grupo.notas.map((n) => ({
        valor: n.valor,
        peso: n.peso,
        nombre: n.nombre,
        tema: n.tema,
        fecha: n.fecha,
      }))
    )
  }

  const riesgoGeneral = calcularRiesgo({
    estudianteId,
    estudianteNombre: `${estudiante.nombre} ${estudiante.apellido}`,
    materiaId: null,
    materiaNombre: null,
    materiaColor: null,
    notas: notasGenerales,
  })

  return {
    estudiante: {
      id: estudiante.id,
      codigo: estudiante.codigo,
      nombre: estudiante.nombre,
      apellido: estudiante.apellido,
      semestre: estudiante.semestre,
      carrera: estudiante.carrera,
    },
    notas: notas.map((n) => ({
      id: n.id,
      valor: n.valor,
      observacion: n.observacion,
      respuestaEjemplo: n.respuestaEjemplo,
      evaluacion: {
        id: n.evaluacion.id,
        nombre: n.evaluacion.nombre,
        peso: n.evaluacion.peso,
        tema: n.evaluacion.tema,
        competencia: n.evaluacion.competencia,
      },
      materia: {
        id: n.evaluacion.materia.id,
        nombre: n.evaluacion.materia.nombre,
        color: n.evaluacion.materia.color,
        codigo: n.evaluacion.materia.codigo,
      },
    })),
    riesgoGeneral,
    riesgoPorMateria: riesgoPorMateria.sort((a, b) => b.puntaje - a.puntaje),
  }
}
