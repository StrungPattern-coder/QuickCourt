export function formatLocalDateInput(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateString: string): Date | null {
  if (!dateString) return null;
  // Match YYYY-MM-DD anywhere at the start or inside ISO string
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  // Match DD-MM-YYYY
  const dmyMatch = /^(\d{2})-(\d{2})-(\d{4})/.exec(dateString);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  const fallback = new Date(dateString);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function formatDisplayDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  const date = parseLocalDate(dateString);
  if (!date) return dateString;
  return date.toLocaleDateString('en-IN', options || {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function isSameCalendarDate(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function getRelativeDateLabel(dateString: string): string {
  const parsed = parseLocalDate(dateString);
  if (!parsed) return dateString;

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (isSameCalendarDate(parsed, today)) {
    return 'Today';
  }
  if (isSameCalendarDate(parsed, tomorrow)) {
    return 'Tomorrow';
  }

  return parsed.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

