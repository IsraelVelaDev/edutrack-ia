import { createHash } from 'crypto'
import type { MetaAnalisisIA, ResultadoAnalisisIA } from './types'

// --- Análisis de brechas de aprendizaje mediante IA ---
// La IA NO calcula notas. Analiza evidencias (respuestas de ejemplo + calificaciones)
// e identifica dificultades por tema/competencia, generando un plan de refuerzo.

export interface EntradaAnalisis {
  estudianteNombre: string
  materiaNombre: string | null
  // notas con contexto: tema, competencia, valor, peso, respuesta de ejemplo (si existe)
  evaluaciones: {
    nombre: string
    tema: string
    competencia: string
    valor: number
    peso: number
    respuestaEjemplo: string | null
  }[]
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODELO_POR_DEFECTO = 'google/gemini-2.5-flash'
export const VERSION_PROMPT = 'v1.3'
const TEMPERATURA = 0.3

// --- Ahorro de tokens ---
// Solo las notas bajo este umbral se envían con detalle; las demás van como lista de temas.
const NOTA_REFUERZO = 70
// Las evidencias largas se recortan: el error suele verse en las primeras líneas.
const MAX_CHARS_EVIDENCIA = 500
// La salida es lo más caro (≈90% del costo): se acota el tamaño de la respuesta.
const MAX_TOKENS_SALIDA = 1200
// Reutiliza el análisis si los datos no cambiaron (evita pagar dos veces el mismo resultado).
const cache = (globalThis as unknown as { __cacheIA?: Map<string, ResultadoAnalisisIA> }).__cacheIA ??= new Map()

const SYSTEM_PROMPT =
  'Eres tutor universitario. Detectas brechas de aprendizaje a partir de notas y evidencias, y propones refuerzo. Respondes solo JSON minificado, en español, conciso.'

function recortar(texto: string): string {
  const limpio = texto.replace(/\s+/g, ' ').trim()
  return limpio.length > MAX_CHARS_EVIDENCIA ? `${limpio.slice(0, MAX_CHARS_EVIDENCIA)}…` : limpio
}

export function construirPrompt(entrada: EntradaAnalisis): string {
  const bajas = entrada.evaluaciones.filter((e) => e.valor < NOTA_REFUERZO)
  const aprobados = [
    ...new Set(entrada.evaluaciones.filter((e) => e.valor >= NOTA_REFUERZO).map((e) => e.tema)),
  ]

  const detalle = bajas
    .map(
      (e) =>
        `- ${e.tema} (${e.competencia}) ${e.valor}/100${e.respuestaEjemplo ? ` | Evidencia: ${recortar(e.respuestaEjemplo)}` : ''}`
    )
    .join('\n')

  return `Materia: ${entrada.materiaNombre ?? 'varias'}
Notas bajas (<${NOTA_REFUERZO}):
${detalle}
Temas aprobados: ${aprobados.join(', ') || 'ninguno'}

Devuelve JSON con esta forma:
{"brechas":[{"tema":"","competencia":"","severidad":"alta|media|baja","descripcion":"","evidencia":""}],"recomendaciones":[{"titulo":"","descripcion":"","tipo":"repaso|ejercicio|recurso|estrategia","prioridad":"alta|media|baja"}],"ejercicios":[{"titulo":"","enunciado":"","dificultad":"basico|intermedio|avanzado","tema":"","pista":""}],"resumen":""}

Reglas: máx 4 brechas (alta primero), 3 recomendaciones, 3 ejercicios. Cada texto ≤25 palabras; resumen ≤2 oraciones. Cita el tema exacto y el error concreto de la evidencia. Si un tema no tiene evidencia textual, escribe en evidencia: "Sin evidencia textual (solo nota)" y no inventes errores.`
}

// --- Validación TOLERANTE de la salida del modelo ---
// Principio: reparar antes que rechazar. Un modelo pequeño suele equivocarse en detalles
// (mayúsculas, textos largos, algún campo vacío); eso no debe tumbar todo el análisis.
//  - Textos largos se recortan; enumeraciones se normalizan (con valor por defecto).
//  - Un ítem sin los campos esenciales se omite; el resto se conserva.
//  - Los temas que no coinciden con las evidencias NO se descartan: se registran en `meta`
//    para auditoría (no se bloquea al modelo).
//  - Solo se lanza error si no hay JSON o no queda ninguna brecha utilizable.
const quitarTildes = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const texto = (v: unknown, max: number): string => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '')
const enumerado = <T extends string>(v: unknown, valores: readonly T[], porDefecto: T): T => {
  const x = typeof v === 'string' ? quitarTildes(v.trim()) : ''
  return (valores as readonly string[]).includes(x) ? (x as T) : porDefecto
}
const lista = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null) : []

const norm = (t: string) => quitarTildes(t).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
const temaAnclado = (tema: string, validos: string[]) => {
  const n = norm(tema)
  return validos.some((v) => n === v || n.includes(v) || v.includes(n))
}

