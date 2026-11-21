import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { autorizar } from '@/lib/auth'

// GET /api/banco?materiaId=X -> lista de preguntas del banco (opcionalmente filtradas por materia)
export async function GET(request: Request) {
  // El banco incluye la respuesta correcta: solo el docente puede verlo.
  const a = autorizar(request, ['docente'])
  if ('error' in a) return a.error
  const { searchParams } = new URL(request.url)
  const materiaId = searchParams.get('materiaId')

  const preguntas = await db.pregunta.findMany({
    where: materiaId ? { materiaId } : undefined,
    include: { materia: true },
    orderBy: [{ materiaId: 'asc' }, { tema: 'asc' }],
  })

  return NextResponse.json({
    preguntas: preguntas.map((p) => ({
      id: p.id,
      materiaId: p.materiaId,
      materiaNombre: p.materia.nombre,
      materiaColor: p.materia.color,
      tema: p.tema,
      competencia: p.competencia,
      enunciado: p.enunciado,
      opciones: JSON.parse(p.opciones),
      correcta: p.correcta,
      explicacion: p.explicacion,
      dificultad: p.dificultad,
    })),
  })
}
