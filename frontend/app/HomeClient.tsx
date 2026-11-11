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
    <div className="container-wide pt-10 sm:pt-14">
      {/* 인트로 */}
      <section className="max-w-2xl">
        <p className="eyebrow">Season Membership · 4 Months</p>
        <h1 className="mt-4 font-serif text-[28px] font-medium leading-[1.35] tracking-tight sm:text-[40px]">
          동경하던 그 사람의
          <br />
          <span className="font-display text-[34px] italic sm:text-[48px]">Private Club</span>에 들어가세요
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-[15px]">
          한 달에 한 번, 넉 달 동안. 좋아하는 인플루언서와 오프라인에서 만나
          <br className="hidden sm:block" /> 그 사람의 미감과 라이프스타일을 가까이에서 배워요.
        </p>
      </section>

      {/* 검색 + 무드 필터 */}
      <section className="sticky top-14 z-30 -mx-5 mt-10 border-b border-line/70 bg-ivory/90 px-5 pb-3 pt-3 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: input.trim() });
          }}
          className="relative max-w-md"
        >
          <input
            ref={searchRef}
            className="w-full border-0 border-b border-ink/15 bg-transparent py-2 pr-16 text-sm outline-none transition placeholder:text-muted focus:border-ink"
            placeholder="인플루언서 이름 또는 @인스타그램 ID"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {q && (
            <button
              type="button"
              className="absolute right-10 top-1/2 -translate-y-1/2 px-1 text-xs text-muted"
              onClick={() => update({ q: '' })}
              aria-label="검색어 지우기"
            >
              ✕
            </button>
          )}
          <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-medium tracking-wide">
            검색
          </button>
        </form>

        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
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

      {/* 인플루언서 그리드 */}
      <section className="pt-8">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-serif text-lg font-medium">
            {tag ? `#${tag} 무드의 사람들` : q ? `'${q}' 검색 결과` : '지금 만날 수 있는 사람들'}
          </h2>
          {clubs && <span className="text-xs text-muted">{clubs.length} clubs</span>}
        </div>

        {isLoading ? (
          <Spinner />
        ) : !clubs?.length ? (
          <Empty>
            {filtered ? '아직 이 무드의 클럽이 없어요.' : '곧 첫 번째 클럽이 열려요.'}
            {filtered && (
              <div className="mt-4">
                <button className="btn-outline btn-sm" onClick={() => router.replace(pathname)}>
                  전체 보기
                </button>
              </div>
            )}
          </Empty>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-x-5 sm:gap-y-5 md:grid-cols-3 lg:grid-cols-4">
            {clubs.map((c, i) => (
              <ClubCard key={c.id} club={c} priority={i < 4} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MoodChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-1.5 text-[13px] transition ${
        active ? 'border-ink bg-ink text-ivory' : 'border-ink/15 text-ink-soft hover:border-ink/50'
      }`}
    >
      {children}
    </button>
  );
}
