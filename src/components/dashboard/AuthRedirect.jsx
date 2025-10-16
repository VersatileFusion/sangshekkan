"use client";

import { GraduationCap } from "lucide-react";
import AdvancedNavigation from "@/components/Navigation/AdvancedNavigation";

export default function AuthRedirect() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
      <AdvancedNavigation currentPage="/student-dashboard" />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              داشبورد دانش‌آموز
            </h1>
            <p className="text-gray-600 mb-8">
              برای دسترسی به داشبورد، ابتدا ثبت‌نام کنید یا وارد شوید
            </p>

            <div className="space-y-4">
              <a
                href="/account/signup"
                className="w-full block text-center bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200"
              >
                ثبت‌نام
              </a>

              <a
                href="/account/signin"
                className="w-full block text-center bg-gray-100 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-200 transition-all duration-200"
              >
                ورود به حساب کاربری
              </a>
            </div>
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
