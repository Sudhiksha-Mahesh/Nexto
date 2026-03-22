/** Shared badge styles for low / medium / high levels (priority & energy). */
export function levelBadgeClass(level: 'low' | 'medium' | 'high'): string {
  const map = {
    low: 'border border-slate-200 bg-slate-100 text-slate-700',
    medium: 'border border-amber-200 bg-amber-50 text-amber-900',
    high: 'border border-red-200 bg-red-50 text-red-800',
  };
  return map[level];
}

export function levelLabel(level: 'low' | 'medium' | 'high'): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}
