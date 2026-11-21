import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Materias con colores académicos (emerald/teal/amber/rose — sin azul/índigo)
const materias = [
  {
    codigo: 'PROG-101',
    nombre: 'Programación I',
    semestre: 1,
    color: '#10b981', // emerald-500
    descripcion: 'Fundamentos de programación: variables, control, funciones y depuración.',
  },
  {
    codigo: 'MAT-102',
    nombre: 'Matemática Discreta',
    semestre: 1,
    color: '#14b8a6', // teal-500
    descripcion: 'Lógica, conjuntos, relaciones, funciones y teoría de grafos.',
  },
  {
    codigo: 'EST-201',
    nombre: 'Estructuras de Datos',
    semestre: 2,
    color: '#f59e0b', // amber-500
    descripcion: 'Arreglos, listas, pilas, colas y árboles.',
  },
  {
    codigo: 'BD-202',
    nombre: 'Bases de Datos',
    semestre: 2,
    color: '#f43f5e', // rose-500
    descripcion: 'Modelo ER, SQL, normalización y consultas avanzadas.',
  },
]

// Evaluaciones por materia (pesos suman 100)
const evaluacionesPorMateria: Record<string, { nombre: string; peso: number; tema: string; competencia: string; diasRest: number }[]> = {
  'PROG-101': [
    { nombre: 'Práctica 1', peso: 20, tema: 'Sintaxis y variables', competencia: 'Implementación', diasRest: -45 },
    { nombre: 'Examen Parcial', peso: 30, tema: 'Estructuras de control', competencia: 'Resolución de problemas', diasRest: -30 },
    { nombre: 'Proyecto Final', peso: 30, tema: 'Funciones y modularidad', competencia: 'Diseño', diasRest: -10 },
    { nombre: 'Taller de depuración', peso: 20, tema: 'Depuración de código', competencia: 'Análisis', diasRest: -5 },
  ],
  'MAT-102': [
    { nombre: 'Tarea 1', peso: 20, tema: 'Lógica proposicional', competencia: 'Razonamiento', diasRest: -44 },
    { nombre: 'Control 1', peso: 25, tema: 'Conjuntos', competencia: 'Abstracción', diasRest: -28 },
    { nombre: 'Examen Parcial', peso: 35, tema: 'Relaciones y funciones', competencia: 'Razonamiento', diasRest: -12 },
    { nombre: 'Examen Final', peso: 20, tema: 'Teoría de grafos', competencia: 'Modelización', diasRest: -3 },
  ],
  'EST-201': [
    { nombre: 'Laboratorio 1', peso: 20, tema: 'Arreglos', competencia: 'Implementación', diasRest: -42 },
    { nombre: 'Práctica 2', peso: 25, tema: 'Listas enlazadas', competencia: 'Implementación', diasRest: -25 },
    { nombre: 'Examen Parcial', peso: 30, tema: 'Pilas y colas', competencia: 'Análisis', diasRest: -15 },
    { nombre: 'Proyecto', peso: 25, tema: 'Árboles', competencia: 'Diseño', diasRest: -4 },
  ],
  'BD-202': [
    { nombre: 'Tarea 1', peso: 20, tema: 'Modelo entidad-relación', competencia: 'Modelización', diasRest: -40 },
    { nombre: 'Práctica SQL', peso: 25, tema: 'SQL básico (SELECT, JOIN)', competencia: 'Implementación', diasRest: -22 },
    { nombre: 'Examen Parcial', peso: 30, tema: 'Normalización', competencia: 'Análisis', diasRest: -14 },
    { nombre: 'Proyecto', peso: 25, tema: 'Consultas avanzadas', competencia: 'Diseño', diasRest: -6 },
  ],
}

