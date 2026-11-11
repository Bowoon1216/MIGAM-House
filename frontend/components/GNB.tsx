'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout, useMe } from '@/lib/auth';
import { useLogin } from './Providers';

export default function GNB() {
  const { user, mutate } = useMe();
  const { openLogin } = useLogin();
  const router = useRouter();

  const onLogout = async () => {
    await logout();
    await mutate(null, { revalidate: false });
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-[22px] font-medium tracking-[0.18em]">MIGAM</span>
          <span className="hidden text-[11px] text-muted sm:inline">미감 · private club</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link href="/?search=1" aria-label="검색" className="rounded-full p-2 hover:bg-ivory-deep">
            <SearchIcon />
          </Link>

          {user?.role === 'ADMIN' && (
            <Link href="/admin/orders" className="rounded-full px-3 py-1.5 text-xs text-ink-soft hover:bg-ivory-deep">
              관리자
            </Link>
          )}
          {(user?.role === 'HOST' || user?.role === 'ADMIN') && (
            <Link href="/host" className="rounded-full px-3 py-1.5 text-xs text-ink-soft hover:bg-ivory-deep">
              내 클럽
            </Link>
          )}

          {user ? (
            <>
              <Link href="/mypage" aria-label="마이페이지" className="rounded-full p-2 hover:bg-ivory-deep">
                <UserIcon />
              </Link>
              <button onClick={onLogout} className="px-1.5 text-xs text-muted hover:text-ink">
                로그아웃
              </button>
            </>
          ) : (
            <button onClick={() => openLogin()} className="btn-primary btn-sm ml-1">
              로그인
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);
