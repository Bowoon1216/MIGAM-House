const TZ = 'Asia/Seoul';

export const formatPrice = (n: number) => (n === 0 ? '무료' : `${n.toLocaleString('ko-KR')}원`);

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: TZ,
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));

/** 2026. 11. 28 (토) */
export const formatDay = (iso: string) =>
  new Intl.DateTimeFormat('ko-KR', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' }).format(
    new Date(iso),
  );

/** 11월 28일 */
export const formatMonthDay = (iso: string) =>
  new Intl.DateTimeFormat('ko-KR', { timeZone: TZ, month: 'long', day: 'numeric' }).format(new Date(iso));

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: TZ,
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));

export const formatPhone = (digits: string) => digits.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3');

/** 128000 → 12.8만 */
export const formatFollowers = (n: number) => {
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}천`;
  return String(n);
};

export const formatDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}시간${m ? ` ${m}분` : ''}` : `${m}분`;
};

export const isPast = (iso: string) => new Date(iso).getTime() <= Date.now();

/** 'Jisu' → "Jisu's", 한글 이름은 그대로 */
export const possessive = (name: string) => (/[a-zA-Z]$/.test(name) ? `${name}'s` : name);

/** 소개글 첫 줄 → 제목(인용구), 나머지 → 본문 */
export const splitIntro = (intro: string) => {
  const lines = intro.split('\n').map((l) => l.trim()).filter(Boolean);
  return { headline: lines[0] ?? '', body: lines.slice(1).join('\n') };
};
