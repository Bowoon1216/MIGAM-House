'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { SWRConfig } from 'swr';
import { fetcher } from '@/lib/api';
import LoginModal from './LoginModal';

interface LoginCtx {
  openLogin: (returnTo?: string) => void;
}

const LoginContext = createContext<LoginCtx>({ openLogin: () => {} });
export const useLogin = () => useContext(LoginContext);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const openLogin = useCallback((to?: string) => {
    setReturnTo(to ?? window.location.pathname + window.location.search);
  }, []);

  return (
    <SWRConfig value={{ fetcher, shouldRetryOnError: false }}>
      <LoginContext.Provider value={{ openLogin }}>
        {children}
        {returnTo !== null && <LoginModal returnTo={returnTo} onClose={() => setReturnTo(null)} />}
      </LoginContext.Provider>
    </SWRConfig>
  );
}
