import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { autorizar } from '@/lib/auth'

// GET /api/evaluaciones -> lista de evaluaciones creadas desde el banco (con sus preguntas)
export async function GET(request: Request) {
  const a = autorizar(request, ['docente', 'estudiante'])
  if ('error' in a) return a.error
  const { sesion } = a
  const evaluaciones = await db.evaluacion.findMany({
    where: { esDeBanco: true },
    include: {
      materia: true,
      preguntas: { include: { pregunta: true }, orderBy: { orden: 'asc' } },
      respuestas: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    evaluaciones: evaluaciones.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      peso: e.peso,
      tema: e.tema,
      competencia: e.competencia,
      fecha: e.fecha.toISOString(),
      materia: {
        id: e.materia.id,
        nombre: e.materia.nombre,
        color: e.materia.color,
        codigo: e.materia.codigo,
      },
      totalPreguntas: e.preguntas.length,
      preguntas: e.preguntas.map((ep) => ({
        id: ep.pregunta.id,
        orden: ep.orden,
        tema: ep.pregunta.tema,
        competencia: ep.pregunta.competencia,
        enunciado: ep.pregunta.enunciado,
        opciones: JSON.parse(ep.pregunta.opciones),
        dificultad: ep.pregunta.dificultad,
      })),
      // El estudiante solo ve si él mismo la rindió (no los ids de sus compañeros).
      rendidaPor: e.respuestas
        .map((r) => r.estudianteId)
        .filter((id) => sesion.rol === 'docente' || id === sesion.estudianteId),
      createdAt: e.createdAt.toISOString(),
    })),
  })
}

// POST /api/evaluaciones -> crea una evaluación desde el banco de preguntas
// Body: { materiaId, nombre, peso, preguntaIds: string[] }
export async function POST(request: Request) {
  const a = autorizar(request, ['docente'])
  if ('error' in a) return a.error
  try {
    const body = await request.json()
    const { materiaId, nombre, peso, preguntaIds } = body as {
      materiaId: string
      nombre: string
      peso: number
      preguntaIds: string[]
    }

    if (!materiaId || !nombre || !Array.isArray(preguntaIds) || preguntaIds.length === 0) {
      return NextResponse.json(
        { error: 'materiaId, nombre y al menos una pregunta son obligatorios.' },
        { status: 400 }
      )
    }
    if (typeof peso !== 'number' || peso < 0 || peso > 100) {
      return NextResponse.json({ error: 'El peso debe estar entre 0 y 100.' }, { status: 400 })
    }

    // Determinar tema y competencia dominantes entre las preguntas seleccionadas
    const preguntas = await db.pregunta.findMany({
      where: { id: { in: preguntaIds } },
    })
    if (preguntas.length === 0) {
      return NextResponse.json({ error: 'Las preguntas seleccionadas no existen.' }, { status: 400 })
    }

    const contar = (arr: string[]) => {
      const m = new Map<string, number>()
      for (const x of arr) m.set(x, (m.get(x) ?? 0) + 1)
      return [...m.entries()].sort((a, b) => b[1] - a[1])[0][0]
    }
    const temaDominante = contar(preguntas.map((p) => p.tema))
    const competenciaDominante = contar(preguntas.map((p) => p.competencia))

    const evaluacion = await db.evaluacion.create({
      data: {
        materiaId,
        nombre: nombre.trim(),
        peso,
        tema: temaDominante,
        competencia: competenciaDominante,
        fecha: new Date(),
        esDeBanco: true,
        preguntas: {
          create: preguntaIds.map((pid, i) => ({ preguntaId: pid, orden: i })),
        },
      },
      include: { materia: true, preguntas: true },
    })

    return NextResponse.json(
      {
        id: evaluacion.id,
        nombre: evaluacion.nombre,
        peso: evaluacion.peso,
        materia: { id: evaluacion.materia.id, nombre: evaluacion.materia.nombre },
        totalPreguntas: evaluacion.preguntas.length,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear evaluación:', error)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
