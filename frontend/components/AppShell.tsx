'use client';

import { usePathname } from 'next/navigation';
import GNB from './GNB';

/**
 * 인스타그램 프로필 링크로 들어오는 사용자가 대부분이라 모바일 화면을 기준으로 설계합니다.
 * 휴대폰에선 화면 전체, 데스크톱에선 화면의 절반(최소 480px)만 쓰는 가운데 컬럼으로 보여줍니다.
 * (tailwind.config.ts의 screens도 이 컬럼 폭 기준)
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-shell bg-ivory shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_10px_40px_rgba(0,0,0,0.05)]">
      <GNB />
      {/* 홈은 자체 푸터로 끝나고, 나머지 화면은 하단 고정 버튼 높이만큼 여백 */}
      <main className={pathname === '/' ? '' : 'pb-28'}>{children}</main>
    </div>
  );
}
