import React from 'react';
import { useAdminFeedback } from '@/hooks/admin/useAdminReports';

type Props = { report: any | null; onClose: () => void };

export default function FeedbackModal({ report, onClose }: Props) {
  const [content, setContent] = React.useState('');
  const feedback = useAdminFeedback();
  if (!report) return null;
  const submit = async (decision: 'APPROVED' | 'REJECTED') => {
    await feedback.mutateAsync({ reportId: report.id, content, decision });
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow p-6 max-w-lg w-full" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">بازخورد گزارش</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="space-y-2 text-sm">
          <div>تاریخ: {new Date(report.date).toLocaleDateString('fa-IR')}</div>
          <div>موضوع: {report.subject}</div>
          {report.fileUrl && <div>فایل: <a className="text-teal-600" href={report.fileUrl} target="_blank" rel="noreferrer">دانلود</a></div>}
        </div>
        <textarea value={content} onChange={(e)=>setContent(e.target.value)} className="mt-3 w-full border rounded-md p-2" rows={4} placeholder="متن بازخورد" />
        <div className="mt-3 flex gap-2 justify-end">
          <button onClick={()=>submit('APPROVED')} className="bg-emerald-600 text-white px-3 py-1 rounded">تایید و ارسال</button>
          <button onClick={()=>submit('REJECTED')} className="bg-rose-600 text-white px-3 py-1 rounded">رد و ارسال</button>
        </div>
      </div>
    </div>
  );
}




