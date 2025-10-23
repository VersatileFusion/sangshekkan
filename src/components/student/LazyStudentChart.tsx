import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

interface LazyStudentChartProps {
  chartData: Array<{
    date: string;
    studyHours: number;
    testCount: number;
  }>;
}

export default function LazyStudentChart({ chartData }: LazyStudentChartProps) {
  return (
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
  );
}
