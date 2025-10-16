import { sendSMS, normalizeIranPhone } from "@/app/api/utils/sms";

export async function GET() {
  try {
    console.log('🔍 [SMS DIAGNOSTIC] Checking SMS configuration...');
    
    const config = {
      SMS_DRIVER: process.env.SMS_DRIVER || 'NOT SET',
      SMS_API_KEY: process.env.SMS_API_KEY ? `${process.env.SMS_API_KEY.substring(0, 8)}...` : 'NOT SET',
      SMS_SENDER: process.env.SMS_SENDER || 'NOT SET',
      SMS_TEMPLATE_NAME: process.env.SMS_TEMPLATE_NAME || 'NOT SET',
      SMS_MOCK_MODE: process.env.SMS_MOCK_MODE || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
    };
    
    console.log('📊 [SMS DIAGNOSTIC] Configuration:', config);
    
    // Test phone number normalization
    const testPhones = ['09123456789', '+989123456789', '00989123456789'];
    const normalizedPhones = testPhones.map(phone => ({
      original: phone,
      normalized: normalizeIranPhone(phone)
    }));
    
    return Response.json({
      status: 'SMS Configuration Check',
      config,
      phoneNormalization: normalizedPhones,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [SMS DIAGNOSTIC] Error:', error);
    return Response.json({
      error: 'Diagnostic failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { phone } = await request.json();
    
    if (!phone) {
      return Response.json({ error: 'Phone number is required' }, { status: 400 });
    }
    
    console.log('🧪 [SMS TEST] Testing SMS send to:', phone);
    
    const testCode = '123456';
    const normalizedPhone = normalizeIranPhone(phone);
    
    console.log('📱 [SMS TEST] Normalized phone:', normalizedPhone);
    
    // Send real SMS (production only)
    const result = await sendSMS(normalizedPhone, testCode, { retries: 1 });
    
    return Response.json({
      success: result,
      message: result ? 'SMS test successful' : 'SMS test failed',
      phone: normalizedPhone,
      code: testCode
    });
    
  } catch (error) {
    console.error('❌ [SMS TEST] Error:', error);
    return Response.json({
      success: false,
      error: error.message,
      debug: {
        driver: process.env.SMS_DRIVER,
        hasApiKey: !!process.env.SMS_API_KEY,
        hasSender: !!process.env.SMS_SENDER,
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}
