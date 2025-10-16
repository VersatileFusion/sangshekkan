import { User, BarChart3 } from "lucide-react";

export function AdvisorProfile() {
  return (
    <div className="container mx-auto px-4 mb-8">
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                src="https://ucarecdn.com/84dec45e-100e-454f-ba2e-30f2ad7e71c9/-/format/auto/"
                alt="خانم ملیکا سنگ شکن - مشاور تحصیلی"
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover shadow-lg border-4 border-teal-100"
              />
              <div className="absolute bottom-2 right-2 bg-green-500 rounded-full w-6 h-6 border-2 border-white flex items-center justify-center">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-right">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              خانم ملیکا سنگ‌شکن
            </h2>
            <p className="text-lg text-teal-600 font-semibold mb-3">
              مشاور تحصیلی و تکنیکی مطالعه
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              با سالها تجربه در زمینه مشاوره تحصیلی، آماده راهنمایی شما عزیزان
              در مسیر موفقیت تحصیلی هستم. این سامانه گزارش‌گیری برای پیگیری
              بهتر پیشرفت شما طراحی شده است.
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center text-gray-600">
                <User className="w-5 h-5 ml-2 text-teal-500" />
                <span>مشاور تخصصی</span>
              </div>
              <div className="flex items-center text-gray-600">
                <BarChart3 className="w-5 h-5 ml-2 text-teal-500" />
                <span>تحلیلگر عملکرد</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
