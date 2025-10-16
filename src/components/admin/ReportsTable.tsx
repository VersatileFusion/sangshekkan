import React from 'react';
import { useAdminReports } from '@/hooks/admin/useAdminReports';
import FeedbackModal from './FeedbackModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type Props = { studentId?: string; initialReports?: any[] };

// کامپوننت Badge برای نمایش وضعیت با رنگ
const StatusBadge = ({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' }) => {
  const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full inline-block';

  switch (status) {
    case 'APPROVED':
      return <span className={`${baseClasses} bg-green-100 text-green-800`}>تأیید شده</span>;
    case 'REJECTED':
      return <span className={`${baseClasses} bg-red-100 text-red-800`}>رد شده</span>;
    case 'PENDING':
    default:
      return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>در انتظار بررسی</span>;
  }
};

export default function ReportsTable({ studentId, initialReports }: Props) {
  const [page, setPage] = React.useState(1);
  const { data } = useAdminReports({ studentId, page });
  const items = data?.items ?? initialReports ?? [];
  const total = data?.total ?? items.length;
  const pageSize = data?.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [open, setOpen] = React.useState<any|null>(null);
  
  const queryClient = useQueryClient();

  // Mutation برای حذف گزارش
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در حذف گزارش');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Refresh data after successful deletion
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
      console.log('✅ Report deleted successfully');
    },
    onError: (error) => {
      console.error('❌ Error deleting report:', error);
    },
  });

  const handleDeleteReport = async (reportId: string, studentName: string) => {
    // نمایش پیام تأیید قبل از حذف
    const confirmed = window.confirm(
      `آیا از حذف گزارش دانش‌آموز "${studentName}" مطمئن هستید؟\n\nاین عمل غیرقابل بازگشت است.`
    );
    
    if (!confirmed) return;

    try {
      await deleteReportMutation.mutateAsync(reportId);
      // نمایش پیام موفقیت
      console.log('✅ Report deleted successfully');
    } catch (error: any) {
      console.error('❌ Error deleting report:', error);
      alert(`خطا در حذف گزارش: ${error.message}`);
    }
  };
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500">
            <th className="text-right py-2">تاریخ</th>
            <th className="text-right">موضوع</th>
            <th className="text-right">تست</th>
            <th className="text-right">ساعت</th>
            <th className="text-right">وضعیت</th>
            <th className="text-right">فایل</th>
            <th className="text-right">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r:any)=> (
            <tr key={r.id} className="border-t">
              <td className="py-2">{new Date(r.date).toLocaleDateString('fa-IR')}</td>
              <td>{r.subject}</td>
              <td>{r.testCount}</td>
              <td>{(r.studyDurationMinutes??0)/60}</td>
              <td>
                <StatusBadge status={r.status} />
              </td>
              <td>
                {r.fileUrl ? (
                  <a 
                    href={r.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:text-teal-700 text-xs"
                  >
                    مشاهده
                  </a>
                ) : (
                  <span className="text-gray-400 text-xs">—</span>
                )}
              </td>
              <td>
                <div className="flex gap-2">
                  <button 
                    className="text-sky-600 hover:text-sky-700 text-xs px-2 py-1 rounded hover:bg-sky-50" 
                    onClick={()=>setOpen(r)}
                  >
                    بازخورد
                  </button>
                  <button 
                    className="text-red-600 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50" 
                    onClick={() => handleDeleteReport(r.id, r.student?.name || 'نامشخص')}
                    disabled={deleteReportMutation.isPending}
                  >
                    {deleteReportMutation.isPending ? 'حذف...' : 'حذف'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-center justify-center gap-3">
        <button disabled={page<=1} onClick={() => setPage((p)=>Math.max(1,p-1))} className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50">قبلی</button>
        <div className="text-sm">{page} / {totalPages}</div>
        <button disabled={page>=totalPages} onClick={() => setPage((p)=>Math.min(totalPages,p+1))} className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50">بعدی</button>
      </div>
      <FeedbackModal report={open} onClose={()=>setOpen(null)} />
    </div>
  );
}




