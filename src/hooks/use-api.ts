import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiStore } from '@/lib/api-store';
import { SubmissionStatus } from '@/types';

// ---- Users ----

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiStore.getUsers(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => apiStore.getUser(id),
    enabled: !!id,
  });
}

// ---- Submissions ----

export function useSubmissions() {
  return useQuery({
    queryKey: ['submissions'],
    queryFn: () => apiStore.getSubmissions(),
  });
}

export function useSubmission(id: string) {
  return useQuery({
    queryKey: ['submissions', id],
    queryFn: () => apiStore.getSubmission(id),
    enabled: !!id,
  });
}

export function useAddSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: apiStore.addSubmission,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] }),
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SubmissionStatus }) =>
      apiStore.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] }),
  });
}

// ---- Votes ----

export function useAllVotes() {
  return useQuery({
    queryKey: ['votes'],
    queryFn: () => apiStore.getAllVotes(),
  });
}

export function useVoteCount(submissionId: string) {
  return useQuery({
    queryKey: ['votes', submissionId, 'count'],
    queryFn: () => apiStore.getVoteCount(submissionId),
    enabled: !!submissionId,
  });
}

export function useHasVoted(submissionId: string, userId: string) {
  return useQuery({
    queryKey: ['votes', submissionId, 'hasVoted', userId],
    queryFn: () => apiStore.hasVoted(submissionId, userId),
    enabled: !!submissionId && !!userId,
  });
}

export function useToggleVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, userId }: { submissionId: string; userId: string }) =>
      apiStore.toggleVote(submissionId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['votes'] });
    },
  });
}

// ---- Comments ----

export function useComments(submissionId: string) {
  return useQuery({
    queryKey: ['comments', submissionId],
    queryFn: () => apiStore.getComments(submissionId),
    enabled: !!submissionId,
  });
}

export function useCommentCount(submissionId: string) {
  return useQuery({
    queryKey: ['comments', submissionId, 'count'],
    queryFn: () => apiStore.getCommentCount(submissionId),
    enabled: !!submissionId,
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, userId, text }: { submissionId: string; userId: string; text: string }) =>
      apiStore.addComment(submissionId, userId, text),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['comments', vars.submissionId] });
    },
  });
}
