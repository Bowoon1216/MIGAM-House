import Link from 'next/link';
import type { ClubCard as Club } from '@/lib/types';
import { PhaseBadge } from './Badges';

/** 홈 그리드: 세로형 사진이 카드를 꽉 채우고, 인플루언서 이름이 가장 크게 */
export default function ClubCard({ club, priority }: { club: Club; priority?: boolean }) {
  return (
    <Link href={`/clubs/${club.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-ivory-deep">
        {club.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={club.coverImage}
            alt={club.displayName}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
            loading={priority ? 'eager' : 'lazy'}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        {club.season && (
          <div className="absolute left-3 top-3">
            <PhaseBadge phase={club.season.phase} number={club.season.number} onImage />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
          <p className="text-[10px] uppercase tracking-label text-white/70">Private Club</p>
          <p className="mt-0.5 font-display text-[34px] font-medium leading-none sm:text-[40px]">{club.displayName}</p>
          <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[12px] text-white/85">
            {club.moodTags.slice(0, 3).map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
