import React from 'react';
import ReportDetailModal from './ReportDetailModal';

type Props = { reports: any[] };

export default function ReportsList({ reports }: Props) {
  const [selected, setSelected] = React.useState<any | null>(null);
  const statusColor = (s?: string) => s === 'APPROVED' ? 'text-emerald-600' : s === 'REJECTED' ? 'text-rose-600' : 'text-amber-600';
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className="font-bold mb-3">گزارش‌های من</h3>
      <div className="divide-y">
        {reports.map((r) => (
          <button key={r.id} className="w-full text-right py-3 hover:bg-gray-50" onClick={() => setSelected(r)}>
            <div className="flex items-center justify-between">
              <div className="text-gray-800">{new Date(r.date).toLocaleDateString('fa-IR')} — {r.subject}</div>
              <div className={`text-sm font-medium ${statusColor(r.status)}`}>{r.status}</div>
            </div>
          </button>
        ))}
      </div>
      <ReportDetailModal report={selected} onClose={() => setSelected(null)} />
    </div>
  );
}




