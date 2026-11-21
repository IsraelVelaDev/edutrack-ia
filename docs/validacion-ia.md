# Validación del análisis de brechas con IA

Generado: 2026-11-07T21:25:31.778Z · versión de prompt v1.3

Modelo y parámetros por ejecución: columna «Modelo» y `docs/ia-resultados.json` (incluye el prompt exacto enviado).

## 1. Resumen por perfil

| Código | Notas < 70 | Con evidencia textual | Modelo | Tokens (ent./sal.) | Brechas | Temas bajos cubiertos | Brechas respaldadas por la evidencia | Brechas basadas solo en la nota | Temas no anclados (brechas/ejerc.) | Estado |
|---|---|---|---|---|---|---|---|---|---|---|
| EST-001 | 0 | 0 | (sin llamada) | — | 0 | — | — | 0 | 0/0 | Sin notas bajas |
| EST-002 | 12 | 3 | google/gemini-2.5-flash | 703/905 | 4 | 4/12 | 4/4 | 1 | 0/0 | IA |
| EST-003 | 1 | 1 | google/gemini-2.5-flash | 382/232 | 1 | 1/1 | 1/1 | 0 | 0/0 | IA |
| EST-004 | 6 | 2 | google/gemini-2.5-flash | 471/560 | 4 | 4/6 | 4/4 | 2 | 0/0 | IA |
| EST-005 | 0 | 0 | (sin llamada) | — | 0 | — | — | 0 | 0/0 | Sin notas bajas |
| EST-006 | 15 | 1 | google/gemini-2.5-flash | 561/804 | 4 | 4/15 | 4/4 | 3 | 0/0 | IA |
| EST-007 | 1 | 0 | google/gemini-2.5-flash | 333/244 | 1 | 1/1 | 1/1 | 0 | 0/0 | IA |
| EST-008 | 7 | 1 | google/gemini-2.5-flash | 503/545 | 4 | 4/7 | 4/4 | 3 | 0/0 | IA |

## 2. Casos: evidencia → brecha → recomendación

### EST-002

**Notas bajas enviadas**

