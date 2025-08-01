// SOURCE: IMPLEMENTATION_PLAN.md line 79 + JavaScript Date API Official Documentation
// VERIFIED: Date utilities for relationship timeline and interaction management

/**
 * Date Helper Utilities
 * Provides date manipulation and formatting for relationship timelines
 * SOURCE: MDN Web Docs - Date API
 */

/**
 * Date Formatting Options
 */
export interface DateFormatOptions {
  includeTime?: boolean;
  includeYear?: boolean;
  includeWeekday?: boolean;
  relative?: boolean; // "2 days ago" vs "Jan 15"
  short?: boolean; // Abbreviated format
}

/**
 * Time Period Interface
 */
export interface TimePeriod {
  start: Date;
  end: Date;
  duration: number; // milliseconds
  label: string;
}

/**
 * Relative Time Result
 */
export interface RelativeTimeResult {
  value: number;
  unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
  label: string;
  isPast: boolean;
  isFuture: boolean;
}

/**
 * Format date for display
 * SOURCE: JavaScript Intl.DateTimeFormat API
 */
export const formatDate = (
  date: Date | null | undefined,
  options: DateFormatOptions = {}
): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Unknown date';
  }

  const {
    includeTime = false,
    includeYear = true,
    includeWeekday = false,
    relative = false,
    short = false,
  } = options;

  // Return relative time if requested
  if (relative) {
    return formatRelativeTime(date);
  }

  try {
    const formatOptions: Intl.DateTimeFormatOptions = {
      month: short ? 'short' : 'long',
      day: 'numeric',
    };

    if (includeYear) {
      formatOptions.year = 'numeric';
    }

    if (includeWeekday) {
      formatOptions.weekday = short ? 'short' : 'long';
    }

    if (includeTime) {
      formatOptions.hour = 'numeric';
      formatOptions.minute = '2-digit';
      formatOptions.hour12 = true;
    }

    return new Intl.DateTimeFormat('en-US', formatOptions).format(date);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return date.toLocaleDateString();
  }
};

/**
 * Format relative time (e.g., "2 days ago", "in 3 hours")
 * SOURCE: JavaScript Date arithmetic
 */
export const formatRelativeTime = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Unknown time';
  }

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const isPast = diffMs < 0;

  // Define time units in milliseconds
  const units = [
    { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
    { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
    { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
    { unit: 'day', ms: 24 * 60 * 60 * 1000 },
    { unit: 'hour', ms: 60 * 60 * 1000 },
    { unit: 'minute', ms: 60 * 1000 },
    { unit: 'second', ms: 1000 },
  ];

  // Handle "just now" case
  if (absDiffMs < 30000) { // Less than 30 seconds
    return 'Just now';
  }

  // Find the appropriate unit
  for (const { unit, ms } of units) {
    if (absDiffMs >= ms) {
      const value = Math.floor(absDiffMs / ms);
      const plural = value !== 1 ? 's' : '';
      
      if (isPast) {
        return `${value} ${unit}${plural} ago`;
      } else {
        return `In ${value} ${unit}${plural}`;
      }
    }
  }

  return isPast ? 'Just now' : 'Soon';
};

/**
 * Get detailed relative time information
 */
export const getRelativeTime = (date: Date): RelativeTimeResult => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return {
      value: 0,
      unit: 'day',
      label: 'Unknown',
      isPast: false,
      isFuture: false,
    };
  }

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const isPast = diffMs < 0;
  const isFuture = diffMs > 0;

  const units = [
    { unit: 'year' as const, ms: 365 * 24 * 60 * 60 * 1000 },
    { unit: 'month' as const, ms: 30 * 24 * 60 * 60 * 1000 },
    { unit: 'week' as const, ms: 7 * 24 * 60 * 60 * 1000 },
    { unit: 'day' as const, ms: 24 * 60 * 60 * 1000 },
    { unit: 'hour' as const, ms: 60 * 60 * 1000 },
    { unit: 'minute' as const, ms: 60 * 1000 },
    { unit: 'second' as const, ms: 1000 },
  ];

  for (const { unit, ms } of units) {
    if (absDiffMs >= ms) {
      const value = Math.floor(absDiffMs / ms);
      return {
        value,
        unit,
        label: formatRelativeTime(date),
        isPast,
        isFuture,
      };
    }
  }

  return {
    value: 0,
    unit: 'second',
    label: 'Just now',
    isPast: false,
    isFuture: false,
  };
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (date1: Date, date2: Date): number => {
  if (!date1 || !date2 || !(date1 instanceof Date) || !(date2 instanceof Date)) {
    return 0;
  }

  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

/**
 * Calculate days since a date
 */
export const daysSince = (date: Date): number => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 0;
  }

  const now = new Date();
  const timeDiff = now.getTime() - date.getTime();
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
};

/**
 * Calculate days until a date
 */
export const daysUntil = (date: Date): number => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 0;
  }

  const now = new Date();
  const timeDiff = date.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  if (!date || !(date instanceof Date)) return false;

  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is yesterday
 */
