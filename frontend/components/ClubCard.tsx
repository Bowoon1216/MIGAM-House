import Link from 'next/link';
import { splitIntro } from '@/lib/format';
import type { ClubCard as Club } from '@/lib/types';
import { PhaseBadge } from './Badges';

/** 홈 리스트: 세로형 사진 위에 이름, 아래에 한 줄 소개와 무드 태그 */
export default function ClubCard({ club, priority }: { club: Club; priority?: boolean }) {
  const { headline, body } = splitIntro(club.intro ?? '');

  return (
    <Link href={`/clubs/${club.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-ivory-deep">
        {club.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={club.coverImage}
            alt={club.displayName}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
            loading={priority ? 'eager' : 'lazy'}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {club.season && (
          <div className="absolute left-3.5 top-3.5">
            <PhaseBadge phase={club.season.phase} number={club.season.number} onImage />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white">
          <div className="min-w-0">
            <p className="truncate font-serif text-[34px] font-normal leading-tight">{club.displayName}</p>
            {club.host.instagramId && <p className="mt-1 text-[12px] text-white/80">@{club.host.instagramId}</p>}
          </div>
          <ArrowIcon />
        </div>
      </div>

      {headline && <h3 className="mt-5 font-serif text-[19px] font-medium leading-snug">{headline}</h3>}
      {body && <p className="mt-2 line-clamp-2 whitespace-pre-line text-[13px] leading-relaxed text-muted">{body}</p>}
      {club.moodTags.length > 0 && (
        <p className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-semibold text-accent">
          {club.moodTags.slice(0, 3).map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </p>
      )}
    </Link>
  );
}

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-1 shrink-0">
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);
