"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { toPersianDate } from "@/utils/dateConverter";

export default function ProgressChart({ reports }) {
  const [chartType, setChartType] = useState("line");
  const [dateRange, setDateRange] = useState("month");

  const chartData = useMemo(() => {
    if (!reports || !reports.length) return [];

    let filteredReports = [...reports];

    if (dateRange !== "all") {
      const now = new Date();
      const days = dateRange === "week" ? 7 : 30;
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filteredReports = reports.filter(
        (report) => new Date(report.report_date) >= cutoffDate,
      );
    }

    const dataMap = {};
    filteredReports.forEach((report) => {
      const date = report.report_date;
      if (!dataMap[date]) {
        dataMap[date] = {
          date,
          persianDate: toPersianDate(date),
          study_hours: 0,
          test_count: 0,
          ghalamchi_score: null,
        };
      }
      dataMap[date].study_hours += report.study_duration / 60;
      dataMap[date].test_count += report.test_count;
      if (report.ghalamchi_score) {
        dataMap[date].ghalamchi_score = report.ghalamchi_score;
      }
    });

    return Object.values(dataMap).sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
  }, [reports, dateRange]);

  const ChartComponent = {
    line: LineChart,
    bar: BarChart,
    area: AreaChart,
  }[chartType];

  const ChartContent = () => {
    switch (chartType) {
      case "line":
        return (
          <>
            <Line
              type="monotone"
              dataKey="study_hours"
              stroke="#06b6d4"
              strokeWidth={3}
              dot={{ fill: "#06b6d4", strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8, fill: "#0891b2" }}
            />
            <Line
              type="monotone"
              dataKey="test_count"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ fill: "#f59e0b", strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8, fill: "#d97706" }}
            />
            {chartData.some((d) => d.ghalamchi_score) && (
              <Line
                type="monotone"
                dataKey="ghalamchi_score"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 5 }}
                activeDot={{ r: 8, fill: "#7c3aed" }}
              />
            )}
          </>
        );
      case "bar":
        return (
          <>
            <Bar dataKey="study_hours" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            <Bar dataKey="test_count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </>
        );
      case "area":
        return (
          <>
            <Area
              type="monotone"
              dataKey="study_hours"
              stackId="1"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="test_count"
              stackId="1"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.6}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="mb-6 lg:mb-0">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            📊 نمودار پیشرفت شخصی
            <span className="ml-2 text-xl">📈</span>
          </h2>
          <p className="text-gray-600">تاریخ‌ها به شمسی نمایش داده می‌شوند</p>
        </div>
        <div className="flex gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white shadow-sm"
          >
            <option value="week">📅 هفته اخیر</option>
            <option value="month">📅 ماه اخیر</option>
            <option value="all">📅 همه زمان‌ها</option>
          </select>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white shadow-sm"
          >
            <option value="line">📈 نمودار خطی</option>
            <option value="bar">📊 نمودار ستونی</option>
            <option value="area">🌊 نمودار مساحت</option>
          </select>
        </div>
      </div>

      <div className="h-96 bg-gradient-to-br from-gray-50 to-white rounded-xl p-4">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                هنوز داده‌ای برای نمایش وجود ندارد
              </p>
              <p className="text-gray-400 text-sm">
                گزارش‌های خود را ثبت کنید تا نمودار نمایش داده شود
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis
                dataKey="persianDate"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
              <Tooltip
                labelFormatter={(label) => `📅 ${label}`}
                formatter={(value, name) => [
                  typeof value === "number" ? value.toFixed(1) : value,
                  name === "study_hours"
                    ? "⏰ ساعت مطالعه"
                    : name === "test_count"
                      ? "📚 تعداد تست"
                      : "🏆 تراز قلمچی",
                ]}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
              />
              <ChartContent />
            </ChartComponent>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
