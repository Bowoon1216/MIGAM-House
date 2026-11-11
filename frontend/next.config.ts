import type { NextConfig } from 'next';

const backendUrl = (process.env.BACKEND_URL ?? 'http://localhost:4000').replace(/\/$/, '');

const nextConfig: NextConfig = {
  // 브라우저 → (same-origin) /api/* → 백엔드 프록시.
  // 쿠키가 프론트 도메인에 저장되어 크로스도메인 쿠키 문제가 없다.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
