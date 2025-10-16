import { useState, useEffect, useMemo } from "react";
import { toPersianDate } from "@/utils/dateConverter";

// Helper function to get today's Persian date
const getTodayPersian = () => {
  return toPersianDate(new Date().toISOString().split("T")[0]);
};

export function useReports() {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const savedReports = localStorage.getItem("studyReports");
      if (savedReports) {
        const parsed = JSON.parse(savedReports);
        if (Array.isArray(parsed)) {
          setReports(parsed);
        }
      }
    } catch (error) {
      console.error("Error loading reports from localStorage:", error);
      setReports([]);
    }
  }, []);

  // Save to localStorage whenever reports change
  useEffect(() => {
    try {
      localStorage.setItem("studyReports", JSON.stringify(reports));
    } catch (error) {
      console.error("Error saving reports to localStorage:", error);
    }
  }, [reports]);

  // Add a new report
  const addReport = (formData) => {
    try {
      const newReport = {
        ...formData,
        id: Date.now(),
        originalDate: formData.date,
        date: toPersianDate(formData.date),
      };
      setReports((prev) => [...prev, newReport]);
      return { success: true };
    } catch (error) {
      console.error("Error adding report:", error);
      return {
        success: false,
        message: "خطا در ثبت گزارش. لطفاً دوباره تلاش کنید.",
      };
    }
  };

  // Delete report
  const deleteReport = (id) => {
    setReports((prev) => prev.filter((report) => report.id !== id));
  };

  // Clear all data
  const clearAllData = () => {
    if (confirm("آیا مطمئن هستید که می‌خواهید همه داده‌ها را پاک کنید؟")) {
      setReports([]);
    }
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    const today = new Date();
    const todayPersian = getTodayPersian();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayReports = reports.filter(
      (report) => report.date === todayPersian,
    );
    const weeklyReports = reports.filter((report) => {
      const reportDate = new Date(report.originalDate || report.date);
      return reportDate >= oneWeekAgo;
    });
    const monthlyReports = reports.filter((report) => {
      const reportDate = new Date(report.originalDate || report.date);
      return reportDate >= oneMonthAgo;
    });

    return {
      todayTests: todayReports.reduce(
        (sum, report) => sum + parseInt(report.testCount || 0),
        0,
      ),
      todayHours:
        todayReports.reduce(
          (sum, report) => sum + parseFloat(report.studyDuration || 0),
          0,
        ) / 60,
      weeklyTests: weeklyReports.reduce(
        (sum, report) => sum + parseInt(report.testCount || 0),
        0,
      ),
      monthlyTests: monthlyReports.reduce(
        (sum, report) => sum + parseInt(report.testCount || 0),
        0,
      ),
    };
  }, [reports]);

  // Calculate subject statistics
  const subjectStats = useMemo(() => {
    const stats = {};
    reports.forEach((report) => {
      if (!stats[report.subject]) {
        stats[report.subject] = { tests: 0, hours: 0 };
      }
      stats[report.subject].tests += parseInt(report.testCount || 0);
      stats[report.subject].hours += parseFloat(report.studyDuration || 0) / 60;
    });

    return Object.entries(stats).map(([subject, data]) => ({
      subject,
      tests: data.tests,
      hours: data.hours.toFixed(1),
      value: (data.tests * data.hours).toFixed(1),
    }));
  }, [reports]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const persianDate = toPersianDate(date);

      const dayReports = reports.filter(
        (report) => report.date === persianDate,
      );
      const totalTests = dayReports.reduce(
        (sum, report) => sum + parseInt(report.testCount || 0),
        0,
      );

      last7Days.push({
        date: persianDate.split("/").slice(-2).join("/"), // Show only month/day
        tests: totalTests,
      });
    }
    return last7Days;
  }, [reports]);

  // Filter and sort reports
  const filteredAndSortedReports = useMemo(() => {
    let filtered = reports.filter((report) =>
      Object.values(report).some((value) =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );

    if (sortField) {
      filtered.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        if (sortField === "testCount" || sortField === "studyDuration") {
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
  }, [reports, searchTerm, sortField, sortDirection]);

  return {
    reports: filteredAndSortedReports,
    searchTerm,
    setSearchTerm,
    sortField,
    sortDirection,
    handleSort,
    addReport,
    deleteReport,
    clearAllData,
    statistics,
    subjectStats,
    chartData,
  };
}
