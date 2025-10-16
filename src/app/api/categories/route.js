// API endpoint برای دریافت لیست دسته‌بندی‌های ویدیو

export async function GET() {
  try {
    // دسته‌بندی‌های ثابت (می‌توان بعداً از دیتابیس خواند)
    const categories = [
      { id: 'آموزشی', name: 'آموزشی' },
      { id: 'انگیزشی', name: 'انگیزشی' },
      { id: 'تکنیک مطالعه', name: 'تکنیک مطالعه' },
      { id: 'تکنیک‌های تست‌زنی', name: 'تکنیک‌های تست‌زنی' },
      { id: 'مدیریت زمان', name: 'مدیریت زمان' },
      { id: 'روانشناسی', name: 'روانشناسی' },
      { id: 'برنامه‌ریزی', name: 'برنامه‌ریزی' },
      { id: 'روش مطالعه', name: 'روش مطالعه' },
      { id: 'آرامش روانی', name: 'آرامش روانی' },
    ];

    return Response.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return Response.json({ error: 'خطا در دریافت دسته‌بندی‌ها' }, { status: 500 });
  }
}

