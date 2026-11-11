'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { OrderBadge, PhaseBadge } from '@/components/Badges';
import { useLogin } from '@/components/Providers';
import { Empty, Spinner } from '@/components/States';
import { useMe } from '@/lib/auth';
import { formatDay, formatDuration, formatFollowers, formatMonthDay, formatPrice, possessive } from '@/lib/format';
import type { ClubDetail } from '@/lib/types';

export default function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: c, isLoading, error } = useSWR<ClubDetail>(`/clubs/${id}`);
  const { user } = useMe();
  const { openLogin } = useLogin();
  const router = useRouter();

  if (isLoading) return <Spinner />;
  if (error || !c) return <Empty>클럽을 찾을 수 없어요.</Empty>;

  const season = c.season;
  const cover = c.gallery[0];
  const applyPath = `/clubs/${id}/apply`;
  const onJoin = () => (user ? router.push(applyPath) : openLogin(applyPath));
  const remaining = season ? Math.max(0, season.maxCapacity - season.appliedCount) : 0;
  const isMine = !!user && user.id === c.hostId;

  return (
    <article>
      {/* ───── Hero ───── */}
      <section className="relative h-[78vh] max-h-[820px] min-h-[520px] w-full overflow-hidden bg-ink">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={c.displayName} className="absolute inset-0 h-full w-full object-cover opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
        <div className="container-wide relative flex h-full flex-col justify-end pb-10 text-white sm:pb-14">
          {season && (
            <div className="mb-5">
              <PhaseBadge phase={season.phase} number={season.number} onImage />
            </div>
          )}
          <h1 className="font-display font-medium leading-[0.92]">
            <span className="block text-[64px] italic sm:text-[104px]">{possessive(c.displayName)}</span>
            <span className="block text-[30px] tracking-wide text-white/90 sm:text-[44px]">Private Club</span>
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/85">
            {c.host.instagramId && (
              <a
                href={`https://instagram.com/${c.host.instagramId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-white"
              >
                <InstagramIcon />@{c.host.instagramId}
              </a>
            )}
            {c.instagramFollowers != null && (
              <span>
                팔로워 <b className="font-semibold text-white">{formatFollowers(c.instagramFollowers)}</b>
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {c.moodTags.map((t) => (
              <Link
                key={t}
                href={`/?tag=${encodeURIComponent(t)}`}
                className="rounded-full border border-white/30 px-3 py-1 text-xs text-white/90 backdrop-blur-sm hover:border-white"
              >
                #{t}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 01. My Style ───── */}
      <section className="pt-16 sm:pt-24">
        <SectionHead no="01" en="My Style" ko="나의 미감" />
        <div className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 sm:gap-4 lg:px-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))]">
          {c.gallery.map((src, i) => (
            <div key={src + i} className="w-[72%] shrink-0 snap-center sm:w-[320px]">
              <div className="aspect-[3/4] overflow-hidden rounded-[18px] bg-ivory-deep">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`${c.displayName} ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
              </div>
            </div>
          ))}
        </div>
        <div className="container-app mt-12">
          <blockquote className="relative pl-1">
            <span className="absolute -left-1 -top-8 font-display text-[80px] leading-none text-accent/40">&ldquo;</span>
            <p className="whitespace-pre-line font-serif text-[17px] leading-[1.9] text-ink-soft sm:text-[19px]">{c.intro}</p>
            <footer className="mt-5 font-display text-xl italic text-muted">— {c.displayName}</footer>
          </blockquote>
        </div>
      </section>

      {/* ───── 02. What we do ───── */}
      {season && (
        <section className="pt-20 sm:pt-28">
          <SectionHead no="02" en="What we do" ko="우리가 함께할 4개월" />
          <div className="container-app mt-3 text-center text-sm text-muted">
            {formatDay(season.startDate)} — {formatDay(season.endDate)} · 월 1회 오프라인
          </div>
          <ol className="container-app mt-10">
            {season.sessions.map((s, i) => (
              <li key={s.id} className="relative grid grid-cols-[56px_1fr] gap-4 pb-10 last:pb-0 sm:grid-cols-[88px_1fr]">
                {i < season.sessions.length - 1 && (
                  <span className="absolute left-[27px] top-14 h-[calc(100%-56px)] w-px bg-line sm:left-[43px]" />
                )}
                <div className="flex flex-col items-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-paper font-display text-2xl italic">
                    {s.round}
                  </span>
                </div>
                <div className="pt-1.5">
                  <p className="eyebrow">{s.round}개월 차</p>
                  <h3 className="mt-1 font-serif text-lg font-medium">{s.title}</h3>
                  {s.description && <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.description}</p>}
                  <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-muted">
                    <span>{formatDuration(s.durationMinutes)}</span>
                    <span>{s.locationText}</span>
                    {s.scheduledAt && <span>{formatMonthDay(s.scheduledAt)}</span>}
                  </p>
                  {s.address && <p className="mt-1 text-xs text-accent">{s.address}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ───── 03. Benefit ───── */}
      {c.benefits.length > 0 && (
        <section className="pt-20 sm:pt-28">
          <SectionHead no="03" en="Benefit" ko="저와 만나면 이런 걸 얻어갈 수 있어요" />
          <ul className="container-app mt-10 grid gap-3 sm:grid-cols-2">
            {c.benefits.map((b) => (
              <li key={b} className="flex items-start gap-3 rounded-2xl border border-line bg-paper p-5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-ivory">
                  <CheckIcon />
                </span>
                <span className="text-[15px] leading-snug">{b}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ───── 시즌 안내 ───── */}
      {season && (
        <section className="container-app pt-20 sm:pt-28">
          <div className="rounded-3xl bg-ink px-6 py-8 text-ivory sm:px-10 sm:py-10">
            <p className="eyebrow text-ivory/60">Season {season.number} Membership</p>
            <p className="mt-2 font-display text-3xl italic sm:text-4xl">{possessive(c.displayName)} Private Club</p>
            <dl className="mt-6 grid grid-cols-2 gap-y-4 text-sm sm:grid-cols-4">
              <Info label="기간" value="4개월" />
              <Info label="만남" value="월 1회 · 총 4회" />
              <Info label="정원" value={`${season.maxCapacity}명`} />
              <Info label="남은 자리" value={season.phase === 'RECRUITING' ? `${remaining}자리` : '—'} />
            </dl>
            <p className="mt-6 border-t border-ivory/15 pt-5 text-xs leading-relaxed text-ivory/60">
              시즌 시작 {formatDay(season.startDate)} · 입금 확인 후 멤버로 확정되며, 확정 멤버에게만 정확한 장소와 멤버 단톡방이 공개돼요.
            </p>
            {season.openChatUrl && (
              <a href={season.openChatUrl} target="_blank" rel="noreferrer" className="btn mt-5 bg-ivory text-ink hover:bg-white">
                멤버 단톡방 입장하기
              </a>
            )}
          </div>
        </section>
      )}

      {/* ───── 호스트 본인: 페이지 수정 ───── */}
      {isMine && (
        <Link
          href="/host/edit"
          className="btn fixed bottom-24 right-4 z-40 bg-accent px-5 py-3 text-ivory shadow-lg hover:bg-ink sm:right-8"
        >
          <EditIcon />내 클럽 페이지 수정
        </Link>
      )}

      {/* ───── Sticky 결제창 ───── */}
      {season && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 backdrop-blur-md">
          <div className="container-app flex items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] text-muted">시즌권 · 4개월, 월 1회 오프라인 만남</p>
              <p className="font-serif text-lg font-semibold leading-tight">{formatPrice(season.price)}</p>
            </div>
            {c.myOrder ? (
              <Link href="/mypage" className="btn-outline shrink-0 py-3">
                합류 신청 완료 <OrderBadge status={c.myOrder.displayStatus} />
              </Link>
            ) : (
              <button className="btn-primary shrink-0 px-6 py-3.5" disabled={season.phase !== 'RECRUITING'} onClick={onJoin}>
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
        </div>
      )}
    </article>
  );
}

function SectionHead({ no, en, ko }: { no: string; en: string; ko: string }) {
  return (
    <div className="container-app text-center">
      <p className="eyebrow">
        {no} — {en}
      </p>
      <h2 className="mt-3 font-serif text-[22px] font-medium leading-snug sm:text-[26px]">{ko}</h2>
    </div>
  );
}

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-xs text-ivory/50">{label}</dt>
    <dd className="mt-0.5 font-medium">{value}</dd>
  </div>
);

const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2">
    <path d="M5 12.5 10 17l9-10" />
  </svg>
);

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
  </svg>
);
