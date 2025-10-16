import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useStudentReports(period: 'weekly' | 'monthly' | 'all') {
  return useQuery({
    queryKey: ['studentReports', period],
    queryFn: async () => {
      const res = await fetch(`/api/student/reports?period=${period}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load reports');
      return res.json();
    },
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch('/api/student/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create report');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studentReports'] });
      qc.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}




