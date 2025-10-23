"use client";

import { useState, useMemo, lazy, Suspense } from "react";
import { TrendingUp } from "lucide-react";
import { toPersianDate } from "@/utils/dateConverter";

// Lazy load the heavy chart components
const LazyChart = lazy(() => import("./LazyChart"));

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

  // Loading component for charts
  const ChartLoading = () => (
    <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
        <p className="text-gray-600">در حال بارگذاری نمودار...</p>
      </div>
    </div>
  );

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
          <Suspense fallback={<ChartLoading />}>
            <LazyChart chartType={chartType} chartData={chartData} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
