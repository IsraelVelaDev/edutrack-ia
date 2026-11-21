// Validación del cálculo de notas y riesgo académico.
// Uso: npx tsx scripts/validar-riesgo.ts   (genera docs/validacion-riesgo.md)
import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'
import { calcularRiesgo, nivelDesdePuntaje } from '../src/lib/risk'

const db = new PrismaClient()
const NOTA_APROB = 51

// Oráculo independiente: reglas duras del documento, sin usar el puntaje.
function nivelEsperadoPorReglas(valores: number[], pesos: number[]): 'bajo' | 'medio' | 'alto' {
  const sp = pesos.reduce((a, b) => a + b, 0)
  const prom = valores.reduce((s, v, i) => s + v * pesos[i], 0) / sp
  const rep = valores.filter((v) => v < NOTA_APROB).length
  const altoPeso = valores.some((v, i) => pesos[i] >= 30 && v < NOTA_APROB)
  if (prom < 60 || rep >= 2 || altoPeso) return 'alto'
  const media = valores.reduce((a, b) => a + b, 0) / valores.length
  const desv = Math.sqrt(valores.reduce((s, v) => s + (v - media) ** 2, 0) / valores.length)
  const caida = valores.length >= 2 && valores[valores.length - 1] - valores[valores.length - 2] <= -10
  if (prom < 70 || rep === 1 || caida || (desv > 20 && valores.length >= 3)) return 'medio'
  return 'bajo'
}

const mk = (valores: number[], pesos: number[]) =>
  calcularRiesgo({
    estudianteId: 'x', estudianteNombre: 'x', materiaId: null, materiaNombre: null, materiaColor: null,
    notas: valores.map((v, i) => ({ valor: v, peso: pesos[i], nombre: `e${i}`, tema: 't', fecha: `2026-0${i + 1}-01` })),
  })

async function main() {
  const out: string[] = ['# Validación del cálculo de riesgo', '', `Generado: ${new Date().toISOString()}`, '']

  // 1) Malla exhaustiva: coherencia nivel/puntaje y contra reglas duras
  const niveles = [35, 45, 50, 55, 65, 75, 90]
  const pesos = [20, 30, 30, 20]
  let total = 0, incoherentes = 0, difReglas = 0
  const dist = { bajo: 0, medio: 0, alto: 0 }
  const ejemplos: string[] = []
  for (const a of niveles) for (const b of niveles) for (const c of niveles) for (const d of niveles) {
    const v = [a, b, c, d]
    const r = mk(v, pesos)
    total++
    dist[r.nivel]++
    if (r.nivel !== nivelDesdePuntaje(r.puntaje)) incoherentes++
    const esp = nivelEsperadoPorReglas(v, pesos)
    if (esp !== r.nivel) { difReglas++; if (ejemplos.length < 5) ejemplos.push(`${v.join('/')}: reglas=${esp}, sistema=${r.nivel} (${r.puntaje})`) }
  }
  out.push('## 1. Coherencia nivel vs. puntaje (malla exhaustiva)', '',
    '| Indicador | Valor | Criterio de aceptación | Resultado |', '|---|---|---|---|',
    `| Casos evaluados | ${total} | — | — |`,
    `| Casos con nivel ≠ tramo del puntaje | ${incoherentes} | 0 | ${incoherentes === 0 ? 'CUMPLE' : 'FALLA'} |`,
    `| Casos con nivel ≠ reglas duras (oráculo independiente) | ${difReglas} | 0 | ${difReglas === 0 ? 'CUMPLE' : 'FALLA'} |`,
    `| Distribución bajo / medio / alto | ${dist.bajo} / ${dist.medio} / ${dist.alto} | — | — |`, '')
  if (ejemplos.length) out.push('Ejemplos de discrepancia: ' + ejemplos.join('; '), '')

  // 2) Casos de borde nombrados
  const bordes: [string, number[]][] = [
    ['Promedio 55, sin reprobadas', [55, 55, 55, 55]], ['Promedio 65 estable', [65, 65, 65, 65]],
    ['1 reprobada (peso 20)', [80, 80, 80, 45]], ['Reprobada de peso 30', [90, 45, 90, 90]],
    ['Caída de 15 puntos', [90, 90, 90, 75]], ['Estable en 75', [75, 75, 75, 75]],
    ['Promedio 45', [45, 45, 45, 45]], ['Alternando 95/40', [95, 40, 95, 40]],
  ]
  out.push('## 2. Casos de borde', '', '| Caso | Notas | Promedio | Puntaje | Nivel | Tramo del puntaje | Coherente |', '|---|---|---|---|---|---|---|')
  for (const [n, v] of bordes) {
    const r = mk(v, pesos)
    out.push(`| ${n} | ${v.join('/')} | ${r.promedio} | ${r.puntaje} | ${r.nivel} | ${nivelDesdePuntaje(r.puntaje)} | ${r.nivel === nivelDesdePuntaje(r.puntaje) ? 'Sí' : 'NO'} |`)
  }
  out.push('')

  // 3) Ocho perfiles de la base de datos: promedio recalculado de forma independiente
  const ests = await db.estudiante.findMany({ orderBy: { codigo: 'asc' }, include: { notas: { include: { evaluacion: true } } } })
  out.push('## 3. Perfiles ficticios (base de datos)', '',
    '| Código | Estudiante | Notas | Promedio sistema | Promedio recalculado | Δ | Puntaje | Nivel | Factores |', '|---|---|---|---|---|---|---|---|---|')
  let maxDelta = 0
  for (const e of ests) {
    const notas = e.notas.map((n) => ({ valor: n.valor, peso: n.evaluacion.peso, nombre: n.evaluacion.nombre, tema: n.evaluacion.tema, fecha: n.evaluacion.fecha.toISOString() }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
    const r = calcularRiesgo({ estudianteId: e.id, estudianteNombre: e.nombre, materiaId: null, materiaNombre: null, materiaColor: null, notas })
    const sp = notas.reduce((s, n) => s + n.peso, 0)
    const rec = notas.reduce((s, n) => s + n.valor * n.peso, 0) / sp
    const delta = Math.abs(rec - r.promedio)
    maxDelta = Math.max(maxDelta, delta)
    out.push(`| ${e.codigo} | ${e.nombre} ${e.apellido} | ${notas.length} | ${r.promedio} | ${rec.toFixed(2)} | ${delta.toFixed(2)} | ${r.puntaje} | ${r.nivel} | ${r.factores.map((f) => f.tipo).join(', ') || '—'} |`)
  }
  out.push('', `Diferencia máxima de promedio: ${maxDelta.toFixed(2)} (tolerancia 0,05, por redondeo a 1 decimal) → ${maxDelta <= 0.0501 ? 'CUMPLE' : 'FALLA'}`, '')

  writeFileSync('docs/validacion-riesgo.md', out.join('\n'))
  console.log(out.join('\n'))
  if (incoherentes || difReglas) process.exitCode = 1
}
main().finally(() => db.$disconnect())
