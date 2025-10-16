'use client';

import React from 'react';
import { useAdminStudents, useToggleSuspension } from '@/hooks/admin/useAdminStudents';
import { Pin, User } from 'lucide-react';

export default function StudentsGridDual() {
  const [page, setPage] = React.useState(1);
  const { data, refetch } = useAdminStudents(page);
  const toggle = useToggleSuspension();
  
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 28;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // تفکیک دانش‌آموزان به دو لیست
  const pinnedUsers = items.filter((s: any) => s.pinned === true);
  const normalUsers = items.filter((s: any) => s.pinned !== true);

  // تابع برای toggle pin
  const handleTogglePin = async (studentId: string, currentPinned: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${studentId}/toggle-pin`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (response.ok) {
        // Refetch data to update UI
        refetch();
      } else {
        alert('خطا در تغییر وضعیت سنجاق');
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert('خطا در تغییر وضعیت سنجاق');
    }
  };

  // کامپوننت کارت دانش‌آموز
  const StudentCard = ({ student, isPinned }: { student: any; isPinned: boolean }) => (
    <div className={`border rounded-lg p-3 text-center relative ${isPinned ? 'border-yellow-400 bg-yellow-50' : ''}`}>
      {/* آیکون سنجاق */}
      <button
        onClick={() => handleTogglePin(student.id, student.pinned)}
        className={`absolute top-2 left-2 p-1.5 rounded-full transition-all ${
          student.pinned
            ? 'bg-yellow-500 hover:bg-yellow-600 shadow-md'
            : 'bg-gray-200 hover:bg-gray-300'
        }`}
        title={student.pinned ? 'حذف از سنجاق شده‌ها' : 'افزودن به سنجاق شده‌ها'}
      >
        <Pin className={`w-3.5 h-3.5 ${student.pinned ? 'text-white fill-white' : 'text-gray-600'}`} />
      </button>

      <img
        className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
        src={student.profileImageUrl || 'https://placehold.co/64x64'}
        alt={student.name || 'avatar'}
      />
      <div className="font-semibold text-sm">{student.name || '—'}</div>
      <div className="text-xs text-gray-500">{student.grade || ''} {student.field || ''}</div>
      <div className="text-xs text-gray-500">در انتظار: {student.pendingReportsCount}</div>
      
      <div className="mt-2 flex flex-col gap-1">
        <a
          href={`/admin/students/${student.id}`}
          className="text-sky-600 text-xs hover:underline"
        >
          مشاهده صفحه شخصی
        </a>
        <button
          onClick={() => toggle.mutate({ studentId: student.id, suspend: !student.accessSuspendedAt })}
          className={`text-xs ${student.accessSuspendedAt ? 'text-green-600' : 'text-rose-600'} hover:underline`}
          disabled={toggle.isPending}
        >
          {student.accessSuspendedAt ? 'رفع مسدودیت' : 'مسدود'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* بخش دانش‌آموزان سنجاق‌شده */}
      {pinnedUsers.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 shadow-lg border-2 border-yellow-200">
          <div className="flex items-center gap-3 mb-6">
            <Pin className="w-6 h-6 text-yellow-600 fill-yellow-600" />
            <h2 className="text-2xl font-bold text-gray-800">دانش‌آموزان سنجاق‌شده</h2>
            <span className="px-3 py-1 bg-yellow-500 text-white text-sm font-medium rounded-full">
              {pinnedUsers.length}
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {pinnedUsers.map((s: any) => (
              <StudentCard key={s.id} student={s} isPinned={true} />
            ))}
          </div>
        </div>
      )}

      {/* بخش سایر دانش‌آموزان */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-gray-600" />
          <h2 className="text-2xl font-bold text-gray-800">سایر دانش‌آموزان</h2>
          <span className="px-3 py-1 bg-gray-500 text-white text-sm font-medium rounded-full">
            {normalUsers.length}
          </span>
        </div>
        
        {normalUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            هیچ دانش‌آموزی در این صفحه یافت نشد
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
              {normalUsers.map((s: any) => (
                <StudentCard key={s.id} student={s} isPinned={false} />
              ))}
            </div>
            
            {/* صفحه‌بندی فقط برای سایر دانش‌آموزان */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                قبلی
              </button>
              <div className="text-sm font-medium">
                صفحه {page} از {totalPages}
              </div>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                بعدی
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

