"use client";

import { useState } from "react";
import AdvancedNavigation from "@/components/Navigation/AdvancedNavigation";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import AuthRedirect from "@/components/dashboard/AuthRedirect";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCards from "@/components/dashboard/StatsCards";
import ProgressChart from "@/components/dashboard/ProgressChart";
import RecentReports from "@/components/dashboard/RecentReports";
import ReportFormModal from "@/components/dashboard/ReportFormModal";
import QuestionFormModal from "@/components/dashboard/QuestionFormModal";

export default function StudentDashboard() {
  const {
    authUser,
    authLoading,
    user,
    reports,
    notifications,
    loading,
    stats,
    unreadNotifications,
    submitReport,
    submitQuestion,
    deleteReport,
    markNotificationsRead,
  } = useStudentDashboard();

  const [showReportForm, setShowReportForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  const breadcrumbs = [{ name: "داشبورد", href: null }];

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!authUser) {
    return <AuthRedirect />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <AdvancedNavigation currentPage="/dashboard" breadcrumbs={breadcrumbs} />

      <div className="container mx-auto px-4 pb-8 pt-8">
        <DashboardHeader
          user={user || authUser}
          notifications={notifications || []}
          unreadCount={unreadNotifications?.length || 0}
          onMarkNotificationsRead={markNotificationsRead}
          onAskQuestion={() => setShowQuestionForm(true)}
          onAddReport={() => setShowReportForm(true)}
        />

        <StatsCards stats={stats} reportCount={reports?.length || 0} />

        <ProgressChart reports={reports || []} />

        <RecentReports
          reports={reports || []}
          onDelete={deleteReport}
          onAddReport={() => setShowReportForm(true)}
        />
      </div>

      <ReportFormModal
        show={showReportForm}
        onClose={() => setShowReportForm(false)}
        onSubmit={submitReport}
      />

      <QuestionFormModal
        show={showQuestionForm}
        onClose={() => setShowQuestionForm(false)}
        onSubmit={submitQuestion}
      />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Vazirmatn', sans-serif;
          direction: rtl;
        }
      `}</style>
    </div>
  );
}
