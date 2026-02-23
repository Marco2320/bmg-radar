import { Comment, Submission, SubmissionStatus, User, Vote } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

interface SubmissionListResponse {
  items: (Submission & { vote_count: number; comment_count: number })[];
  total: number;
  page: number;
  page_size: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiStore = {
  async getSubmissions(): Promise<Submission[]> {
    const result = await request<SubmissionListResponse>('/submissions?sort=newest&page=1&page_size=500');
    return result.items;
  },

  async getSubmission(id: string): Promise<Submission | null> {
    try {
      return await request<Submission>(`/submissions/${id}`);
    } catch {
      return null;
    }
  },

  async addSubmission(data: Omit<Submission, 'id' | 'created_at' | 'status'>): Promise<Submission> {
    return request<Submission>('/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateStatus(id: string, status: SubmissionStatus): Promise<void> {
    await request<void>(`/submissions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getVotes(submissionId: string): Promise<Vote[]> {
    return request<Vote[]>(`/submissions/${submissionId}/votes`);
  },

  async getVoteCount(submissionId: string): Promise<number> {
    const result = await request<{ count: number }>(`/submissions/${submissionId}/votes/count`);
    return result.count;
  },

  async hasVoted(submissionId: string, userId: string): Promise<boolean> {
    const result = await request<{ has_voted: boolean }>(
      `/submissions/${submissionId}/votes/has-voted?user_id=${encodeURIComponent(userId)}`,
    );
    return result.has_voted;
  },

  async toggleVote(submissionId: string, userId: string): Promise<boolean> {
    const result = await request<{ voted: boolean }>(`/submissions/${submissionId}/votes/toggle`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
    return result.voted;
  },

  async getComments(submissionId: string): Promise<Comment[]> {
    return request<Comment[]>(`/submissions/${submissionId}/comments`);
  },

  async getCommentCount(submissionId: string): Promise<number> {
    const result = await request<{ count: number }>(`/submissions/${submissionId}/comments/count`);
    return result.count;
  },

  async addComment(submissionId: string, userId: string, text: string): Promise<Comment> {
    return request<Comment>(`/submissions/${submissionId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, comment_text: text }),
    });
  },

  async getUser(id: string): Promise<User | null> {
    try {
      return await request<User>(`/users/${id}`);
    } catch {
      return null;
    }
  },

  async getUsers(): Promise<User[]> {
    return request<User[]>('/users');
  },

  async getAllVotes(): Promise<Vote[]> {
    return request<Vote[]>('/votes');
  },
};
