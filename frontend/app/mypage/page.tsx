'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { OrderBadge } from '@/components/Badges';
import RequireRole from '@/components/RequireRole';
import { Empty, Spinner } from '@/components/States';
import { useMe } from '@/lib/auth';
import { formatDay, formatDuration, formatMonthDay, formatPrice, possessive } from '@/lib/format';
import type { MyOrder } from '@/lib/types';

export default function MyPage() {
  return (
    <RequireRole role="USER">
      <Suspense fallback={<Spinner />}>
        <MyPageContent />
      </Suspense>
    </RequireRole>
  );
}

const PROVIDER_LABEL = { KAKAO: '카카오', NAVER: '네이버', DEV: '개발용' } as const;

function MyPageContent() {
  const { user } = useMe();
  const applied = useSearchParams().get('applied');
  // 관리자가 입금 확인하면 창 포커스/주기적 갱신으로 상태 뱃지가 반영된다
  const { data: orders, isLoading } = useSWR<MyOrder[]>('/me/orders', { revalidateOnFocus: true, refreshInterval: 30_000 });

  if (!user) return null;

  return (
    <div className="container-app space-y-10 pt-8">
      {applied && (
        <div className="rounded-2xl border border-accent/30 bg-accent-soft p-4 text-sm leading-relaxed text-ink">
          합류 신청이 접수되었어요. 관리자가 입금을 확인하면 <b>멤버 확정</b>으로 바뀌고, 모임 장소와 멤버 단톡방이 열려요.
        </div>
      )}

      <section className="flex items-center gap-4">
        <div className="h-14 w-14 overflow-hidden rounded-full bg-ivory-deep">
          {user.profileImg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.profileImg} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <p className="font-serif text-xl font-medium">{user.name}</p>
          <p className="text-xs text-muted">
            {PROVIDER_LABEL[user.provider]} 로그인
            {user.instagramId && ` · @${user.instagramId}`}
          </p>
        </div>
      </section>

      <section>
        <p className="eyebrow">My Memberships</p>
        <h2 className="mb-5 mt-1 font-serif text-lg font-medium">나의 클럽</h2>
        {isLoading ? (
          <Spinner />
        ) : !orders?.length ? (
          <Empty>
            아직 합류한 클럽이 없어요.
            <div className="mt-4">
              <Link href="/" className="btn-outline">
                클럽 둘러보기
              </Link>
            </div>
          </Empty>
        ) : (
          <ul className="space-y-4">
            {orders.map((o) => (
              <MembershipCard key={o.id} order={o} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MembershipCard({ order: o }: { order: MyOrder }) {
  const [open, setOpen] = useState(o.displayStatus === 'CONFIRMED');
  const confirmed = o.displayStatus === 'CONFIRMED' || o.displayStatus === 'COMPLETED';
  const { season } = o;

  return (
    <li className="overflow-hidden rounded-3xl border border-line bg-paper">
      <Link href={`/clubs/${season.club.id}`} className="flex gap-4 p-4">
        <div className="aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-2xl bg-ivory-deep">
          {season.club.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={season.club.coverImage} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] uppercase tracking-label text-muted">Season {season.number}</p>
            <OrderBadge status={o.displayStatus} />
          </div>
          <p className="mt-1 truncate font-display text-[26px] italic leading-none">{possessive(season.club.displayName)} Club</p>
          <p className="mt-2 text-xs text-muted">
            {formatDay(season.startDate)} — {formatDay(season.endDate)}
          </p>
          <p className="mt-0.5 text-xs text-muted">{formatPrice(o.amount)}</p>
        </div>
      </Link>

      {confirmed && (
        <div className="border-t border-line">
          <button onClick={() => setOpen(!open)} className="w-full px-5 py-3 text-left text-xs font-medium text-ink-soft">
            {open ? '시즌 일정 접기 ▲' : '시즌 일정 · 장소 보기 ▼'}
          </button>
          {open && (
            <div className="space-y-4 px-5 pb-5">
              <ol className="space-y-3">
                {season.sessions.map((s) => (
                  <li key={s.id} className="flex gap-3 text-sm">
                    <span className="w-6 shrink-0 font-display text-lg italic leading-5 text-accent">{s.round}</span>
                    <div className="min-w-0">
                      <p className="font-medium">{s.title}</p>
                      <p className="text-xs text-muted">
                        {s.scheduledAt ? `${formatMonthDay(s.scheduledAt)} · ` : ''}
                        {formatDuration(s.durationMinutes)} · {s.locationText}
                      </p>
                      {s.address && <p className="text-xs text-ink-soft">{s.address}</p>}
                    </div>
                  </li>
                ))}
              </ol>
              {season.openChatUrl && (
                <a href={season.openChatUrl} target="_blank" rel="noreferrer" className="btn-primary w-full">
                  멤버 단톡방 입장하기
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
