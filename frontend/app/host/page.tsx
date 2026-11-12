'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { PaymentBadge, PhaseBadge, VenueBadge } from '@/components/Badges';
import RequireRole from '@/components/RequireRole';
import { Empty, Spinner } from '@/components/States';
import { api } from '@/lib/api';
import { formatDateTime, formatDay, formatDuration, formatMonthDay, formatPhone, formatPrice } from '@/lib/format';
import { MAX_HOUSES, type HostClub, type HostSeason, type MemberRow } from '@/lib/types';

export default function HostDashboard() {
  return (
    <RequireRole role="HOST">
      <Suspense fallback={<Spinner />}>
        <Dashboard />
      </Suspense>
    </RequireRole>
  );
}

function Dashboard() {
  const { data: clubs, isLoading } = useSWR<HostClub[]>('/host/clubs');
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  if (isLoading || !clubs) return <Spinner />;

  const canCreate = clubs.length < MAX_HOUSES;
  const club = clubs.find((c) => c.id === params.get('house')) ?? clubs[0];
  const select = (id: string) => router.replace(`${pathname}?house=${id}`, { scroll: false });

  return (
    <div className="px-5 pt-6">
      {/* 헤더 + 새로 만들기 */}
      <section className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Host Center</p>
          <h1 className="mt-2 font-serif text-[26px] font-normal leading-tight">
            내 하우스{' '}
            <span className="align-middle font-sans text-[13px] text-muted">
              {clubs.length} / {MAX_HOUSES}
            </span>
          </h1>
        </div>
        {canCreate ? (
          <Link href="/host/season/new" className="btn-accent btn-sm shrink-0 py-2">
            + 하우스 새로 만들기
          </Link>
        ) : (
          <span className="btn-sm btn shrink-0 cursor-default border border-line py-2 text-muted">최대 {MAX_HOUSES}개</span>
        )}
      </section>

      {!clubs.length ? (
        <div className="py-16 text-center">
          <h2 className="font-serif text-[22px] leading-snug">
            나만의 하우스를
            <br />
            열어볼까요?
          </h2>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            사진과 글만 넣으면 하우스 페이지가 자동으로 만들어져요.
            <br />
            4개월 동안 한 달에 한 번, 팬들과 오프라인에서 만나요.
            <br />
            하우스는 최대 {MAX_HOUSES}개까지 동시에 운영할 수 있어요.
          </p>
          <Link href="/host/season/new" className="btn-accent mt-8 px-8 py-3.5">
            첫 하우스 만들기
          </Link>
        </div>
      ) : (
        <>
          {/* 하우스 선택 */}
          <nav className="no-scrollbar -mx-5 mt-6 flex gap-2.5 overflow-x-auto px-5 pb-1">
            {clubs.map((c) => {
              const latest = c.seasons[0];
              const active = c.id === club.id;
              return (
                <button
                  key={c.id}
                  onClick={() => select(c.id)}
                  className={`flex w-[200px] shrink-0 items-center gap-3 rounded-2xl border p-2.5 text-left transition sm:w-[230px] ${
                    active ? 'border-accent bg-accent-soft' : 'border-line bg-paper hover:border-ink/30'
                  }`}
                >
                  <span className="aspect-[4/5] w-11 shrink-0 overflow-hidden rounded-lg bg-ivory-deep">
                    {c.gallery[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.gallery[0]} alt="" className="h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-[15px]">{c.displayName}의 House</span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted">
                      {latest ? `시즌 ${latest.number} · ${PHASE_SHORT[latest.phase]}` : '시즌 없음'}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          <HousePanel key={club.id} club={club} />
        </>
      )}
    </div>
  );
}

const PHASE_SHORT: Record<HostSeason['phase'], string> = {
  RECRUITING: '모집 중',
  FULL: '모집 마감',
  IN_PROGRESS: '진행 중',
  ENDED: '종료',
};

function HousePanel({ club }: { club: HostClub }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { mutate } = useSWRConfig();
  const router = useRouter();

  const season = club.seasons.find((s) => s.id === selected) ?? club.seasons[0];
  const recruiting = club.seasons.some((s) => s.phase === 'RECRUITING' || s.phase === 'FULL');

  const remove = async () => {
    if (!confirm(`'${club.displayName}의 House'를 삭제할까요?\n시즌과 일정이 모두 사라지고 되돌릴 수 없어요.`)) return;
    setDeleting(true);
    try {
      await api(`/host/clubs/${club.id}`, { method: 'DELETE' });
      await mutate('/host/clubs');
      router.replace('/host');
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제에 실패했어요.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="pt-6">
      {/* 하우스 요약 + 관리 버튼 */}
      <section className="rounded-2xl bg-ivory-deep p-5">
        <h2 className="font-serif text-[22px] leading-tight">{club.displayName}의 House</h2>
        {club.moodTags.length > 0 && (
          <p className="mt-1.5 text-[12px] font-semibold text-accent">{club.moodTags.map((t) => `#${t}`).join('  ')}</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href={`/host/edit?club=${club.id}`} className="btn-primary btn-sm py-2.5">
            페이지 수정
          </Link>
          <Link href={`/clubs/${club.id}`} className="btn-outline btn-sm bg-paper py-2.5">
            페이지 보기
          </Link>
          {recruiting ? (
            <p className="col-span-2 pt-1 text-center text-[11px] text-muted">
              모집 중인 시즌이 시작되면 다음 시즌을 열 수 있어요
            </p>
          ) : (
            <Link href={`/host/season/new?club=${club.id}`} className="btn-accent btn-sm col-span-2 py-2.5">
              + 새 시즌 오픈하기
            </Link>
          )}
        </div>
      </section>

      {/* 시즌 탭 */}
      {club.seasons.length > 0 && (
        <nav className="no-scrollbar mt-8 flex gap-5 overflow-x-auto border-b border-line text-sm">
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
      )}

      {season && <SeasonPanel season={season} />}

      <div className="border-t border-line pb-4 pt-6 text-center">
        <button onClick={remove} disabled={deleting} className="text-[12px] text-muted underline-offset-2 hover:text-red-600 hover:underline">
          {deleting ? '삭제 중...' : '이 하우스 삭제하기'}
        </button>
        <p className="mt-1 text-[11px] text-muted/80">합류 신청 이력이 없는 하우스만 삭제할 수 있어요.</p>
      </div>
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
          <Empty>아직 합류한 멤버가 없어요. 인스타그램에 하우스 페이지를 공유해보세요!</Empty>
        ) : (
          <>
            {/* 좁은 화면: 카드 */}
            <ul className="card divide-y divide-line sm:hidden">
              {members.map((o) => (
                <li key={o.id} className={`p-4 text-sm ${o.status === 'CANCELED' ? 'text-muted' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{o.applicantName}</p>
                    <PaymentBadge status={o.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    <a href={`https://instagram.com/${o.instagramId}`} target="_blank" rel="noreferrer" className="hover:underline">
                      @{o.instagramId}
                    </a>
                    {' · '}
                    {formatPhone(o.contact)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">{formatDateTime(o.appliedAt)} 신청</p>
                </li>
              ))}
            </ul>
            {/* 넓은 화면: 표 */}
            <div className="card hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
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
                      <td className="whitespace-nowrap px-4 py-3">{formatPhone(o.contact)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">{formatDateTime(o.appliedAt)}</td>
                      <td className="px-4 py-3">
                        <PaymentBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium">4개월 커리큘럼</h2>
        <ul className="card divide-y divide-line">
          {season.sessions.map((s) => (
            <li key={s.id} className="flex items-start gap-4 p-4">
              <span className="w-6 shrink-0 font-serif text-2xl leading-6 text-accent">{s.round}</span>
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
