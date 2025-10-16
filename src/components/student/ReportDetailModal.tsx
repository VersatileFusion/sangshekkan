import React from 'react';

type Props = { report: any | null; onClose: () => void };

export default function ReportDetailModal({ report, onClose }: Props) {
  if (!report) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">جزئیات گزارش</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="space-y-2 text-sm">
          <div>تاریخ: {new Date(report.date).toLocaleDateString('fa-IR')}</div>
          <div>موضوع: {report.subject}</div>
          <div>منبع تست: {report.testSource}</div>
          <div>تعداد تست: {report.testCount}</div>
          <div>ساعت مطالعه: {(report.studyDurationMinutes??0)/60}</div>
          {report.description && <div>توضیحات: {report.description}</div>}
          {report.fileUrl && <div>فایل: <a className="text-teal-600" href={report.fileUrl} target="_blank" rel="noreferrer">دانلود</a></div>}
          <div className="pt-2">
            <div className="font-semibold">بازخورد مشاور</div>
            {report.feedback ? (
              <div className="text-gray-700">{report.feedback.content}</div>
            ) : (
              <div className="text-gray-400">بازخوردی ثبت نشده است</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




