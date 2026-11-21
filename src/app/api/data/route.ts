import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { autorizar } from '@/lib/auth'
import { calcularRiesgoGeneralEstudiantes, getEstudiantes, getMateriasConEvaluaciones, getNotas } from '@/lib/queries'

export async function GET(request: Request) {
  const a = autorizar(request, ['docente'])
  if ('error' in a) return a.error
  const materias = await getMateriasConEvaluaciones()
  const estudiantes = await getEstudiantes()
  const notas = await getNotas()
  const riesgoGeneral = await calcularRiesgoGeneralEstudiantes()

  // Conteos agregados para el dashboard
  // Promedio general PONDERADO por el peso de cada evaluación (coherente con el
  // promedio por estudiante, que también es ponderado).
  const pesoPorEvaluacion = new Map<string, number>()
  for (const m of materias) {
    for (const ev of m.evaluaciones) pesoPorEvaluacion.set(ev.id, ev.peso)
  }
  let sumaPond = 0
  let sumaPesos = 0
  for (const n of notas) {
    const p = pesoPorEvaluacion.get(n.evaluacionId) ?? 0
    sumaPond += n.valor * p
    sumaPesos += p
  }
  const promedioGeneral =
    sumaPesos > 0 ? Math.round((sumaPond / sumaPesos) * 10) / 10 : 0

  const distribucionRiesgo = {
    alto: riesgoGeneral.filter((r) => r.nivel === 'alto').length,
    medio: riesgoGeneral.filter((r) => r.nivel === 'medio').length,
    bajo: riesgoGeneral.filter((r) => r.nivel === 'bajo').length,
  }

  const aprobadas = notas.filter((n) => n.valor >= 51).length
  const reprobadas = notas.filter((n) => n.valor < 51).length

  // Promedio por materia (para gráfico)
  const promedioPorMateria = materias.map((m) => {
    const evIds = m.evaluaciones.map((e) => e.id)
    const notasMateria = notas.filter((n) => evIds.includes(n.evaluacionId))
    const prom =
      notasMateria.length > 0
        ? Math.round((notasMateria.reduce((s, n) => s + n.valor, 0) / notasMateria.length) * 10) / 10
        : 0
    return {
      id: m.id,
      nombre: m.nombre,
      color: m.color,
      promedio: prom,
      totalNotas: notasMateria.length,
    }
  })

  return NextResponse.json({
    materias: materias.map((m) => ({
      id: m.id,
      codigo: m.codigo,
      nombre: m.nombre,
      semestre: m.semestre,
      color: m.color,
      descripcion: m.descripcion,
      evaluaciones: m.evaluaciones.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        peso: e.peso,
        tema: e.tema,
        competencia: e.competencia,
        fecha: e.fecha.toISOString(),
      })),
    })),
    estudiantes: estudiantes.map((e) => ({
      id: e.id,
      codigo: e.codigo,
      nombre: e.nombre,
      apellido: e.apellido,
      semestre: e.semestre,
      carrera: e.carrera,
    })),
    notas: notas.map((n) => ({
      id: n.id,
      estudianteId: n.estudianteId,
      evaluacionId: n.evaluacionId,
      valor: n.valor,
      observacion: n.observacion,
      respuestaEjemplo: n.respuestaEjemplo,
    })),
    riesgoGeneral,
    resumen: {
      totalEstudiantes: estudiantes.length,
      totalMaterias: materias.length,
      totalEvaluaciones: materias.reduce((s, m) => s + m.evaluaciones.length, 0),
      totalNotas: notas.length,
      promedioGeneral,
      distribucionRiesgo,
      aprobadas,
      reprobadas,
      promedioPorMateria,
    },
  })
}
