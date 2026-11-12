import type { Metadata, Viewport } from 'next';
import AppShell from '@/components/AppShell';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: '미감 · House — 내가 원하던 그 미감',
  description: '좋아하는 인플루언서와 한 달에 한 번, 넉 달 동안 오프라인에서 만나는 시즌 멤버십',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#f8f6f2' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
