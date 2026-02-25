export type UserRole = 'employee' | 'ar' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type Platform = 
  | 'Spotify'
  | 'YouTube'
  | 'TikTok'
  | 'Instagram'
  | 'Apple Music'
  | 'SoundCloud'
  | 'Bandcamp'
  | 'Other';

export type SubmissionStatus = 'New' | 'Opened' | 'Reviewed' | 'Passed' | 'Shortlisted';

export interface SubmissionLink {
  id: string;
  submission_id: string;
  platform: Platform;
  url: string;
  created_at: string;
}

export interface Submission {
  id: string;
  artist_name: string;
  territory: string;
  genre: string;
  custom_genre?: string;
  rationale: string;
  submitted_by: string;
  status: SubmissionStatus;
  created_at: string;
  links: SubmissionLink[];
  image_url?: string;
}

export interface Reaction {
  id: string;
  submission_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  submission_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
}

export const PLATFORMS: Platform[] = [
  'Spotify', 'YouTube', 'TikTok', 'Instagram', 'Apple Music', 'SoundCloud', 'Bandcamp', 'Other'
];

export const PLATFORM_PLACEHOLDERS: Record<Platform, string> = {
  'Spotify': 'https://open.spotify.com/artist/...',
  'YouTube': 'https://www.youtube.com/@...',
  'TikTok': 'https://www.tiktok.com/@...',
  'Instagram': 'https://www.instagram.com/...',
  'Apple Music': 'https://music.apple.com/...',
  'SoundCloud': 'https://soundcloud.com/...',
  'Bandcamp': 'https://artistname.bandcamp.com',
  'Other': 'https://...',
};

export const TERRITORIES = [
  'North America', 'Latin America', 'Brazil', 'Mexico', 'UK', 'GSA', 'France',
  'Nordics', 'Southern Europe', 'Eastern Europe', 'Asia Pacific',
  'Africa', 'Middle East', 'Australia/NZ',
];

export const GENRES = [
  'Pop', 'Rock', 'Hip-Hop/Rap', 'R&B/Soul', 'Electronic/Dance',
  'Country', 'Latin', 'Jazz', 'Classical', 'Folk', 'Metal',
  'Indie', 'K-Pop', 'Afrobeats', 'Reggaeton', 'Other',
];

export const STATUSES: SubmissionStatus[] = ['New', 'Opened', 'Reviewed', 'Passed', 'Shortlisted'];
