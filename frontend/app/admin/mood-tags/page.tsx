'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Empty, Spinner } from '@/components/States';
import { api, json } from '@/lib/api';
import type { MoodTag } from '@/lib/types';

export default function AdminMoodTagsPage() {
  const { data, isLoading, mutate } = useSWR<MoodTag[]>('/admin/mood-tags');
  const [name, setName] = useState('');

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api('/admin/mood-tags', { method: 'POST', ...json({ name }) });
      setName('');
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : '추가 실패');
    }
  };

  const remove = async (t: MoodTag) => {
    if (!confirm(`#${t.name} 태그를 삭제할까요? 이미 이 태그를 쓰는 하우스에는 그대로 남아요.`)) return;
    await api(`/admin/mood-tags/${t.id}`, { method: 'DELETE' });
    await mutate();
  };

  return (
    <div className="max-w-2xl">
      <p className="mb-4 text-xs text-muted">홈 화면 필터와 호스트의 &lsquo;내 무드 설정&rsquo; 단계에 노출되는 태그입니다.</p>
      <form onSubmit={add} className="flex gap-2">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={15} placeholder="#새태그 (예: 발레코어)" />
        <button className="btn-primary shrink-0">추가</button>
      </form>
      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : !data?.length ? (
          <Empty>등록된 무드 태그가 없어요.</Empty>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {data.map((t) => (
              <li key={t.id} className="flex items-center gap-1 rounded-full border border-line bg-paper py-1.5 pl-4 pr-2 text-sm">
                #{t.name}
                <button onClick={() => remove(t)} className="px-1.5 text-muted hover:text-red-500" aria-label="삭제">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
