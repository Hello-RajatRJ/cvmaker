/**
 * Formats a date string into "Month Year" format for resume display.
 * 
 * Handles multiple input formats:
 *   - "YYYY-MM" (e.g. "2022-03")      → "Mar 2022"
 *   - "YYYY-MM-DD" (e.g. "2022-03-15") → "Mar 2022"
 *   - "Present" / "present"            → "Present"
 *   - Already formatted "May 2023"     → "May 2023" (passthrough)
 *   - Empty / undefined                → ""
 */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTH_FULL_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Convert any date string to "Mon YYYY" display format.
 */
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr || dateStr.trim() === '') return '';

  const trimmed = dateStr.trim();

  // Handle "Present" (case-insensitive)
  if (trimmed.toLowerCase() === 'present') return 'Present';

  // Handle YYYY-MM or YYYY-MM-DD format
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const monthIdx = parseInt(isoMatch[2], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${MONTH_NAMES[monthIdx]} ${year}`;
    }
    return year; // fallback to just year if month is invalid
  }

  // Handle plain year "2023"
  if (/^\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // Already in human-readable format like "May 2023", "August 2022", etc — passthrough
  return trimmed;
}

/**
 * Format a date range as "Mon YYYY – Mon YYYY" or "Mon YYYY – Present"
 */
export function formatDateRange(startDate: string | undefined | null, endDate: string | undefined | null, isCurrent?: boolean): string {
  const start = formatDate(startDate);
  const end = isCurrent ? 'Present' : formatDate(endDate);

  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  if (end) return end;
  return '';
}

/**
 * Parse a "Mon YYYY" or "YYYY-MM" string back into a consistent "Mon YYYY" format for storage.
 * This ensures the data is always stored in a human-friendly format.
 */
export function normalizeToMonthYear(input: string): string {
  if (!input || input.trim() === '') return '';

  const trimmed = input.trim();

  if (trimmed.toLowerCase() === 'present') return 'Present';

  // Already in YYYY-MM ISO format → convert to Month Year
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const monthIdx = parseInt(isoMatch[2], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${MONTH_NAMES[monthIdx]} ${year}`;
    }
  }

  return trimmed; // Already in readable format
}

/**
 * Build month options for dropdown selectors
 */
export function getMonthOptions(): { value: string; label: string }[] {
  return MONTH_NAMES.map((name, idx) => ({
    value: name,
    label: name,
  }));
}

/**
 * Build year options (from current year + 10 down to 1970)
 */
export function getYearOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let y = currentYear + 10; y >= 1970; y--) {
    years.push(y.toString());
  }
  return years;
}

/**
 * Parse a "Mon YYYY" string into { month, year } parts
 */
export function parseMonthYear(dateStr: string | undefined | null): { month: string; year: string } {
  if (!dateStr || dateStr.trim() === '') return { month: '', year: '' };

  const trimmed = dateStr.trim();

  if (trimmed.toLowerCase() === 'present') return { month: '', year: '' };

  // Try "Mon YYYY" format (e.g., "May 2023")
  const monthYearMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYearMatch) {
    return { month: monthYearMatch[1], year: monthYearMatch[2] };
  }

  // Try YYYY-MM format
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})$/);
  if (isoMatch) {
    const monthIdx = parseInt(isoMatch[2], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return { month: MONTH_NAMES[monthIdx], year: isoMatch[1] };
    }
    return { month: '', year: isoMatch[1] };
  }

  // Try just year
  if (/^\d{4}$/.test(trimmed)) {
    return { month: '', year: trimmed };
  }

  return { month: '', year: '' };
}
