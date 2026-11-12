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
    <header className="sticky top-0 z-40 bg-ivory/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-5">
        <Link href="/" className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap font-serif text-[17px] font-medium tracking-tight">
          <span className="font-display text-[19px] font-semibold tracking-[0.02em]">MIGAM</span>
          <span className="max-[379px]:hidden">미감 · House</span>
        </Link>

        <nav className="flex items-center whitespace-nowrap text-sm">
          <Link href="/?search=1" aria-label="검색" className="rounded-full p-2 hover:bg-ivory-deep">
            <SearchIcon />
          </Link>

          {user?.role === 'ADMIN' && (
            <Link href="/admin/orders" className="rounded-full px-2 py-1.5 text-xs text-ink-soft hover:bg-ivory-deep">
              관리자
            </Link>
          )}
          {(user?.role === 'HOST' || user?.role === 'ADMIN') && (
            <Link href="/host" className="rounded-full px-2 py-1.5 text-xs text-ink-soft hover:bg-ivory-deep">
              내 하우스
            </Link>
          )}

          {user ? (
            <>
              <Link href="/mypage" aria-label="마이페이지" className="rounded-full p-2 hover:bg-ivory-deep">
                <UserIcon />
              </Link>
              {/* 좁은 화면에선 마이페이지 안의 로그아웃 버튼 사용 */}
              <button onClick={onLogout} className="hidden px-1.5 text-xs text-muted hover:text-ink sm:block">
                로그아웃
              </button>
            </>
          ) : (
            <button onClick={() => openLogin()} className="px-1.5 py-2 text-[13px] text-ink-soft hover:text-ink">
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
