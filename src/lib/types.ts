// Tipos compartidos del dominio académico

export interface MateriaBase {
  id: string
  codigo: string
  nombre: string
  semestre: number
  color: string
  descripcion: string
}

export interface EvaluacionBase {
  id: string
  nombre: string
  peso: number
  tema: string
  competencia: string
  fecha: string
}

export interface EstudianteBase {
  id: string
  codigo: string
  nombre: string
  apellido: string
  semestre: number
  carrera: string
}

export interface NotaBase {
  id: string
  estudianteId: string
  evaluacionId: string
  valor: number
  observacion: string | null
  respuestaEjemplo: string | null
}

// --- Tipos derivados para el dashboard ---

export type NivelRiesgo = 'bajo' | 'medio' | 'alto'

export interface FactorRiesgo {
  tipo: 'promedio' | 'reprobadas' | 'tendencia' | 'peso_alto' | 'variabilidad'
  descripcion: string
  evidencia: string
}

export interface ResultadoRiesgo {
  estudianteId: string
  estudianteNombre: string
  materiaId: string | null
  materiaNombre: string | null
  materiaColor: string | null
  promedio: number
  nivel: NivelRiesgo
  puntaje: number // 0-100, mayor = más riesgo
  factores: FactorRiesgo[]
  reprobadas: number
  totalEvaluaciones: number
  tieneDatos: boolean // false si no hay notas para evaluar (estado "sin calificaciones")
}

// --- Tipos para análisis IA ---

export interface BrechaAprendizaje {
  tema: string
  competencia: string
  severidad: 'alta' | 'media' | 'baja'
  descripcion: string
  evidencia: string
}

export interface RecomendacionIA {
  titulo: string
  descripcion: string
  tipo: 'repaso' | 'ejercicio' | 'recurso' | 'estrategia'
  prioridad: 'alta' | 'media' | 'baja'
}

export interface EjercicioRefuerzo {
  titulo: string
  enunciado: string
  dificultad: 'basico' | 'intermedio' | 'avanzado'
  tema: string
  pista: string
}

// Trazabilidad de cada análisis: qué modelo, con qué configuración y qué validaciones pasó.
export interface MetaAnalisisIA {
  modelo: string | null // null cuando no se llamó a la IA (sin notas bajas)
  versionPrompt: string
  temperatura: number
  maxTokens: number
  tokens: { entrada: number; salida: number } | null
  prompt: string // texto exacto enviado al modelo (sin datos personales)
  validacion: {
    esquemaValido: boolean
    brechasNoAncladas: number // brechas cuyo tema no aparece en las notas bajas enviadas (se conservan, solo se registran)
    ejerciciosNoAnclados: number
  }
  desdeCache: boolean
}

export interface ResultadoAnalisisIA {
  brechas: BrechaAprendizaje[]
  recomendaciones: RecomendacionIA[]
  ejercicios: EjercicioRefuerzo[]
  resumen: string
  meta?: MetaAnalisisIA
}
