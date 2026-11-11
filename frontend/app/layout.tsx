import type { Metadata, Viewport } from 'next';
import GNB from '@/components/GNB';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: '미감 — 동경하던 그 사람의 프라이빗 클럽',
  description: '인플루언서가 직접 여는 4개월 시즌제 프라이빗 클럽',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <GNB />
          <main className="pb-24">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
