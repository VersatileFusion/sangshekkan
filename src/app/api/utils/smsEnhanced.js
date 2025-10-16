// Enhanced SMS utility with template support
import { Smsir } from 'smsir-js';
import { formatTemplate, getTemplate, validateTemplateVariables } from './smsTemplates.js';

/**
 * Normalizes Iranian phone number to standard format
 * @param {string} phone - Input phone number
 * @returns {string} Normalized phone number (09XXXXXXXXX format)
 */
export function normalizeIranPhone(phone = "") {
  let p = String(phone).trim().replace(/[\s\-+]/g, "");
  
  // Convert to 09XXXXXXXXX format (Iranian mobile format)
  if (p.startsWith("0098")) p = "0" + p.slice(4);
  if (p.startsWith("98")) p = "0" + p.slice(2);
  if (p.startsWith("+98")) p = "0" + p.slice(3);
  
  return p;
}

/**
 * Enhanced SMS sending with template support
 * @param {string} receptor - Target phone number
 * @param {string} templateId - Template identifier
 * @param {object} variables - Variables for template
 * @param {object} opts - Options (retries, etc.)
 * @returns {Promise<boolean>} True if sent successfully, false otherwise
 */
export async function sendTemplateSMS(receptor, templateId, variables = {}, opts = {}) {
  console.log('📱 [SMS TEMPLATE] sendTemplateSMS called with:', { receptor, templateId, variables, opts });
  
  const retries = Number(opts.retries || 2);
  console.log('🔄 [SMS TEMPLATE] Retries set to:', retries);
  
  // Validate template
  const template = getTemplate(templateId);
  if (!template) {
    console.error('❌ [SMS TEMPLATE] Template not found:', templateId);
    throw new Error(`Template ${templateId} not found`);
  }

  // Validate variables
  if (!validateTemplateVariables(templateId, variables)) {
    console.error('❌ [SMS TEMPLATE] Missing required variables for template:', templateId);
    throw new Error(`Missing required variables for template ${templateId}`);
  }

  // Format message
  const message = formatTemplate(templateId, variables);
  console.log('📝 [SMS TEMPLATE] Formatted message:', message);

  // Check if we're using SMS.ir driver
  const driver = process.env.SMS_DRIVER;
  console.log('🔧 [SMS TEMPLATE] SMS_DRIVER:', driver);
  if (driver !== 'smsir') {
    console.warn('⚠️ [SMS TEMPLATE] SMS_DRIVER is not set to "smsir". Current driver:', driver);
    throw new Error('SMS_DRIVER must be set to "smsir"');
  }

  console.log('🔍 [SMS TEMPLATE] Validating environment variables...');
  const apiKey = process.env.SMS_API_KEY;
  const lineNumber = process.env.SMS_SENDER;
  
  console.log('🔑 [SMS TEMPLATE] Environment variables:', { 
    apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET',
    lineNumber: lineNumber || 'NOT SET'
  });
  
  if (!apiKey) {
    console.error('❌ [SMS TEMPLATE] SMS_API_KEY is not set');
    throw new Error('SMS_API_KEY environment variable is required');
  }
  
  if (!lineNumber) {
    console.error('❌ [SMS TEMPLATE] SMS_SENDER is not set');
    throw new Error('SMS_SENDER environment variable is required');
  }

  console.log('🔄 [SMS TEMPLATE] Normalizing phone number...');
  const normalizedReceptor = normalizeIranPhone(receptor);
  console.log('📱 [SMS TEMPLATE] Normalized receptor:', normalizedReceptor);
  
  console.log('🔧 [SMS TEMPLATE] Initializing SMS.ir client...');
  const smsir = new Smsir(apiKey, parseInt(lineNumber));
  console.log('✅ [SMS TEMPLATE] SMS.ir client initialized');

  let lastError = null;
  console.log(`🔄 [SMS TEMPLATE] Starting retry loop (${retries + 1} attempts)...`);
  
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    console.log(`📤 [SMS TEMPLATE] Attempt ${attempt}/${retries + 1} - Sending SMS...`);
    try {
      console.log(`📱 [SMS TEMPLATE] Calling SendBulk with:`, {
        receptor: normalizedReceptor,
        message: message
      });
      
      const result = await smsir.SendBulk(message, [normalizedReceptor]);
      console.log(`✅ [SMS TEMPLATE] SMS.ir success - sent to ${normalizedReceptor}`, result);
      return true;
    } catch (err) {
      console.error(`❌ [SMS TEMPLATE] Attempt ${attempt} failed:`, err?.message || err);
      console.error(`❌ [SMS TEMPLATE] Error details:`, err);
      console.error(`❌ [SMS TEMPLATE] Error response:`, err?.response?.data);
      console.error(`❌ [SMS TEMPLATE] Error status:`, err?.response?.status);
      lastError = err;
      if (attempt <= retries) {
        const waitMs = attempt === 1 ? 500 : 1000 * attempt;
        console.log(`⏳ [SMS TEMPLATE] Waiting ${waitMs}ms before retry...`);
        await new Promise(r => setTimeout(r, waitMs));
      }
    }
  }
  
  console.error('💥 [SMS TEMPLATE] All retry attempts failed');
  console.error('💥 [SMS TEMPLATE] Last error:', lastError);
  throw lastError || new Error('SMS sending failed after all retries');
}

