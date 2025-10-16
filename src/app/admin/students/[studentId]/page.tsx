"use client";
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProgressChart from '@/components/student/ProgressChart';
import { useAdminReports } from '@/hooks/admin/useAdminReports';
import ReportsTable from '@/components/admin/ReportsTable';
import ReportHistory from '@/components/admin/ReportHistory';

async function fetchStudent(studentId: string) {
  try {
    const res = await fetch(`/api/admin/students/${studentId}`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? { ...data.student, reports: data.reports, _count: { reports: data.reportsCount } } : null;
  } catch {
    return null;
  }
}

export default function Page({ params }: { params: { studentId: string } }) {
  const studentId = params.studentId;
  const { data } = useAdminReports({ studentId, page: 1 });
  const reports = data?.items ?? [];
  
  const [student, setStudent] = React.useState<any>(null);
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!studentId) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch student data
        const studentData = await fetchStudent(studentId);
        setStudent(studentData);
        
        // Fetch reports separately using the new API
        const reportsRes = await fetch(`/api/reports/student/${studentId}`, { 
          credentials: 'include' 
        });
        
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setHistory(reportsData.reports || []);
        } else {
          console.warn('Failed to fetch reports:', await reportsRes.text());
          setHistory([]);
        }
      } catch (error) {
        console.error('Error loading student data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [studentId]);

  if (loading) {
    return (
      <AdminLayout current="students">
        <div className="bg-white rounded-xl shadow p-5 text-center">
          <div className="animate-pulse">در حال بارگذاری...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!student) {
    return (
      <AdminLayout current="students">
        <div className="bg-white rounded-xl shadow p-5 text-center text-red-500">
          دانش‌آموز یافت نشد
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout current="students">
      {/* اطلاعات دانش‌آموز */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">اطلاعات دانش‌آموز</h2>
          <span className={`px-3 py-1 rounded-full text-sm ${
            student.status === 'ACTIVE' 
              ? 'bg-green-100 text-green-800' 
              : student.status === 'SUSPENDED'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {student.status === 'ACTIVE' ? 'فعال' : 
             student.status === 'SUSPENDED' ? 'مسدود شده' : 
             student.status}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <span className="text-gray-600">نام:</span>
            <span className="font-medium mr-2">{student.name}</span>
          </div>
          <div>
            <span className="text-gray-600">شماره تماس:</span>
            <span className="font-medium mr-2 dir-ltr inline-block">{student.phone}</span>
          </div>
          <div>
            <span className="text-gray-600">پایه:</span>
            <span className="font-medium mr-2">{student.grade || '—'}</span>
          </div>
          <div>
            <span className="text-gray-600">رشته:</span>
            <span className="font-medium mr-2">{student.field || '—'}</span>
          </div>
          <div>
            <span className="text-gray-600">شهر:</span>
            <span className="font-medium mr-2">{student.city || '—'}</span>
          </div>
          <div>
            <span className="text-gray-600">تاریخ ثبت‌نام:</span>
            <span className="font-medium mr-2">{new Date(student.createdAt).toLocaleDateString('fa-IR')}</span>
          </div>
        </div>

        {student.accessSuspendedAt && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-red-800">
              ⚠️ دسترسی این کاربر در تاریخ {new Date(student.accessSuspendedAt).toLocaleDateString('fa-IR')} مسدود شده است.
            </span>
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-blue-700 font-medium">تعداد گزارش‌ها:</span>
            <span className="text-blue-900 font-bold mr-2">{student._count?.reports || 0}</span>
          </div>
          <div className="bg-purple-50 px-4 py-2 rounded-lg">
            <span className="text-purple-700 font-medium">چالش‌های شرکت‌کرده:</span>
            <span className="text-purple-900 font-bold mr-2">{student._count?.challengeParticipations || 0}</span>
          </div>
        </div>
      </div>

      {/* نمودار پیشرفت */}
      <div className="mb-6">
        <ProgressChart />
      </div>

      {/* جدول گزارش‌ها */}
      <div className="mb-6">
        <ReportsTable studentId={studentId} initialReports={reports} />
      </div>

      {/* تاریخچه گزارش‌ها و بازخوردها */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">تاریخچه گزارش‌ها و بازخوردهای ادمین</h2>
        {history.length > 0 ? (
          <div className="reports-container max-h-[500px] overflow-y-auto">
            <ReportHistory reports={history} />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            هیچ گزارشی برای نمایش وجود ندارد
          </div>
        )}
      </div>
    </AdminLayout>
  );
}




