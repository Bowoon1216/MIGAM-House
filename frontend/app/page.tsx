import { Suspense } from 'react';
import { Spinner } from '@/components/States';
import HomeClient from './HomeClient';

export default function HomePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <HomeClient />
    </Suspense>
  );
}
