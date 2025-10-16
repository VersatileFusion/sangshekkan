import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ==================== CHALLENGES ====================

export function useAdminChallenges(page: number = 1) {
  return useQuery({
    queryKey: ['adminChallenges', page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/challenges?page=${page}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load challenges');
      return res.json();
    },
    keepPreviousData: true,
  });
}

export function useCreateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create challenge');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminChallenges'] });
    },
  });
}

export function useUpdateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/challenges/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update challenge');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminChallenges'] });
    },
  });
}

export function useDeleteChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/challenges/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete challenge');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminChallenges'] });
    },
  });
}

// ==================== VIDEOS ====================

export function useAdminVideos(page: number = 1, category?: string) {
  return useQuery({
    queryKey: ['adminVideos', page, category],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString() });
      if (category && category !== 'all') {
        params.append('category', category);
      }
      const res = await fetch(`/api/admin/videos?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load videos');
      return res.json();
    },
    keepPreviousData: true,
  });
}

export function useCreateVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create video');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminVideos'] });
    },
  });
}

export function useUpdateVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update video');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminVideos'] });
    },
  });
}

export function useDeleteVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete video');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminVideos'] });
    },
  });
}




