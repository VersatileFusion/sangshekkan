import React from 'react';
import { useAdminStudents, useToggleSuspension } from '@/hooks/admin/useAdminStudents';

export default function StudentsGrid() {
  const [page, setPage] = React.useState(1);
  const { data } = useAdminStudents(page);
  const toggle = useToggleSuspension();
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 28;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
        {items.map((s: any) => (
          <div key={s.id} className="border rounded-lg p-3 text-center">
            <img className="w-16 h-16 rounded-full mx-auto mb-2 object-cover" src={s.profileImageUrl || 'https://placehold.co/64x64'} alt={s.name||'avatar'} />
            <div className="font-semibold text-sm">{s.name || '—'}</div>
            <div className="text-xs text-gray-500">در انتظار: {s.pendingReportsCount}</div>
            <div className="mt-2 flex flex-col gap-1">
              <a href={`/admin/students/${s.id}`} className="text-sky-600 text-xs hover:underline">مشاهده</a>
              <button 
                onClick={() => toggle.mutate({ studentId: s.id, suspend: !s.accessSuspendedAt })} 
                className={`text-xs ${s.accessSuspendedAt ? 'text-green-600' : 'text-rose-600'} hover:underline`}
                disabled={toggle.isPending}
              >
                {s.accessSuspendedAt ? 'رفع مسدودیت' : 'مسدود'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        <button disabled={page<=1} onClick={() => setPage((p)=>Math.max(1,p-1))} className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50">قبلی</button>
        <div className="text-sm">{page} / {totalPages}</div>
        <button disabled={page>=totalPages} onClick={() => setPage((p)=>Math.min(totalPages,p+1))} className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50">بعدی</button>
      </div>
    </div>
  );
}




