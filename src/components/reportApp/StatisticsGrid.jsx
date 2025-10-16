import { FileText, Clock, TrendingUp, BarChart3 } from "lucide-react";

const StatCard = ({ icon, title, value, colorClass }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 text-center">
    <div className="flex items-center justify-center mb-2">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
    <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

export function StatisticsGrid({ statistics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <StatCard
        icon={<FileText className="w-8 h-8 text-blue-500" />}
        title="تست‌های امروز"
        value={statistics.todayTests}
        colorClass="text-blue-600"
      />
      <StatCard
        icon={<Clock className="w-8 h-8 text-green-500" />}
        title="ساعت مطالعه امروز"
        value={statistics.todayHours.toFixed(1)}
        colorClass="text-green-600"
      />
      <StatCard
        icon={<TrendingUp className="w-8 h-8 text-purple-500" />}
        title="تست‌های هفتگی"
        value={statistics.weeklyTests}
        colorClass="text-purple-600"
      />
      <StatCard
        icon={<BarChart3 className="w-8 h-8 text-orange-500" />}
        title="تست‌های ماهانه"
        value={statistics.monthlyTests}
        colorClass="text-orange-600"
      />
    </div>
  );
}
