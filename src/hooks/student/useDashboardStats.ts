import { useQuery } from '@tanstack/react-query';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await fetch('/api/student/dashboard-stats', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load stats');
      return res.json() as Promise<{ approved: number; rejected: number; pending: number }>
    },
    staleTime: 30_000,
  });
}




