export interface InstagramProfile {
  id: string;
  username: string;
  fullName?: string;
  biography?: string;
  profilePictureUrl?: string;
  followersCount: number;
  mediaCount: number;
  isVerified: boolean;
  profileUrl: string;
}

export interface ProspectStatus {
  status: 'pending' | 'sent' | 'replied' | 'converted' | 'ignored';
  contactedAt?: string;
  dmText?: string;
}

export type ScoredProfile = InstagramProfile & {
  score: 'ideal' | 'ok' | 'ignore';
  prospectStatus?: ProspectStatus;
}

export interface InstagramSearchResponse {
  data: ScoredProfile[];
  count: number;
  filteredCount: number;
}
