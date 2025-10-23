import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useAdminReports(params: { studentId?: string; status?: 'PENDING'|'APPROVED'|'REJECTED'; page: number }) {
  const q = new URLSearchParams();
  if (params.studentId) q.set('studentId', params.studentId);
  if (params.status) q.set('status', params.status);
  q.set('page', String(params.page));
  return useQuery({
    queryKey: ['adminReports', params],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports?${q.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load reports');
      return res.json();
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminReport(reportId: string) {
  return useQuery({
    queryKey: ['adminReport', reportId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports/${reportId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load report');
      return res.json();
    },
    enabled: Boolean(reportId),
  });
}

export function useAdminFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { reportId: string; content: string; decision: 'APPROVED'|'REJECTED' }) => {
      const res = await fetch(`/api/admin/reports/${args.reportId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: args.content, decision: args.decision }),
      });
      if (!res.ok) throw new Error('Failed to submit feedback');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminReports'] });
    },
  });
}




