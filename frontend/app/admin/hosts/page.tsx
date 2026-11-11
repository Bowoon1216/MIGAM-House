'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Empty, Spinner } from '@/components/States';
import { api, json } from '@/lib/api';
import type { Role, User } from '@/lib/types';

const ROLE_LABEL: Record<Role, string> = { USER: '일반', HOST: '호스트', ADMIN: '관리자' };

export default function AdminHostsPage() {
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const key = q ? `/admin/users?q=${encodeURIComponent(q)}` : '/admin/users?role=HOST';
  const { data, isLoading, mutate } = useSWR<User[]>(key);

  const setRole = async (u: User, role: Role) => {
    const msg = role === 'HOST' ? `${u.name}님에게 호스트 권한을 부여할까요?` : `${u.name}님의 호스트 권한을 해제할까요?`;
    if (!confirm(msg)) return;
    try {
      await api(`/admin/users/${u.id}/role`, { method: 'PATCH', ...json({ role }) });
      await mutate();
    } catch (e) {
      alert(e instanceof Error ? e.message : '처리에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-3xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQ(input.trim());
        }}
        className="flex gap-2"
      >
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="이름, 이메일, 인스타 ID로 유저 검색"
        />
        <button className="btn-primary shrink-0">검색</button>
      </form>
      <p className="mt-2 text-xs text-muted">
        인플루언서가 먼저 카카오/네이버로 1회 로그인해야 검색됩니다. {q ? '' : '현재 호스트 목록을 표시 중입니다.'}
      </p>

      <div className="mt-5">
        {isLoading ? (
          <Spinner />
        ) : !data?.length ? (
          <Empty>{q ? '검색 결과가 없어요.' : '등록된 호스트가 없어요.'}</Empty>
        ) : (
          <ul className="card divide-y divide-line">
            {data.map((u) => (
              <li key={u.id} className="flex items-center gap-3 p-4">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-ivory-deep">
                  {u.profileImg && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.profileImg} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">
                    {u.name} <span className="ml-1 text-xs font-normal text-muted">{ROLE_LABEL[u.role]}</span>
                  </p>
                  <p className="truncate text-xs text-muted">
                    {u.provider} · {u.email ?? '이메일 없음'}
                    {u.instagramId && ` · @${u.instagramId}`}
                  </p>
                </div>
                {u.role === 'USER' && (
                  <button className="btn-primary btn-sm" onClick={() => setRole(u, 'HOST')}>
                    호스트 권한 부여
                  </button>
                )}
                {u.role === 'HOST' && (
                  <button className="btn-outline btn-sm" onClick={() => setRole(u, 'USER')}>
                    권한 해제
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
