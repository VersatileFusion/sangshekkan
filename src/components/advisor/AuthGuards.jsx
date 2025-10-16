import { User, AlertCircle } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-gray-600">در حال بارگذاری...</p>
      </div>
    </div>
  );
}

export function AuthRedirect() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
      <div className="text-center">
        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          ورود به سیستم لازم است
        </h2>
        <p className="text-gray-600 mb-4">
          برای دسترسی به پنل مشاور، لطفاً وارد شوید
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

export function RolePermission() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">دسترسی محدود</h2>
        <p className="text-gray-600 mb-4">
          این بخش فقط برای مشاوران در دسترس است
        </p>
        <a
          href="/"
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          بازگشت به صفحه اصلی
        </a>
      </div>
    </div>
  );
}
