'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { VenueBadge } from '@/components/Badges';
import { Empty, Spinner } from '@/components/States';
import { api, json } from '@/lib/api';
import { formatDay, formatDuration } from '@/lib/format';
import type { AdminSession, VenueStatus } from '@/lib/types';

const FILTERS: { key: '' | VenueStatus; label: string }[] = [
  { key: 'REQUESTED', label: '대관 요청' },
  { key: 'FIXED', label: '대관 확정' },
  { key: '', label: '전체' },
];

/** 'YYYY-MM-DDTHH:mm' (KST) ↔ ISO */
const toLocalInput = (iso: string | null) =>
  iso ? new Date(new Date(iso).getTime() + 9 * 3600_000).toISOString().slice(0, 16) : '';
const fromLocalInput = (v: string) => new Date(`${v}:00+09:00`).toISOString();

export default function AdminVenuesPage() {
  const [status, setStatus] = useState<'' | VenueStatus>('REQUESTED');
  const { data, isLoading, mutate } = useSWR<AdminSession[]>(`/admin/sessions${status ? `?status=${status}` : ''}`);

  return (
    <div>
      <p className="mb-4 text-xs text-muted">
        호스트가 회차별로 고른 제휴 공간입니다. 공간 측과 일정을 맞춘 뒤 일시를 입력하고 대관을 확정해주세요. (종료되지 않은 시즌만 표시)
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={`rounded-full border px-3.5 py-1.5 text-sm ${status === f.key ? 'border-ink bg-ink text-ivory' : 'border-line text-ink-soft'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data?.length ? (
        <Empty>해당하는 회차가 없어요.</Empty>
      ) : (
        <ul className="card divide-y divide-line">
          {data.map((s) => (
            <SessionRow key={s.id} s={s} onChange={() => mutate()} />
          ))}
        </ul>
      )}
    </div>
  );
}

function SessionRow({ s, onChange }: { s: AdminSession; onChange: () => void }) {
  const [when, setWhen] = useState(toLocalInput(s.scheduledAt));
  const [busy, setBusy] = useState(false);

  const save = async (venueStatus: VenueStatus) => {
    setBusy(true);
    try {
      await api(`/admin/sessions/${s.id}`, {
        method: 'PATCH',
        ...json({ venueStatus, ...(when ? { scheduledAt: fromLocalInput(when) } : {}) }),
      });
      onChange();
    } catch (e) {
      alert(e instanceof Error ? e.message : '처리에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="grid gap-3 p-4 text-sm md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <VenueBadge status={s.venueStatus} hasSpace={!!s.spaceId} />
          <Link href={`/clubs/${s.season.club.id}`} className="font-medium hover:underline">
            {s.season.club.displayName} · 시즌 {s.season.number}
          </Link>
          <span className="text-muted">
            {s.round}회차 · {s.title}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          시즌 시작 {formatDay(s.season.startDate)} · {formatDuration(s.durationMinutes)}
        </p>
        <p className="mt-0.5 text-xs">
          {s.space ? (
            <>
              <b className="font-medium">{s.space.name}</b> ({s.space.priceCondition}) · {s.space.address}
            </>
          ) : (
            <span className="text-muted">호스트가 장소를 고르지 않았어요</span>
          )}
        </p>
      </div>
      {s.space && (
        <div className="flex flex-wrap items-center gap-2">
          <input type="datetime-local" className="input w-auto py-2" value={when} onChange={(e) => setWhen(e.target.value)} />
          {s.venueStatus === 'REQUESTED' ? (
            <button className="btn-primary btn-sm" disabled={busy} onClick={() => save('FIXED')}>
              대관 확정
            </button>
          ) : (
            <>
              <button className="btn-outline btn-sm" disabled={busy} onClick={() => save('FIXED')}>
                일시 저장
              </button>
              <button className="btn-sm btn text-muted" disabled={busy} onClick={() => save('REQUESTED')}>
                확정 취소
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
