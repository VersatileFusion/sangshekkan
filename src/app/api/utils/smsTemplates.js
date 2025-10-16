// SMS Template System for SMS.ir
// This file contains predefined templates for different SMS purposes

export const SMS_TEMPLATES = {
  // OTP Templates
  OTP_SIGNUP: {
    id: 'otp_signup',
    name: 'کد تایید ثبت‌نام',
    template: '{code}\nکد تایید شما\nاین کد تا {expiry} دقیقه معتبر است\nخانم سنگ‌شکن',
    variables: ['code', 'expiry'],
    purpose: 'signup'
  },

  OTP_LOGIN: {
    id: 'otp_login', 
    name: 'کد تایید ورود',
    template: '{code}\nکد تایید ورود\nاین کد تا {expiry} دقیقه معتبر است\nخانم سنگ‌شکن',
    variables: ['code', 'expiry'],
    purpose: 'login'
  },

  OTP_RESET_PASSWORD: {
    id: 'otp_reset_password',
    name: 'کد تایید تغییر رمز عبور', 
    template: '{code}\nکد تایید تغییر رمز عبور\nاین کد تا {expiry} دقیقه معتبر است\nخانم سنگ‌شکن',
    variables: ['code', 'expiry'],
    purpose: 'reset_password'
  },

  // Notification Templates
  WELCOME: {
    id: 'welcome',
    name: 'خوش‌آمدگویی',
    template: 'سلام {name} عزیز!\nبه خانواده خانم سنگ‌شکن خوش آمدید.\nموفق باشید!',
    variables: ['name'],
    purpose: 'welcome'
  },

  DAILY_REMINDER: {
    id: 'daily_reminder',
    name: 'یادآوری روزانه',
    template: 'سلام {name}!\nیادت نره امروز هم درس بخونی! 💪\nخانم سنگ‌شکن',
    variables: ['name'],
    purpose: 'reminder'
  },

  CHALLENGE_START: {
    id: 'challenge_start',
    name: 'شروع چالش',
    template: 'چالش جدید شروع شد! 🎯\nموضوع: {challenge_title}\n{name} عزیز، آماده‌ای؟',
    variables: ['name', 'challenge_title'],
    purpose: 'challenge'
  },

  REPORT_APPROVED: {
    id: 'report_approved',
    name: 'تایید گزارش',
    template: 'گزارش شما تایید شد! ✅\nتاریخ: {report_date}\nموضوع: {subject}\nخانم سنگ‌شکن',
    variables: ['report_date', 'subject'],
    purpose: 'report'
  },

  REPORT_REJECTED: {
    id: 'report_rejected',
    name: 'رد گزارش',
    template: 'گزارش شما نیاز به اصلاح دارد.\nتاریخ: {report_date}\nموضوع: {subject}\nلطفاً مجدداً ارسال کنید.',
    variables: ['report_date', 'subject'],
    purpose: 'report'
  },

  SUSPENSION_WARNING: {
    id: 'suspension_warning',
    name: 'هشدار تعلیق',
    template: 'هشدار! {name} عزیز\nشما {days_left} روز تا تعلیق حساب کاربری وقت دارید.\nلطفاً فعالیت خود را افزایش دهید.',
    variables: ['name', 'days_left'],
    purpose: 'warning'
  },

  ACCOUNT_SUSPENDED: {
    id: 'account_suspended',
    name: 'تعلیق حساب',
    template: 'حساب کاربری شما به مدت {duration} روز تعلیق شد.\nدلیل: {reason}\nبرای بازگشت با پشتیبانی تماس بگیرید.',
    variables: ['duration', 'reason'],
    purpose: 'suspension'
  }
};

/**
 * Get template by ID
 * @param {string} templateId - Template identifier
 * @returns {object|null} Template object or null if not found
 */
export function getTemplate(templateId) {
  return SMS_TEMPLATES[templateId] || null;
}

/**
 * Get all templates for a specific purpose
 * @param {string} purpose - Template purpose (signup, login, etc.)
 * @returns {array} Array of templates matching the purpose
 */
export function getTemplatesByPurpose(purpose) {
  return Object.values(SMS_TEMPLATES).filter(template => template.purpose === purpose);
}

/**
 * Format template with variables
 * @param {string} templateId - Template identifier
 * @param {object} variables - Variables to replace in template
 * @returns {string} Formatted SMS message
 */
export function formatTemplate(templateId, variables = {}) {
  const template = getTemplate(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  let message = template.template;
  
  // Replace variables in template
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    message = message.replace(new RegExp(placeholder, 'g'), value);
  });

  return message;
}

/**
 * Validate template variables
 * @param {string} templateId - Template identifier
 * @param {object} variables - Variables to validate
 * @returns {boolean} True if all required variables are provided
 */
export function validateTemplateVariables(templateId, variables) {
  const template = getTemplate(templateId);
  if (!template) return false;

  return template.variables.every(variable => variables.hasOwnProperty(variable));
}

/**
 * Get template preview with sample data
 * @param {string} templateId - Template identifier
 * @returns {string} Preview of template with sample data
 */
export function getTemplatePreview(templateId) {
  const template = getTemplate(templateId);
  if (!template) return 'Template not found';

  const sampleData = {
    code: '123456',
    expiry: '5',
    name: 'علی',
    challenge_title: 'ریاضی پایه دهم',
    report_date: '1403/01/15',
    subject: 'فصل اول ریاضی',
    days_left: '3',
    duration: '7',
    reason: 'عدم فعالیت'
  };

  return formatTemplate(templateId, sampleData);
}

export default SMS_TEMPLATES;
