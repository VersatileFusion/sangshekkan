import { FileText, BookOpen, Clock, Award } from "lucide-react";

export default function StatsCards({
  reportsCount = 0,
  totalTests = 0,
  totalHours = 0,
  avgGhalamchiScore = 0,
}) {
  const stats = [
    {
      label: "گزارش ثبت شده",
      value: reportsCount || 0,
      Icon: FileText,
      gradient: "from-blue-500 to-purple-500",
    },
    {
      label: "تست حل شده",
      value: totalTests || 0,
      Icon: BookOpen,
      gradient: "from-green-500 to-teal-500",
    },
    {
      label: "ساعت مطالعه",
      value: totalHours || 0,
      Icon: Clock,
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      label: "متوسط تراز قلمچی",
      value: avgGhalamchiScore || "-",
      Icon: Award,
      gradient: "from-pink-500 to-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl shadow-lg p-6 text-center"
        >
          <div
            className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-full flex items-center justify-center mx-auto mb-3`}
          >
            <stat.Icon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
          <p className="text-gray-600">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
