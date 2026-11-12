'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import ClubCard from '@/components/ClubCard';
import { useLogin } from '@/components/Providers';
import { Empty, Spinner } from '@/components/States';
import type { ClubCard as Club } from '@/lib/types';

export default function HomeClient() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { openLogin } = useLogin();
  const tag = params.get('tag') ?? '';
  const q = params.get('q') ?? '';
  const [input, setInput] = useState(q);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: tags } = useSWR<string[]>('/mood-tags');
  const query = new URLSearchParams({ ...(tag && { tag }), ...(q && { q }) }).toString();
  const { data: clubs, isLoading } = useSWR<Club[]>(`/clubs${query ? `?${query}` : ''}`);

  useEffect(() => setInput(q), [q]);
  useEffect(() => {
    if (params.get('search')) searchRef.current?.focus();
    const err = params.get('loginError');
    if (err) {
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
      openLogin('/');
    }
  }, [params, openLogin]);

  const update = (next: { tag?: string; q?: string }) => {
    const sp = new URLSearchParams();
    const t = next.tag ?? tag;
    const s = next.q ?? q;
    if (t) sp.set('tag', t);
    if (s) sp.set('q', s);
    router.replace(`${pathname}${sp.toString() ? `?${sp}` : ''}`, { scroll: false });
  };

  const filtered = !!(tag || q);

  return (
    <div>
      {/* 인트로 */}
      <section className="px-5 pt-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Season Membership · 4 Months</p>
        <h1 className="mt-4 font-serif text-[27px] font-normal leading-[1.4] tracking-tight">
          내가 원하던 그 미감,
          <br />
          <span className="font-semibold text-accent">미감하우스</span>에서 찾으세요!
        </h1>
        <p className="mt-4 text-[13px] leading-[1.8] text-muted">
          한 달에 한 번, 넉 달 동안. 좋아하는 인플루언서와
          <br />
          오프라인에서 만나 취향을 나누고,
          <br />
          화면 너머의 일상을 함께 만들어가세요.
        </p>
      </section>

      {/* 검색 + 무드 필터 */}
      <section className="sticky top-14 z-30 bg-ivory/95 px-5 pb-3 pt-5 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: input.trim() });
          }}
          className="flex items-center rounded-xl border border-line bg-paper pl-4 pr-1 focus-within:border-ink/40"
        >
          <input
            ref={searchRef}
            className="min-w-0 flex-1 bg-transparent py-3.5 text-[13px] outline-none placeholder:text-muted"
            placeholder="인플루언서 이름 또는 @인스타그램 ID"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            enterKeyHint="search"
          />
          {q && (
            <button
              type="button"
              className="px-2 text-xs text-muted"
              onClick={() => update({ q: '' })}
              aria-label="검색어 지우기"
            >
              ✕
            </button>
          )}
          <span className="h-4 w-px bg-line" />
          <button type="submit" className="px-4 py-3 text-[13px] font-semibold text-accent">
            검색
          </button>
        </form>

        <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
          <MoodChip active={!tag} onClick={() => update({ tag: '' })}>
            All
          </MoodChip>
          {tags?.map((t) => (
            <MoodChip key={t} active={tag === t} onClick={() => update({ tag: tag === t ? '' : t })}>
              #{t}
            </MoodChip>
          ))}
        </div>
      </section>

      {/* 인플루언서 리스트 */}
      <section className="px-5 pb-16 pt-6">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold tracking-tight">
            {tag ? `#${tag} 무드의 사람들` : q ? `'${q}' 검색 결과` : '지금 만날 수 있는 사람들'}
          </h2>
          {clubs && <span className="font-serif text-[13px] italic text-muted">{clubs.length} houses</span>}
        </div>

        {isLoading ? (
          <Spinner />
        ) : !clubs?.length ? (
          <Empty>
            {filtered ? '아직 이 무드의 하우스가 없어요.' : '곧 첫 번째 하우스가 열려요.'}
            {filtered && (
              <div className="mt-4">
                <button className="btn-outline btn-sm" onClick={() => router.replace(pathname)}>
                  전체 보기
                </button>
              </div>
            )}
          </Empty>
        ) : (
          <div className="grid gap-12 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-14">
            {clubs.map((c, i) => (
              <ClubCard key={c.id} club={c} priority={i < 2} />
            ))}
          </div>
        )}
      </section>

      {/* 브랜드 메시지 */}
      <section className="bg-ivory-deep px-5 py-14">
        <p className="font-serif text-[24px] leading-[1.45] text-accent">
          좋아하는 마음이
          <br />
          우리의 일상이 되도록.
        </p>
        <p className="mt-5 text-[13px] leading-[1.8] text-muted">
          미감은 취향이 닮은 사람들이 만나는 작은 집입니다.
          <br />
          네 번의 만남, 오래 이어질 새로운 관계를 시작해요.
        </p>
      </section>

      <footer className="px-5 pb-12 pt-10">
        <p className="font-serif text-[15px] font-medium">
          <span className="font-display text-[17px] font-semibold">MIGAM</span> 미감 · House
        </p>
        <p className="mt-4 text-[11px] text-muted">© 2026 미감. 취향으로 이어지는 우리.</p>
      </footer>
    </div>
  );
}

function MoodChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-[13px] transition ${
        active ? 'border-ink bg-ink text-ivory' : 'border-line bg-paper text-ink-soft hover:border-ink/40'
      }`}
    >
      {children}
    </button>
  );
}
