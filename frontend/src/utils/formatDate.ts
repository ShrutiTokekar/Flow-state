import { format, formatDistanceToNow, isPast, isToday, isTomorrow, isYesterday } from 'date-fns';

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString: string | undefined, formatStr: string = 'MMM dd, yyyy'): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '-';
  }
};

/**
 * Format date with contextual labels (Today, Tomorrow, etc.)
 */
export const formatContextualDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return `Today, ${format(date, 'hh:mm a')}`;
    }
    
    if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, 'hh:mm a')}`;
    }
    
    if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'hh:mm a')}`;
    }
    
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Error formatting contextual date:', error);
    return '-';
  }
};

/**
 * Check if a date is overdue
 */
export const isOverdue = (dateString: string | undefined): boolean => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return isPast(date) && !isToday(date);
  } catch (error) {
    return false;
  }
};

/**
 * Get due date color based on proximity
 */
export const getDueDateColor = (dateString: string | undefined, status: string): string => {
  if (!dateString || status === 'DONE') return 'text-gray-500';
  
  try {
    const date = new Date(dateString);
    
    if (isOverdue(dateString)) {
      return 'text-red-600';
    }
    
    if (isToday(date) || isTomorrow(date)) {
      return 'text-orange-600';
    }
    
    return 'text-gray-500';
  } catch (error) {
    return 'text-gray-500';
  }
};

/**
 * Convert date string to input format (YYYY-MM-DD)
 */
export const toInputFormat = (dateString: string | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    return '';
  }
};

/**
 * Convert input format to ISO string
 */
export const toISOString = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toISOString();
  } catch (error) {
    return '';
  }
};