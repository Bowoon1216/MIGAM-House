'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { PaymentBadge, PhaseBadge, VenueBadge } from '@/components/Badges';
import RequireRole from '@/components/RequireRole';
import { Empty, Spinner } from '@/components/States';
import { formatDateTime, formatDay, formatDuration, formatMonthDay, formatPhone, formatPrice, possessive } from '@/lib/format';
import type { HostClub, HostSeason, MemberRow } from '@/lib/types';

export default function HostDashboard() {
  return (
    <RequireRole role="HOST">
      <Dashboard />
    </RequireRole>
  );
}

function Dashboard() {
  const { data: club, isLoading } = useSWR<HostClub | null>('/host/club');
  const [selected, setSelected] = useState<string | null>(null);

  if (isLoading) return <Spinner />;

  if (!club) {
    return (
      <div className="container-app py-20 text-center">
        <p className="eyebrow">Host Center</p>
        <h1 className="mt-3 font-serif text-2xl font-medium leading-snug">
          나만의 프라이빗 클럽을
          <br />
          열어볼까요?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          사진과 글만 넣으면, 나를 위한 클럽 페이지가 자동으로 만들어져요.
          <br />4개월 동안 한 달에 한 번, 팬들과 오프라인에서 만나요.
        </p>
        <Link href="/host/season/new" className="btn-primary mt-8 px-8 py-3.5">
          첫 시즌 오픈하기
        </Link>
      </div>
    );
  }

  const season = club.seasons.find((s) => s.id === selected) ?? club.seasons[0];
  const recruiting = club.seasons.some((s) => s.phase === 'RECRUITING' || s.phase === 'FULL');

  return (
    <div className="container-wide max-w-4xl pt-8">
      {/* 클럽 헤더 */}
      <section className="flex items-center gap-4">
        <div className="aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-xl bg-ivory-deep sm:w-20">
          {club.gallery[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={club.gallery[0]} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Host Center</p>
          <h1 className="mt-1 truncate font-display text-3xl italic leading-none sm:text-4xl">
            {possessive(club.displayName)} Private Club
          </h1>
          <p className="mt-2 text-xs text-muted">{club.moodTags.map((t) => `#${t}`).join(' ')}</p>
        </div>
      </section>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/host/edit" className="btn-primary btn-sm">
          클럽 페이지 수정
        </Link>
        <Link href={`/clubs/${club.id}`} className="btn-outline btn-sm">
          내 클럽 페이지 보기
        </Link>
        {recruiting ? (
          <span className="btn-sm btn cursor-default text-muted">모집 중인 시즌이 시작되면 다음 시즌을 열 수 있어요</span>
        ) : (
          <Link href="/host/season/new" className="btn-outline btn-sm">
            + 새 시즌 오픈하기
          </Link>
        )}
      </div>

      {/* 시즌 탭 */}
      <nav className="no-scrollbar mt-10 flex gap-5 overflow-x-auto border-b border-line text-sm">
        {club.seasons.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(s.id)}
            className={`-mb-px shrink-0 border-b-2 pb-2.5 font-medium ${
              s.id === season?.id ? 'border-ink' : 'border-transparent text-muted'
            }`}
          >
            시즌 {s.number}
          </button>
        ))}
      </nav>

      {season && <SeasonPanel season={season} />}
    </div>
  );
}

function SeasonPanel({ season }: { season: HostSeason }) {
  const { data: members, isLoading } = useSWR<MemberRow[]>(`/host/seasons/${season.id}/members`);

  return (
    <div className="space-y-10 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PhaseBadge phase={season.phase} number={season.number} />
        <p className="text-xs text-muted">
          {formatDay(season.startDate)} — {formatDay(season.endDate)} · {formatPrice(season.price)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="정원" value={`${season.maxCapacity}명`} />
        <Stat label="멤버 확정" value={`${season.confirmedCount}명`} accent />
        <Stat label="입금 대기" value={`${season.pendingCount}명`} />
      </div>

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium">
          시즌 {season.number} 멤버 <span className="text-sm text-muted">(총 {season.appliedCount}명)</span>
        </h2>
        {isLoading ? (
          <Spinner />
        ) : !members?.length ? (
          <Empty>아직 합류한 멤버가 없어요. 인스타그램에 클럽 페이지를 공유해보세요!</Empty>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[540px] text-sm">
              <thead className="border-b border-line text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 font-normal">이름</th>
                  <th className="px-4 py-3 font-normal">인스타 ID</th>
                  <th className="px-4 py-3 font-normal">연락처</th>
                  <th className="px-4 py-3 font-normal">신청일시</th>
                  <th className="px-4 py-3 font-normal">결제 상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {members.map((o) => (
                  <tr key={o.id} className={o.status === 'CANCELED' ? 'text-muted' : ''}>
                    <td className="px-4 py-3 font-medium">{o.applicantName}</td>
                    <td className="px-4 py-3">
                      <a href={`https://instagram.com/${o.instagramId}`} target="_blank" rel="noreferrer" className="hover:underline">
                        @{o.instagramId}
                      </a>
                    </td>
                    <td className="px-4 py-3">{formatPhone(o.contact)}</td>
                    <td className="px-4 py-3 text-xs">{formatDateTime(o.appliedAt)}</td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium">4개월 커리큘럼</h2>
        <ul className="card divide-y divide-line">
          {season.sessions.map((s) => (
            <li key={s.id} className="flex items-start gap-4 p-4">
              <span className="w-6 shrink-0 font-display text-2xl italic leading-6 text-accent">{s.round}</span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{s.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatDuration(s.durationMinutes)} · {s.locationText}
                  {s.scheduledAt && ` · ${formatMonthDay(s.scheduledAt)}`}
                </p>
              </div>
              <VenueBadge status={s.venueStatus} hasSpace={!!s.spaceId} />
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">제휴 공간을 선택한 회차는 관리자가 확인 후 대관을 확정해드려요.</p>
      </section>
    </div>
  );
}

const Stat = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className={`rounded-2xl py-4 ${accent ? 'bg-ink text-ivory' : 'border border-line bg-paper'}`}>
    <p className={`text-xs ${accent ? 'text-ivory/60' : 'text-muted'}`}>{label}</p>
    <p className="mt-1 font-serif text-xl font-semibold">{value}</p>
  </div>
);
