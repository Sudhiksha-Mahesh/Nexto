/** Shared badge styles for low / medium / high levels (priority & energy). */
export function levelBadgeClass(level: 'low' | 'medium' | 'high'): string {
  const map = {
    low: 'border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200',
    medium:
      'border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100',
    high: 'border border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200',
  };
  return map[level];
}

export function levelLabel(level: 'low' | 'medium' | 'high'): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}
