'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Empty, Spinner } from '@/components/States';
import { api, json } from '@/lib/api';
import type { Space } from '@/lib/types';

const EMPTY = { name: '', priceCondition: '', address: '', description: '' };

export default function AdminSpacesPage() {
  const { data, isLoading, mutate } = useSWR<Space[]>('/spaces');
  const [f, setF] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !f.priceCondition.trim() || !f.address.trim()) return alert('공간명, 지원 조건, 주소는 필수입니다.');
    setSaving(true);
    try {
      await api('/admin/spaces', { method: 'POST', ...json({ ...f, description: f.description || undefined }) });
      setF(EMPTY);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: Space) => {
    if (!confirm(`'${s.name}'을(를) 삭제할까요? 이미 개설된 모임의 장소 표기는 유지됩니다.`)) return;
    await api(`/admin/spaces/${s.id}`, { method: 'DELETE' });
    await mutate();
  };

  return (
    <div className="grid gap-8 md:grid-cols-[320px_1fr]">
      <form onSubmit={add} className="card h-fit space-y-3 p-5">
        <h2 className="font-bold">제휴 공간 추가</h2>
        <input className="input" placeholder="공간명 (예: 성수 A 스튜디오)" value={f.name} onChange={set('name')} />
        <input className="input" placeholder="지원 조건 (예: 무료, 5만원)" value={f.priceCondition} onChange={set('priceCondition')} />
        <input className="input" placeholder="주소" value={f.address} onChange={set('address')} />
        <input className="input" placeholder="메모 (선택)" value={f.description} onChange={set('description')} />
        <button className="btn-primary w-full" disabled={saving}>
          추가
        </button>
      </form>

      <div>
        {isLoading ? (
          <Spinner />
        ) : !data?.length ? (
          <Empty>등록된 제휴 공간이 없어요.</Empty>
        ) : (
          <ul className="card divide-y divide-line">
            {data.map((s) => (
              <li key={s.id} className="flex items-start gap-3 p-4 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    <span className="mr-1.5 rounded bg-accent-soft px-1.5 py-0.5 text-xs">{s.priceCondition}</span>
                    {s.name}
                  </p>
                  <p className="mt-1 text-xs text-muted">{s.address}</p>
                  {s.description && <p className="mt-0.5 text-xs text-muted">{s.description}</p>}
                </div>
                <button className="text-xs text-red-500" onClick={() => remove(s)}>
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
