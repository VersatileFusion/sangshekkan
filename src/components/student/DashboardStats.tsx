import React from 'react';
import { useDashboardStats } from '@/hooks/student/useDashboardStats';

export default function DashboardStats() {
  const { data, isLoading } = useDashboardStats();
  const stats = data ?? { approved: 0, rejected: 0, pending: 0 };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {[
        { label: 'تایید شده', value: stats.approved, color: 'bg-emerald-500' },
        { label: 'رد شده', value: stats.rejected, color: 'bg-rose-500' },
        { label: 'در انتظار', value: stats.pending, color: 'bg-amber-500' },
      ].map((s) => (
        <div key={s.label} className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
          <div>
            <div className="text-gray-500 text-sm mb-1">{s.label}</div>
            <div className="text-2xl font-bold">{isLoading ? '—' : s.value}</div>
          </div>
          <div className={`${s.color} w-10 h-10 rounded-full`} />
        </div>
      ))}
    </div>
  );
}




