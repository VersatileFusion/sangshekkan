"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Users,
  BarChart3,
  TrendingUp,
  Clock,
  FileText,
  Download,
  Filter,
  Calendar,
  Award,
  Target,
  BookOpen,
  User,
  Shield,
} from "lucide-react";
import {
  BarChart,
  Bar,
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
import useUser from "@/utils/useUser";

export default function AdvisorPanel() {
  const { data: authUser, loading: authLoading } = useUser();
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch reports from API
  useEffect(() => {
    const fetchReports = async () => {
      if (!authUser) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/advisor/reports');
        if (response.ok) {
          const data = await response.json();
          setReports(data.reports || []);
        } else {
          console.error('Failed to fetch reports');
          setReports([]);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [authUser]);

  // Convert Gregorian date to Persian
  const toPersianDate = (date) => {
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      calendar: "persian",
      numberingSystem: "latn",
    };
    return new Date(date).toLocaleDateString("fa-IR", options);
  };

  // Get unique subjects for filter
  const uniqueSubjects = useMemo(() => {
    const subjects = [...new Set(reports.map((report) => report.subject))];
    return subjects.filter(Boolean);
  }, [reports]);

  // Get unique dates for filter
  const uniqueDates = useMemo(() => {
    const dates = [...new Set(reports.map((report) => report.report_date))];
    return dates.filter(Boolean).sort().reverse();
  }, [reports]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalReports = reports.length;
    const totalTests = reports.reduce(
      (sum, report) => sum + parseInt(report.test_count || 0),
      0,
    );
    const totalHours = reports.reduce(
      (sum, report) => sum + parseFloat(report.study_duration || 0),
      0,
    ) / 60;

    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const todayReports = reports.filter(
      (report) => report.report_date === todayString,
    );

    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyReports = reports.filter((report) => {
      const reportDate = new Date(report.report_date);
      return reportDate >= oneWeekAgo;
    });

    return {
      totalReports,
      totalTests,
      totalHours: totalHours.toFixed(1),
      todayReports: todayReports.length,
      weeklyReports: weeklyReports.length,
      averageTestsPerReport:
        totalReports > 0 ? (totalTests / totalReports).toFixed(1) : 0,
      averageHoursPerReport:
        totalReports > 0 ? (totalHours / totalReports).toFixed(1) : 0,
    };
  }, [reports]);

  // Subject performance analysis
  const subjectAnalysis = useMemo(() => {
    const analysis = {};
    reports.forEach((report) => {
      if (!analysis[report.subject]) {
        analysis[report.subject] = {
          totalTests: 0,
          totalHours: 0,
          reportCount: 0,
          sources: new Set(),
        };
      }
      analysis[report.subject].totalTests += parseInt(report.test_count || 0);
      analysis[report.subject].totalHours +=
        parseFloat(report.study_duration || 0) / 60;
      analysis[report.subject].reportCount += 1;
      analysis[report.subject].sources.add(report.test_source);
    });

    return Object.entries(analysis)
      .map(([subject, data]) => ({
        subject,
        totalTests: data.totalTests,
        totalHours: data.totalHours.toFixed(1),
        reportCount: data.reportCount,
        avgTestsPerReport: (data.totalTests / data.reportCount).toFixed(1),
        avgHoursPerReport: (data.totalHours / data.reportCount).toFixed(1),
        uniqueSources: data.sources.size,
        efficiency: (data.totalTests / data.totalHours || 0).toFixed(1),
      }))
      .sort((a, b) => b.totalTests - a.totalTests);
  }, [reports]);

  // Daily progress chart data
  const dailyProgressData = useMemo(() => {
    const dailyData = {};
    reports.forEach((report) => {
      const date = report.report_date;
      if (!dailyData[date]) {
        dailyData[date] = { date, tests: 0, hours: 0, reports: 0 };
      }
      dailyData[date].tests += parseInt(report.test_count || 0);
      dailyData[date].hours += parseFloat(report.study_duration || 0) / 60;
      dailyData[date].reports += 1;
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-14); // Last 14 days
  }, [reports]);

  // Subject distribution for pie chart
  const subjectDistribution = useMemo(() => {
    const distribution = {};
    reports.forEach((report) => {
      distribution[report.subject] =
        (distribution[report.subject] || 0) + parseInt(report.test_count || 0);
    });

    const colors = [
      "#40E0D0",
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FCEA2B",
      "#FF9FF3",
      "#F38BA8",
    ];

    return Object.entries(distribution).map(([subject, tests], index) => ({
      name: subject,
      value: tests,
      fill: colors[index % colors.length],
    }));
  }, [reports]);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort reports
  const filteredAndSortedReports = useMemo(() => {
    let filtered = reports.filter((report) => {
      const matchesSearch = Object.values(report).some((value) =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      );
      const matchesSubject = !filterSubject || report.subject === filterSubject;
      const matchesDate = !filterDate || report.report_date === filterDate;

      return matchesSearch && matchesSubject && matchesDate;
    });

    if (sortField) {
      filtered.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        if (sortField === "test_count" || sortField === "study_duration") {
          aVal = parseFloat(aVal);
          bVal = parseFloat(bVal);
        }

        if (sortDirection === "asc") {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    return filtered;
  }, [
    reports,
    searchTerm,
    filterSubject,
    filterDate,
    sortField,
    sortDirection,
  ]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "تاریخ",
      "درس",
      "منبع تست",
      "تعداد تست",
      "زمان مطالعه (دقیقه)",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredAndSortedReports.map((report) =>
        [
          report.report_date,
          report.subject,
          report.test_source,
          report.test_count,
          report.study_duration,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `گزارش_مطالعه_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 text-gray-400 mx-auto mb-4">👤</div>
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

  // Role check
  if (authUser.email !== "advisor@study.com") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 text-red-400 mx-auto mb-4">🚫</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">دسترسی محدود</h2>
          <p className="text-gray-600 mb-4">این بخش مخصوص مشاور سیستم است</p>
          <a
            href="/dashboard"
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            بازگشت به داشبورد
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)",
      }}
    >
      {/* Header */}
      <div
        className="w-full py-8 mb-8"
        style={{
          background: "linear-gradient(135deg, #40E0D0 0%, #F8F8FF 100%)",
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 font-vazirmatn">
              پنل نظارت همگانی مشاور
            </h1>
            <a
              href="/account/logout"
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              خروج
            </a>
          </div>
          <p className="text-gray-600 mt-2 text-center">
            خانم ملیکا سنگ‌شکن - پنل تحلیل و نظارت بر عملکرد دانش‌آموزان
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        {/* Overall Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <FileText className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-700">کل گزارش‌ها</h3>
            <p className="text-xl font-bold text-blue-600">
              {overallStats.totalReports}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-700">کل تست‌ها</h3>
            <p className="text-xl font-bold text-green-600">
              {overallStats.totalTests}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-700">کل ساعات</h3>
            <p className="text-xl font-bold text-purple-600">
              {overallStats.totalHours}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <Calendar className="w-6 h-6 text-pink-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-700">گزارش امروز</h3>
            <p className="text-xl font-bold text-pink-600">
              {overallStats.todayReports}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <TrendingUp className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-700">گزارش هفتگی</h3>
            <p className="text-xl font-bold text-indigo-600">
              {overallStats.weeklyReports}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <Award className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-700">میانگین تست</h3>
            <p className="text-xl font-bold text-yellow-600">
              {overallStats.averageTestsPerReport}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <BookOpen className="w-6 h-6 text-teal-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-700">
              میانگین ساعت
            </h3>
            <p className="text-xl font-bold text-teal-600">
              {overallStats.averageHoursPerReport}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Progress Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 ml-2 text-teal-600" />
              پیشرفت روزانه (۲ هفته اخیر)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
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

          {/* Subject Distribution Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <BarChart3 className="w-6 h-6 ml-2 text-teal-600" />
              توزیع تست‌ها بر اساس درس
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {subjectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Subject Analysis Table */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 ml-2 text-teal-600" />
            تحلیل عملکرد بر اساس درس
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-right p-3 font-semibold text-gray-700">
                    درس
                  </th>
                  <th className="text-right p-3 font-semibold text-gray-700">
                    کل تست‌ها
                  </th>
                  <th className="text-right p-3 font-semibold text-gray-700">
                    کل ساعات
                  </th>
                  <th className="text-right p-3 font-semibold text-gray-700">
                    تعداد گزارش
                  </th>
                  <th className="text-right p-3 font-semibold text-gray-700">
                    میانگین تست
                  </th>
                  <th className="text-right p-3 font-semibold text-gray-700">
                    میانگین ساعت
                  </th>
                  <th className="text-right p-3 font-semibold text-gray-700">
                    منابع مختلف
                  </th>
                  <th className="text-right p-3 font-semibold text-gray-700">
                    بازدهی
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjectAnalysis.map((subject, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="p-3 text-gray-800 font-semibold">
                      {subject.subject}
                    </td>
                    <td className="p-3 text-gray-600">{subject.totalTests}</td>
                    <td className="p-3 text-gray-600">{subject.totalHours}</td>
                    <td className="p-3 text-gray-600">{subject.reportCount}</td>
                    <td className="p-3 text-gray-600">
                      {subject.avgTestsPerReport}
                    </td>
                    <td className="p-3 text-gray-600">
                      {subject.avgHoursPerReport}
                    </td>
                    <td className="p-3 text-gray-600">
                      {subject.uniqueSources}
                    </td>
                    <td className="p-3 text-gray-600 font-semibold">
                      {subject.efficiency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reports Management */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 md:mb-0">
              مدیریت گزارش‌ها
            </h2>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">همه دروس</option>
                {uniqueSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>

              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">همه تاریخ‌ها</option>
                {uniqueDates.map((date) => (
                  <option key={date} value={date}>
                    {toPersianDate(date)}
                  </option>
                ))}
              </select>

              <button
                onClick={exportToCSV}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center"
              >
                <Download className="w-4 h-4 ml-2" />
                خروجی CSV
              </button>
            </div>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            نمایش {filteredAndSortedReports.length} گزارش از {reports.length}{" "}
            گزارش کل
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th
                    className="text-right p-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("report_date")}
                  >
                    تاریخ{" "}
                    {sortField === "report_date" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-right p-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("subject")}
                  >
                    درس{" "}
                    {sortField === "subject" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-right p-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("test_source")}
                  >
                    منبع تست{" "}
                    {sortField === "test_source" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-right p-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("test_count")}
                  >
                    تعداد تست{" "}
                    {sortField === "test_count" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-right p-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("study_duration")}
                  >
                    زمان مطالعه (ساعت){" "}
                    {sortField === "study_duration" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="text-right p-3 font-semibold text-gray-700">
                    بازدهی
                  </th>
                  <th className="text-right p-3 font-semibold text-gray-700">
                    وضعیت
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedReports.map((report, index) => (
                  <tr
                    key={report.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="p-3 text-gray-800">{toPersianDate(report.report_date)}</td>
                    <td className="p-3 text-gray-800 font-semibold">
                      {report.subject}
                    </td>
                    <td className="p-3 text-gray-600">{report.test_source}</td>
                    <td className="p-3 text-gray-600">{report.test_count}</td>
                    <td className="p-3 text-gray-600">
                      {(parseFloat(report.study_duration) / 60).toFixed(1)}
                    </td>
                    <td className="p-3 text-gray-600 font-semibold">
                      {(
                        parseInt(report.test_count) /
                          (parseFloat(report.study_duration) / 60) || 0
                      ).toFixed(1)}{" "}
                      تست/ساعت
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : report.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {report.status === "approved" && "تایید شده"}
                        {report.status === "rejected" && "رد شده"}
                        {report.status === "pending" && "در انتظار"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAndSortedReports.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || filterSubject || filterDate
                  ? "گزارشی با این فیلتر یافت نشد"
                  : "هنوز گزارشی ثبت نشده است"}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap');
        
        .font-vazirmatn {
          font-family: 'Vazirmatn', sans-serif;
        }
        
        * {
          font-family: 'Vazirmatn', sans-serif;
          direction: rtl;
        }
      `}</style>
    </div>
  );
}