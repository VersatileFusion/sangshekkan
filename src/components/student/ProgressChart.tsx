import React, { lazy, Suspense } from 'react';
import { useStudentReports } from '@/hooks/student/useStudentReports';

// Lazy load the chart component
const LazyStudentChart = lazy(() => import('./LazyStudentChart'));

type Period = 'weekly' | 'monthly' | 'all';

export default function ProgressChart() {
  const [period, setPeriod] = React.useState<Period>('weekly');
  const { data } = useStudentReports(period);
  const reports = Array.isArray(data) ? data : [];
  const chartData = reports
    .map((r: any) => ({
      date: new Date(r.date).toLocaleDateString('fa-IR'),
      studyHours: (r.studyDurationMinutes ?? 0) / 60,
      testCount: r.testCount ?? 0,
    }))
    .reverse();

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">نمودار پیشرفت</h3>
        <div className="space-x-2 space-x-reverse">
          {(['weekly','monthly','all'] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-md text-sm ${period===p?'bg-teal-600 text-white':'bg-gray-100 text-gray-700'}`}>
              {p==='weekly'?'هفته اخیر':p==='monthly'?'ماه اخیر':'کل'}
            </button>
          ))}
        </div>
      </div>
      <Suspense fallback={
        <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
            <p className="text-gray-600">در حال بارگذاری نمودار...</p>
          </div>
        </div>
      }>
        <LazyStudentChart chartData={chartData} />
      </Suspense>
    </div>
  );
}




