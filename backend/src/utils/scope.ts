/**
 * Helper para construir el filtro de "scope" en queries:
 * - Personal: { userId, householdId: null }
 * - Hogar:    { householdId: X }
 *
 * En hogar NO filtramos por userId porque todos los miembros deben ver
 * los movimientos del hogar. La verificación de membresía se hace en el
 * controller antes de invocar al service.
 */
export function scopeFilter(
  userId: string,
  householdId?: string | null
): Record<string, unknown> {
  if (householdId) return { householdId };
  return { userId, householdId: null };
}
