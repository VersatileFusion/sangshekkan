"use client";
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ReportsTable from '@/components/admin/ReportsTable';

export default function ReportsPage() {
  return (
    <AdminLayout current="reports">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">گزارش‌های دانش‌آموزان</h2>
        <ReportsTable />
      </div>
    </AdminLayout>
  );
}

