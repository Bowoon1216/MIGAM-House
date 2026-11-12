'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { PaymentBadge } from '@/components/Badges';
import { Empty, Spinner } from '@/components/States';
import { api, json } from '@/lib/api';
import { formatDateTime, formatPhone, formatPrice } from '@/lib/format';
import type { AdminOrder, OrderStatus } from '@/lib/types';

const FILTERS: { key: '' | OrderStatus; label: string }[] = [
  { key: '', label: '전체' },
  { key: 'PENDING', label: '입금 대기' },
  { key: 'CONFIRMED', label: '예약 확정' },
  { key: 'CANCELED', label: '취소/환불' },
];

export default function AdminOrdersPage() {
  const [status, setStatus] = useState<'' | OrderStatus>('PENDING');
  const [busy, setBusy] = useState<string | null>(null);
  const { data, isLoading, mutate } = useSWR<AdminOrder[]>(`/admin/orders${status ? `?status=${status}` : ''}`, {
    refreshInterval: 30_000,
  });

  const change = async (o: AdminOrder, next: OrderStatus) => {
    const msg =
      next === 'CONFIRMED'
        ? `${o.applicantName}님 ${formatPrice(o.amount)} 입금을 확인하셨나요?`
        : `${o.applicantName}님의 합류 신청을 취소/환불 처리할까요?`;
    if (!confirm(msg)) return;
    setBusy(o.id);
    try {
      await api(`/admin/orders/${o.id}`, { method: 'PATCH', ...json({ status: next }) });
      await mutate();
    } catch (e) {
      alert(e instanceof Error ? e.message : '처리에 실패했습니다.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={`rounded-full border px-3.5 py-1.5 text-sm ${
              status === f.key ? 'border-ink bg-ink text-white' : 'border-line text-ink-soft'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data?.length ? (
        <Empty>신청 내역이 없어요.</Empty>
      ) : (
        <>
          {/* 좁은 화면: 카드 */}
          <ul className="space-y-3 md:hidden">
            {data.map((o) => (
              <li key={o.id} className="card p-4 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {o.applicantName}
                      {o.user.name !== o.applicantName && (
                        <span className="ml-1.5 text-xs font-normal text-muted">계정: {o.user.name}</span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {o.season.club.displayName} · 시즌 {o.season.number}
                    </p>
                  </div>
                  <PaymentBadge status={o.status} />
                </div>
                <dl className="mt-3 grid grid-cols-[56px_1fr] gap-y-1 text-xs">
                  <dt className="text-muted">금액</dt>
                  <dd className="font-semibold">{formatPrice(o.amount)}</dd>
                  <dt className="text-muted">연락처</dt>
                  <dd>{formatPhone(o.contact)}</dd>
                  <dt className="text-muted">인스타</dt>
                  <dd>@{o.instagramId}</dd>
                  <dt className="text-muted">신청</dt>
                  <dd>{formatDateTime(o.appliedAt)}</dd>
                </dl>
                {o.status !== 'CANCELED' && (
                  <div className="mt-3 flex gap-2">
                    {o.status === 'PENDING' && (
                      <button
                        className="btn-primary btn-sm flex-1 py-2.5"
                        disabled={busy === o.id}
                        onClick={() => change(o, 'CONFIRMED')}
                      >
                        입금 확인
                      </button>
                    )}
                    <button
                      className="btn-outline btn-sm flex-1 py-2.5"
                      disabled={busy === o.id}
                      onClick={() => change(o, 'CANCELED')}
                    >
                      취소/환불
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {/* 넓은 화면: 표 */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-ivory text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-2.5">신청일시</th>
                  <th className="px-4 py-2.5">유저명(입금자)</th>
                  <th className="px-4 py-2.5">연락처</th>
                  <th className="px-4 py-2.5">인스타 ID</th>
                  <th className="px-4 py-2.5">하우스 · 시즌</th>
                  <th className="px-4 py-2.5 text-right">금액</th>
                  <th className="px-4 py-2.5">상태</th>
                  <th className="px-4 py-2.5 text-right">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.map((o) => (
                  <tr key={o.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">{formatDateTime(o.appliedAt)}</td>
                    <td className="px-4 py-3 font-medium">
                      {o.applicantName}
                      {o.user.name !== o.applicantName && <span className="block text-xs text-muted">계정: {o.user.name}</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{formatPhone(o.contact)}</td>
                    <td className="px-4 py-3">@{o.instagramId}</td>
                    <td className="max-w-[220px] truncate px-4 py-3">
                      {o.season.club.displayName} · 시즌 {o.season.number}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{formatPrice(o.amount)}</td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={o.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {o.status === 'PENDING' && (
                        <button className="btn-primary btn-sm" disabled={busy === o.id} onClick={() => change(o, 'CONFIRMED')}>
                          입금 확인
                        </button>
                      )}
                      {o.status !== 'CANCELED' && (
                        <button
                          className="btn-outline btn-sm ml-1.5"
                          disabled={busy === o.id}
                          onClick={() => change(o, 'CANCELED')}
                        >
                          취소/환불
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
