# Validación del cálculo de riesgo

Generado: 2026-11-07T21:17:14.391Z

## 1. Coherencia nivel vs. puntaje (malla exhaustiva)

| Indicador | Valor | Criterio de aceptación | Resultado |
|---|---|---|---|
| Casos evaluados | 2401 | — | — |
| Casos con nivel ≠ tramo del puntaje | 0 | 0 | CUMPLE |
| Casos con nivel ≠ reglas duras (oráculo independiente) | 0 | 0 | CUMPLE |
| Distribución bajo / medio / alto | 86 / 480 / 1835 | — | — |

## 2. Casos de borde

| Caso | Notas | Promedio | Puntaje | Nivel | Tramo del puntaje | Coherente |
|---|---|---|---|---|---|---|
| Promedio 55, sin reprobadas | 55/55/55/55 | 55 | 61 | alto | alto | Sí |
| Promedio 65 estable | 65/65/65/65 | 65 | 31 | medio | medio | Sí |
| 1 reprobada (peso 20) | 80/80/80/45 | 73 | 31 | medio | medio | Sí |
| Reprobada de peso 30 | 90/45/90/90 | 76.5 | 61 | alto | alto | Sí |
| Caída de 15 puntos | 90/90/90/75 | 87 | 31 | medio | medio | Sí |
| Estable en 75 | 75/75/75/75 | 75 | 0 | bajo | bajo | Sí |
| Promedio 45 | 45/45/45/45 | 45 | 100 | alto | alto | Sí |
| Alternando 95/40 | 95/40/95/40 | 67.5 | 77 | alto | alto | Sí |

## 3. Perfiles ficticios (base de datos)

| Código | Estudiante | Notas | Promedio sistema | Promedio recalculado | Δ | Puntaje | Nivel | Factores |
|---|---|---|---|---|---|---|---|---|
| EST-001 | Mariana Rojas | 16 | 83.1 | 83.13 | 0.03 | 0 | bajo | — |
| EST-002 | Carlos Mendoza | 16 | 58.8 | 58.83 | 0.03 | 100 | alto | promedio, reprobadas, peso_alto |
| EST-003 | Ana Vera | 16 | 75.7 | 75.74 | 0.04 | 31 | medio | reprobadas, tendencia |
| EST-004 | Diego Flores | 16 | 66.1 | 66.13 | 0.03 | 69 | alto | promedio, reprobadas, peso_alto |
| EST-005 | Lucía Paz | 16 | 88.6 | 88.55 | 0.05 | 0 | bajo | — |
| EST-006 | Pedro Quispe | 16 | 48.3 | 48.25 | 0.05 | 100 | alto | promedio, reprobadas, peso_alto |
| EST-007 | Sofía Cortez | 16 | 74.9 | 74.85 | 0.05 | 0 | bajo | — |
| EST-008 | Javier Mamani | 16 | 68.5 | 68.46 | 0.04 | 31 | medio | promedio, reprobadas |

Diferencia máxima de promedio: 0.05 (tolerancia 0,05, por redondeo a 1 decimal) → CUMPLE
