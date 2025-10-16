// Persian Date Utilities

// Convert Gregorian date to Persian (Shamsi)
export function toPersianDate(date) {
  if (!date) return "";
  
  const gregorianDate = new Date(date);
  
  // Simple Persian date conversion (using toLocaleDateString with fa-IR locale)
  return gregorianDate.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// Get Persian day name
export function getPersianDayName(date) {
  const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  const gregorianDate = new Date(date);
  return days[gregorianDate.getDay()];
}

// Get Persian month name
export function getPersianMonthName(monthNumber) {
  const months = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  return months[monthNumber - 1] || '';
}

// Format Persian date with day name
export function formatPersianDate(date) {
  if (!date) return "";
  
  const persianDate = toPersianDate(date);
  const dayName = getPersianDayName(date);
  
  return `${dayName} ${persianDate}`;
}

// Get current Persian date
export function getCurrentPersianDate() {
  return toPersianDate(new Date());
}

// Format for input fields (YYYY-MM-DD)
export function formatForInput(date) {
  if (!date) return "";
  
  const gregorianDate = new Date(date);
  return gregorianDate.toISOString().split('T')[0];
}