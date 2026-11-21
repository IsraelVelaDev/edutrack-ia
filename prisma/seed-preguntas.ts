import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Banco de preguntas de opción múltiple (4 opciones c/u), con explicación.
// Cada pregunta está asociada a una materia (por código), tema y competencia.

interface PreguntaSeed {
  materiaCodigo: string
  tema: string
  competencia: string
  enunciado: string
  opciones: string[]
  correcta: number
  explicacion: string
  dificultad: 'basico' | 'intermedio' | 'avanzado'
}

const preguntas: PreguntaSeed[] = [
  // ===== Programación I (PROG-101) =====
  {
    materiaCodigo: 'PROG-101',
    tema: 'Sintaxis y variables',
    competencia: 'Implementación',
    enunciado: '¿Cuál de las siguientes es una declaración válida de variable en JavaScript?',
    opciones: ['variable x = 5;', 'let x = 5;', 'x := 5;', 'declare x = 5;'],
    correcta: 1,
    explicacion: 'En JavaScript se usa `let` (o `const`/`var`) para declarar variables. `let x = 5;` es la sintaxis correcta.',
    dificultad: 'basico',
  },
  {
    materiaCodigo: 'PROG-101',
    tema: 'Estructuras de control',
    competencia: 'Resolución de problemas',
    enunciado: 'Dado: if(nota>=90) imprimir("A"); if(nota>=80) imprimir("B"); si nota=95, ¿qué se imprime?',
    opciones: ['Solo "A"', 'Solo "B"', '"A" y "B" (ambas)', 'Nada'],
    correcta: 2,
    explicacion: 'Al usar `if` encadenados (sin `else if`), todas las condiciones verdaderas se evalúan. Como 95>=90 y 95>=80, se imprimen "A" y "B". Para exclusión mutua se debe usar `else if`.',
    dificultad: 'intermedio',
  },
  {
    materiaCodigo: 'PROG-101',
    tema: 'Funciones y modularidad',
    competencia: 'Diseño',
    enunciado: '¿Cuál es el propósito principal de la palabra clave `return` dentro de una función?',
    opciones: [
      'Imprimir un mensaje en pantalla',
      'Detener el programa por completo',
      'Devolver un valor al llamador y terminar la ejecución de la función',
      'Repetir la función varias veces',
    ],
    correcta: 2,
    explicacion: '`return` entrega un valor a quien invocó la función y finaliza su ejecución. Sin `return`, la función devuelve `undefined`.',
    dificultad: 'basico',
  },
  {
    materiaCodigo: 'PROG-101',
    tema: 'Depuración de código',
    competencia: 'Análisis',
    enunciado: 'La función `function promedio(a) { let s=0; for i=0;i<a.length;i++ s = a[i]; return s/a.length }` tiene errores. ¿Cuál es uno de ellos?',
    opciones: [
      'Falta `let` antes de `i` y `;` en el for; además usa `=` en vez de `+=`',
      'El nombre `promedio` no es válido',
      'No se puede dividir entre `a.length`',
      'El arreglo `a` debe ser global',
    ],
    correcta: 0,
    explicacion: 'El bucle `for` carece de `let` para `i` y de punto y coma. Además `s = a[i]` sobrescribe en vez de acumular; debe ser `s += a[i]`. Ambos son errores de sintaxis y de acumulación.',
    dificultad: 'avanzado',
  },
  {
    materiaCodigo: 'PROG-101',
    tema: 'Estructuras de control',
    competencia: 'Implementación',
    enunciado: '¿Qué estructura de control se usa para repetir un bloque un número conocido de veces?',
    opciones: ['if / else', 'for', 'switch', 'try / catch'],
    correcta: 1,
    explicacion: 'El bucle `for` repite un bloque un número determinado de veces, definido por una condición y un contador.',
    dificultad: 'basico',
  },
  {
    materiaCodigo: 'PROG-101',
    tema: 'Sintaxis y variables',
    competencia: 'Implementación',
    enunciado: '¿Qué operador se usa para comparar igualdad estricta (valor y tipo) en JavaScript?',
    opciones: ['=', '==', '===', '!='],
    correcta: 2,
    explicacion: '`===` compara valor y tipo sin realizar conversión implícita. `==` convierte tipos (puede dar resultados inesperados), y `=` es asignación.',
    dificultad: 'intermedio',
  },

  // ===== Matemática Discreta (MAT-102) =====
  {
    materiaCodigo: 'MAT-102',
    tema: 'Lógica proposicional',
    competencia: 'Razonamiento',
    enunciado: 'Dada la implicación p → q, ¿cuándo es FALSA?',
    opciones: [
      'Cuando p es verdadera y q es verdadera',
      'Cuando p es verdadera y q es falsa',
      'Cuando p es falsa y q es verdadera',
      'Cuando p es falsa y q es falsa',
    ],
    correcta: 1,
    explicacion: 'La implicación p → q solo es falsa cuando el antecedente (p) es verdadero y el consecuente (q) es falso. En los demás casos es verdadera.',
    dificultad: 'basico',
  },
  {
    materiaCodigo: 'MAT-102',
    tema: 'Conjuntos',
    competencia: 'Abstracción',
    enunciado: 'Si A = {1,2,3} y B = {2,4}, ¿cuál es A ∪ B?',
    opciones: ['{2}', '{1,2,3,4}', '{1,3,4}', '{}'],
    correcta: 1,
    explicacion: 'La unión A ∪ B contiene todos los elementos que están en A o en B (sin repetir): {1,2,3,4}.',
    dificultad: 'basico',
  },
  {
    materiaCodigo: 'MAT-102',
    tema: 'Relaciones y funciones',
    competencia: 'Razonamiento',
    enunciado: '¿Cuál es la condición necesaria para que una relación binaria sea una función?',
    opciones: [
      'Cada elemento del codominio tiene exactamente una imagen',
      'Cada elemento del dominio tiene exactamente una imagen en el codominio',
      'La relación es simétrica',
      'El dominio y el codominio son iguales',
    ],
    correcta: 1,
    explicacion: 'Una relación es función si, y solo si, cada elemento del dominio se relaciona con exactamente un elemento del codominio. No se exige nada sobre el codominio.',
    dificultad: 'intermedio',
  },
  {
    materiaCodigo: 'MAT-102',
    tema: 'Teoría de grafos',
    competencia: 'Modelización',
    enunciado: 'Un grafo con vértices {1,2,3,4} y aristas {(1,2),(2,3)} (no dirigido), ¿es conexo?',
    opciones: ['Sí, porque tiene aristas', 'No, porque el vértice 4 está aislado', 'Sí, porque es no dirigido', 'No, porque tiene 4 vértices'],
    correcta: 1,
    explicacion: 'Un grafo es conexo si existe un camino entre todo par de vértices. Como el vértice 4 no tiene aristas, está aislado, por lo que no hay camino desde 4 a los demás: el grafo NO es conexo. La cantidad de aristas o ser no dirigido no basta.',
    dificultad: 'intermedio',
  },
  {
    materiaCodigo: 'MAT-102',
    tema: 'Lógica proposicional',
    competencia: 'Razonamiento',
    enunciado: '¿Cuál es la negación lógica de "Todos los pájaros vuelan"?',
    opciones: ['Ningún pájaro vuela', 'Todos los pájaros no vuelan', 'Existe al menos un pájaro que no vuela', 'Algunos pájaros vuelan'],
    correcta: 2,
    explicacion: 'La negación de un cuantificador universal "para todo x, P(x)" es un cuantificador existencial "existe x tal que ¬P(x)": existe al menos un pájaro que no vuela.',
    dificultad: 'avanzado',
  },
  {
    materiaCodigo: 'MAT-102',
    tema: 'Teoría de grafos',
    competencia: 'Modelización',
    enunciado: '¿Cuál es la diferencia conceptual entre un grafo dirigido y uno no dirigido?',
    opciones: [
      'El dirigido se dibuja con flechas y el no dirigido con líneas',
      'En el dirigido las aristas tienen un orden (origen-destino); en el no dirigido la conexión es bidireccional',
      'El dirigido siempre tiene ciclos',
      'El no dirigido no puede tener vértices aislados',
    ],
    correcta: 1,
    explicacion: 'La diferencia conceptual es que en un grafo dirigido las aristas son pares ordenados (tienen origen y destino), mientras que en el no dirigido la relación es bidireccional. Las flechas son solo representación visual.',
    dificultad: 'basico',
  },

  // ===== Estructuras de Datos (EST-201) =====
  {
    materiaCodigo: 'EST-201',
    tema: 'Pilas y colas',
    competencia: 'Implementación',
    enunciado: '¿Qué estructura de datos sigue el principio LIFO (último en entrar, primero en salir)?',
    opciones: ['Cola (queue)', 'Pila (stack)', 'Lista circular', 'Árbol binario'],
    correcta: 1,
    explicacion: 'La pila (stack) es LIFO: el último elemento apilado es el primero en retirarse (operaciones push/pop). La cola es FIFO.',
    dificultad: 'basico',
  },
  {
    materiaCodigo: 'EST-201',
    tema: 'Árboles',
    competencia: 'Análisis',
    enunciado: 'En un árbol binario de búsqueda (BST), ¿cuál es el recorrido que visita: subárbol izquierdo, raíz, subárbol derecho?',
    opciones: ['Pre-order', 'In-order', 'Post-order', 'Por niveles (BFS)'],
    correcta: 1,
    explicacion: 'El recorrido in-order visita: hijo izquierdo, luego la raíz, luego el hijo derecho. En un BST produce los valores ordenados de menor a mayor.',
    dificultad: 'intermedio',
  },
  {
    materiaCodigo: 'EST-201',
    tema: 'Listas enlazadas',
    competencia: 'Diseño',
    enunciado: '¿Cuál es una ventaja de una lista enlazada frente a un arreglo?',
    opciones: [
      'Acceso aleatorio O(1) por índice',
      'Inserción/eliminación eficiente en cualquier posición sin reubicar elementos',
      'Menor uso de memoria por elemento',
      'Mejor localidad de referencia en caché',
    ],
    correcta: 1,
    explicacion: 'Las listas enlazadas permiten insertar o eliminar nodos en cualquier posición ajustando solo punteros (O(1) si se tiene la referencia), sin desplazar elementos como en un arreglo. Sin embargo, pierden acceso aleatorio y usan más memoria por nodo.',
    dificultad: 'intermedio',
  },
  {
    materiaCodigo: 'EST-201',
    tema: 'Árboles',
    competencia: 'Implementación',
    enunciado: 'En un BST, ¿dónde se inserta un valor menor que el valor de la raíz actual?',
    opciones: ['En el subárbol derecho', 'En el subárbol izquierdo', 'Reemplaza la raíz', 'No se puede insertar'],
    correcta: 1,
    explicacion: 'En un BST, los valores menores que la raíz van al subárbol izquierdo, y los mayores al derecho. Esto mantiene la propiedad de orden.',
    dificultad: 'basico',
  },
  {
    materiaCodigo: 'EST-201',
    tema: 'Arreglos',
    competencia: 'Implementación',
    enunciado: '¿Cuál es la complejidad temporal de acceder al elemento de índice i en un arreglo?',
    opciones: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
    correcta: 2,
    explicacion: 'El acceso por índice en un arreglo es O(1) (tiempo constante) porque la posición de memoria se calcula directamente con la dirección base + índice × tamaño.',
    dificultad: 'intermedio',
  },
  {
    materiaCodigo: 'EST-201',
    tema: 'Pilas y colas',
    competencia: 'Análisis',
    enunciado: 'La operación `dequeue` (extraer el frente) pertenece a:',
    opciones: ['Una pila (stack)', 'Una cola (queue)', 'Un árbol', 'Un grafo'],
    correcta: 1,
    explicacion: '`dequeue` extrae el elemento del frente de una cola (queue), que es FIFO. La operación equivalente en una pila es `pop`.',
    dificultad: 'basico',
  },

  // ===== Bases de Datos (BD-202) =====
  {
    materiaCodigo: 'BD-202',
    tema: 'SQL básico',
    competencia: 'Implementación',
    enunciado: '¿Cuál JOIN devuelve solo las filas que tienen coincidencia en ambas tablas?',
    opciones: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'CROSS JOIN'],
    correcta: 2,
    explicacion: 'INNER JOIN devuelve únicamente las filas que tienen coincidencia en ambas tablas. LEFT/RIGHT incluyen los no coincidentes de una de las tablas, y CROSS hace el producto cartesiano.',
    dificultad: 'basico',
  },
  {
    materiaCodigo: 'BD-202',
    tema: 'Normalización',
    competencia: 'Análisis',
    enunciado: '¿Cuál es el objetivo principal de normalizar una base de datos?',
    opciones: [
      'Acelerar las consultas complejas con JOIN',
      'Reducir la redundancia y evitar anomalías de actualización',
      'Aumentar el número de tablas siempre',
      'Eliminar todas las claves foráneas',
    ],
    correcta: 1,
    explicacion: 'La normalización reduce la redundancia de datos y previene anomalías de inserción, actualización y borrado. Aunque puede aumentar el número de tablas y requerir JOINs, su objetivo es la integridad, no la velocidad.',
    dificultad: 'intermedio',
  },
  {
    materiaCodigo: 'BD-202',
    tema: 'Modelo entidad-relación',
    competencia: 'Modelización',
    enunciado: 'En un modelo ER, una relación "1:N" entre Cliente y Pedido significa que:',
    opciones: [
      'Un cliente tiene un solo pedido y un pedido pertenece a un cliente',
      'Un cliente puede tener muchos pedidos, pero cada pedido pertenece a un solo cliente',
      'Muchos clientes comparten muchos pedidos',
      'No hay relación entre cliente y pedido',
    ],
    correcta: 1,
    explicacion: 'En 1:N, el lado "1" (Cliente) se relaciona con varios del lado "N" (Pedido). Cada pedido pertenece a un único cliente, pero un cliente puede tener varios pedidos. La clave foránea va en la tabla Pedido.',
    dificultad: 'basico',
  },
  {
    materiaCodigo: 'BD-202',
    tema: 'SQL básico',
    competencia: 'Implementación',
    enunciado: '¿Qué hace la cláusula `SELECT DISTINCT`?',
    opciones: [
      'Cuenta el número de filas',
      'Devuelve solo filas únicas, eliminando duplicados',
      'Ordena los resultados',
      'Filtra con una condición',
    ],
    correcta: 1,
    explicacion: '`SELECT DISTINCT` elimina las filas duplicadas del resultado, devolviendo solo combinaciones únicas de las columnas seleccionadas.',
    dificultad: 'basico',
  },
  {
    materiaCodigo: 'BD-202',
    tema: 'Consultas avanzadas',
    competencia: 'Diseño',
    enunciado: '¿Cuál es la sintaxis correcta para contar el número de pedidos por cliente?',
    opciones: [
      'SELECT cliente, COUNT(pedido) FROM pedidos GROUP BY cliente',
      'SELECT cliente, COUNT(pedido) FROM pedidos ORDER BY cliente',
      'SELECT COUNT(pedido) FROM pedidos',
      'SELECT cliente FROM pedidos WHERE COUNT > 0',
    ],
    correcta: 0,
    explicacion: 'Para agregar por cliente se usa `GROUP BY cliente` con `COUNT(pedido)`. ORDER BY solo ordena, WHERE no admite funciones de agregación (se usa HAVING para filtrar agregados).',
    dificultad: 'avanzado',
  },
  {
    materiaCodigo: 'BD-202',
    tema: 'Normalización',
    competencia: 'Análisis',
    enunciado: 'Una tabla está en 3FN si, además de estar en 2FN:',
    opciones: [
      'No tiene columnas repetidas',
      'Ningún atributo no-primario depende transitivamente de la clave primaria',
      'Tiene exactamente una columna',
      'Todos sus datos son numéricos',
    ],
    correcta: 1,
    explicacion: 'La 3FN exige que no haya dependencias transitivas: ningún atributo no-primario debe depender de otro atributo no-primario, sino directamente de la clave primaria. Esto evita redundancias como guardar categoría y precio_unit derivado de producto en la tabla de ventas.',
    dificultad: 'avanzado',
  },
]

async function main() {
  console.log('Limpiando banco de preguntas previo...')
  await db.evaluacionPregunta.deleteMany()
  await db.respuestaEstudiante.deleteMany()
  await db.pregunta.deleteMany()

  console.log('Cargando banco de preguntas...')
  for (const p of preguntas) {
    const materia = await db.materia.findUnique({ where: { codigo: p.materiaCodigo } })
    if (!materia) {
      console.warn(`Materia ${p.materiaCodigo} no encontrada, saltando pregunta.`)
      continue
    }
    await db.pregunta.create({
      data: {
        materiaId: materia.id,
        tema: p.tema,
        competencia: p.competencia,
        enunciado: p.enunciado,
        opciones: JSON.stringify(p.opciones),
        correcta: p.correcta,
        explicacion: p.explicacion,
        dificultad: p.dificultad,
      },
    })
  }

  const total = await db.pregunta.count()
  console.log(`Banco cargado: ${total} preguntas.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