export const isYesterday = (date: Date): boolean => {
  if (!date || !(date instanceof Date)) return false;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * Check if a date is tomorrow
 */
export const isTomorrow = (date: Date): boolean => {
  if (!date || !(date instanceof Date)) return false;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
};

/**
 * Check if a date is in the current week
 */
export const isThisWeek = (date: Date): boolean => {
  if (!date || !(date instanceof Date)) return false;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
  endOfWeek.setHours(23, 59, 59, 999);

  return date >= startOfWeek && date <= endOfWeek;
};

/**
 * Check if a date is in the current month
 */
export const isThisMonth = (date: Date): boolean => {
  if (!date || !(date instanceof Date)) return false;

  const now = new Date();
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
};

/**
 * Check if a date is in the current year
 */
export const isThisYear = (date: Date): boolean => {
  if (!date || !(date instanceof Date)) return false;

  const now = new Date();
  return date.getFullYear() === now.getFullYear();
};

/**
 * Get start of day
 */
export const startOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * Get end of day
 */
export const endOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

/**
 * Get start of week (Sunday)
 */
export const startOfWeek = (date: Date): Date => {
  const newDate = new Date(date);
  const day = newDate.getDay();
  const diff = newDate.getDate() - day;
  newDate.setDate(diff);
  return startOfDay(newDate);
};

/**
 * Get end of week (Saturday)
 */
export const endOfWeek = (date: Date): Date => {
  const newDate = new Date(date);
  const day = newDate.getDay();
  const diff = newDate.getDate() - day + 6;
  newDate.setDate(diff);
  return endOfDay(newDate);
};

/**
 * Get start of month
 */
export const startOfMonth = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setDate(1);
  return startOfDay(newDate);
};

/**
 * Get end of month
 */
export const endOfMonth = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + 1, 0); // Last day of current month
  return endOfDay(newDate);
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

/**
 * Add months to a date
 */
export const addMonths = (date: Date, months: number): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

/**
 * Add years to a date
 */
export const addYears = (date: Date, years: number): Date => {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + years);
  return newDate;
};

/**
 * Get age from birth date
 */
export const getAge = (birthDate: Date): number => {
  if (!birthDate || !(birthDate instanceof Date)) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return Math.max(0, age);
};

/**
 * Get next birthday date
 */
export const getNextBirthday = (birthDate: Date): Date => {
  if (!birthDate || !(birthDate instanceof Date)) return new Date();

  const today = new Date();
  const thisYear = today.getFullYear();
  const nextBirthday = new Date(thisYear, birthDate.getMonth(), birthDate.getDate());
  
  // If birthday has passed this year, get next year's birthday
  if (nextBirthday < today) {
    nextBirthday.setFullYear(thisYear + 1);
  }
  
  return nextBirthday;
};

/**
 * Format time duration (e.g., "2h 30m")
 */
export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 0) return '0m';

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return seconds > 0 ? `${seconds}s` : '0s';
  }
};

/**
 * Get time periods for analytics
 */
export const getTimePeriods = (): {
  today: TimePeriod;
  yesterday: TimePeriod;
  thisWeek: TimePeriod;
  lastWeek: TimePeriod;
  thisMonth: TimePeriod;
  lastMonth: TimePeriod;
  thisYear: TimePeriod;
  lastYear: TimePeriod;
} => {
  const now = new Date();

  // Today
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  
  // Yesterday
  const yesterdayStart = startOfDay(addDays(now, -1));
  const yesterdayEnd = endOfDay(addDays(now, -1));
  
  // This week
  const thisWeekStart = startOfWeek(now);
  const thisWeekEnd = endOfWeek(now);
  
  // Last week
  const lastWeekStart = startOfWeek(addDays(now, -7));
  const lastWeekEnd = endOfWeek(addDays(now, -7));
  
  // This month
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  
  // Last month
  const lastMonthStart = startOfMonth(addDays(now, -30));
  const lastMonthEnd = endOfMonth(addDays(now, -30));
  
  // This year
  const thisYearStart = new Date(now.getFullYear(), 0, 1);
  const thisYearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  
  // Last year
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);

  return {
    today: {
      start: todayStart,
      end: todayEnd,
      duration: todayEnd.getTime() - todayStart.getTime(),
      label: 'Today',
    },
    yesterday: {
      start: yesterdayStart,
      end: yesterdayEnd,
      duration: yesterdayEnd.getTime() - yesterdayStart.getTime(),
      label: 'Yesterday',
    },
    thisWeek: {
      start: thisWeekStart,
      end: thisWeekEnd,
      duration: thisWeekEnd.getTime() - thisWeekStart.getTime(),
      label: 'This Week',
    },
    lastWeek: {
      start: lastWeekStart,
      end: lastWeekEnd,
      duration: lastWeekEnd.getTime() - lastWeekStart.getTime(),
      label: 'Last Week',
    },
    thisMonth: {
      start: thisMonthStart,
      end: thisMonthEnd,
      duration: thisMonthEnd.getTime() - thisMonthStart.getTime(),
      label: 'This Month',
    },
    lastMonth: {
      start: lastMonthStart,
      end: lastMonthEnd,
      duration: lastMonthEnd.getTime() - lastMonthStart.getTime(),
      label: 'Last Month',
    },
    thisYear: {
      start: thisYearStart,
      end: thisYearEnd,
      duration: thisYearEnd.getTime() - thisYearStart.getTime(),
      label: 'This Year',
    },
    lastYear: {
      start: lastYearStart,
      end: lastYearEnd,
      duration: lastYearEnd.getTime() - lastYearStart.getTime(),
      label: 'Last Year',
    },
  };
};

/**
 * Parse various date formats
 */
export const parseDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') return null;

  // Try different formats
  const formats = [
    // ISO format
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    // Date only
    /^\d{4}-\d{2}-\d{2}$/,
    // US format
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    // European format
    /^\d{1,2}\.\d{1,2}\.\d{4}$/,
  ];

  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (error) {
    // Ignore parsing errors
  }

  return null;
};

/**
 * Check if date is valid
 */
export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Export all date helper functions
 */
export default {
  formatDate,
  formatRelativeTime,
  getRelativeTime,
  daysBetween,
  daysSince,
  daysUntil,
  isToday,
  isYesterday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  isThisYear,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addMonths,
  addYears,
  getAge,
  getNextBirthday,
  formatDuration,
  getTimePeriods,
  parseDate,
  isValidDate,
};