import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#1b1916', soft: '#3a3530' },
        ivory: { DEFAULT: '#f6f2ec', deep: '#ece5da' },
        paper: '#fbf9f6',
        line: '#e2dacd',
        muted: '#8a8178',
        accent: { DEFAULT: '#9c7a54', soft: '#efe6da' },
        // 하위 호환 (관리자 화면 등)
        brand: { DEFAULT: '#1b1916', soft: '#f6f2ec', accent: '#9c7a54' },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Cormorant Garamond"', '"Noto Serif KR"', 'serif'],
        serif: ['"Noto Serif KR"', '"Cormorant Garamond"', 'serif'],
      },
      letterSpacing: { label: '0.22em' },
    },
  },
  plugins: [],
} satisfies Config;