/**
 * Send OTP SMS using template
 * @param {string} phone - Phone number
 * @param {string} code - OTP code
 * @param {string} purpose - Purpose (signup, login, reset_password)
 * @param {object} opts - Options
 * @returns {Promise<boolean>} Success status
 */
export async function sendOTPSMS(phone, code, purpose = 'signup', opts = {}) {
  console.log('🔐 [OTP SMS] sendOTPSMS called with:', { phone, code, purpose, opts });
  
  const templateId = `OTP_${purpose.toUpperCase()}`;
  const variables = {
    code: code,
    expiry: '5' // 5 minutes expiry
  };
  
  return await sendTemplateSMS(phone, templateId, variables, opts);
}

/**
 * Send welcome SMS to new user
 * @param {string} phone - Phone number
 * @param {string} name - User name
 * @param {object} opts - Options
 * @returns {Promise<boolean>} Success status
 */
export async function sendWelcomeSMS(phone, name, opts = {}) {
  console.log('👋 [WELCOME SMS] sendWelcomeSMS called with:', { phone, name, opts });
  
  const variables = { name: name };
  return await sendTemplateSMS(phone, 'WELCOME', variables, opts);
}

/**
 * Send daily reminder SMS
 * @param {string} phone - Phone number
 * @param {string} name - User name
 * @param {object} opts - Options
 * @returns {Promise<boolean>} Success status
 */
export async function sendDailyReminderSMS(phone, name, opts = {}) {
  console.log('⏰ [REMINDER SMS] sendDailyReminderSMS called with:', { phone, name, opts });
  
  const variables = { name: name };
  return await sendTemplateSMS(phone, 'DAILY_REMINDER', variables, opts);
}

/**
 * Send challenge notification SMS
 * @param {string} phone - Phone number
 * @param {string} name - User name
 * @param {string} challengeTitle - Challenge title
 * @param {object} opts - Options
 * @returns {Promise<boolean>} Success status
 */
export async function sendChallengeSMS(phone, name, challengeTitle, opts = {}) {
  console.log('🎯 [CHALLENGE SMS] sendChallengeSMS called with:', { phone, name, challengeTitle, opts });
  
  const variables = { 
    name: name,
    challenge_title: challengeTitle
  };
  return await sendTemplateSMS(phone, 'CHALLENGE_START', variables, opts);
}

// Legacy function for backward compatibility
export async function sendSMS(receptor, code, opts = {}) {
  console.log('📱 [LEGACY SMS] sendSMS called - redirecting to OTP template');
  return await sendOTPSMS(receptor, code, 'signup', opts);
}

export default {
  sendTemplateSMS,
  sendOTPSMS,
  sendWelcomeSMS,
  sendDailyReminderSMS,
  sendChallengeSMS,
  sendSMS,
  normalizeIranPhone
};