| Tema | Competencia | Nota | Evidencia (extracto) |
|---|---|---|---|
| Sintaxis y variables | Implementación | 55 | — |
| Estructuras de control | Resolución de problemas | 48 | // Ejercicio: clasificar nota if (nota >= 90) { console.log("A") } if (nota >= 80) { console.log("B") } // usa if en cadena en lugar de else |
| Funciones y modularidad | Diseño | 52 | — |
| Depuración de código | Análisis | 45 | function promedio(notas) { let suma = 0 for i = 0; i < notas.length; i++ // olvidó 'let' y punto y coma suma = notas[i] // usa '=' en vez de |
| Conjuntos | Abstracción | 65 | — |
| Relaciones y funciones | Razonamiento | 68 | — |
| Teoría de grafos | Modelización | 60 | — |
| Arreglos | Implementación | 50 | — |
| Listas enlazadas | Implementación | 45 | — |
| Pilas y colas | Análisis | 55 | — |
| Árboles | Diseño | 42 | // Recorrido in-order de BST function inorder(node) { console.log(node.value) // visita raíz primero (pre-order, no in-order) inorder(node.l |
| Consultas avanzadas | Diseño | 68 | — |

**Brechas detectadas**

| Tema | Severidad | Descripción | Evidencia citada |
|---|---|---|---|
| Árboles | alta | Confusión en el orden de visita de nodos para recorridos de árboles (in-order vs. pre-order). | Visita la raíz primero (console.log(node.value)) en lugar de entre subárboles. |
| Depuración de código | alta | Errores sintácticos y lógicos básicos en la implementación de funciones. | Olvidó 'let' y punto y coma en for; usó '=' en vez de '+='. |
| Estructuras de control | alta | Uso incorrecto de condicionales, generando múltiples resultados inesperados. | Usa 'if' en cadena en lugar de 'else if', lo que evalúa todas las condiciones. |
| Listas enlazadas | alta | Dificultad en la implementación de estructuras de datos dinámicas. | Sin evidencia textual (solo nota) |

**Recomendaciones**

| Prioridad | Tipo | Recomendación |
|---|---|---|
| alta | repaso | Repaso de Estructuras de Control: Estudiar 'if-else if-else' para evitar evaluaciones múltiples y lógicas erróneas. |
| alta | ejercicio | Práctica de Depuración: Realizar ejercicios de identificación y corrección de errores sintácticos y lógicos. |
| alta | recurso | Visualización de Árboles: Usar herramientas visuales para entender los recorridos de árboles binarios. |

**Ejercicios**

| Tema | Dificultad | Enunciado |
|---|---|---|
| Estructuras de control | basico | Escribe una función que clasifique una nota (0-100) en A, B, C, D, F usando 'else if'. |
| Depuración de código | basico | Corrige la función 'promedio' para que calcule correctamente el promedio de un arreglo de números. |
| Árboles | intermedio | Implementa la función de recorrido in-order para un árbol de búsqueda binario. |

### EST-003

**Notas bajas enviadas**

| Tema | Competencia | Nota | Evidencia (extracto) |
|---|---|---|---|
| Teoría de grafos | Modelización | 50 | // Ejercicio: diferencia entre grafo dirigido y no dirigido // "Un grafo dirigido es aquel donde las aristas tienen flecha // y el no dirigi |

**Brechas detectadas**

| Tema | Severidad | Descripción | Evidencia citada |
|---|---|---|---|
| Teoría de grafos | alta | Confunde la definición conceptual de grafo dirigido/no dirigido con su representación visual. | "Un grafo dirigido es aquel donde las aristas tienen flecha y el no dirigido el que se dibuja con líneas." |

**Recomendaciones**

| Prioridad | Tipo | Recomendación |
|---|---|---|
| alta | repaso | Revisar Teoría de Grafos: Estudiar la definición formal y propiedades de grafos dirigidos y no dirigidos. |

**Ejercicios**

| Tema | Dificultad | Enunciado |
|---|---|---|
| Teoría de grafos | basico | Define y diferencia conceptualmente un grafo dirigido de uno no dirigido. |

### EST-004

**Notas bajas enviadas**

| Tema | Competencia | Nota | Evidencia (extracto) |
|---|---|---|---|
| Relaciones y funciones | Razonamiento | 68 | — |
| Teoría de grafos | Modelización | 65 | — |
| Modelo entidad-relación | Modelización | 48 | — |
| SQL básico (SELECT, JOIN) | Implementación | 52 | SELECT * FROM estudiantes, notas // "Para combinar tablas solo las pongo en el FROM separadas por coma." |
| Normalización | Análisis | 45 | // Tabla: Ventas(id_venta, cliente, producto, categoria, precio_unit, total) // "Esta tabla está bien porque guarda todo en un solo lugar, / |
| Consultas avanzadas | Diseño | 40 | — |

**Brechas detectadas**

| Tema | Severidad | Descripción | Evidencia citada |
|---|---|---|---|
| Normalización | alta | Confusión sobre redundancia y eficiencia en bases de datos. | "Esta tabla está bien porque guarda todo en un solo lugar, es más rápido consultar sin hacer JOINs." |
| Modelo entidad-relación | alta | Dificultad en el diseño conceptual de bases de datos. | Sin evidencia textual (solo nota) |
| SQL básico (SELECT, JOIN) | media | Error fundamental en la sintaxis y lógica de JOINs. | SELECT * FROM estudiantes, notas // "Para combinar tablas solo las pongo en el FROM separadas por coma." |
| Consultas avanzadas | media | Problemas para formular consultas complejas y optimizadas. | Sin evidencia textual (solo nota) |

**Recomendaciones**

| Prioridad | Tipo | Recomendación |
|---|---|---|
| alta | repaso | Fundamentos de Normalización: Revisar formas normales y sus objetivos. |
| alta | ejercicio | Práctica de JOINs: Realizar ejercicios variados con diferentes tipos de JOIN. |
| media | recurso | Diseño ERD: Estudiar ejemplos y practicar la creación de diagramas ER. |

**Ejercicios**

| Tema | Dificultad | Enunciado |
|---|---|---|
| Normalización | intermedio | Normaliza la tabla Ventas(id_venta, cliente, producto, categoria, precio_unit, total) a 3FN. |
| SQL básico (SELECT, JOIN) | basico | Combina las tablas 'estudiantes' y 'notas' para mostrar nombre del estudiante y su calificación. |
| Modelo entidad-relación | intermedio | Diseña un modelo entidad-relación para una biblioteca con libros, autores y préstamos. |

### EST-006

**Notas bajas enviadas**

| Tema | Competencia | Nota | Evidencia (extracto) |
|---|---|---|---|
| Estructuras de control | Resolución de problemas | 50 | — |
| Funciones y modularidad | Diseño | 48 | — |
| Depuración de código | Análisis | 45 | — |
| Lógica proposicional | Razonamiento | 48 | — |
| Conjuntos | Abstracción | 52 | — |
| Relaciones y funciones | Razonamiento | 45 | — |
| Teoría de grafos | Modelización | 40 | // Ejercicio: ¿Es conexo el grafo G con aristas {(1,2),(2,3)} y vértices {1,2,3,4}? // "Sí, porque hay aristas que conectan los vértices." |
| Arreglos | Implementación | 50 | — |
| Listas enlazadas | Implementación | 45 | — |
| Pilas y colas | Análisis | 48 | — |
| Árboles | Diseño | 42 | — |
| Modelo entidad-relación | Modelización | 52 | — |
| SQL básico (SELECT, JOIN) | Implementación | 48 | — |
| Normalización | Análisis | 45 | — |
| Consultas avanzadas | Diseño | 40 | — |

**Brechas detectadas**

| Tema | Severidad | Descripción | Evidencia citada |
|---|---|---|---|
| Teoría de grafos | alta | Confusión en la definición de conectividad de grafos. | Error en 'Sí, porque hay aristas que conectan los vértices.' El grafo no es conexo al no incluir el vértice 4. |
| Relaciones y funciones | alta | Dificultad en el razonamiento sobre relaciones y funciones. | Sin evidencia textual (solo nota) |
| Depuración de código | alta | Problemas para identificar y corregir errores en el código. | Sin evidencia textual (solo nota) |
| Consultas avanzadas | alta | Dificultad en el diseño de consultas SQL complejas. | Sin evidencia textual (solo nota) |

**Recomendaciones**

| Prioridad | Tipo | Recomendación |
|---|---|---|
| alta | repaso | Revisar conectividad de grafos: Estudiar la definición formal de grafos conexos y sus propiedades. |
| alta | ejercicio | Practicar depuración: Realizar ejercicios de depuración paso a paso con herramientas. |
| alta | ejercicio | Ejercicios de SQL avanzado: Resolver problemas de consultas complejas con subconsultas y funciones. |

**Ejercicios**

| Tema | Dificultad | Enunciado |
|---|---|---|
| Teoría de grafos | basico | Determina si el grafo G con V={A,B,C,D} y E={(A,B),(B,C)} es conexo. |
| Depuración de código | intermedio | Encuentra el error en un código que suma números pares hasta N. |
| Consultas avanzadas | avanzado | Obtén los nombres de empleados que ganan más que el promedio de su departamento. |

### EST-007

**Notas bajas enviadas**

| Tema | Competencia | Nota | Evidencia (extracto) |
|---|---|---|---|
| Consultas avanzadas | Diseño | 68 | — |

**Brechas detectadas**

| Tema | Severidad | Descripción | Evidencia citada |
|---|---|---|---|
| Consultas avanzadas (Diseño) | alta | Dificultad en la aplicación de consultas complejas. | 68/100 en Consultas avanzadas (Diseño) |

**Recomendaciones**

| Prioridad | Tipo | Recomendación |
|---|---|---|
| alta | repaso | Reforzar diseño de consultas: Revisar principios de optimización y casos prácticos. |
| alta | ejercicio | Práctica de consultas complejas: Realizar ejercicios con múltiples tablas y subconsultas. |

**Ejercicios**

| Tema | Dificultad | Enunciado |
|---|---|---|
| Consultas avanzadas (Diseño) | intermedio | Crea una consulta que una 3 tablas y filtre por 2 criterios. |

### EST-008

**Notas bajas enviadas**

| Tema | Competencia | Nota | Evidencia (extracto) |
|---|---|---|---|
| Depuración de código | Análisis | 68 | — |
| Conjuntos | Abstracción | 68 | — |
| Relaciones y funciones | Razonamiento | 65 | — |
| Teoría de grafos | Modelización | 62 | — |
| Árboles | Diseño | 48 | // Implementar BST insert function insert(root, val) { if (!root) return { value: val, left: null, right: null } // compara mal: inserta a l |
| Normalización | Análisis | 68 | — |
| Consultas avanzadas | Diseño | 65 | — |

**Brechas detectadas**

| Tema | Severidad | Descripción | Evidencia citada |
|---|---|---|---|
| Árboles | alta | Confusión fundamental en la propiedad de orden de los BST. | // compara mal: inserta a la izquierda si MAYOR if (val > root.value) root.left = insert(root.left, val) else root.right = insert(root.right, val) // 'Un BST ordena poniendo los mayores a la izquierda.' |
| Teoría de grafos | media | Dificultad en la modelización de problemas con grafos. | Sin evidencia textual (solo nota) |
| Relaciones y funciones | media | Problemas con el razonamiento abstracto de relaciones. | Sin evidencia textual (solo nota) |
| Consultas avanzadas | media | Debilidad en el diseño de consultas SQL complejas. | Sin evidencia textual (solo nota) |

**Recomendaciones**

| Prioridad | Tipo | Recomendación |
|---|---|---|
| alta | repaso | Revisar BST: Estudiar la definición y propiedades de los árboles binarios de búsqueda. |
| media | ejercicio | Ejercicios de grafos: Practicar la representación de problemas reales usando grafos. |
| baja | recurso | Material de normalización: Consultar recursos sobre las formas normales en bases de datos. |

**Ejercicios**

| Tema | Dificultad | Enunciado |
|---|---|---|
| Árboles | intermedio | Corrige la función `insert` para que un BST ordene correctamente. |
| Teoría de grafos | basico | Modela un mapa de ciudades y rutas como un grafo. |
| Consultas avanzadas | intermedio | Escribe una consulta que calcule el promedio de ventas por producto. |

## 3. Personalización: similitud entre planes de refuerzo

Similitud de Jaccard sobre el vocabulario de los ejercicios (0 = distintos, 1 = idénticos). Criterio de aceptación: < 0,5 entre perfiles con dificultades distintas.

| Perfil A | Perfil B | Temas de brecha A | Temas de brecha B | Similitud ejercicios | Resultado |
|---|---|---|---|---|---|
| EST-002 | EST-003 | Árboles, Depuración de código, Estructuras de control, Listas enlazadas | Teoría de grafos | 0.00 | CUMPLE |
| EST-002 | EST-004 | Árboles, Depuración de código, Estructuras de control, Listas enlazadas | Normalización, Modelo entidad-relación, SQL básico (SELECT, JOIN), Consultas avanzadas | 0.02 | CUMPLE |
| EST-002 | EST-006 | Árboles, Depuración de código, Estructuras de control, Listas enlazadas | Teoría de grafos, Relaciones y funciones, Depuración de código, Consultas avanzadas | 0.06 | CUMPLE |
| EST-002 | EST-007 | Árboles, Depuración de código, Estructuras de control, Listas enlazadas | Consultas avanzadas (Diseño) | 0.00 | CUMPLE |
| EST-002 | EST-008 | Árboles, Depuración de código, Estructuras de control, Listas enlazadas | Árboles, Teoría de grafos, Relaciones y funciones, Consultas avanzadas | 0.23 | CUMPLE |
| EST-003 | EST-004 | Teoría de grafos | Normalización, Modelo entidad-relación, SQL básico (SELECT, JOIN), Consultas avanzadas | 0.00 | CUMPLE |
| EST-003 | EST-006 | Teoría de grafos | Teoría de grafos, Relaciones y funciones, Depuración de código, Consultas avanzadas | 0.05 | CUMPLE |
| EST-003 | EST-007 | Teoría de grafos | Consultas avanzadas (Diseño) | 0.00 | CUMPLE |
| EST-003 | EST-008 | Teoría de grafos | Árboles, Teoría de grafos, Relaciones y funciones, Consultas avanzadas | 0.05 | CUMPLE |
| EST-004 | EST-006 | Normalización, Modelo entidad-relación, SQL básico (SELECT, JOIN), Consultas avanzadas | Teoría de grafos, Relaciones y funciones, Depuración de código, Consultas avanzadas | 0.00 | CUMPLE |
| EST-004 | EST-007 | Normalización, Modelo entidad-relación, SQL básico (SELECT, JOIN), Consultas avanzadas | Consultas avanzadas (Diseño) | 0.03 | CUMPLE |
| EST-004 | EST-008 | Normalización, Modelo entidad-relación, SQL básico (SELECT, JOIN), Consultas avanzadas | Árboles, Teoría de grafos, Relaciones y funciones, Consultas avanzadas | 0.07 | CUMPLE |
| EST-006 | EST-007 | Teoría de grafos, Relaciones y funciones, Depuración de código, Consultas avanzadas | Consultas avanzadas (Diseño) | 0.00 | CUMPLE |
| EST-006 | EST-008 | Teoría de grafos, Relaciones y funciones, Depuración de código, Consultas avanzadas | Árboles, Teoría de grafos, Relaciones y funciones, Consultas avanzadas | 0.06 | CUMPLE |
| EST-007 | EST-008 | Consultas avanzadas (Diseño) | Árboles, Teoría de grafos, Relaciones y funciones, Consultas avanzadas | 0.05 | CUMPLE |

Similitud media: 0.04 · máxima: 0.23 (15 pares).

## 4. Rúbrica de pertinencia pedagógica (a completar por el docente)

Escala 1 = no cumple · 2 = parcial · 3 = cumple. Esta evaluación no puede automatizarse.

| Perfil | Brecha corresponde a la evidencia | Recomendación atiende la brecha | Ejercicio pertinente al tema y nivel | Lenguaje claro | Observaciones |
|---|---|---|---|---|---|
| EST-002 |  |  |  |  |  |
| EST-003 |  |  |  |  |  |
| EST-004 |  |  |  |  |  |
| EST-006 |  |  |  |  |  |
| EST-007 |  |  |  |  |  |
| EST-008 |  |  |  |  |  |