// Validación del análisis de brechas con IA sobre los perfiles ficticios.
// Uso: npx tsx scripts/validar-ia.ts   (requiere OPENROUTER_API_KEY; consume crédito)
// Genera docs/validacion-ia.md y docs/ia-resultados.json (entrada, salida y metadatos).
import { writeFileSync } from 'fs'
import { db } from '../src/lib/db'
import { calcularRiesgoEstudiante } from '../src/lib/queries'
import { analizarBrechasAprendizaje, construirPrompt, EntradaAnalisis, VERSION_PROMPT } from '../src/lib/ai'
import type { ResultadoAnalisisIA } from '../src/lib/types'

const NOTA_REFUERZO = 70
const quitarTildes = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const palabras = (t: string) => new Set(quitarTildes(t).split(/[^a-z0-9]+/).filter((w) => w.length > 3))
const jaccard = (a: Set<string>, b: Set<string>) => {
  const i = [...a].filter((x) => b.has(x)).length
  return a.size + b.size - i === 0 ? 0 : i / (a.size + b.size - i)
}
const celda = (t: string, max = 400) => t.replace(/\s+/g, ' ').replace(/\|/g, '/').slice(0, max)

interface Fila {
  codigo: string
  entrada: EntradaAnalisis
  prompt: string
  resultado: ResultadoAnalisisIA | null
  error?: string
}

