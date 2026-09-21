/**
 * Devuelve el rango [inicio, fin) de un mes dado.
 * Usar como filtro: { date: { $gte: start, $lt: end } }
 */
export function monthRange(year: number, month: number): { start: Date; end: Date } {
  // month: 1-12
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  return { start, end };
}

/**
 * Cantidad de días en un mes (year, month=1-12).
 */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Construye una fecha UTC clampeando el día al último válido del mes.
 * Ej: clampDay(2026, 2, 31) → 28 (o 29 en bisiesto).
 */
export function buildDateInMonth(year: number, month: number, day: number): Date {
  const maxDay = daysInMonth(year, month);
  const clampedDay = Math.min(Math.max(day, 1), maxDay);
  return new Date(Date.UTC(year, month - 1, clampedDay, 12, 0, 0, 0));
}
