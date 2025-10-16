import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";

export function useStudentDashboard() {
  const { data: authUser, loading: authLoading } = useUser();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reports, setReports] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false); // For form submissions
  const [error, setError] = useState("");
  const [reportForm, setReportForm] = useState({
    reportDate: new Date().toISOString().split("T")[0],
    subject: "",
    testSource: "",
    testCount: "",
    studyDuration: "",
    ghalamchiScore: "",
    description: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (authUser && !authLoading) {
      fetchReports();
      fetchChallenges();
    }
  }, [authUser, authLoading]);

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/daily-reports");
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        const errorData = await response.json();
        setError(
          "خطا در دریافت گزارش‌ها: " + (errorData.error || "خطای نامشخص"),
        );
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setError("خطا در ارتباط با سرور");
    }
  };

  const fetchChallenges = async () => {
    try {
      const response = await fetch("/api/challenges");
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges || []);
      } else {
        console.error("Failed to fetch challenges");
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (
      !reportForm.reportDate ||
      !reportForm.subject ||
      !reportForm.testCount ||
      !reportForm.studyDuration
    ) {
      setError("لطفاً تمام فیلدهای الزامی را پر کنید");
      setLoading(false);
      return;
    }
    if (
      parseInt(reportForm.testCount) < 0 ||
      parseInt(reportForm.studyDuration) < 0
    ) {
      setError("تعداد تست و مدت مطالعه نمی‌تواند منفی باشد");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/daily-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate: reportForm.reportDate,
          subject: reportForm.subject,
          testSource: reportForm.testSource || "",
          testCount: parseInt(reportForm.testCount),
          studyDuration: parseInt(reportForm.studyDuration),
          ghalamchiScore: reportForm.ghalamchiScore
            ? parseInt(reportForm.ghalamchiScore)
            : null,
          description: reportForm.description || "",
          imageUrl: reportForm.imageUrl || "",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "خطا در ثبت گزارش");
      }

      // Optimistically update local state so charts refresh immediately
      if (data && data.report) {
        setReports((prev) => [data.report, ...prev]);
      }

      setReportForm({
        reportDate: new Date().toISOString().split("T")[0],
        subject: "",
        testSource: "",
        testCount: "",
        studyDuration: "",
        ghalamchiScore: "",
        description: "",
        imageUrl: "",
      });
      setShowReportModal(false);
      // Re-sync with server in the background to ensure full/normalized data
      fetchReports();
      alert("گزارش با موفقیت ثبت شد! ✅");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این گزارش را حذف کنید؟")) {
      return;
    }
    try {
      const response = await fetch(`/api/daily-reports/${reportId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchReports();
        alert("گزارش با موفقیت حذف شد");
      } else {
        const error = await response.json();
        alert(error.error || "خطا در حذف گزارش");
      }
    } catch (error) {
      alert("خطا در حذف گزارش");
    }
  };

  const participateInChallenge = async (challengeId) => {
    try {
      const response = await fetch("/api/challenges/participate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge_id: challengeId,
          participation_date: new Date().toISOString().split("T")[0],
          completed: true,
        }),
      });
      if (response.ok) {
        fetchChallenges();
        alert("مشارکت شما ثبت شد! 🎉");
      } else {
        console.error("Failed to participate in challenge");
      }
    } catch (error) {
      console.error("Error participating in challenge:", error);
    }
  };

  const calculatedStats = {
    totalTests: reports.reduce((sum, r) => sum + (r.test_count || 0), 0),
    totalHours: Math.round(
      reports.reduce((sum, r) => sum + (r.study_duration || 0), 0) / 60,
    ),
    avgGhalamchiScore:
      reports.length > 0
        ? Math.round(
            reports
              .filter((r) => r.ghalamchi_score)
              .reduce((sum, r) => sum + (r.ghalamchi_score || 0), 0) /
              (reports.filter((r) => r.ghalamchi_score).length || 1),
          )
        : 0,
  };

  return {
    authUser,
    authLoading,
    showReportModal,
    setShowReportModal,
    reports,
    challenges,
    loading,
    error,
    reportForm,
    setReportForm,
    handleReportSubmit,
    handleDeleteReport,
    participateInChallenge,
    calculatedStats,
  };
}
