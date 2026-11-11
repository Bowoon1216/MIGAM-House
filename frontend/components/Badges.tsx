import type { DisplayStatus, OrderStatus, SeasonPhase, VenueStatus } from '@/lib/types';

export const phaseLabel = (phase: SeasonPhase, number: number) =>
  ({
    RECRUITING: `시즌 ${number} 멤버 모집 중`,
    FULL: `시즌 ${number} 모집 마감`,
    IN_PROGRESS: `시즌 ${number} 진행 중`,
    ENDED: '다음 시즌 준비 중',
  })[phase];

export function PhaseBadge({ phase, number, onImage }: { phase: SeasonPhase; number: number; onImage?: boolean }) {
  const live = phase === 'RECRUITING';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        onImage ? 'bg-black/35 text-white backdrop-blur-sm' : live ? 'bg-accent-soft text-accent' : 'bg-ivory-deep text-muted'
      }`}
    >
      {live && <span className={`h-1.5 w-1.5 rounded-full ${onImage ? 'bg-white' : 'bg-accent'} animate-pulse`} />}
      {phaseLabel(phase, number)}
    </span>
  );
}

const DISPLAY: Record<DisplayStatus, [string, string]> = {
  PENDING: ['입금 확인 중', 'bg-ivory-deep text-ink-soft'],
  CONFIRMED: ['멤버 확정', 'bg-ink text-ivory'],
  COMPLETED: ['시즌 종료', 'bg-accent-soft text-accent'],
  CANCELED: ['취소/환불', 'bg-red-50 text-red-600'],
};

export function OrderBadge({ status }: { status: DisplayStatus }) {
  const [label, cls] = DISPLAY[status];
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span>;
}

const ADMIN: Record<OrderStatus, [string, string]> = {
  PENDING: ['입금 대기', 'bg-amber-100 text-amber-800'],
  CONFIRMED: ['예약 확정', 'bg-ink text-ivory'],
  CANCELED: ['취소/환불', 'bg-red-50 text-red-600'],
};

export function PaymentBadge({ status }: { status: OrderStatus }) {
  const [label, cls] = ADMIN[status];
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

export function VenueBadge({ status, hasSpace }: { status: VenueStatus; hasSpace: boolean }) {
  if (!hasSpace) return <span className="whitespace-nowrap rounded-full bg-ivory-deep px-2 py-0.5 text-xs text-muted">장소 미정</span>;
  return status === 'FIXED' ? (
    <span className="whitespace-nowrap rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">대관 확정</span>
  ) : (
    <span className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">대관 요청</span>
  );
}
