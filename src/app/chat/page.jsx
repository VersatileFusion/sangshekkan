"use client";

import { useState } from "react";
import { MessageCircle, User, Home } from "lucide-react";
import useUser from "@/utils/useUser";
import AdvancedNavigation from "@/components/Navigation/AdvancedNavigation";
import PublicChat from "@/components/chat/PublicChat";
import PrivateChat from "@/components/chat/PrivateChat";

export default function ChatPage() {
  const { data: authUser, loading: authLoading } = useUser();
  const [activeTab, setActiveTab] = useState("public"); // public | private

  // Define breadcrumbs
  const breadcrumbs = [{ name: "پنل گفت‌وگو", href: null }];

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

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            ورود به سیستم لازم است
          </h2>
          <p className="text-gray-600 mb-4">
            برای دسترسی به پنل گفت‌وگو، لطفاً وارد شوید
          </p>
          <a
            href="/account/signin"
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            ورود به سیستم
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
      {/* Advanced Navigation */}
      <AdvancedNavigation currentPage="/chat" breadcrumbs={breadcrumbs} />

      <div className="container mx-auto px-4 pb-8 pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">پنل گفت‌وگو</h1>
          <p className="text-gray-600">
            چت عمومی و گفتگوی خصوصی با مشاور
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 justify-center">
          <button
            onClick={() => setActiveTab("public")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeTab === "public"
                ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            گفت‌وگو عمومی
          </button>
          
          <button
            onClick={() => setActiveTab("private")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeTab === "private"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Home className="w-5 h-5" />
            پیام به مشاور
          </button>
        </div>

        {/* Chat Components */}
        <div className="max-w-4xl mx-auto" style={{ height: '600px' }}>
          {activeTab === "public" && <PublicChat />}
          {activeTab === "private" && <PrivateChat />}
        </div>

        {/* Guidelines */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8 max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
            راهنمای استفاده
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg">
              <MessageCircle className="w-8 h-8 text-teal-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">گفت‌وگو عمومی</h3>
              <p className="text-sm text-gray-600">
                سوالات درسی و تجربیات مطالعاتی را با سایر دانش‌آموزان به اشتراک بگذارید.
                پیام‌های شامل کلمات نامناسب ارسال نمی‌شوند.
              </p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <Home className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">پیام خصوصی به مشاور</h3>
              <p className="text-sm text-gray-600">
                برای مسائل شخصی، دغدغه‌ها و سوالات خصوصی، می‌توانید مستقیماً با مشاور در ارتباط باشید.
                این پیام‌ها محرمانه هستند.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 text-center">
              ⚠️ <strong>توجه:</strong> حداکثر ۵ پیام در دقیقه می‌توانید ارسال کنید. 
              از کلمات محترمانه استفاده کنید.
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
