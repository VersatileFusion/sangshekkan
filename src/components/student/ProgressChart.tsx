import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { useStudentReports } from '@/hooks/student/useStudentReports';

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
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" label={{ value: 'ساعت', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'تست', angle: 90, position: 'insideRight' }} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="studyHours" stroke="#14b8a6" name="ساعت مطالعه" dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="testCount" stroke="#6366f1" name="تعداد تست" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}




