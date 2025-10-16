export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">تماس با ما</h1>
          <p className="text-gray-600">پیام خود را برای مدیریت ارسال کنید</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-700 leading-7">
            برای ارتباط سریع با مدیریت، از یکی از روش‌های زیر استفاده کنید:
          </p>
          <ul className="list-disc pr-6 mt-3 space-y-2 text-gray-700">
            <li>
              از طریق بخش <a className="text-teal-600 hover:underline" href="/admin/messages">مدیریت پیام‌ها</a>
              
              در پنل ادمین (برای مدیران)
            </li>
            <li>پیام درون‌سیستمی از صفحه پروفایل دانش‌آموز</li>
            <li>تماس تلفنی با شماره درج‌شده در صفحه پروفایل ادمین</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

