import { BarChart3, TrendingUp } from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { toPersianDate } from "@/utils/dateConverter";

function DailyProgressChart({ data }) {
  // Convert dates to Persian
  const persianData = data.map((item) => ({
    ...item,
    persianDate: toPersianDate(item.date),
    originalDate: item.date,
  }));

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
        <TrendingUp className="w-6 h-6 ml-2 text-teal-600" />
        پیشرفت روزانه (۲ هفته اخیر)
      </h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={persianData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="persianDate"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
            />
            <YAxis />
            <Tooltip
              labelFormatter={(label) => `تاریخ: ${label}`}
              formatter={(value, name) => [
                value,
                name === "tests" ? "تعداد تست" : "ساعت مطالعه",
              ]}
            />
            <Line
              type="monotone"
              dataKey="tests"
              stroke="#40E0D0"
              strokeWidth={2}
              name="تعداد تست"
            />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#FF6B6B"
              strokeWidth={2}
              name="ساعت مطالعه"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatusDistributionChart({ data }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
        <BarChart3 className="w-6 h-6 ml-2 text-teal-600" />
        توزیع وضعیت گزارش‌ها
      </h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ChartsSection({ dailyProgressData, statusDistribution }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <DailyProgressChart data={dailyProgressData} />
      <StatusDistributionChart data={statusDistribution} />
    </div>
  );
}