async function main() {
  const ests = await db.estudiante.findMany({ orderBy: { codigo: 'asc' } })
  const filas: Fila[] = []

  for (const e of ests) {
    const d = await calcularRiesgoEstudiante(e.id)
    if (!d) continue
    const entrada: EntradaAnalisis = {
      estudianteNombre: `${e.nombre} ${e.apellido}`,
      materiaNombre: null,
      evaluaciones: d.notas.map((n) => ({
        nombre: n.evaluacion.nombre,
        tema: n.evaluacion.tema,
        competencia: n.evaluacion.competencia,
        valor: n.valor,
        peso: n.evaluacion.peso,
        respuestaEjemplo: n.respuestaEjemplo,
      })),
    }
    try {
      const resultado = await analizarBrechasAprendizaje(entrada)
      filas.push({ codigo: e.codigo, entrada, prompt: construirPrompt(entrada), resultado })
    } catch (err) {
      filas.push({ codigo: e.codigo, entrada, prompt: '', resultado: null, error: (err as Error).message })
    }
    console.log('listo', e.codigo)
  }

  const out: string[] = [
    '# Validación del análisis de brechas con IA',
    '',
    `Generado: ${new Date().toISOString()} · versión de prompt ${VERSION_PROMPT}`,
    '',
    'Modelo y parámetros por ejecución: columna «Modelo» y `docs/ia-resultados.json` (incluye el prompt exacto enviado).',
    '',
    '## 1. Resumen por perfil',
    '',
    '| Código | Notas < 70 | Con evidencia textual | Modelo | Tokens (ent./sal.) | Brechas | Temas bajos cubiertos | Brechas respaldadas por la evidencia | Brechas basadas solo en la nota | Temas no anclados (brechas/ejerc.) | Estado |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
  ]

  for (const f of filas) {
    const bajas = f.entrada.evaluaciones.filter((x) => x.valor < NOTA_REFUERZO)
    const conEv = bajas.filter((b) => b.respuestaEjemplo).length
    if (!f.resultado) {
      out.push(`| ${f.codigo} | ${bajas.length} | ${conEv} | — | — | — | — | — | — | — | ERROR: ${celda(f.error ?? '')} |`)
      continue
    }
    const r = f.resultado
    const m = r.meta!
    const temasBajos = [...new Set(bajas.map((b) => quitarTildes(b.tema)))]
    const cubiertos = temasBajos.filter((t) =>
      r.brechas.some((b) => quitarTildes(b.tema).includes(t) || t.includes(quitarTildes(b.tema)))
    ).length
    const pw = palabras(f.prompt)
    const sinEv = r.brechas.filter((b) => !b.evidencia || /sin evidencia/i.test(b.evidencia)).length
    const resp = r.brechas.filter((b) => {
      const w = [...palabras(b.evidencia)]
      return w.length > 0 && w.filter((x) => pw.has(x)).length / w.length >= 0.5
    }).length
    out.push(
      `| ${f.codigo} | ${bajas.length} | ${conEv} | ${m.modelo ?? '(sin llamada)'} | ${m.tokens ? `${m.tokens.entrada}/${m.tokens.salida}` : '—'} | ${r.brechas.length} | ${temasBajos.length ? `${cubiertos}/${temasBajos.length}` : '—'} | ${r.brechas.length ? `${resp}/${r.brechas.length}` : '—'} | ${sinEv} | ${m.validacion.brechasNoAncladas}/${m.validacion.ejerciciosNoAnclados} | ${m.modelo ? 'IA' : 'Sin notas bajas'} |`
    )
  }

  out.push('', '## 2. Casos: evidencia → brecha → recomendación', '')
  for (const f of filas.filter((x) => x.resultado?.meta?.modelo)) {
    const r = f.resultado!
    out.push(`### ${f.codigo}`, '', '**Notas bajas enviadas**', '', '| Tema | Competencia | Nota | Evidencia (extracto) |', '|---|---|---|---|')
    for (const b of f.entrada.evaluaciones.filter((x) => x.valor < NOTA_REFUERZO)) {
      out.push(`| ${b.tema} | ${b.competencia} | ${b.valor} | ${b.respuestaEjemplo ? celda(b.respuestaEjemplo, 140) : '—'} |`)
    }
    out.push('', '**Brechas detectadas**', '', '| Tema | Severidad | Descripción | Evidencia citada |', '|---|---|---|---|')
    for (const b of r.brechas) out.push(`| ${b.tema} | ${b.severidad} | ${celda(b.descripcion)} | ${celda(b.evidencia)} |`)
    out.push('', '**Recomendaciones**', '', '| Prioridad | Tipo | Recomendación |', '|---|---|---|')
    for (const x of r.recomendaciones) out.push(`| ${x.prioridad} | ${x.tipo} | ${celda(`${x.titulo}: ${x.descripcion}`)} |`)
    out.push('', '**Ejercicios**', '', '| Tema | Dificultad | Enunciado |', '|---|---|---|')
    for (const x of r.ejercicios) out.push(`| ${x.tema} | ${x.dificultad} | ${celda(x.enunciado, 500)} |`)
    out.push('')
  }

  const con = filas.filter((x) => x.resultado && x.resultado.ejercicios.length)
  out.push(
    '## 3. Personalización: similitud entre planes de refuerzo',
    '',
    'Similitud de Jaccard sobre el vocabulario de los ejercicios (0 = distintos, 1 = idénticos). Criterio de aceptación: < 0,5 entre perfiles con dificultades distintas.',
    '',
    '| Perfil A | Perfil B | Temas de brecha A | Temas de brecha B | Similitud ejercicios | Resultado |',
    '|---|---|---|---|---|---|'
  )
  const sims: number[] = []
  for (let i = 0; i < con.length; i++) {
    for (let j = i + 1; j < con.length; j++) {
      const a = con[i].resultado!
      const b = con[j].resultado!
      const s = jaccard(
        palabras(a.ejercicios.map((e) => e.enunciado).join(' ')),
        palabras(b.ejercicios.map((e) => e.enunciado).join(' '))
      )
      sims.push(s)
      out.push(
        `| ${con[i].codigo} | ${con[j].codigo} | ${a.brechas.map((x) => x.tema).join(', ')} | ${b.brechas.map((x) => x.tema).join(', ')} | ${s.toFixed(2)} | ${s < 0.5 ? 'CUMPLE' : 'REVISAR'} |`
      )
    }
  }
  if (sims.length) {
    out.push('', `Similitud media: ${(sims.reduce((a, b) => a + b, 0) / sims.length).toFixed(2)} · máxima: ${Math.max(...sims).toFixed(2)} (${sims.length} pares).`)
  }

  out.push(
    '',
    '## 4. Rúbrica de pertinencia pedagógica (a completar por el docente)',
    '',
    'Escala 1 = no cumple · 2 = parcial · 3 = cumple. Esta evaluación no puede automatizarse.',
    '',
    '| Perfil | Brecha corresponde a la evidencia | Recomendación atiende la brecha | Ejercicio pertinente al tema y nivel | Lenguaje claro | Observaciones |',
    '|---|---|---|---|---|---|',
    ...con.map((f) => `| ${f.codigo} |  |  |  |  |  |`)
  )

  writeFileSync('docs/validacion-ia.md', out.join('\n'))
  writeFileSync(
    'docs/ia-resultados.json',
    JSON.stringify(filas.map((f) => ({ codigo: f.codigo, prompt: f.prompt, resultado: f.resultado, error: f.error })), null, 2)
  )
  console.log(out.slice(0, 18).join('\n'))
}
main().finally(() => db.$disconnect())
