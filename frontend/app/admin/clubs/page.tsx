'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { PhaseBadge } from '@/components/Badges';
import { Empty, Spinner } from '@/components/States';
import { api, json } from '@/lib/api';
import { formatDay, formatFollowers, formatPrice } from '@/lib/format';
import type { AdminClub } from '@/lib/types';

export default function AdminClubsPage() {
  const { data, isLoading, mutate } = useSWR<AdminClub[]>('/admin/clubs');

  const toggle = async (c: AdminClub) => {
    await api(`/admin/clubs/${c.id}/featured`, { method: 'PATCH', ...json({ isFeatured: !c.isFeatured }) });
    await mutate();
  };

  if (isLoading) return <Spinner />;
  if (!data?.length) return <Empty>개설된 하우스가 없어요.</Empty>;

  const Toggle = ({ c }: { c: AdminClub }) => (
    <button
      onClick={() => toggle(c)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${c.isFeatured ? 'bg-ink' : 'bg-line'}`}
      aria-pressed={c.isFeatured}
      aria-label="추천 하우스"
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${c.isFeatured ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  );

  return (
    <>
      <p className="mb-3 text-xs text-muted md:hidden">&lsquo;추천&rsquo;을 켠 하우스가 홈 맨 앞에 노출됩니다.</p>
      {/* 좁은 화면: 카드 */}
      <ul className="space-y-3 md:hidden">
        {data.map((c) => (
          <li key={c.id} className="card flex gap-3 p-3 text-sm">
            <Link href={`/clubs/${c.id}`} className="aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-lg bg-ivory-deep">
              {c.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.coverImage} alt="" className="h-full w-full object-cover" />
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/clubs/${c.id}`} className="truncate font-semibold hover:underline">
                  {c.displayName}
                </Link>
                <Toggle c={c} />
              </div>
              <p className="truncate text-xs text-muted">
                {c.host.name}
                {c.host.instagramId && ` · @${c.host.instagramId}`}
              </p>
              {c.season ? (
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <PhaseBadge phase={c.season.phase} number={c.season.number} />
                  <span>
                    {formatDay(c.season.startDate)} · {formatPrice(c.season.price)} · {c.season.appliedCount}/
                    {c.season.maxCapacity}명
                  </span>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted">시즌 없음</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {/* 넓은 화면: 표 */}
      <div className="card hidden overflow-x-auto md:block">
        <p className="border-b border-line px-4 py-2.5 text-xs text-muted">
          &lsquo;추천&rsquo;을 켠 하우스가 홈 맨 앞에 노출됩니다.
        </p>
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-line text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-2.5 font-normal">하우스</th>
              <th className="px-4 py-2.5 font-normal">호스트</th>
              <th className="px-4 py-2.5 font-normal">현재 시즌</th>
              <th className="px-4 py-2.5 font-normal">시작일</th>
              <th className="px-4 py-2.5 text-right font-normal">가격</th>
              <th className="px-4 py-2.5 font-normal">신청</th>
              <th className="px-4 py-2.5 font-normal">추천</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <Link href={`/clubs/${c.id}`} className="flex items-center gap-3 hover:underline">
                    <span className="aspect-[3/4] w-9 shrink-0 overflow-hidden rounded-md bg-ivory-deep">
                      {c.coverImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.coverImage} alt="" className="h-full w-full object-cover" />
                      )}
                    </span>
                    <span className="font-medium">{c.displayName}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs">
                  {c.host.name}
                  {c.host.instagramId && <span className="block text-muted">@{c.host.instagramId}</span>}
                  {c.instagramFollowers != null && (
                    <span className="block text-muted">팔로워 {formatFollowers(c.instagramFollowers)}</span>
                  )}
                </td>
                <td className="px-4 py-3">{c.season ? <PhaseBadge phase={c.season.phase} number={c.season.number} /> : '-'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs">{c.season ? formatDay(c.season.startDate) : '-'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{c.season ? formatPrice(c.season.price) : '-'}</td>
                <td className="px-4 py-3">{c.season ? `${c.season.appliedCount}/${c.season.maxCapacity}` : '-'}</td>
                <td className="px-4 py-3">
                  <Toggle c={c} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
