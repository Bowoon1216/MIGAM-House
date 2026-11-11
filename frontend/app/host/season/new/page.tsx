'use client';

import useSWR from 'swr';
import ClubEditor from '@/components/ClubEditor';
import RequireRole from '@/components/RequireRole';
import { Spinner } from '@/components/States';
import type { HostClub } from '@/lib/types';

export default function OpenSeasonPage() {
  return (
    <RequireRole role="HOST">
      <Loader />
    </RequireRole>
  );
}

function Loader() {
  const { data: club, isLoading } = useSWR<HostClub | null>('/host/club');
  if (isLoading) return <Spinner />;
  return <ClubEditor mode="open" club={club ?? null} />;
}
