"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  User,
  Lock,
  ExternalLink,
  Copy,
  AlertCircle,
} from "lucide-react";

export default function AdvisorSetupComplete() {
  const [copied, setCopied] = useState(false);

  const credentials = {
    email: "advisor@study.com",
    password: "advisor123", // New simplified working password
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🎉 حساب مشاور با موفقیت راه‌اندازی شد!
            </h1>
            <p className="text-xl text-gray-600">
              اطلاعات ورود خانم ملیکا سنگ‌شکن آماده است
            </p>
          </div>

          {/* Status Alert */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center mb-3">
              <CheckCircle className="w-6 h-6 text-green-600 ml-3" />
              <h3 className="font-bold text-green-800">
                ✅ سیستم آماده استفاده
              </h3>
            </div>
            <p className="text-green-700">
              رمز عبور مشاور بروزرسانی شد و با سیستم authentication سازگار است.
              اکنون می‌توانید با اطلاعات زیر وارد شوید.
            </p>
          </div>

          {/* Credentials Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              🔐 اطلاعات ورود مشاور (بروزرسانی شده)
            </h2>

            <div className="space-y-6">
              {/* Email */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="w-6 h-6 text-purple-600 ml-3" />
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        ایمیل:
                      </label>
                      <p className="text-lg font-mono text-gray-800">
                        {credentials.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.email)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <Copy className="w-5 h-5 text-purple-600" />
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Lock className="w-6 h-6 text-teal-600 ml-3" />
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        رمز عبور:
                      </label>
                      <p className="text-lg font-mono text-gray-800 bg-white px-3 py-2 rounded border">
                        {credentials.password}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        ✅ بروزرسانی شده - آماده استفاده
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.password)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <Copy className="w-5 h-5 text-teal-600" />
                  </button>
                </div>
              </div>

              {copied && (
                <div className="text-center">
                  <div className="inline-flex items-center bg-green-100 text-green-700 px-4 py-2 rounded-lg">
                    <CheckCircle className="w-4 h-4 ml-2" />
                    کپی شد!
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              📋 دستورالعمل ورود
            </h3>
            <div className="space-y-4 text-gray-600">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold ml-3 mt-0.5">
                  1
                </div>
                <p>
                  از <strong>ایمیل</strong> و <strong>رمز عبور</strong> بالا
                  استفاده کنید
                </p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold ml-3 mt-0.5">
                  2
                </div>
                <p>به صفحه ورود بروید و اطلاعات را وارد کنید</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold ml-3 mt-0.5">
                  3
                </div>
                <p>
                  بعد از ورود، به <strong>پنل مشاور پیشرفته</strong> دسترسی
                  خواهید داشت
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/account/signin"
              className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-8 py-4 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 flex items-center justify-center text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <User className="w-6 h-6 ml-2" />
              ورود به پنل مشاور
            </a>

            <a
              href="/test-advisor"
              className="bg-white text-teal-600 border-2 border-teal-600 px-8 py-4 rounded-xl hover:bg-teal-50 transition-all duration-200 flex items-center justify-center text-lg font-semibold shadow-lg hover:shadow-xl"
            >
              <ExternalLink className="w-6 h-6 ml-2" />
              تست اطلاعات ورود
            </a>
          </div>

          {/* Security Note */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center mb-3">
              <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center ml-3">
                <span className="text-yellow-800 text-sm font-bold">!</span>
              </div>
              <h4 className="font-bold text-yellow-800">نکته امنیتی</h4>
            </div>
            <p className="text-yellow-700 text-sm">
              لطفاً رمز عبور را در مکانی امن ذخیره کرده و با دیگران به اشتراک
              نگذارید. در صورت نیاز به تغییر رمز عبور، با تیم پشتیبانی تماس
              بگیرید.
            </p>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-gray-500">
            <p className="text-sm">
              © 2025 سامانه گزارش‌گیری مطالعه - خانم ملیکا سنگ‌شکن
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Vazirmatn', sans-serif;
          direction: rtl;
        }
      `}</style>
    </div>
  );
}