// 8 estudiantes ficticios
const estudiantes = [
  { codigo: 'EST-001', nombre: 'Mariana', apellido: 'Rojas', semestre: 2, carrera: 'Ingeniería de Sistemas' },
  { codigo: 'EST-002', nombre: 'Carlos', apellido: 'Mendoza', semestre: 2, carrera: 'Ingeniería de Sistemas' },
  { codigo: 'EST-003', nombre: 'Ana', apellido: 'Vera', semestre: 2, carrera: 'Ingeniería de Sistemas' },
  { codigo: 'EST-004', nombre: 'Diego', apellido: 'Flores', semestre: 2, carrera: 'Ingeniería de Sistemas' },
  { codigo: 'EST-005', nombre: 'Lucía', apellido: 'Paz', semestre: 2, carrera: 'Ingeniería de Sistemas' },
  { codigo: 'EST-006', nombre: 'Pedro', apellido: 'Quispe', semestre: 2, carrera: 'Ingeniería de Sistemas' },
  { codigo: 'EST-007', nombre: 'Sofía', apellido: 'Cortez', semestre: 2, carrera: 'Ingeniería de Sistemas' },
  { codigo: 'EST-008', nombre: 'Javier', apellido: 'Mamani', semestre: 2, carrera: 'Ingeniería de Sistemas' },
]

// Matriz de notas [estudiante][materia][evaluacion_idx]
// Filosofía: crear perfiles variados para demostrar riesgo y brechas
// Mariana: sólida en todo. Carlos: débil en programación/estructuras.
// Ana: buena pero baja en grafos. Diego: débil en BD.
// Lucía: alta en todo. Pedro: bajo general. Sofía: media-alta.
// Javier: medio, con caída en proyecto de estructuras.
// Orden materias: PROG-101, MAT-102, EST-201, BD-202
const notas: Record<string, number[][]> = {
  'EST-001': [ // Mariana - sólida
    [88, 82, 90, 85], // PROG
    [80, 78, 85, 72], // MAT
    [90, 85, 88, 80], // EST
    [85, 82, 80, 78], // BD
  ],
  'EST-002': [ // Carlos - débil programación/estructuras
    [55, 48, 52, 45], // PROG (reprobando)
    [70, 65, 68, 60], // MAT
    [50, 45, 55, 42], // EST (reprobando)
    [75, 72, 70, 68], // BD
  ],
  'EST-003': [ // Ana - buena, baja en grafos
    [82, 78, 80, 75], // PROG
    [85, 80, 78, 50], // MAT (caída en final de grafos)
    [78, 75, 72, 70], // EST
    [80, 78, 75, 72], // BD
  ],
  'EST-004': [ // Diego - débil BD
    [78, 75, 72, 70], // PROG
    [72, 70, 68, 65], // MAT
    [80, 78, 75, 72], // EST
    [48, 52, 45, 40], // BD (reprobando)
  ],
  'EST-005': [ // Lucía - alta
    [92, 90, 95, 88], // PROG
    [88, 85, 90, 82], // MAT
    [95, 92, 90, 85], // EST
    [90, 88, 85, 80], // BD
  ],
  'EST-006': [ // Pedro - bajo general
    [55, 50, 48, 45], // PROG
    [48, 52, 45, 40], // MAT
    [50, 45, 48, 42], // EST
    [52, 48, 45, 40], // BD
  ],
  'EST-007': [ // Sofía - media-alta
    [80, 78, 75, 72], // PROG
    [78, 75, 72, 70], // MAT
    [82, 80, 78, 75], // EST
    [75, 72, 70, 68], // BD
  ],
  'EST-008': [ // Javier - medio, caída en proyecto EST
    [75, 72, 70, 68], // PROG
    [70, 68, 65, 62], // MAT
    [78, 75, 72, 48], // EST (caída fuerte en proyecto árboles)
    [72, 70, 68, 65], // BD
  ],
}

