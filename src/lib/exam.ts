import { db } from './db'

// --- Autocorrección de una evaluación rendida por un estudiante ---
// Calcula el puntaje y genera la evidencia (respuestas erróneas) que alimentará
// el análisis de IA, integrándose con el modelo Nota existente.

export interface ResultadoExamen {
  puntaje: number
  correctas: number
  total: number
  observacion: string
  evidencia: string // texto que se guarda en Nota.respuestaEjemplo
  detalle: {
    preguntaId: string
    enunciado: string
    tema: string
    competencia: string
    seleccionada: number | null
    correcta: number
    esCorrecta: boolean
    opciones: string[]
    explicacion: string
  }[]
}

export async function corregirExamen(
  estudianteId: string,
  evaluacionId: string,
  respuestas: Record<string, number>
): Promise<ResultadoExamen | null> {
  const evaluacion = await db.evaluacion.findUnique({
    where: { id: evaluacionId },
    include: {
      materia: true,
      preguntas: { include: { pregunta: true }, orderBy: { orden: 'asc' } },
    },
  })
  if (!evaluacion) return null

  const estudiante = await db.estudiante.findUnique({ where: { id: estudianteId } })
  if (!estudiante) return null

  const total = evaluacion.preguntas.length
  if (total === 0) return null

  let correctas = 0
  const detalle: ResultadoExamen['detalle'] = []
  const errores: string[] = []

  for (const ep of evaluacion.preguntas) {
    const p = ep.pregunta
    const opciones = JSON.parse(p.opciones) as string[]
    const sel = respuestas[p.id] // índice seleccionado o undefined
    const seleccionada = typeof sel === 'number' ? sel : null
    const esCorrecta = seleccionada === p.correcta
    if (esCorrecta) correctas++

    detalle.push({
      preguntaId: p.id,
      enunciado: p.enunciado,
      tema: p.tema,
      competencia: p.competencia,
      seleccionada,
      correcta: p.correcta,
      esCorrecta,
      opciones,
      explicacion: p.explicacion,
    })

    if (!esCorrecta) {
      errores.push(
        `[Tema: ${p.tema} | Competencia: ${p.competencia}]
Pregunta: ${p.enunciado}
Respuesta del estudiante: ${seleccionada !== null ? opciones[seleccionada] : '(sin responder)'}
Respuesta correcta: ${opciones[p.correcta]}
Explicación: ${p.explicacion}
---`
      )
    }
  }

  const puntaje = Math.round((correctas / total) * 1000) / 10
  const observacion = `Evaluación rendida · ${correctas}/${total} correctas · ${puntaje}/100`

  let evidencia = `Evaluación: "${evaluacion.nombre}" — ${correctas}/${total} correctas (${puntaje}/100)`
  if (errores.length > 0) {
    evidencia += `\n\nErrores detectados (${errores.length}):\n\n` + errores.join('\n')
  } else {
    evidencia += `\n\nSin errores. El estudiante respondió correctamente todas las preguntas.`
  }

  return { puntaje, correctas, total, observacion, evidencia, detalle }
}

// Guarda el resultado: crea/actualiza la Nota (integrándose al sistema existente)
// y registra la RespuestaEstudiante vinculada.
export async function guardarResultado(
  estudianteId: string,
  evaluacionId: string,
  resultado: ResultadoExamen
) {
  // Upsert de la Nota por (estudianteId, evaluacionId)
  const existente = await db.nota.findFirst({
    where: { estudianteId, evaluacionId },
  })

  let nota
  if (existente) {
    nota = await db.nota.update({
      where: { id: existente.id },
      data: {
        valor: resultado.puntaje,
        observacion: resultado.observacion,
        respuestaEjemplo: resultado.evidencia,
      },
    })
    // Si ya había una RespuestaEstudiante, actualizarla
    const respPrev = await db.respuestaEstudiante.findFirst({
      where: { estudianteId, evaluacionId },
    })
    if (respPrev) {
      await db.respuestaEstudiante.update({
        where: { id: respPrev.id },
        data: { notaId: nota.id, respuestas: JSON.stringify(resultado.detalle.map((d) => ({ preguntaId: d.preguntaId, sel: d.seleccionada }))), puntaje: resultado.puntaje, correctas: resultado.correctas, total: resultado.total },
      })
    } else {
      await db.respuestaEstudiante.create({
        data: { estudianteId, evaluacionId, notaId: nota.id, respuestas: JSON.stringify(resultado.detalle.map((d) => ({ preguntaId: d.preguntaId, sel: d.seleccionada }))), puntaje: resultado.puntaje, correctas: resultado.correctas, total: resultado.total },
      })
    }
  } else {
    nota = await db.nota.create({
      data: {
        estudianteId,
        evaluacionId,
        valor: resultado.puntaje,
        observacion: resultado.observacion,
        respuestaEjemplo: resultado.evidencia,
      },
    })
    await db.respuestaEstudiante.create({
      data: { estudianteId, evaluacionId, notaId: nota.id, respuestas: JSON.stringify(resultado.detalle.map((d) => ({ preguntaId: d.preguntaId, sel: d.seleccionada }))), puntaje: resultado.puntaje, correctas: resultado.correctas, total: resultado.total },
    })
  }

  return { notaId: nota.id }
}
