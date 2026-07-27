export const PLANT_AREAS = [
  { value: 'SEALING', label: 'Bolseras / Selladoras' },
  { value: 'EXTRUSION', label: 'Extrusoras' },
  { value: 'PRINTING', label: 'Impresoras Flexográficas' },
  { value: 'SLITTING', label: 'Refilado / Rebobinado' },
  { value: 'RECYCLING', label: 'Peletizado / Reciclado' },
  { value: 'MIXING', label: 'Mezclado / Mezcladoras' },
  { value: 'POWER_PLANT', label: 'Planta Eléctrica / Subestación' },
  { value: 'AUXILIARY', label: 'Auxiliares / Compresores' },
  { value: 'GENERAL', label: 'General Planta' },
] as const

export const AREA_LABELS: Record<string, string> = {
  SEALING: 'Bolseras / Selladoras',
  EXTRUSION: 'Extrusoras',
  PRINTING: 'Impresoras Flexográficas',
  SLITTING: 'Refilado / Rebobinado',
  RECYCLING: 'Peletizado / Reciclado',
  MIXING: 'Mezclado / Mezcladoras',
  POWER_PLANT: 'Planta Eléctrica / Subestación',
  AUXILIARY: 'Auxiliares / Compresores',
  GENERAL: 'General Planta',
}

export function getAreaLabel(areaKey?: string | null): string {
  if (!areaKey) return 'General Planta'
  return AREA_LABELS[areaKey] || areaKey
}

export const getCriticalityBadge = (criticality: number | string) => {
  const crit = String(criticality);
  if (crit === '1' || crit === 'Alta') {
    return { label: 'Criticidad 1 (Alta)', className: 'bg-red-500 text-white font-semibold hover:bg-red-600' };
  }
  if (crit === '2' || crit === 'Media') {
    return { label: 'Criticidad 2 (Media)', className: 'bg-amber-500 text-white font-semibold hover:bg-amber-600' };
  }
  return { label: 'Criticidad 3 (Baja)', className: 'bg-emerald-500 text-white font-semibold hover:bg-emerald-600' };
};
