"use client";

import AdvancedNavigation from "@/components/Navigation/AdvancedNavigation";
import { useAdvisorPanel } from "@/hooks/useAdvisorPanel";
import {
  LoadingSpinner,
  AuthRedirect,
  RolePermission,
} from "@/components/advisor/AuthGuards.jsx";
import { OverallStatistics } from "@/components/advisor/OverallStatistics.jsx";
import { ChartsSection } from "@/components/advisor/ChartsSection.jsx";
import { SubjectAnalysisTable } from "@/components/advisor/SubjectAnalysisTable.jsx";
import { ReportsManagement } from "@/components/advisor/ReportsManagement.jsx";
import { FeedbackModal } from "@/components/advisor/FeedbackModal.jsx";

export default function EnhancedAdvisorPanel() {
  const breadcrumbs = [{ name: "پنل مشاور پیشرفته", href: null }];

  const {
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
  } = useAdvisorPanel();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

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
      <AdvancedNavigation breadcrumbs={breadcrumbs} />

      <div className="container mx-auto px-4 pb-8">
        <OverallStatistics stats={overallStats} />
        <ChartsSection
          dailyProgressData={dailyProgressData}
          statusDistribution={statusDistribution}
        />
        <SubjectAnalysisTable analysis={subjectAnalysis} />
        <ReportsManagement
          reports={filteredAndSortedReports}
          totalCount={reports.length}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterSubject={filterSubject}
          setFilterSubject={setFilterSubject}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          uniqueSubjects={uniqueSubjects}
          exportToCSV={exportToCSV}
          sortField={sortField}
          sortDirection={sortDirection}
          handleSort={handleSort}
          openFeedbackModal={openFeedbackModal}
        />
      </div>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={closeFeedbackModal}
        report={selectedReport}
        status={reportStatus}
        setStatus={setReportStatus}
        feedbackText={feedbackText}
        setFeedbackText={setFeedbackText}
        onSubmit={submitFeedback}
      />

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