export function parsearRespuesta(
  contenido: string,
  temasEntrada: string[]
): ResultadoAnalisisIA & { noAncladas: { brechas: number; ejercicios: number } } {
  let limpio = contenido.trim()
  if (limpio.startsWith('```')) limpio = limpio.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  // Tolera texto alrededor del JSON: toma desde la primera { hasta la última }
  const ini = limpio.indexOf('{')
  const fin = limpio.lastIndexOf('}')
  let crudo: Record<string, unknown>
  try {
    crudo = JSON.parse(ini >= 0 && fin > ini ? limpio.slice(ini, fin + 1) : limpio)
  } catch {
    throw new Error('No se pudo interpretar la respuesta del modelo como JSON. Intenta nuevamente.')
  }

  const brechas = lista(crudo.brechas).flatMap((b) => {
    const tema = texto(b.tema, 120)
    if (!tema) return []
    return [{
      tema,
      competencia: texto(b.competencia, 120),
      severidad: enumerado(b.severidad, ['alta', 'media', 'baja'] as const, 'media'),
      descripcion: texto(b.descripcion, 400),
      evidencia: texto(b.evidencia, 600),
    }]
  }).slice(0, 6)

  const recomendaciones = lista(crudo.recomendaciones).flatMap((r) => {
    const titulo = texto(r.titulo, 160)
    const descripcion = texto(r.descripcion, 400)
    if (!titulo && !descripcion) return []
    return [{
      titulo: titulo || descripcion.slice(0, 60),
      descripcion,
      tipo: enumerado(r.tipo, ['repaso', 'ejercicio', 'recurso', 'estrategia'] as const, 'estrategia'),
      prioridad: enumerado(r.prioridad, ['alta', 'media', 'baja'] as const, 'media'),
    }]
  }).slice(0, 6)

  const ejercicios = lista(crudo.ejercicios).flatMap((e) => {
    const enunciado = texto(e.enunciado, 800)
    if (!enunciado) return []
    return [{
      titulo: texto(e.titulo, 160) || 'Ejercicio de refuerzo',
      enunciado,
      dificultad: enumerado(e.dificultad, ['basico', 'intermedio', 'avanzado'] as const, 'intermedio'),
      tema: texto(e.tema, 120),
      pista: texto(e.pista, 400),
    }]
  }).slice(0, 6)

  const validos = temasEntrada.map(norm)
  return {
    brechas,
    recomendaciones,
    ejercicios,
    resumen: texto(crudo.resumen, 600),
    noAncladas: {
      brechas: brechas.filter((b) => !temaAnclado(b.tema, validos)).length,
      ejercicios: ejercicios.filter((e) => e.tema && !temaAnclado(e.tema, validos)).length,
    },
  }
}

export async function analizarBrechasAprendizaje(
  entrada: EntradaAnalisis
): Promise<ResultadoAnalisisIA> {
  // Sin notas bajas no hay brechas que analizar: se responde sin llamar a la IA.
  if (!entrada.evaluaciones.some((e) => e.valor < NOTA_REFUERZO)) {
    return {
      meta: {
        modelo: null, versionPrompt: VERSION_PROMPT, temperatura: TEMPERATURA, maxTokens: MAX_TOKENS_SALIDA,
        tokens: null, prompt: '', desdeCache: false,
        validacion: { esquemaValido: true, brechasNoAncladas: 0, ejerciciosNoAnclados: 0 },
      },
      brechas: [],
      recomendaciones: [],
      ejercicios: [],
      resumen: `Todas las evaluaciones están en ${NOTA_REFUERZO}/100 o más. No se detectan brechas que requieran refuerzo.`,
    }
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('Falta OPENROUTER_API_KEY en el archivo .env.')
  }

  // Privacidad: el nombre del estudiante no se envía al proveedor de IA.
  const prompt = construirPrompt(entrada)
  const modelo = process.env.OPENROUTER_MODEL || MODELO_POR_DEFECTO
  const clave = createHash('sha256').update(`${modelo}\n${prompt}`).digest('hex')
  const enCache = cache.get(clave)
  if (enCache) {
    console.log('[IA] resultado reutilizado del caché (0 tokens)')
    return { ...enCache, meta: { ...enCache.meta!, desdeCache: true } }
  }

  const respuesta = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'EduTrack IA',
    },
    body: JSON.stringify({
      model: modelo,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: TEMPERATURA,
      max_tokens: MAX_TOKENS_SALIDA,
      // Los tokens de razonamiento se cobran como salida; este análisis no los necesita.
      reasoning: { enabled: false },
    }),
  })

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '')
    const motivo =
      respuesta.status === 401
        ? 'API key de OpenRouter inválida'
        : respuesta.status === 402
          ? 'sin crédito en OpenRouter'
          : respuesta.status === 429
            ? 'límite de peticiones alcanzado'
            : `error ${respuesta.status}`
    throw new Error(`OpenRouter: ${motivo}. ${detalle.slice(0, 200)}`)
  }

  const data = await respuesta.json()
  console.log('[IA] uso de tokens:', JSON.stringify(data.usage))
  if (data.choices?.[0]?.finish_reason === 'length') {
    throw new Error('La respuesta de la IA se cortó por longitud. Intenta nuevamente.')
  }
  const contenido: string = data.choices?.[0]?.message?.content ?? ''
  const temasBajos = entrada.evaluaciones.filter((e) => e.valor < NOTA_REFUERZO).map((e) => e.tema)
  const { noAncladas, ...parcial } = parsearRespuesta(contenido, temasBajos)
  if (parcial.brechas.length === 0) {
    throw new Error('La IA no devolvió ninguna brecha utilizable. Intenta nuevamente.')
  }
  const meta: MetaAnalisisIA = {
    modelo,
    versionPrompt: VERSION_PROMPT,
    temperatura: TEMPERATURA,
    maxTokens: MAX_TOKENS_SALIDA,
    tokens: data.usage ? { entrada: data.usage.prompt_tokens ?? 0, salida: data.usage.completion_tokens ?? 0 } : null,
    prompt,
    validacion: { esquemaValido: true, brechasNoAncladas: noAncladas.brechas, ejerciciosNoAnclados: noAncladas.ejercicios },
    desdeCache: false,
  }
  const resultado: ResultadoAnalisisIA = { ...parcial, meta }
  cache.set(clave, resultado)
  return resultado
}
