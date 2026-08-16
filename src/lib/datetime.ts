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

/**
 * Extracts "HH:mm" from either "HH:mm", "HH:mm:ss", or "YYYY-MM-DDTHH:mm:ss.sssZ"
 * without any timezone conversion skew.
 */
export function extractBookingTimeStr(timeOrIso: string): string {
  if (!timeOrIso) return '00:00';
  if (typeof timeOrIso !== 'string') return '00:00';
  if (timeOrIso.includes('T')) {
    const timePart = timeOrIso.split('T')[1];
    const match = /^(\d{2}):(\d{2})/.exec(timePart);
    if (match) return `${match[1]}:${match[2]}`;
  }
  const match = /^(\d{1,2}):(\d{2})/.exec(timeOrIso);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  return timeOrIso;
}

/**
 * Extracts "YYYY-MM-DD" from either "YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss.sssZ", or Date
 * without any timezone conversion skew.
 */
export function extractBookingDateStr(dateOrIso: string | Date): string {
  if (!dateOrIso) return formatLocalDateInput();
  if (dateOrIso instanceof Date) {
    return formatLocalDateInput(dateOrIso);
  }
  if (typeof dateOrIso === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateOrIso);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }
  return formatLocalDateInput(new Date(dateOrIso));
}

/**
 * Formats "06:00" or "2026-08-17T06:00:00.000Z" to "6:00 AM" without timezone drift.
 */
export function formatBookingTime(timeOrIso: string): string {
  if (!timeOrIso) return '';
  const timeStr = extractBookingTimeStr(timeOrIso);
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  }
  return timeOrIso;
}

/**
 * Formats date to "Monday, August 17, 2026" or custom options without timezone drift.
 */
export function formatBookingDate(dateOrIso: string | Date, options?: Intl.DateTimeFormatOptions): string {
  if (!dateOrIso) return '';
  const dateStr = extractBookingDateStr(dateOrIso);
  const parsed = parseLocalDate(dateStr);
  if (!parsed) return typeof dateOrIso === 'string' ? dateOrIso : formatLocalDateInput(dateOrIso);
  
  return parsed.toLocaleDateString('en-US', options || {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats time range e.g. "6:00 AM - 7:00 AM"
 */
export function formatBookingTimeRange(startTimeOrIso: string, endTimeOrIso: string): string {
  return `${formatBookingTime(startTimeOrIso)} - ${formatBookingTime(endTimeOrIso)}`;
}