// Respuestas de ejemplo que evidencian errores conceptuales (para análisis IA)
// Se asocian a notas bajas para alimentar el análisis de brechas
const respuestasEjemplo: Record<string, string> = {
  // Carlos - Programación I, Taller de depuración (idx 3)
  'EST-002|PROG-101|3': `function promedio(notas) {
  let suma = 0
  for i = 0; i < notas.length; i++   // olvidó 'let' y punto y coma
    suma = notas[i]        // usa '=' en vez de '+='
  return suma / notas.length
}
// "El error creo que está en que la función no retorna nada."`,
  // Carlos - Programación I, Examen Parcial (estructuras de control) idx 1
  'EST-002|PROG-101|1': `// Ejercicio: clasificar nota
if (nota >= 90) { console.log("A") }
if (nota >= 80) { console.log("B") }   // usa if en cadena en lugar de else if
if (nota >= 60) { console.log("C") }
// "Una nota de 95 muestra A, B y C porque cumplen todas las condiciones."`,
  // Carlos - Estructuras de Datos, Proyecto árboles idx 3
  'EST-002|EST-201|3': `// Recorrido in-order de BST
function inorder(node) {
  console.log(node.value)      // visita raíz primero (pre-order, no in-order)
  inorder(node.left)
  inorder(node.right)
}
// "In-order es visitar la raíz, luego izquierda, luego derecha."`,
  // Diego - BD, Práctica SQL idx 1
  'EST-004|BD-202|1': `SELECT * FROM estudiantes, notas
// "Para combinar tablas solo las pongo en el FROM separadas por coma."`,
  // Diego - BD, Examen Parcial normalización idx 2
  'EST-004|BD-202|2': `// Tabla: Ventas(id_venta, cliente, producto, categoria, precio_unit, total)
// "Esta tabla está bien porque guarda todo en un solo lugar, 
//  es más rápido consultar sin hacer JOINs."`,
  // Pedro - MAT, Examen Final grafos idx 3
  'EST-006|MAT-102|3': `// Ejercicio: ¿Es conexo el grafo G con aristas {(1,2),(2,3)} y vértices {1,2,3,4}?
// "Sí, porque hay aristas que conectan los vértices."`,
  // Ana - MAT, Examen Final grafos idx 3
  'EST-003|MAT-102|3': `// Ejercicio: diferencia entre grafo dirigido y no dirigido
// "Un grafo dirigido es aquel donde las aristas tienen flecha
//  y el no dirigido el que se dibuja con líneas."  // definición por apariencia, no conceptual`,
  // Javier - EST, Proyecto árboles idx 3
  'EST-008|EST-201|3': `// Implementar BST insert
function insert(root, val) {
  if (!root) return { value: val, left: null, right: null }
  // compara mal: inserta a la izquierda si MAYOR
  if (val > root.value) root.left = insert(root.left, val)
  else root.right = insert(root.right, val)
  return root
}
// "Un BST ordena poniendo los mayores a la izquierda."`,
}

async function main() {
  console.log('Limpiando base de datos...')
  await db.nota.deleteMany()
  await db.analisisIA.deleteMany()
  await db.evaluacion.deleteMany()
  await db.materia.deleteMany()
  await db.estudiante.deleteMany()

  console.log('Creando materias y evaluaciones...')
  const materiaMap: Record<string, string> = {}
  for (const m of materias) {
    const materia = await db.materia.create({ data: m })
    materiaMap[m.codigo] = materia.id
    for (const ev of evaluacionesPorMateria[m.codigo]) {
      await db.evaluacion.create({
        data: {
          materiaId: materia.id,
          nombre: ev.nombre,
          peso: ev.peso,
          tema: ev.tema,
          competencia: ev.competencia,
          fecha: new Date(Date.now() + ev.diasRest * 86400000),
        },
      })
    }
  }

  console.log('Creando estudiantes y notas...')
  for (const e of estudiantes) {
    const est = await db.estudiante.create({ data: e })
    let materiaIdx = 0
    for (const codMateria of Object.keys(evaluacionesPorMateria)) {
      const materiaId = materiaMap[codMateria]
      const evaluaciones = await db.evaluacion.findMany({
        where: { materiaId },
        orderBy: { fecha: 'asc' },
      })
      const valores = notas[e.codigo][materiaIdx]
      for (let i = 0; i < evaluaciones.length; i++) {
        const key = `${e.codigo}|${codMateria}|${i}`
        await db.nota.create({
          data: {
            estudianteId: est.id,
            evaluacionId: evaluaciones[i].id,
            valor: valores[i],
            respuestaEjemplo: respuestasEjemplo[key] || null,
            observacion: valores[i] < 51
              ? 'Reprobado. Requiere refuerzo.'
              : valores[i] < 70
                ? 'Desempeño regular.'
                : 'Desempeño satisfactorio.',
          },
        })
      }
      materiaIdx++
    }
  }

  console.log('Seed completado.')
  const totalNotas = await db.nota.count()
  const totalEst = await db.estudiante.count()
  const totalMat = await db.materia.count()
  const totalEv = await db.evaluacion.count()
  console.log(`Resumen: ${totalEst} estudiantes, ${totalMat} materias, ${totalEv} evaluaciones, ${totalNotas} notas.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
