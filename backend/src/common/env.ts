const str = (key: string, fallback = '') => process.env[key] ?? fallback;

export const env = {
  get port() {
    return Number(str('PORT', '4000'));
  },
  get isProd() {
    return str('NODE_ENV') === 'production';
  },
  get frontendUrl() {
    return str('FRONTEND_URL', 'http://localhost:3000').replace(/\/$/, '');
  },
  get jwtSecret() {
    const s = str('JWT_SECRET');
    if (!s && this.isProd) throw new Error('JWT_SECRET is required in production');
    return s || 'dev-only-secret';
  },
  get allowDevLogin() {
    return !this.isProd || str('ALLOW_DEV_LOGIN') === 'true';
  },
  get adminSnsIds() {
    return str('ADMIN_SNS_IDS')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  },
  kakao: {
    get clientId() {
      return str('KAKAO_CLIENT_ID');
    },
    get clientSecret() {
      return str('KAKAO_CLIENT_SECRET');
    },
  },
  naver: {
    get clientId() {
      return str('NAVER_CLIENT_ID');
    },
    get clientSecret() {
      return str('NAVER_CLIENT_SECRET');
    },
  },
  supabase: {
    get url() {
      return str('SUPABASE_URL');
    },
    get serviceRoleKey() {
      return str('SUPABASE_SERVICE_ROLE_KEY');
    },
    get bucket() {
      return str('SUPABASE_BUCKET', 'meetings');
    },
  },
  bank: {
    get name() {
      return str('BANK_NAME', '신한은행');
    },
    get accountNumber() {
      return str('BANK_ACCOUNT_NUMBER', '110-000-000000');
    },
    get holder() {
      return str('BANK_ACCOUNT_HOLDER', '미감모임');
    },
  },
};
