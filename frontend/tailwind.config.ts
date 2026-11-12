import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    /**
     * 앱 전체가 가운데 한 컬럼(AppShell)으로 보입니다.
     *   컬럼 폭 = 휴대폰에선 화면 전체, 그 이상에선 max(480px, 화면의 50%)
     * 그래서 브레이크포인트도 '컬럼 폭' 기준으로 맞춥니다. (컬럼 폭 X 이상 ⇔ 화면 폭 2X 이상)
     *   sm: 컬럼 640px+ (화면 1280px+), md: 768px+ (1536px+), lg: 1024px+ (2048px+)
     * 화면이 960px 이하로 줄면 컬럼은 480px 이하 = 휴대폰 레이아웃.
     */
    screens: {
      sm: '1280px',
      md: '1536px',
      lg: '2048px',
      xl: '2560px',
    },
    extend: {
      colors: {
        ink: { DEFAULT: '#1b1916', soft: '#3a3530' },
        ivory: { DEFAULT: '#f8f6f2', deep: '#efe9e2' },
        paper: '#fdfcfa',
        line: '#e6dfd6',
        muted: '#8a8178',
        // 미감 House 포인트 컬러 (플럼)
        accent: { DEFAULT: '#8a1452', soft: '#f6e7ef' },
        // 하위 호환 (관리자 화면 등)
        brand: { DEFAULT: '#1b1916', soft: '#f6f2ec', accent: '#8a1452' },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Cormorant Garamond"', '"Noto Serif KR"', 'serif'],
        serif: ['"Noto Serif KR"', '"Cormorant Garamond"', 'serif'],
      },
      letterSpacing: { label: '0.22em' },
      maxWidth: { shell: 'max(480px, 50vw)' },
    },
  },
  plugins: [],
} satisfies Config;
