"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Target,
  User,
  UserPlus,
  TrendingUp,
  Star,
  Clock,
  FileText,
  GraduationCap,
  MessageCircle,
  Phone,
  Calendar,
  Users,
  Trophy,
  BookOpen,
} from "lucide-react";
import useUser from "@/utils/useUser";
import AdvancedNavigation from "@/components/Navigation/AdvancedNavigation";

export default function HomePage() {
  const { data: authUser, loading: authLoading } = useUser();

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Show home page for all users (authenticated users should now stay on home page)
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
      {/* Advanced Navigation */}
      <AdvancedNavigation currentPage="/" />

      {/* Advisor Profile Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-2xl p-8 text-white text-center">
          <div className="max-w-4xl mx-auto">
            {/* Profile Image */}
            <div className="mb-6">
              <div className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img
                  src="https://ucarecdn.com/cd33498e-dc04-4065-a5c2-f500ca714ae2/-/format/auto/"
                  alt="خانم ملیکا سنگ‌شکن - مشاور تحصیلی"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Name and Title */}
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              خانم ملیکا سنگ‌شکن
            </h2>
            <div className="text-xl md:text-2xl font-semibold mb-6 text-cyan-100">
              مشاور تحصیلی و راهنمای موفقیت
            </div>

            {/* Description */}
            <div className="max-w-3xl mx-auto">
              <p className="text-lg md:text-xl leading-relaxed mb-4 text-cyan-50">
                خانم سنگ‌شکن با دانش تخصصی و رویکرد نوین در آموزش، راهنمای مطمئن
                شما در مسیر کسب موفقیت و دستیابی به بالاترین رتبه‌های تحصیلی است.
              </p>
              <p className="text-base md:text-lg text-cyan-100">
                ⭐ راهنمایی تخصصی در برنامه‌ریزی مطالعه
                <span className="mx-4">•</span>📊 پیگیری دقیق پیشرفت تحصیلی
                <span className="mx-4">•</span>🎯 تنظیم اهداف و نقشه راه شخصی
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
            سامانه گزارش‌گیری مطالعه
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            پیگیری پیشرفت تحصیلی دانش‌آموزان با نظارت مستقیم مشاور
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center mb-12">
            <a
              href="/account/signin"
              className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-8 py-4 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 flex items-center justify-center text-lg font-semibold shadow-lg"
            >
              <User className="w-6 h-6 ml-2" />
              ورود به سیستم
            </a>
            <a
              href="/student-dashboard"
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center text-lg font-semibold shadow-lg"
            >
              <GraduationCap className="w-6 h-6 ml-2" />
              داشبورد دانش‌آموز
            </a>
            <a
              href="/account/signup"
              className="bg-white text-teal-600 border-2 border-teal-600 px-8 py-4 rounded-lg hover:bg-teal-50 transition-all duration-200 flex items-center justify-center text-lg font-semibold shadow-lg"
            >
              <UserPlus className="w-6 h-6 ml-2" />
              ثبت‌نام
            </a>
          </div>
        </div>
      </div>

      {/* Contact and Management Panels */}
      <div className="container mx-auto px-4 py-8">
        {/* Main Contact Panels */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
            ارتباط مستقیم با مشاور
          </h2>

          <div className="max-w-4xl mx-auto">
            <p className="text-center text-gray-600 mb-8">
              برای دریافت مشاوره تخصصی، راهنمایی در برنامه‌ریزی مطالعه یا هرگونه
              سوال، از طریق راه‌های زیر با خانم مشاور در ارتباط باشید:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
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

            <a
              href="/challenges"
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white text-center hover:from-yellow-600 hover:to-yellow-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-center mb-3">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">چالش‌های مطالعاتی</h3>
              <p className="text-yellow-100 text-sm mb-3">
                ایجاد انگیزه و رقابت سالم
              </p>
              <div className="text-xs bg-white bg-opacity-20 rounded-lg py-2 px-3">
                🏆 آماده!
              </div>
            </a>

            <a
              href="/chat"
              className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white text-center hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-center mb-3">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">پنل گفت‌وگو</h3>
              <p className="text-blue-100 text-sm mb-3">
                ارتباط با رتبه‌برترها و خانواده‌ها
              </p>
              <div className="text-xs bg-white bg-opacity-20 rounded-lg py-2 px-3">
                💬 فعال
              </div>
            </a>

            <a
              href="/videos"
              className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white text-center hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-center mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">ویدیوهای آموزشی</h3>
              <p className="text-red-100 text-sm mb-3">
                انگیزشی و آموزشی برای موفقیت
              </p>
              <div className="text-xs bg-white bg-opacity-20 rounded-lg py-2 px-3">
                🎬 جدید
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          ویژگی‌های سیستم
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              داشبورد پیشرفته
            </h3>
            <p className="text-gray-600">
              نمودارهای تعاملی و آمار کامل پیشرفت تحصیلی
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">نقشه‌ی راه</h3>
            <p className="text-gray-600">
              تعیین اهداف و ردیابی نقاط عطف مسیر تحصیلی
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              بازخورد مشاور
            </h3>
            <p className="text-gray-600">
              دریافت راهنمایی و بازخورد مستقیم از مشاور
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              ثبت گزارش روزانه
            </h3>
            <p className="text-gray-600">
              ثبت ساعات مطالعه، تست‌ها و تراز قلمچی
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              تحلیل پیشرفت
            </h3>
            <p className="text-gray-600">
              نمودارهای زمانی و تحلیل عملکرد بر اساس درس
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              سیستم اعلانات
            </h3>
            <p className="text-gray-600">
              اطلاع‌رسانی فوری برای بازخوردها و تغییرات
            </p>
          </div>
        </div>
      </div>

      {/* About Section - آمارها حذف شده */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            درباره سامانه
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            این سامانه برای کمک به دانش‌آموزان و مشاوران در پیگیری دقیق پیشرفت
            تحصیلی طراحی شده است. با ابزارهای پیشرفته آمارگیری و گزارش‌گیری، مسیر
            موفقیت را برای هر دانش‌آموز تسهیل می‌کند.
          </p>

          <div className="text-center">
            <p className="text-gray-600">
              سیستم جدید و آماده پذیرش دانش‌آموزان عزیز
            </p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl shadow-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-8">آماده برای شروع؟</h2>
          <p className="text-xl mb-8 opacity-90">
            همین حالا به سیستم بپیوندید و مسیر موفقیت خود را آغاز کنید
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/account/signup"
              className="bg-white text-teal-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-all duration-200 flex items-center justify-center text-lg font-semibold shadow-lg"
            >
              <UserPlus className="w-6 h-6 ml-2" />
              ثبت‌نام رایگان
            </a>
            <a
              href="/account/signin"
              className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-teal-600 transition-all duration-200 flex items-center justify-center text-lg font-semibold"
            >
              <User className="w-6 h-6 ml-2" />
              ورود
            </a>
          </div>
        </div>
      </div>

      {/* Response Hours - Footer */}
      <div className="container mx-auto px-4 pb-16">
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

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg flex items-center justify-center ml-2">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">سامانه مطالعه</span>
          </div>
          <p className="text-gray-400 mb-4">
            پیگیری پیشرفت تحصیلی دانش‌آموزان با نظارت مستقیم مشاور
          </p>
          <div className="text-sm text-gray-500">
            © 2025 سامانه گزارش‌گیری مطالعه. تمامی حقوق محفوظ است.
          </div>
        </div>
      </footer>

    </div>
  );
}
