/** Bridge `datetime-local` values (local) ↔ Unix ms. */

export function toDatetimeLocalValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(s: string): number | undefined {
  const t = s.trim();
  if (!t) return undefined;
  const ms = new Date(t).getTime();
  return Number.isFinite(ms) ? ms : undefined;
}
