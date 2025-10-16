import prisma from "@/app/api/utils/prisma";

// کش کلمات برای بهینه‌سازی
let profanityCache = [];
let lastCacheUpdate = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 دقیقه

/**
 * نرمال‌سازی متن فارسی
 * تبدیل حروف مشابه و حذف فاصله‌های اضافی
 */
export function normalizePersian(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/[آأإ]/g, 'ا')  // تبدیل انواع الف
    .replace(/[یيئ]/g, 'ی')  // تبدیل انواع ی
    .replace(/ة/g, 'ه')       // تبدیل ة به ه
    .replace(/ك/g, 'ک')       // تبدیل ك عربی به ک فارسی
    .replace(/ؤ/g, 'و')       // تبدیل ؤ به و
    .replace(/\s+/g, ' ')     // حذف فاصله‌های اضافی
    .replace(/[._\-]/g, '')   // حذف نقطه، خط‌تیره و آندرلاین
    .trim()
    .toLowerCase();
}

/**
 * بارگذاری کلمات نامناسب از دیتابیس با کش
 */
async function loadProfanities() {
  const now = Date.now();
  
  // اگر کش معتبر است، از آن استفاده کن
  if (now - lastCacheUpdate < CACHE_TTL && profanityCache.length > 0) {
    return profanityCache;
  }
  
  try {
    const words = await prisma.profanity.findMany({
      select: { word: true }
    });
    
    profanityCache = words.map(w => normalizePersian(w.word));
    lastCacheUpdate = now;
    
    console.log(`✅ Profanity cache updated: ${profanityCache.length} words loaded`);
    
    return profanityCache;
  } catch (error) {
    console.error('❌ Error loading profanities:', error);
    // در صورت خطا، از کش قدیمی استفاده کن
    return profanityCache;
  }
}

/**
 * ساخت Regex برای کلمه با اجازه فاصله/نقطه بین حروف
 * مثال: "بد" => /ب[\s\-._]*د/i
 */
function buildProfanityRegex(word) {
  // Escape special regex characters
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // اجازه فاصله، نقطه، خط‌تیره، آندرلاین بین هر کاراکتر
  const pattern = escaped
    .split('')
    .join('[\\s\\-._]*');
  
  // استفاده از word boundary برای تشخیص کلمات کامل
  return new RegExp(`\\b${pattern}\\b`, 'i');
}

/**
 * بررسی وجود کلمات نامناسب در متن
 * @param {string} text - متن ورودی
 * @returns {Promise<{hasProfanity: boolean, matchedWords: string[]}>}
 */
export async function checkProfanity(text) {
  if (!text || typeof text !== 'string') {
    return { hasProfanity: false, matchedWords: [] };
  }

  try {
    const words = await loadProfanities();
    
    if (words.length === 0) {
      // اگر هیچ کلمه‌ای در دیتابیس نیست، پاس کن
      return { hasProfanity: false, matchedWords: [] };
    }

    const normalizedText = normalizePersian(text);
    const matched = [];
    
    for (const word of words) {
      if (!word) continue;
      
      try {
        const regex = buildProfanityRegex(word);
        
        if (regex.test(normalizedText)) {
          matched.push(word);
        }
      } catch (regexError) {
        console.error(`❌ Regex error for word "${word}":`, regexError);
        continue;
      }
    }
    
    if (matched.length > 0) {
      console.warn(`🚫 Profanity detected in text: [${matched.join(', ')}]`);
    }
    
    return {
      hasProfanity: matched.length > 0,
      matchedWords: matched
    };
  } catch (error) {
    console.error('❌ Error in checkProfanity:', error);
    // در صورت خطا، اجازه ارسال بده (fail-open برای UX)
    return { hasProfanity: false, matchedWords: [] };
  }
}

/**
 * پاک کردن کش (برای استفاده بعد از اضافه/حذف کلمه)
 */
export function clearProfanityCache() {
  profanityCache = [];
  lastCacheUpdate = 0;
  console.log('✅ Profanity cache cleared');
}

/**
 * لیست پیش‌فرض کلمات نامناسب فارسی (برای seed)
 */
export const defaultProfanityWords = [
  // این لیست را مدیر باید تکمیل کند
  // فقط برای نمونه چند کلمه placeholder:
  'احمق',
  'خر',
  'کله‌خراب'
  // مدیر می‌تواند از پنل ادمین کلمات واقعی را اضافه کند
];

