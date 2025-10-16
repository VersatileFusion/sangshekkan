"use client";
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StudentsGridDual from '@/components/admin/StudentsGridDual';
import { useAdminStats } from '@/hooks/admin/useAdminStats';

export default function Page() {
  const { data } = useAdminStats();
  return (
    <AdminLayout current="dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-5">
          <div className="text-gray-500 text-sm mb-1">تعداد دانش‌آموزان</div>
          <div className="text-2xl font-bold">{data?.totalStudents ?? '—'}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <div className="text-gray-500 text-sm mb-1">گزارش‌های در انتظار</div>
          <div className="text-2xl font-bold">{data?.pendingReports ?? '—'}</div>
        </div>
      </div>
      <StudentsGridDual />
    </AdminLayout>
  );
}




