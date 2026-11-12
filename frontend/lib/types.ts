export type Role = 'USER' | 'HOST' | 'ADMIN';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED';
export type DisplayStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
export type RecruitStatus = 'OPEN' | 'CLOSED';

export interface User {
  id: string;
  provider: 'KAKAO' | 'NAVER' | 'DEV';
  snsId: string;
  email: string | null;
  name: string;
  instagramId: string | null;
  profileImg: string | null;
  role: Role;
  createdAt: string;
}

export interface HostSummary {
  id: string;
  name: string;
  instagramId: string | null;
  profileImg: string | null;
}

export type SeasonPhase = 'RECRUITING' | 'FULL' | 'IN_PROGRESS' | 'ENDED';
export type VenueStatus = 'REQUESTED' | 'FIXED';

export interface SeasonSummary {
  id: string;
  clubId: string;
  number: number;
  price: number;
  maxCapacity: number;
  startDate: string;
  endDate: string;
  appliedCount: number;
  recruitStatus: RecruitStatus;
  phase: SeasonPhase;
}

export interface SeasonSession {
  id: string;
  round: number;
  title: string;
  description: string | null;
  durationMinutes: number;
  spaceId: string | null;
  locationText: string;
  venueStatus: VenueStatus;
  scheduledAt: string | null;
  /** 예약 확정 멤버/호스트/관리자에게만 */
  address?: string | null;
}

export interface ClubCard {
  id: string;
  hostId: string;
  displayName: string;
  moodTags: string[];
  coverImage: string | null;
  intro: string;
  instagramFollowers: number | null;
  isFeatured: boolean;
  host: HostSummary;
  season: SeasonSummary | null;
}

export interface ClubDetail {
  id: string;
  hostId: string;
  displayName: string;
  moodTags: string[];
  gallery: string[];
  intro: string;
  benefits: string[];
  instagramFollowers: number | null;
  host: HostSummary;
  seasonCount: number;
  season: (SeasonSummary & { sessions: SeasonSession[]; openChatUrl?: string | null }) | null;
  myOrder: { id: string; status: OrderStatus; displayStatus: DisplayStatus } | null;
}

export interface HostSeason {
  id: string;
  number: number;
  price: number;
  maxCapacity: number;
  startDate: string;
  endDate: string;
  openChatUrl: string | null;
  confirmedCount: number;
  pendingCount: number;
  appliedCount: number;
  phase: SeasonPhase;
  sessions: (SeasonSession & { space: { name: string; address: string } | null })[];
}

export interface HostClub {
  id: string;
  createdAt: string;
  isFeatured: boolean;
  displayName: string;
  moodTags: string[];
  gallery: string[];
  intro: string;
  benefits: string[];
  instagramFollowers: number | null;
  seasons: HostSeason[];
}

export interface MyOrder {
  id: string;
  status: OrderStatus;
  displayStatus: DisplayStatus;
  amount: number;
  applicantName: string;
  contact: string;
  instagramId: string;
  appliedAt: string;
  season: {
    id: string;
    number: number;
    startDate: string;
    endDate: string;
    club: { id: string; displayName: string; coverImage: string | null };
    sessions: SeasonSession[];
    openChatUrl?: string | null;
  };
}

export interface MemberRow {
  id: string;
  applicantName: string;
  instagramId: string;
  contact: string;
  status: OrderStatus;
  amount: number;
  appliedAt: string;
}

export interface AdminOrder {
  id: string;
  status: OrderStatus;
  amount: number;
  applicantName: string;
  contact: string;
  instagramId: string;
  appliedAt: string;
  user: { id: string; name: string };
  season: { id: string; number: number; startDate: string; club: { id: string; displayName: string } };
}

export interface AdminClub extends Omit<ClubCard, 'host'> {
  host: HostSummary;
  _count: { seasons: number };
}

export interface AdminSession extends SeasonSession {
  space: { name: string; address: string; priceCondition: string } | null;
  season: { id: string; number: number; startDate: string; club: { id: string; displayName: string } };
}

export interface MoodTag {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Space {
  id: string;
  name: string;
  address: string;
  priceCondition: string;
  description: string | null;
}

/** 호스트 1명이 동시에 운영할 수 있는 하우스 수 (backend MAX_CLUBS_PER_HOST와 동일) */
export const MAX_HOUSES = 3;

export interface AppConfig {
  bank: { name: string; accountNumber: string; holder: string };
}

export interface AuthProviders {
  kakao: boolean;
  naver: boolean;
  dev: boolean;
}
