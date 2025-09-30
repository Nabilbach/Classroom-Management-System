export function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    // Return only the date part in ISO-like format YYYY-MM-DD
    // Use toISOString to get a stable YYYY-MM-DD in UTC and slice the date portion
    return d.toISOString().slice(0, 10);
  } catch (e) {
    return String(dateStr);
  }
}
