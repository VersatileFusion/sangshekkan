"use client";
import React from 'react';
import StudentDashboardLayout from '@/components/student/StudentDashboardLayout';
import DashboardStats from '@/components/student/DashboardStats';
import ProgressChart from '@/components/student/ProgressChart';

export default function Page() {
  return (
    <StudentDashboardLayout current="dashboard">
      <DashboardStats />
      <ProgressChart />
    </StudentDashboardLayout>
  );
}




