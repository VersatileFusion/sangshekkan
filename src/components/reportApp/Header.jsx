import useUser from "@/utils/useUser";
import { BarChart3, LogOut, User } from "lucide-react";

export function Header() {
  const { data: authUser, loading: authLoading } = useUser();

  return (
    <div
      className="w-full py-8 mb-8"
      style={{
        background: "linear-gradient(135deg, #40E0D0 0%, #F8F8FF 100%)",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 font-vazirmatn">
            تهیه شده برای مشاور عزیز: خانم ملیکا سنگ‌شکن
          </h1>

          <div className="flex items-center gap-4">
            {authLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
            ) : authUser ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">خوش آمدید</p>
                  <p className="font-semibold text-gray-800">
                    {authUser.name}
                  </p>
                </div>
                <a
                  href="/dashboard"
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 flex items-center"
                >
                  <BarChart3 className="w-4 h-4 ml-2" />
                  داشبورد
                </a>
                <a
                  href="/account/logout"
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                >
                  <LogOut className="w-4 h-4 ml-2" />
                  خروج
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <a
                  href="/account/signin"
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 flex items-center"
                >
                  <User className="w-4 h-4 ml-2" />
                  ورود
                </a>
                <a
                  href="/account/signup"
                  className="bg-white text-teal-600 border border-teal-600 px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors flex items-center"
                >
                  ثبت‌نام
                </a>
              </div>
            )}
          </div>
        </div>

        {authUser && (
          <div className="text-center mt-4">
            <p className="text-gray-600">
              برای دسترسی به امکانات پیشرفته، به داشبورد خود مراجعه کنید
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
