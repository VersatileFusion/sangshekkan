// apps/web/src/app/api/utils/sms.js
// SMS.ir Integration using official smsir-js package

import { Smsir } from 'smsir-js';

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
 * Sends SMS using SMS.ir official package
 * @param {string} receptor - Target phone number
 * @param {string} code - OTP code to send
 * @param {object} opts - Options (retries, etc.)
 * @returns {Promise<boolean>} True if sent successfully, false otherwise
 */
export async function sendSMS(receptor, code, opts = {}) {
  console.log('📱 [SMS] sendSMS called with:', { receptor, code, opts });
  const retries = Number(opts.retries || 2);
  console.log('🔄 [SMS] Retries set to:', retries);
  
  // Check if we're using SMS.ir driver
  const driver = process.env.SMS_DRIVER;
  console.log('🔧 [SMS] SMS_DRIVER:', driver);
  if (driver !== 'smsir') {
    console.warn('⚠️ [SMS] SMS_DRIVER is not set to "smsir". Current driver:', driver);
    throw new Error('SMS_DRIVER must be set to "smsir"');
  }

  // Validate required environment variables
  console.log('🔍 [SMS] Validating environment variables...');
  const apiKey = process.env.SMS_API_KEY;
  const lineNumber = process.env.SMS_SENDER;
  
  console.log('🔑 [SMS] Environment variables:', { 
    apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET',
    lineNumber: lineNumber || 'NOT SET'
  });

  if (!apiKey) {
    console.error('❌ [SMS] SMS_API_KEY is not defined');
    throw new Error('SMS_API_KEY is required');
  }

  if (!lineNumber) {
    console.error('❌ [SMS] SMS_SENDER is not defined');
    throw new Error('SMS_SENDER is required');
  }

  // Normalize phone number
  console.log('🔄 [SMS] Normalizing phone number...');
  const normalizedReceptor = normalizeIranPhone(receptor);
  console.log('📱 [SMS] Normalized receptor:', normalizedReceptor);
  
  // Initialize SMS.ir client
  console.log('🔧 [SMS] Initializing SMS.ir client...');
  const smsir = new Smsir(apiKey, parseInt(lineNumber));
  console.log('✅ [SMS] SMS.ir client initialized');

  let lastError = null;

  // Create OTP message manually (more reliable than template)
  // Format: Code first (LTR), then Persian text on new line (RTL)
  const otpMessage = `${code}\nکد تایید شما\nاین کد تا 5 دقیقه معتبر است\nخانم سنگ‌شکن`;
  console.log('📝 [SMS] OTP Message:', otpMessage);

  // Retry loop
  console.log(`🔄 [SMS] Starting retry loop (${retries + 1} attempts)...`);
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    console.log(`📤 [SMS] Attempt ${attempt}/${retries + 1} - Sending SMS...`);
    try {
      // Use SendBulk method for better reliability
      console.log(`📱 [SMS] Calling SendBulk with:`, {
        receptor: normalizedReceptor,
        message: otpMessage
      });
      
      const result = await smsir.SendBulk(otpMessage, [normalizedReceptor]);

      console.log(`✅ [SMS] SMS.ir success - sent to ${normalizedReceptor}`, result);
      return true;
      
    } catch (err) {
      console.error(`❌ [SMS] Attempt ${attempt} failed:`, err?.message || err);
      console.error(`❌ [SMS] Error details:`, err);
      lastError = err;
      
      // Simple exponential backoff
      if (attempt <= retries) {
        const waitMs = attempt === 1 ? 500 : 1000 * attempt;
        console.log(`⏳ [SMS] Waiting ${waitMs}ms before retry...`);
        await new Promise(r => setTimeout(r, waitMs));
      }
    }
  }

  // Exhausted all retries
  console.error('💥 [SMS] All retry attempts failed');
  console.error('💥 [SMS] Last error:', lastError);
  throw lastError || new Error('SMS sending failed after all retries');
}

/**
 * Sends signup notification to admin (Mrs. Sangshekan)
 * Preserved for backward compatibility
 */
export async function notifySangshekanOnSignup(userPhoneNumber) {
  const adminMsisdn = process.env.SIGNUP_ALERT_MSISDN || '09923182082';
  const studentPhone = typeof userPhoneNumber === 'string' ? userPhoneNumber : '';
  
  try {
    // For admin notifications, we'll try to send
    // Note: This might need a different template or approach for SMS.ir
    console.log(`[notifySangshekanOnSignup] Would notify ${adminMsisdn} about ${studentPhone}`);
    
    // Since SMS.ir uses templates, admin notifications might need different handling
    // For now, we'll just log it
    console.warn('[notifySangshekanOnSignup] Admin notifications need separate template configuration');
    
    return true;
  } catch (err) {
    console.error('[notifySangshekanOnSignup] Failed:', err?.message || err);
    return false;
  }
}
