import {
  FileText,
  Target,
  Clock,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

const statItemsConfig = [
    { Icon: FileText, label: "کل گزارش‌ها", key: "totalReports", iconColor: "text-blue-500", textColor: "text-blue-600" },
    { Icon: Target, label: "کل تست‌ها", key: "totalTests", iconColor: "text-green-500", textColor: "text-green-600" },
    { Icon: Clock, label: "کل ساعات", key: "totalHours", iconColor: "text-purple-500", textColor: "text-purple-600" },
    { Icon: Calendar, label: "گزارش امروز", key: "todayReports", iconColor: "text-pink-500", textColor: "text-pink-600" },
    { Icon: TrendingUp, label: "گزارش هفتگی", key: "weeklyReports", iconColor: "text-indigo-500", textColor: "text-indigo-600" },
    { Icon: AlertCircle, label: "در انتظار", key: "pendingReports", iconColor: "text-yellow-500", textColor: "text-yellow-600" },
    { Icon: CheckCircle, label: "تایید شده", key: "approvedReports", iconColor: "text-green-500", textColor: "text-green-600" },
    { Icon: XCircle, label: "رد شده", key: "rejectedReports", iconColor: "text-red-500", textColor: "text-red-600" },
  ];

export function OverallStatistics({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
      {statItemsConfig.map(({ Icon, label, key, iconColor, textColor }) => (
        <div key={key} className="bg-white rounded-xl shadow-lg p-4 text-center">
          <Icon className={`w-6 h-6 ${iconColor} mx-auto mb-2`} />
          <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
          <p className={`text-xl font-bold ${textColor}`}>{stats[key]}</p>
        </div>
      ))}
    </div>
  );
}
