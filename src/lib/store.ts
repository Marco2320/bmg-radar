import { Submission, Vote, Comment, User } from '@/types';

// Mock users
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Sarah Chen', email: 'sarah.chen@bmg.com', role: 'employee' },
  { id: 'u2', name: 'Marcus Webb', email: 'marcus.webb@bmg.com', role: 'ar' },
  { id: 'u3', name: 'Laura Müller', email: 'laura.muller@bmg.com', role: 'employee' },
  { id: 'u4', name: 'James Okafor', email: 'james.okafor@bmg.com', role: 'employee' },
];

let submissions: Submission[] = [
  {
    id: 's1', artist_name: 'Mira Voss', territory: 'DACH', genre: 'Electronic/Dance',
    rationale: 'Strong streaming growth in DACH region. Unique blend of techno and ambient. Building organic following on TikTok with 50k+ followers.',
    submitted_by: 'u1', status: 'New', created_at: '2026-02-18T10:30:00Z',
    links: [
      { id: 'l1', submission_id: 's1', platform: 'Spotify', url: 'https://open.spotify.com/artist/mira-voss', created_at: '2026-02-18T10:30:00Z' },
      { id: 'l2', submission_id: 's1', platform: 'TikTok', url: 'https://www.tiktok.com/@miravoss', created_at: '2026-02-18T10:30:00Z' },
    ],
  },
  {
    id: 's2', artist_name: 'Kofi Mensah', territory: 'Africa', genre: 'Afrobeats',
    rationale: 'Viral single in Ghana, crossing over to UK audiences. Independently released 3 EPs with consistent quality improvement.',
    submitted_by: 'u4', status: 'Reviewed', created_at: '2026-02-16T14:00:00Z',
    links: [
      { id: 'l3', submission_id: 's2', platform: 'YouTube', url: 'https://www.youtube.com/@kofimensah', created_at: '2026-02-16T14:00:00Z' },
      { id: 'l4', submission_id: 's2', platform: 'Spotify', url: 'https://open.spotify.com/artist/kofi-mensah', created_at: '2026-02-16T14:00:00Z' },
      { id: 'l5', submission_id: 's2', platform: 'Instagram', url: 'https://www.instagram.com/kofimensah', created_at: '2026-02-16T14:00:00Z' },
    ],
  },
  {
    id: 's3', artist_name: 'Luna Park', territory: 'Asia Pacific', genre: 'K-Pop',
    rationale: 'Solo artist with strong vocal range and self-produced tracks. Growing international fanbase through YouTube covers.',
    submitted_by: 'u3', status: 'Shortlisted', created_at: '2026-02-14T09:15:00Z',
    links: [
      { id: 'l6', submission_id: 's3', platform: 'YouTube', url: 'https://www.youtube.com/@lunapark', created_at: '2026-02-14T09:15:00Z' },
      { id: 'l7', submission_id: 's3', platform: 'Apple Music', url: 'https://music.apple.com/lunapark', created_at: '2026-02-14T09:15:00Z' },
    ],
  },
  {
    id: 's4', artist_name: 'The Drifters Club', territory: 'UK', genre: 'Indie',
    rationale: 'Sold-out headline shows in London and Manchester. BBC Radio 6 support. Ready for label backing to scale.',
    submitted_by: 'u1', status: 'New', created_at: '2026-02-20T16:45:00Z',
    links: [
      { id: 'l8', submission_id: 's4', platform: 'Bandcamp', url: 'https://thedriftersclub.bandcamp.com', created_at: '2026-02-20T16:45:00Z' },
      { id: 'l9', submission_id: 's4', platform: 'Spotify', url: 'https://open.spotify.com/artist/thedriftersclub', created_at: '2026-02-20T16:45:00Z' },
    ],
  },
];

