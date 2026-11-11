'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import RequireRole from '@/components/RequireRole';

const TABS = [
  { href: '/admin/orders', label: '입금 확인' },
  { href: '/admin/venues', label: '대관 관리' },
  { href: '/admin/clubs', label: '클럽' },
  { href: '/admin/hosts', label: '호스트' },
  { href: '/admin/mood-tags', label: '무드 태그' },
  { href: '/admin/spaces', label: '제휴 공간' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <RequireRole role="ADMIN">
      <div className="container-wide pt-6">
        <h1 className="font-serif text-xl font-medium">관리자</h1>
        <nav className="no-scrollbar mt-4 flex gap-5 overflow-x-auto border-b border-line text-sm">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`-mb-px shrink-0 border-b-2 pb-2.5 font-medium ${
                pathname.startsWith(t.href) ? 'border-ink' : 'border-transparent text-muted'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="py-6">{children}</div>
      </div>
    </RequireRole>
  );
}
