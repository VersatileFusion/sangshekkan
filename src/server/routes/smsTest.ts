import { Hono } from 'hono';
import { sendTemplateSMS, sendOTPSMS, sendWelcomeSMS, sendDailyReminderSMS, sendChallengeSMS } from '../../app/api/utils/smsEnhanced.js';
import { getTemplate, getTemplatePreview, getTemplatesByPurpose, SMS_TEMPLATES } from '../../app/api/utils/smsTemplates.js';

const smsTestRouter = new Hono();

// Test SMS Templates endpoint
smsTestRouter.post('/', async (c) => {
  console.log('🧪 [SMS TEST] Template test endpoint called');
  
  try {
    const { action, phone, templateId, variables, purpose } = await c.req.json();
    console.log('📝 [SMS TEST] Request data:', { action, phone, templateId, variables, purpose });
    
    const normalizedPhone = phone || '09109924707'; // Default test phone
    
    switch (action) {
      case 'send_template':
        console.log('📤 [SMS TEST] Sending template SMS...');
        const result = await sendTemplateSMS(normalizedPhone, templateId, variables || {});
        return c.json({
          success: true,
          message: 'Template SMS sent successfully',
          template: templateId,
          phone: normalizedPhone,
          variables: variables
        });
        
      case 'send_otp':
        console.log('🔐 [SMS TEST] Sending OTP SMS...');
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        await sendOTPSMS(normalizedPhone, otpCode, purpose || 'signup');
        return c.json({
          success: true,
          message: 'OTP SMS sent successfully',
          phone: normalizedPhone,
          code: otpCode,
          purpose: purpose || 'signup'
        });
        
      case 'send_welcome':
        console.log('👋 [SMS TEST] Sending welcome SMS...');
        await sendWelcomeSMS(normalizedPhone, variables?.name || 'کاربر عزیز');
        return c.json({
          success: true,
          message: 'Welcome SMS sent successfully',
          phone: normalizedPhone,
          name: variables?.name || 'کاربر عزیز'
        });
        
      case 'send_reminder':
        console.log('⏰ [SMS TEST] Sending reminder SMS...');
        await sendDailyReminderSMS(normalizedPhone, variables?.name || 'کاربر عزیز');
        return c.json({
          success: true,
          message: 'Reminder SMS sent successfully',
          phone: normalizedPhone,
          name: variables?.name || 'کاربر عزیز'
        });
        
      case 'send_challenge':
        console.log('🎯 [SMS TEST] Sending challenge SMS...');
        await sendChallengeSMS(
          normalizedPhone, 
          variables?.name || 'کاربر عزیز',
          variables?.challenge_title || 'چالش ریاضی'
        );
        return c.json({
          success: true,
          message: 'Challenge SMS sent successfully',
          phone: normalizedPhone,
          name: variables?.name || 'کاربر عزیز',
          challenge_title: variables?.challenge_title || 'چالش ریاضی'
        });
        
      case 'get_template':
        console.log('📋 [SMS TEST] Getting template info...');
        const template = getTemplate(templateId);
        if (!template) {
          return c.json({
            success: false,
            error: 'Template not found',
            templateId
          }, 404);
        }
        
        const preview = getTemplatePreview(templateId);
        return c.json({
          success: true,
          template: template,
          preview: preview
        });
        
      case 'list_templates':
        console.log('📚 [SMS TEST] Listing all templates...');
        const purposeTemplates = purpose ? getTemplatesByPurpose(purpose) : Object.values(SMS_TEMPLATES);
        return c.json({
          success: true,
          templates: purposeTemplates,
          purpose: purpose || 'all'
        });
        
      default:
        return c.json({
          success: false,
          error: 'Invalid action. Available actions: send_template, send_otp, send_welcome, send_reminder, send_challenge, get_template, list_templates'
        }, 400);
    }
    
  } catch (error) {
    console.error('💥 [SMS TEST] Error:', error);
    return c.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, 500);
  }
});

// Get available templates
smsTestRouter.get('/', async (c) => {
  console.log('📚 [SMS TEST] Getting available templates...');
  
  try {
    const url = new URL(c.req.url);
    const purpose = url.searchParams.get('purpose');
    
    const templates = purpose ? getTemplatesByPurpose(purpose) : Object.values(SMS_TEMPLATES);
    
    return c.json({
      success: true,
      templates: templates,
      purpose: purpose || 'all',
      count: templates.length
    });
    
  } catch (error) {
    console.error('💥 [SMS TEST] Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

export default smsTestRouter;
