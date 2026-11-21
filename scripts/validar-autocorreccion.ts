// Validación de la autocorrección (src/lib/exam.ts).
// Uso: npx tsx scripts/validar-autocorreccion.ts  (genera docs/validacion-autocorreccion.md)
// Crea una evaluación temporal con 4 preguntas del banco y la elimina al terminar.
import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'
import { corregirExamen } from '../src/lib/exam'

const db = new PrismaClient()

async function main() {
  const est = await db.estudiante.findFirstOrThrow({ orderBy: { codigo: 'asc' } })
  const preguntas = await db.pregunta.findMany({ take: 4, orderBy: { id: 'asc' } })
  const materiaId = preguntas[0].materiaId
  const ev = await db.evaluacion.create({
    data: { materiaId, nombre: '__TEMP_VALIDACION__', peso: 10, tema: 'temp', competencia: 'temp', fecha: new Date(), esDeBanco: true,
      preguntas: { create: preguntas.map((p, i) => ({ preguntaId: p.id, orden: i + 1 })) } },
  })
  const buena = (p: (typeof preguntas)[number]) => p.correcta
  const mala = (p: (typeof preguntas)[number]) => (p.correcta + 1) % (JSON.parse(p.opciones) as string[]).length

  const casos: { nombre: string; resp: Record<string, number>; puntaje: number; correctas: number }[] = [
    { nombre: 'Todas correctas', resp: Object.fromEntries(preguntas.map((p) => [p.id, buena(p)])), puntaje: 100, correctas: 4 },
    { nombre: 'Todas incorrectas', resp: Object.fromEntries(preguntas.map((p) => [p.id, mala(p)])), puntaje: 0, correctas: 0 },
    { nombre: '2 de 4 correctas', resp: Object.fromEntries(preguntas.map((p, i) => [p.id, i < 2 ? buena(p) : mala(p)])), puntaje: 50, correctas: 2 },
    { nombre: '1 de 4 correcta', resp: Object.fromEntries(preguntas.map((p, i) => [p.id, i === 0 ? buena(p) : mala(p)])), puntaje: 25, correctas: 1 },
    { nombre: 'Sin responder', resp: {}, puntaje: 0, correctas: 0 },
    { nombre: '3 correctas + 1 sin responder', resp: Object.fromEntries(preguntas.slice(0, 3).map((p) => [p.id, buena(p)])), puntaje: 75, correctas: 3 },
  ]

  const out = ['# Validación de la autocorrección', '', `Generado: ${new Date().toISOString()}`, '',
    '| Caso | Correctas esperadas | Correctas obtenidas | Puntaje esperado | Puntaje obtenido | Errores en evidencia | Evidencia coherente | Resultado |', '|---|---|---|---|---|---|---|---|']
  let fallas = 0
  for (const c of casos) {
    const r = await corregirExamen(est.id, ev.id, c.resp)
    if (!r) { fallas++; out.push(`| ${c.nombre} | — | null | — | — | — | — | FALLA |`); continue }
    const esperadosErr = 4 - c.correctas
    const nErr = (r.evidencia.match(/Pregunta: /g) ?? []).length
    // la evidencia debe citar exactamente las preguntas falladas y ninguna acertada
    const falladas = r.detalle.filter((d) => !d.esCorrecta).map((d) => d.enunciado)
    const aciertos = r.detalle.filter((d) => d.esCorrecta).map((d) => d.enunciado)
    const evOk = nErr === esperadosErr && falladas.every((q) => r.evidencia.includes(q)) && aciertos.every((q) => !r.evidencia.includes(q))
    const ok = r.puntaje === c.puntaje && r.correctas === c.correctas && evOk
    if (!ok) fallas++
    out.push(`| ${c.nombre} | ${c.correctas} | ${r.correctas} | ${c.puntaje} | ${r.puntaje} | ${nErr}/${esperadosErr} | ${evOk ? 'Sí' : 'NO'} | ${ok ? 'CUMPLE' : 'FALLA'} |`)
  }
  out.push('', `Criterio de aceptación: puntaje = correctas/total×100 exacto y evidencia con exactamente las preguntas falladas. Fallas: ${fallas}.`)

  await db.evaluacionPregunta.deleteMany({ where: { evaluacionId: ev.id } })
  await db.evaluacion.delete({ where: { id: ev.id } })
  writeFileSync('docs/validacion-autocorreccion.md', out.join('\n'))
  console.log(out.join('\n'))
  if (fallas) process.exitCode = 1
}
main().finally(() => db.$disconnect())