let votes: Vote[] = [
  { id: 'v1', submission_id: 's1', user_id: 'u3', created_at: '2026-02-18T12:00:00Z' },
  { id: 'v2', submission_id: 's1', user_id: 'u4', created_at: '2026-02-18T13:00:00Z' },
  { id: 'v3', submission_id: 's2', user_id: 'u1', created_at: '2026-02-17T09:00:00Z' },
  { id: 'v4', submission_id: 's2', user_id: 'u3', created_at: '2026-02-17T10:00:00Z' },
  { id: 'v5', submission_id: 's2', user_id: 'u2', created_at: '2026-02-17T11:00:00Z' },
  { id: 'v6', submission_id: 's3', user_id: 'u1', created_at: '2026-02-15T08:00:00Z' },
  { id: 'v7', submission_id: 's3', user_id: 'u2', created_at: '2026-02-15T09:00:00Z' },
  { id: 'v8', submission_id: 's3', user_id: 'u3', created_at: '2026-02-15T10:00:00Z' },
  { id: 'v9', submission_id: 's3', user_id: 'u4', created_at: '2026-02-15T11:00:00Z' },
  { id: 'v10', submission_id: 's4', user_id: 'u2', created_at: '2026-02-20T17:00:00Z' },
];

let comments: Comment[] = [
  { id: 'c1', submission_id: 's1', user_id: 'u3', comment_text: 'Saw her live in Berlin — incredible presence on stage.', created_at: '2026-02-18T14:00:00Z' },
  { id: 'c2', submission_id: 's2', user_id: 'u2', comment_text: 'The crossover potential here is real. Worth a deep dive.', created_at: '2026-02-17T15:00:00Z' },
  { id: 'c3', submission_id: 's3', user_id: 'u1', comment_text: 'Production quality is surprisingly high for an independent artist.', created_at: '2026-02-15T12:00:00Z' },
  { id: 'c4', submission_id: 's3', user_id: 'u4', comment_text: 'Agreed. Her vocal range is remarkable.', created_at: '2026-02-15T14:00:00Z' },
];

let nextId = 100;
const genId = () => String(++nextId);

// --- Store API ---

export const store = {
  getSubmissions: () => [...submissions],
  getSubmission: (id: string) => submissions.find(s => s.id === id) || null,

  addSubmission: (data: Omit<Submission, 'id' | 'created_at' | 'status'>) => {
    const sub: Submission = {
      ...data,
      id: genId(),
      status: 'New',
      created_at: new Date().toISOString(),
      links: data.links.map(l => ({ ...l, id: genId(), submission_id: '', created_at: new Date().toISOString() })),
    };
    sub.links = sub.links.map(l => ({ ...l, submission_id: sub.id }));
    submissions = [sub, ...submissions];
    return sub;
  },

  updateStatus: (id: string, status: Submission['status']) => {
    submissions = submissions.map(s => s.id === id ? { ...s, status } : s);
  },

  getVotes: (submissionId: string) => votes.filter(v => v.submission_id === submissionId),
  getVoteCount: (submissionId: string) => votes.filter(v => v.submission_id === submissionId).length,
  hasVoted: (submissionId: string, userId: string) => votes.some(v => v.submission_id === submissionId && v.user_id === userId),

  toggleVote: (submissionId: string, userId: string) => {
    const existing = votes.find(v => v.submission_id === submissionId && v.user_id === userId);
    if (existing) {
      votes = votes.filter(v => v.id !== existing.id);
      return false;
    }
    votes = [...votes, { id: genId(), submission_id: submissionId, user_id: userId, created_at: new Date().toISOString() }];
    return true;
  },

  getComments: (submissionId: string) => comments.filter(c => c.submission_id === submissionId).sort((a, b) => a.created_at.localeCompare(b.created_at)),
  getCommentCount: (submissionId: string) => comments.filter(c => c.submission_id === submissionId).length,

  addComment: (submissionId: string, userId: string, text: string) => {
    const comment: Comment = { id: genId(), submission_id: submissionId, user_id: userId, comment_text: text, created_at: new Date().toISOString() };
    comments = [...comments, comment];
    return comment;
  },

  getUser: (id: string) => MOCK_USERS.find(u => u.id === id) || null,
  getAllVotes: () => [...votes],
};
