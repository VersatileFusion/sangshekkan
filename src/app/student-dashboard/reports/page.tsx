"use client";
import React from 'react';
import StudentDashboardLayout from '@/components/student/StudentDashboardLayout';
import ReportSubmissionForm from '@/components/student/ReportSubmissionForm';
import ReportsList from '@/components/student/ReportsList';
import { useStudentReports } from '@/hooks/student/useStudentReports';

export default function Page() {
  const { data } = useStudentReports('weekly');
  const reports = Array.isArray(data) ? data : [];
  return (
    <StudentDashboardLayout current="reports">
      <div className="space-y-6">
        <ReportSubmissionForm />
        <ReportsList reports={reports} />
      </div>
    </StudentDashboardLayout>
  );
}




