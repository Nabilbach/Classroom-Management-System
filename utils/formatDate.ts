export function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString) return 'غير متوفر';
  
  try {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 10); // YYYY-MM-DD format
  } catch (error) {
    return 'تاريخ غير صحيح';
  }
}