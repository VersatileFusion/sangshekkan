import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useAdminStudents(page: number) {
  return useQuery({
    queryKey: ['adminStudents', page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/students?page=${page}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load students');
      return res.json();
    },
    keepPreviousData: true,
  });
}

export function useToggleSuspension() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, suspend }: { studentId: string; suspend: boolean }) => {
      const res = await fetch(`/api/admin/students/${studentId}/toggle-suspension`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ suspend }),
      });
      if (!res.ok) throw new Error('Failed to toggle suspension');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminStudents'] });
      qc.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
}




