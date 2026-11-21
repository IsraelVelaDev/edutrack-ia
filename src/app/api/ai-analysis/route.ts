import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { autorizarSobreEstudiante } from '@/lib/auth'
import { analizarBrechasAprendizaje } from '@/lib/ai'
import { calcularRiesgoEstudiante } from '@/lib/queries'
import type { ResultadoAnalisisIA } from '@/lib/types'

// GET /api/ai-analysis?estudianteId=X -> lista de análisis almacenados del estudiante
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const estudianteId = searchParams.get('estudianteId')

  if (!estudianteId) {
    return NextResponse.json({ error: 'estudianteId es obligatorio.' }, { status: 400 })
  }
  const a = autorizarSobreEstudiante(request, estudianteId)
  if ('error' in a) return a.error

  const analisis = await db.analisisIA.findMany({
    where: { estudianteId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    analisis: analisis.map((a) => ({
      id: a.id,
      estudianteId: a.estudianteId,
      materiaId: a.materiaId,
      createdAt: a.createdAt.toISOString(),
      resultado: {
        brechas: JSON.parse(a.brechas),
        recomendaciones: JSON.parse(a.recomendaciones),
        ejercicios: JSON.parse(a.ejercicios),
        resumen: a.resumen,
        meta: a.meta ? JSON.parse(a.meta) : undefined,
      } as ResultadoAnalisisIA,
    })),
  })
}

// POST /api/ai-analysis { estudianteId, materiaId? }
// Ejecuta un nuevo análisis IA, lo almacena y lo devuelve.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { estudianteId, materiaId } = body

    if (!estudianteId) {
      return NextResponse.json({ error: 'estudianteId es obligatorio.' }, { status: 400 })
    }
    const a = autorizarSobreEstudiante(request, estudianteId)
    if ('error' in a) return a.error

    // Obtener el detalle del estudiante (notas con contexto)
    const detalle = await calcularRiesgoEstudiante(estudianteId)
    if (!detalle) {
      return NextResponse.json({ error: 'Estudiante no encontrado.' }, { status: 404 })
    }

    // Filtrar evaluaciones según materiaId (si se especifica) o todas
    const notasFiltradas = materiaId
      ? detalle.notas.filter((n) => n.materia.id === materiaId)
      : detalle.notas

    if (notasFiltradas.length === 0) {
      return NextResponse.json(
        { error: 'El estudiante no tiene notas registradas para analizar.' },
        { status: 400 }
      )
    }

    const materiaNombre = materiaId
      ? detalle.notas.find((n) => n.materia.id === materiaId)?.materia.nombre ?? null
      : null

    // Ejecutar análisis IA
    const resultado = await analizarBrechasAprendizaje({
      estudianteNombre: `${detalle.estudiante.nombre} ${detalle.estudiante.apellido}`,
      materiaNombre,
      evaluaciones: notasFiltradas.map((n) => ({
        nombre: n.evaluacion.nombre,
        tema: n.evaluacion.tema,
        competencia: n.evaluacion.competencia,
        valor: n.valor,
        peso: n.evaluacion.peso,
        respuestaEjemplo: n.respuestaEjemplo,
      })),
    })

    // Almacenar el análisis
    const analisis = await db.analisisIA.create({
      data: {
        estudianteId,
        materiaId: materiaId ?? null,
        brechas: JSON.stringify(resultado.brechas),
        recomendaciones: JSON.stringify(resultado.recomendaciones),
        ejercicios: JSON.stringify(resultado.ejercicios),
        resumen: resultado.resumen,
        meta: resultado.meta ? JSON.stringify(resultado.meta) : null,
      },
    })

    return NextResponse.json({
      id: analisis.id,
      estudianteId: analisis.estudianteId,
      materiaId: analisis.materiaId,
      createdAt: analisis.createdAt.toISOString(),
      resultado,
    })
  } catch (error) {
    console.error('Error en análisis IA:', error)
    const mensaje =
      error instanceof Error && error.message.startsWith('OpenRouter')
        ? error.message
        : error instanceof Error && error.message.includes('OPENROUTER_API_KEY')
          ? error.message
          : 'Error al procesar el análisis.'
    return NextResponse.json({ error: mensaje }, { status: 500 })
  }
}
