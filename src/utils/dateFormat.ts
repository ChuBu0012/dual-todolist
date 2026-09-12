/**
 * Date formatting utilities for Dual Todo
 */

/**
 * Format date to Thai Buddhist Era short format: DD/MM/YY (e.g., 12/09/69)
 * Using Thailand timezone (Asia/Bangkok, UTC+7)
 */
export function formatThaiDate(date: Date = new Date()): string {
  // Convert to Asia/Bangkok timezone
  const bangkokDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const day = String(bangkokDate.getDate()).padStart(2, '0');
  const month = String(bangkokDate.getMonth() + 1).padStart(2, '0');
  // Buddhist Era (BE) is CE + 543 (e.g. 2026 + 543 = 2569 -> 69)
  const thaiYear = String(bangkokDate.getFullYear() + 543).slice(-2);
  return `${day}/${month}/${thaiYear}`;
}

/**
 * Format date for Dual Todo Summary header: e.g. "12 Sep 2026"
 */
export function formatSummaryDate(date: Date = new Date()): string {
  const bangkokDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = bangkokDate.getDate();
  const monthStr = months[bangkokDate.getMonth()];
  const year = bangkokDate.getFullYear();
  return `${day} ${monthStr} ${year}`;
}

