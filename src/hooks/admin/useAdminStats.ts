import { useQuery } from '@tanstack/react-query';

export function useAdminStats() {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const [studentsRes, reportsRes] = await Promise.all([
        fetch('/api/admin/students?page=1&pageSize=1', { credentials: 'include' }),
        fetch('/api/admin/reports?status=PENDING&page=1&pageSize=1', { credentials: 'include' }),
      ]);
      if (!studentsRes.ok || !reportsRes.ok) throw new Error('Failed to load stats');
      const students = await studentsRes.json();
      const reports = await reportsRes.json();
      return { totalStudents: students.total as number, pendingReports: reports.total as number };
    },
    staleTime: 30_000,
  });
}




