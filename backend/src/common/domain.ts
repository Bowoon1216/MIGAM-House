import { OrderStatus, Role } from '@prisma/client';

/** 정원 계산에 포함되는 신청 상태 */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED];

export type RecruitStatus = 'OPEN' | 'CLOSED';

/** 시즌 모집 상태: 시즌 시작 전 + 정원 미달일 때만 모집 중 */
export function recruitStatus(
  season: { startDate: Date; maxCapacity: number },
  activeCount: number,
  now = new Date(),
): RecruitStatus {
  if (season.startDate.getTime() <= now.getTime()) return 'CLOSED';
  if (activeCount >= season.maxCapacity) return 'CLOSED';
  return 'OPEN';
}

/** 클럽 카드/상세에 노출되는 시즌 단계 */
export type SeasonPhase = 'RECRUITING' | 'FULL' | 'IN_PROGRESS' | 'ENDED';

export function seasonPhase(
  season: { startDate: Date; endDate: Date; maxCapacity: number },
  activeCount: number,
  now = new Date(),
): SeasonPhase {
  if (season.endDate.getTime() <= now.getTime()) return 'ENDED';
  if (season.startDate.getTime() <= now.getTime()) return 'IN_PROGRESS';
  return activeCount >= season.maxCapacity ? 'FULL' : 'RECRUITING';
}

/** 시즌 시작일로부터 4개월 뒤 종료일 */
/** 호스트 1명이 동시에 운영할 수 있는 하우스 수 */
export const MAX_CLUBS_PER_HOST = 3;

export const SEASON_MONTHS = 4;
export function seasonEndDate(startDate: Date): Date {
  const end = new Date(startDate);
  end.setMonth(end.getMonth() + SEASON_MONTHS);
  return end;
}

/** 마이페이지 표시용 상태 (시즌 종료는 별도 DB 상태 없이 계산) */
export type DisplayStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';

export function displayStatus(status: OrderStatus, seasonEndDate: Date, now = new Date()): DisplayStatus {
  if (status === OrderStatus.CONFIRMED && seasonEndDate.getTime() <= now.getTime()) return 'COMPLETED';
  return status;
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELED],
  CONFIRMED: [OrderStatus.CANCELED],
  CANCELED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** 회차별 정확한 주소 / 오픈채팅 링크 열람 가능 여부 */
export function canSeePrivateInfo(params: {
  viewer?: { id: string; role: Role } | null;
  hostId: string;
  viewerOrderStatus?: OrderStatus | null;
}): boolean {
  const { viewer, hostId, viewerOrderStatus } = params;
  if (!viewer) return false;
  if (viewer.role === Role.ADMIN) return true;
  if (viewer.id === hostId) return true;
  return viewerOrderStatus === OrderStatus.CONFIRMED;
}

/** 오픈 리다이렉트 방지: 같은 사이트 내 경로만 허용 */
export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string') return '/';
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
  return value;
}
