import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toPersianDate } from "@/utils/dateConverter";

export function WeeklyChart({ chartData }) {
  // Convert dates to Persian
  const persianChartData = chartData.map((item) => ({
    ...item,
    persianDate: toPersianDate(item.date),
    originalDate: item.date,
  }));

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
        <BarChart3 className="w-6 h-6 ml-2 text-teal-600" />
        نمودار تست‌های هفتگی
      </h2>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={persianChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="persianDate"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
            />
            <YAxis />
            <Tooltip
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return `تاریخ: ${label}`;
                }
                return `تاریخ: ${label}`;
              }}
              formatter={(value, name) => [value, "تعداد تست"]}
            />
            <Bar dataKey="tests" fill="#40E0D0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
