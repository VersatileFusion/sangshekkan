"use client";

import React from 'react';

type Feedback = {
  id: string;
  content: string;
  createdAt: string;
  admin?: { id: string; name: string | null } | null;
};

type Report = {
  id: string;
  subject?: string | null;
  description?: string | null;
  createdAt: string;
  testSource?: string | null;
  testCount?: number | null;
  studyDurationMinutes?: number | null;
  status?: string | null;
  fileUrl?: string | null;
  feedback?: Feedback | null; // one-to-one per schema
};

export default function ReportHistory({ reports }: { reports: Report[] }) {
  if (!reports || reports.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-5 mt-8">
        <h2 className="text-xl font-bold mb-4">تاریخچه گزارش‌ها</h2>
        <p className="text-gray-500">هیچ گزارشی برای این دانش‌آموز ثبت نشده است.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-5 mt-8">
      <h2 className="text-xl font-bold mb-4">تاریخچه گزارش‌ها</h2>
      <div className="space-y-6">
        {reports.map((report) => (
          <div key={report.id} className="p-4 border rounded-lg">
            {/* Student's Report Message */}
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold">دانش‌آموز:</p>
                <p className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleString('fa-IR')}</p>
              </div>
              {report.subject && (
                <div className="text-sm text-gray-700 mb-1">عنوان: {report.subject}</div>
              )}
              <p className="text-gray-800 whitespace-pre-wrap">{report.description || '—'}</p>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                {report.testSource && <div>منبع آزمون: {report.testSource}</div>}
                {typeof report.testCount === 'number' && <div>تعداد تست: {report.testCount}</div>}
                {typeof report.studyDurationMinutes === 'number' && (
                  <div>زمان مطالعه: {report.studyDurationMinutes} دقیقه</div>
                )}
                {report.status && <div>وضعیت: {report.status}</div>}
                {report.fileUrl && (
                  <div>
                    فایل: <a className="text-teal-600 hover:underline" href={report.fileUrl} target="_blank" rel="noreferrer">دانلود</a>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Feedback (single per schema) */}
            {report.feedback && (
              <div className="bg-gray-100 p-3 rounded-md mt-3 md:ml-8">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold">پاسخ مدیر{report.feedback.admin?.name ? ` (${report.feedback.admin.name})` : ''}:</p>
                  <p className="text-xs text-gray-500">{new Date(report.feedback.createdAt).toLocaleString('fa-IR')}</p>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{report.feedback.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


