"use client";

import { useState, useEffect, useMemo } from "react";
import useUser from "@/utils/useUser";

export function useAdvisorPanel() {
  const { data: authUser, loading: authLoading } = useUser();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    if (authUser) {
      fetchUserData();
      fetchReports();
    }
  }, [authUser]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterDate) params.append("start_date", filterDate);

      const response = await fetch(`/api/advisor/reports?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else if (response.status === 403) {
        console.error("Access denied to advisor panel");
        setReports([]);
      } else {
        console.error("Failed to fetch reports");
        setReports([]);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const openFeedbackModal = (report) => {
    setSelectedReport(report);
    setFeedbackText(report.feedback_text || "");
    setReportStatus(report.status || "pending");
    setShowFeedbackModal(true);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setSelectedReport(null);
    setFeedbackText("");
  };

  const submitFeedback = async () => {
    if (!selectedReport) return;

    try {
      const response = await fetch("/api/advisor/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: selectedReport.id,
          status: reportStatus,
          feedback_text: feedbackText,
        }),
      });

      if (response.ok) {
        closeFeedbackModal();
        fetchReports();
        alert("بازخورد با موفقیت ثبت شد");
      } else {
        const error = await response.json();
        alert(error.error || "خطا در ثبت بازخورد");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("خطا در ثبت بازخورد");
    }
  };

  const uniqueSubjects = useMemo(() => {
    const subjects = [...new Set(reports.map((report) => report.subject))];
    return subjects.filter(Boolean);
  }, [reports]);

  const overallStats = useMemo(() => {
    const totalReports = reports.length;
    const totalTests = reports.reduce(
      (sum, report) => sum + parseInt(report.test_count || 0),
      0,
    );
    const totalHours =
      reports.reduce(
        (sum, report) => sum + parseFloat(report.study_duration || 0),
        0,
      ) / 60;
    const today = new Date().toISOString().split("T")[0];
    const todayReports = reports.filter(
      (report) => report.report_date === today,
    );
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const weeklyReports = reports.filter(
      (report) => report.report_date >= oneWeekAgo,
    );
    const pendingReports = reports.filter((r) => r.status === "pending").length;
    const approvedReports = reports.filter(
      (r) => r.status === "approved",
    ).length;
    const rejectedReports = reports.filter(
      (r) => r.status === "rejected",
    ).length;

    return {
      totalReports,
      totalTests,
      totalHours: totalHours.toFixed(1),
      todayReports: todayReports.length,
      weeklyReports: weeklyReports.length,
      pendingReports,
      approvedReports,
      rejectedReports,
      averageTestsPerReport:
        totalReports > 0 ? (totalTests / totalReports).toFixed(1) : 0,
      averageHoursPerReport:
        totalReports > 0 ? (totalHours / totalReports).toFixed(1) : 0,
    };
  }, [reports]);

  const subjectAnalysis = useMemo(() => {
    const analysis = {};
    reports.forEach((report) => {
      if (!analysis[report.subject]) {
        analysis[report.subject] = {
          totalTests: 0,
          totalHours: 0,
          reportCount: 0,
          students: new Set(),
        };
      }
      analysis[report.subject].totalTests += parseInt(report.test_count || 0);
      analysis[report.subject].totalHours +=
        parseFloat(report.study_duration || 0) / 60;
      analysis[report.subject].reportCount += 1;
      analysis[report.subject].students.add(report.student_name);
    });

    return Object.entries(analysis)
      .map(([subject, data]) => ({
        subject,
        totalTests: data.totalTests,
        totalHours: data.totalHours.toFixed(1),
        reportCount: data.reportCount,
        studentCount: data.students.size,
        avgTestsPerReport: (data.totalTests / data.reportCount).toFixed(1),
        avgHoursPerReport: (data.totalHours / data.reportCount).toFixed(1),
        efficiency: (data.totalTests / data.totalHours || 0).toFixed(1),
      }))
      .sort((a, b) => b.totalTests - a.totalTests);
  }, [reports]);

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
      .slice(-14);
  }, [reports]);

  const statusDistribution = useMemo(() => {
    const distribution = { pending: 0, approved: 0, rejected: 0 };
    reports.forEach((report) => {
      distribution[report.status] = (distribution[report.status] || 0) + 1;
    });
    const colors = {
      pending: "#F59E0B",
      approved: "#10B981",
      rejected: "#EF4444",
    };
    const labels = {
      pending: "در انتظار",
      approved: "تایید شده",
      rejected: "رد شده",
    };
    return Object.entries(distribution)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: labels[status],
        value: count,
        fill: colors[status],
      }));
  }, [reports]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedReports = useMemo(() => {
    let filtered = reports.filter((report) => {
      const matchesSearch = Object.values(report).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      );
      const matchesSubject = !filterSubject || report.subject === filterSubject;
      const matchesDate = !filterDate || report.report_date === filterDate;
      const matchesStatus = !filterStatus || report.status === filterStatus;
      return matchesSearch && matchesSubject && matchesDate && matchesStatus;
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
    filterStatus,
    sortField,
    sortDirection,
  ]);

  const exportToCSV = () => {
    const headers = [
      "تاریخ",
      "نام دانش‌آموز",
      "درس",
      "منبع تست",
      "تعداد تست",
      "زمان مطالعه (دقیقه)",
      "تراز قلمچی",
      "وضعیت",
      "بازخورد",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredAndSortedReports.map((report) =>
        [
          report.report_date,
          report.student_name,
          report.subject,
          report.test_source,
          report.test_count,
          report.study_duration,
          report.ghalamchi_score || "",
          report.status,
          report.feedback_text || "",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `گزارش_مطالعه_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return {
    authUser,
    authLoading,
    user,
    reports,
    loading,
    searchTerm,
    setSearchTerm,
    sortField,
    sortDirection,
    handleSort,
    filterSubject,
    setFilterSubject,
    filterStatus,
    setFilterStatus,
    uniqueSubjects,
    overallStats,
    subjectAnalysis,
    dailyProgressData,
    statusDistribution,
    filteredAndSortedReports,
    exportToCSV,
    showFeedbackModal,
    selectedReport,
    feedbackText,
    setFeedbackText,
    reportStatus,
    setReportStatus,
    openFeedbackModal,
    closeFeedbackModal,
    submitFeedback,
  };
}
