import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useNotifications() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/student/notifications', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load notifications');
      return res.json() as Promise<Array<{ id: string; content: string; createdAt: string; readAt?: string }>>
    },
    refetchInterval: 60_000,
  });

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      await fetch('/api/student/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return { ...query, markRead } as const;
}


