'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { OrderBadge, PhaseBadge } from '@/components/Badges';
import { useLogin } from '@/components/Providers';
import { Empty, Spinner } from '@/components/States';
import { useMe } from '@/lib/auth';
import { formatDuration, formatFollowers, formatPrice, splitIntro } from '@/lib/format';
import type { ClubDetail, SeasonSession } from '@/lib/types';

const TZ = 'Asia/Seoul';
const KO_COUNT = ['', '한', '두', '세', '네', '다섯', '여섯'];

/** Asia/Seoul 기준 날짜 구성 요소 */
const parts = (iso: string) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('ko-KR', {
      timeZone: TZ,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return { y: +p.year, m: +p.month, d: +p.day, wd: p.weekday as string, hm: `${p.hour}:${p.minute}` };
};

const addMinutes = (hm: string, min: number) => {
  const [h, m] = hm.split(':').map(Number);
  const t = h * 60 + m + min;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

/** 회차의 월: 일정이 있으면 그 날짜, 없으면 시즌 시작월 + (회차-1) */
const sessionMonth = (s: SeasonSession, startDate: string) => {
  if (s.scheduledAt) return parts(s.scheduledAt).m;
  return ((parts(startDate).m - 1 + s.round - 1) % 12) + 1;
};

export default function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: c, isLoading, error } = useSWR<ClubDetail>(`/clubs/${id}`);
  const { user } = useMe();
  const { openLogin } = useLogin();
  const router = useRouter();

  if (isLoading) return <Spinner />;
  if (error || !c) return <Empty>하우스를 찾을 수 없어요.</Empty>;

  const season = c.season;
  const [cover, ...gallery] = c.gallery;
  const { headline, body } = splitIntro(c.intro);
  const applyPath = `/clubs/${id}/apply`;
  const onJoin = () => (user ? router.push(applyPath) : openLogin(applyPath));
  const remaining = season ? Math.max(0, season.maxCapacity - season.appliedCount) : 0;
  const isMine = !!user && user.id === c.hostId;

  const sessions = season?.sessions ?? [];
  const count = sessions.length || 4;
  const countKo = KO_COUNT[count] ?? String(count);

  // 시즌 요약 정보
  let period = '';
  let time = '일정은 합류 멤버에게 안내돼요';
  let place = '';
  if (season) {
    const s = parts(season.startDate);
    const e = parts(season.endDate);
    period = `${s.y}년 ${s.m}월 – ${s.y !== e.y ? `${e.y}년 ` : ''}${e.m}월 · 총 ${count}회`;
    const first = sessions.find((x) => x.scheduledAt);
    if (first?.scheduledAt) {
      const f = parts(first.scheduledAt);
      const sameWeekday = sessions.every((x) => !x.scheduledAt || parts(x.scheduledAt).wd === f.wd);
      time = `${sameWeekday ? `매월 ${f.wd}요일` : '월 1회'} ${f.hm} – ${addMinutes(f.hm, first.durationMinutes)}`;
    }
    place = [...new Set(sessions.map((x) => x.locationText).filter(Boolean))].slice(0, 2).join(' · ');
  }

  return (
    <article>
      <div className="px-5">
        <Link href="/" className="inline-flex items-center gap-1 py-3 text-[12px] text-muted hover:text-ink">
          <ChevronLeft />
          모든 하우스
        </Link>

        {/* ───── 대표 사진 + 프로필 (넓은 화면에선 나란히) ───── */}
        <div className="sm:grid sm:grid-cols-2 sm:items-end sm:gap-7">
          <div className="mt-1 aspect-[4/5] overflow-hidden rounded-[18px] bg-ivory-deep">
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={c.displayName} className="h-full w-full object-cover" />
            )}
          </div>

          {/* ───── 프로필 ───── */}
          <section className="pt-6 sm:pb-1 sm:pt-0">
            {season && <PhaseBadge phase={season.phase} number={season.number} />}
            <h1 className="mt-4 font-serif text-[30px] font-normal leading-tight tracking-tight">{c.displayName}의 House</h1>
            <p className="mt-2 text-[12px] text-muted">
              {c.host.instagramId && (
                <a
                  href={`https://instagram.com/${c.host.instagramId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-ink"
                >
                  @{c.host.instagramId}
                </a>
              )}
              {c.host.instagramId && c.instagramFollowers != null && ' · '}
              {c.instagramFollowers != null && `팔로워 ${formatFollowers(c.instagramFollowers)}`}
            </p>
            {c.moodTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {c.moodTags.map((t) => (
                  <Link
                    key={t}
                    href={`/?tag=${encodeURIComponent(t)}`}
                    className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-[12px] text-ink-soft hover:border-ink/40"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ───── 호스트의 편지 ───── */}
        <section className="mt-7 border-t border-line pt-8">
          {headline && <p className="font-serif text-[22px] leading-[1.5] text-accent">&ldquo;{headline}&rdquo;</p>}
          {body && <p className="mt-5 whitespace-pre-line text-[13px] leading-[1.85] text-ink-soft">{body}</p>}
          <p className="mt-5 text-right font-serif text-[13px] text-ink-soft">{c.displayName} 드림</p>
        </section>
      </div>

      {/* ───── 갤러리 ───── */}
      {gallery.length > 0 && (
        <div className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5">
          {gallery.map((src, i) => (
            <div key={src + i} className="aspect-[3/4] w-[44%] shrink-0 snap-start sm:w-[30%] overflow-hidden rounded-xl bg-ivory-deep">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${c.displayName} ${i + 2}`} className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      )}

      <div className="px-5">
        {/* ───── 시즌 요약 ───── */}
        {season && (
          <section className="mt-8 rounded-2xl bg-ivory-deep px-5 py-6">
            <h2 className="font-serif text-[19px] font-medium">{countKo} 번의 만남, 하나의 취향</h2>
            <dl className="mt-5 space-y-3 text-[12px]">
              <Row label="함께하는 기간" value={period} />
              <Row label="만나는 시간" value={time} />
              {place && <Row label="만나는 곳" value={place} />}
              <Row label="함께할 인원" value={`호스트 ${c.displayName} · 멤버 ${season.maxCapacity}명`} />
              {season.phase === 'RECRUITING' && <Row label="남은 자리" value={`${remaining}자리`} accent />}
            </dl>
          </section>
        )}

        {/* ───── 회차 일정 ───── */}
        {season && sessions.length > 0 && (
          <section className="pt-12">
            <h2 className="font-serif text-[24px] font-normal">우리가 함께 보낼 계절</h2>
            <p className="mt-1 text-[12px] text-muted">한 달에 한 번, 일상에 새로운 장면을 더해요.</p>
            <ol className="mt-6 border-t border-line">
              {sessions.map((s) => {
                const d = s.scheduledAt ? parts(s.scheduledAt) : null;
                return (
                  <li key={s.id} className="grid grid-cols-[64px_1fr] gap-3 border-b border-line py-6">
                    <div>
                      <p className="font-serif text-[26px] leading-none text-accent">{sessionMonth(s, season.startDate)}월</p>
                      {d && (
                        <p className="mt-2 text-[10px] text-muted">
                          {d.m}. {d.d} {d.wd}
                        </p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold">{s.title}</h3>
                      {s.description && (
                        <p className="mt-2 whitespace-pre-line text-[12px] leading-[1.7] text-muted">{s.description}</p>
                      )}
                      <p className="mt-2 flex flex-wrap gap-x-2 text-[11px] text-muted/80">
                        <span>{formatDuration(s.durationMinutes)}</span>
                        {s.locationText && <span>· {s.locationText}</span>}
                      </p>
                      {s.address && <p className="mt-1 text-[11px] font-medium text-accent">{s.address}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {/* ───── 이런 걸 나눠요 ───── */}
        {c.benefits.length > 0 && (
          <section className="pt-12">
            <h2 className="font-serif text-[24px] font-normal">함께 나눌 것들</h2>
            <ul className="mt-5 space-y-3">
              {c.benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[13px] leading-relaxed text-ink-soft">
                  <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                    <CheckIcon />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ───── 멤버십 ───── */}
        {season && (
          <section className="pt-12">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-serif text-[24px] font-normal">시즌 {season.number} 멤버십</h2>
              <p className="shrink-0 font-serif text-[22px] font-bold text-accent">{formatPrice(season.price)}</p>
            </div>
            <p className="mt-4 text-[12px] leading-[1.8] text-muted">
              4개월 동안 월 1회, 총 {countKo} 번의 오프라인 만남을 포함해요. 카페 음료와 개인 쇼핑 비용은 별도이며, 정확한 장소는
              합류한 멤버에게 안내됩니다.
            </p>
            {season.openChatUrl && (
              <a href={season.openChatUrl} target="_blank" rel="noreferrer" className="btn-outline mt-5 w-full py-3">
                멤버 단톡방 입장하기
              </a>
            )}
          </section>
        )}

        {/* ───── 안내 ───── */}
        {season && (
          <section className="mt-10 border-t border-line pt-8">
            <h3 className="text-[14px] font-bold">합류하기 전에 읽어주세요</h3>
            <p className="mt-3 text-[12px] leading-[1.8] text-muted">
              정원 {season.maxCapacity}명이 모두 차면 모집이 마감돼요. 혼자 오셔도 괜찮아요. 좋아하는 마음이면 충분해요.
            </p>
            <p className="mt-3 text-[12px] leading-[1.8] text-muted">
              무통장 입금 확인 후 멤버로 확정되며, 확정된 멤버에게만 정확한 장소와 멤버 단톡방이 공개돼요.
            </p>
          </section>
        )}
      </div>

      {/* ───── 하단 고정 합류 버튼 ───── */}
      {season && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-shell border-t border-line bg-paper/95 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
          {isMine && (
            <Link
              href={`/host/edit?club=${c.id}`}
              className="mb-2 flex items-center justify-center gap-1 text-[12px] font-medium text-accent"
            >
              <EditIcon />내 하우스 페이지 수정
            </Link>
          )}
          <div className="flex items-baseline justify-between">
            <p className="text-[11px] text-muted">시즌권 : 4개월, 월 1회 오프라인 만남</p>
            <p className="font-serif text-[19px] font-bold text-accent">{formatPrice(season.price)}</p>
          </div>
          {c.myOrder ? (
            <Link href="/mypage" className="btn-outline mt-2.5 w-full rounded-xl py-3.5">
              합류 신청 완료 <OrderBadge status={c.myOrder.displayStatus} />
            </Link>
          ) : (
            <button
              className="btn-accent mt-2.5 w-full rounded-xl py-4 text-[15px] font-semibold"
              disabled={season.phase !== 'RECRUITING'}
              onClick={onJoin}
            >
              {
                {
                  RECRUITING: `시즌 ${season.number} 멤버 합류하기`,
                  FULL: '이번 시즌 모집 마감',
                  IN_PROGRESS: '시즌 진행 중',
                  ENDED: '다음 시즌 준비 중',
                }[season.phase]
              }
            </button>
          )}
        </div>
      )}
      {/* 하단 고정 바 높이만큼 여백 */}
      {season && <div className={isMine ? 'h-24' : 'h-16'} />}
    </article>
  );
}

const Row = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="grid grid-cols-[84px_1fr] gap-3">
    <dt className="text-muted">{label}</dt>
    <dd className={`font-medium ${accent ? 'text-accent' : 'text-ink'}`}>{value}</dd>
  </div>
);

const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const CheckIcon = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
    <path d="M5 12.5 10 17l9-10" />
  </svg>
);

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </svg>
);
