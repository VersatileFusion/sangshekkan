import {
  MessageCircle,
  Phone,
  Calendar,
  User,
  Target,
  Users,
  Trophy,
  BookOpen,
  BarChart3,
} from "lucide-react";

export function ContactSection() {
  return (
    <div className="space-y-8">
      {/* Header Section for Advisor */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl shadow-lg p-6 text-white text-center">
        <h1 className="text-2xl font-bold mb-4">خانم ملیکا سنگ‌شکن</h1>

        {/* Advisor Profile */}
        <div className="max-w-md mx-auto">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <img
              src="https://ucarecdn.com/21f29fe9-828c-4460-bed5-bdce688cdf85/-/format/auto/"
              alt="خانم ملیکا سنگ‌شکن - مشاور تحصیلی"
              className="w-full h-full object-cover"
            />
          </div>

          <h2 className="text-2xl font-bold mb-2">خانم ملیکا سنگ‌شکن</h2>
          <p className="text-lg opacity-90 mb-4">مشاور تحصیلی</p>

          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="text-sm opacity-90">
              آماده راهنمایی دانش‌آموزان در مسیر موفقیت تحصیلی
            </p>
          </div>
        </div>
      </div>

      {/* Main Contact Panels */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          ارتباط مستقیم با مشاور
        </h2>

        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600 mb-8">
            برای دریافت مشاوره تخصصی، راهنمایی در برنامه‌ریزی مطالعه یا هرگونه
            سوال، از طریق راه‌های زیر با خانم مشاور در ارتباط باشید:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <a
              href={`https://wa.me/989900314740?text=${encodeURIComponent("سلام خانم ملیکا سنگ‌شکن، من یکی از شاگردان شما هستم و سوالی دارم.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white text-center hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                <div className="flex items-center justify-center mb-3">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold mb-2">پیام واتساپ</h3>
                <p className="text-green-100 text-sm mb-3">
                  ارسال پیام سریع و دریافت پاسخ فوری
                </p>
                <div className="text-sm bg-white bg-opacity-20 rounded-lg py-2 px-4">
                  📱 09900314740
                </div>
              </div>
            </a>

            <a href="tel:+989900314740" className="group block">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white text-center hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                <div className="flex items-center justify-center mb-3">
                  <Phone className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold mb-2">تماس تلفنی</h3>
                <p className="text-blue-100 text-sm mb-3">
                  گفتگوی مستقیم و مشاوره تلفنی
                </p>
                <div className="text-sm bg-white bg-opacity-20 rounded-lg py-2 px-4">
                  📞 09900314740
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Management Panels */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          پنل‌های مدیریت و نظارت
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a href="/roadmap" className="group block">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-6 text-white text-center hover:from-indigo-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-center mb-3">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">نقشه‌ی راه مطالعاتی</h3>
              <p className="text-indigo-100 text-sm mb-3">
                برنامه‌ریزی و پیگیری اهداف تحصیلی
              </p>
              <div className="text-xs bg-white bg-opacity-20 rounded-lg py-2 px-3">
                📍 تعیین نقاط هدف
              </div>
            </div>
          </a>

          <a href="/advisor-enhanced" className="group block">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white text-center hover:from-purple-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-center mb-3">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">پنل مشاور پیشرفته</h3>
              <p className="text-purple-100 text-sm mb-3">
                نظارت کامل و تحلیل عملکرد دانش‌آموزان
              </p>
              <div className="text-xs bg-white bg-opacity-20 rounded-lg py-2 px-3">
                🔐 ویژه مشاور
              </div>
            </div>
          </a>

          <a href="/advisor" className="group block">
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-6 text-white text-center hover:from-pink-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-center mb-3">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">پنل نظارت همگانی</h3>
              <p className="text-pink-100 text-sm mb-3">
                مدیریت گزارش‌ها و بازخوردها
              </p>
              <div className="text-xs bg-white bg-opacity-20 rounded-lg py-2 px-3">
                📊 آمار و گزارش
              </div>
            </div>
          </a>

          <a href="/dashboard" className="group block">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white text-center hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-center mb-3">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">داشبورد عمومی</h3>
              <p className="text-orange-100 text-sm mb-3">
                نمای کلی از وضعیت سیستم
              </p>
              <div className="text-xs bg-white bg-opacity-20 rounded-lg py-2 px-3">
                📈 آمار کلی
              </div>
            </div>
          </a>

          <a href="/student-dashboard" className="group block">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white text-center hover:from-emerald-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-center mb-3">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">داشبورد دانش‌آموز</h3>
              <p className="text-emerald-100 text-sm mb-3">
                نمای دانش‌آموزی از سیستم
              </p>
              <div className="text-xs bg-white bg-opacity-20 rounded-lg py-2 px-3">
                🎓 ویژه دانش‌آموزان
              </div>
            </div>
          </a>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white text-center">
            <div className="flex items-center justify-center mb-3">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold mb-2">چالش‌های مطالعاتی</h3>
            <p className="text-yellow-100 text-sm mb-3">
              ایجاد انگیزه و رقابت سالم
            </p>
            <div className="text-xs bg-white bg-opacity-20 rounded-lg py-2 px-3">
              🏆 به زودی
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-200 p-6">
        <h3 className="text-lg font-bold text-teal-800 mb-4 text-center">
          نکات مهم برای مشاوره
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4 border-r-4 border-teal-500">
            <h4 className="font-semibold text-teal-700 mb-2">
              💡 آماده‌سازی قبل از مشاوره
            </h4>
            <p className="text-gray-600">
              قبل از تماس، سوالات خود را یادداشت کنید تا بیشترین بهره را از
              مشاوره ببرید.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border-r-4 border-cyan-500">
            <h4 className="font-semibold text-cyan-700 mb-2">
              📱 بهترین روش ارتباط
            </h4>
            <p className="text-gray-600">
              برای سوالات فوری از واتساپ و برای مشاوره‌های تخصصی از تماس تلفنی
              استفاده کنید.
            </p>
          </div>
        </div>
      </div>

      {/* Response Hours - Footer */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-lg p-6 text-white text-center">
        <h3 className="text-xl font-bold mb-4 flex items-center justify-center">
          <Calendar className="w-6 h-6 ml-2" />
          ساعات پاسخگویی خانم مشاور
        </h3>

        <div className="max-w-md mx-auto">
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <div className="text-lg font-semibold mb-3 text-yellow-300">
              🕕 تمام روزهای هفته: ۶ عصر تا ۱۰ شب
            </div>

            <div className="text-sm text-gray-300 space-y-1">
              <p>📅 شنبه تا جمعه: ۱۸:۰۰ - ۲۲:۰۰</p>
              <p>🌟 پاسخگویی منظم و دقیق</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            ✨ آماده پاسخگویی به سوالات و راهنمایی شما دانش‌آموزان عزیز هستم
          </p>
        </div>
      </div>
    </div>
  );
}
