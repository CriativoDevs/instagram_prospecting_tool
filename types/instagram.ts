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
  latitude?: number;
  longitude?: number;
  city?: string;
}

export interface ScoredProfileGeo {
  distanceKm?: number;
}

export interface ProspectStatus {
  status: 'pending' | 'sent' | 'replied' | 'converted' | 'ignored' | 'rejected';
  contactedAt?: string;
  repliedAt?: string;
  convertedAt?: string;
  rejectedAt?: string;
  dmText?: string;
}

export type ScoredProfile = InstagramProfile & ScoredProfileGeo & {
  score: 'ideal' | 'ok' | 'ignore';
  prospectStatus?: ProspectStatus;
}

export interface InstagramSearchResponse {
  data: ScoredProfile[];
  count: number;
  filteredCount: number;
}
