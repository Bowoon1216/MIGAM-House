import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, User, VenueStatus } from '@prisma/client';
import {
  ACTIVE_ORDER_STATUSES,
  canSeePrivateInfo,
  displayStatus,
  MAX_CLUBS_PER_HOST,
  recruitStatus,
  seasonEndDate,
  seasonPhase,
} from '../common/domain';
import { PrismaService } from '../prisma/prisma.service';
import { ClubProfileDto, OpenSeasonDto, SeasonFieldsDto, SessionInputDto } from './dto';

const hostSelect = { id: true, name: true, instagramId: true, profileImg: true } satisfies Prisma.UserSelect;

const activeCount = {
  _count: { select: { orders: { where: { status: { in: ACTIVE_ORDER_STATUSES } } } } },
} satisfies Prisma.SeasonInclude;

/** 가장 최근 시즌 1개 (카드/상세의 '현재 시즌') */
const latestSeason = {
  orderBy: { number: 'desc' },
  take: 1,
  include: activeCount,
} satisfies Prisma.Club$seasonsArgs;

type SeasonWithCount = Prisma.SeasonGetPayload<{ include: typeof activeCount }>;

function seasonSummary(s: SeasonWithCount) {
  const { _count, openChatUrl: _private, ...rest } = s;
  return {
    ...rest,
    appliedCount: _count.orders,
    recruitStatus: recruitStatus(s, _count.orders),
    phase: seasonPhase(s, _count.orders),
  };
}

const PHASE_ORDER = { RECRUITING: 0, FULL: 1, IN_PROGRESS: 2, ENDED: 3 } as const;

/** 하우스 주인(또는 관리자)만 */
function assertOwner(club: { hostId: string }, user: User) {
  if (club.hostId !== user.id && user.role !== Role.ADMIN) throw new ForbiddenException();
}

const hostClubInclude = {
  seasons: {
    orderBy: { number: 'desc' },
    include: {
      sessions: { orderBy: { round: 'asc' }, include: { space: { select: { name: true, address: true } } } },
      orders: { select: { status: true } },
    },
  },
} satisfies Prisma.ClubInclude;

function toHostClub(club: Prisma.ClubGetPayload<{ include: typeof hostClubInclude }>) {
  return {
    ...club,
    seasons: club.seasons.map(({ orders, ...s }) => {
      const confirmed = orders.filter((o) => o.status === 'CONFIRMED').length;
      const pending = orders.filter((o) => o.status === 'PENDING').length;
      return {
        ...s,
        confirmedCount: confirmed,
        pendingCount: pending,
        appliedCount: confirmed + pending,
        phase: seasonPhase(s, confirmed + pending),
      };
    }),
  };
}

@Injectable()
export class ClubsService {
  constructor(private readonly prisma: PrismaService) {}

  // ───────────── 공개 ─────────────

  async list(params: { tag?: string; q?: string }) {
    const where: Prisma.ClubWhereInput = { seasons: { some: {} } };
    const tag = params.tag?.trim().replace(/^#/, '');
    if (tag) where.moodTags = { has: tag };
    const q = params.q?.trim().replace(/^@/, '');
    if (q) {
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { host: { name: { contains: q, mode: 'insensitive' } } },
        { host: { instagramId: { contains: q, mode: 'insensitive' } } },
      ];
    }
    const clubs = await this.prisma.club.findMany({
      where,
      include: { host: { select: hostSelect }, seasons: latestSeason },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const cards = clubs.map(({ seasons, gallery, benefits: _b, ...c }) => ({
      ...c,
      coverImage: gallery[0] ?? null,
      season: seasons[0] ? seasonSummary(seasons[0]) : null,
    }));
    // 추천 → 모집 중 → 최신순
    return cards.sort(
      (a, b) =>
        Number(b.isFeatured) - Number(a.isFeatured) ||
        PHASE_ORDER[a.season?.phase ?? 'ENDED'] - PHASE_ORDER[b.season?.phase ?? 'ENDED'],
    );
  }

  async moodTags() {
    const tags = await this.prisma.moodTag.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    if (tags.length) return tags.map((t) => t.name);
    // 관리자 태그가 없으면 클럽들이 실제 사용 중인 태그
    const rows = await this.prisma.$queryRaw<{ tag: string }[]>`
      SELECT unnest("moodTags") AS tag, COUNT(*) AS c FROM "Club" GROUP BY tag ORDER BY c DESC LIMIT 20`;
    return rows.map((r) => r.tag);
  }

  async detail(id: string, viewer: User | null) {
    const club = await this.prisma.club.findUnique({
      where: { id },
      include: {
        host: { select: hostSelect },
        seasons: {
          orderBy: { number: 'desc' },
          take: 1,
          include: {
            ...activeCount,
            sessions: { orderBy: { round: 'asc' }, include: { space: { select: { address: true } } } },
          },
        },
        _count: { select: { seasons: true } },
      },
    });
    if (!club) throw new NotFoundException('하우스를 찾을 수 없습니다.');

    const { seasons, _count, ...rest } = club;
    const season = seasons[0];
    if (!season) return { ...rest, seasonCount: 0, season: null, myOrder: null };

    const myOrder = viewer
      ? await this.prisma.order.findFirst({
          where: { seasonId: season.id, userId: viewer.id, status: { in: ACTIVE_ORDER_STATUSES } },
          select: { id: true, status: true },
        })
      : null;
    const reveal = canSeePrivateInfo({ viewer, hostId: club.hostId, viewerOrderStatus: myOrder?.status });

    const { sessions, ...seasonRest } = season;
    return {
      ...rest,
      seasonCount: _count.seasons,
      season: {
        ...seasonSummary(seasonRest),
        ...(reveal ? { openChatUrl: season.openChatUrl } : {}),
        sessions: sessions.map(({ space, ...s }) => ({ ...s, ...(reveal ? { address: space?.address ?? null } : {}) })),
      },
      myOrder: myOrder ? { ...myOrder, displayStatus: displayStatus(myOrder.status, season.endDate) } : null,
    };
  }

  // ───────────── 호스트 ─────────────

  /** 호스트의 하우스 목록 (최신순, 각 하우스의 전체 시즌 포함) */
  async hostClubs(host: User) {
    const clubs = await this.prisma.club.findMany({
      where: { hostId: host.id },
      include: hostClubInclude,
      orderBy: { createdAt: 'asc' },
    });
    return clubs.map(toHostClub);
  }

  async hostClub(host: User, clubId: string) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId }, include: hostClubInclude });
    if (!club) throw new NotFoundException('하우스를 찾을 수 없습니다.');
    assertOwner(club, host);
    return toHostClub(club);
  }

  /** 하우스 삭제: 합류 신청 이력이 한 번도 없는 하우스만 */
  async deleteClub(host: User, clubId: string) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      include: { seasons: { select: { _count: { select: { orders: true } } } } },
    });
    if (!club) throw new NotFoundException('하우스를 찾을 수 없습니다.');
    assertOwner(club, host);
    if (club.seasons.some((s) => s._count.orders > 0)) {
      throw new BadRequestException('합류 신청 이력이 있는 하우스는 삭제할 수 없어요. 관리자에게 문의해주세요.');
    }
    await this.prisma.club.delete({ where: { id: clubId } });
    return { ok: true };
  }

  /** 회차 입력 → 저장할 데이터 (제휴 공간명으로 공개 장소 표기) */
  private async resolveSessions(sessions: SessionInputDto[]) {
    const spaceIds = sessions.map((s) => s.spaceId).filter((v): v is string => !!v);
    const spaces = await this.prisma.space.findMany({ where: { id: { in: spaceIds } } });
    const spaceName = new Map(spaces.map((s) => [s.id, s.name]));
    if (spaceIds.some((id) => !spaceName.has(id))) throw new NotFoundException('선택한 제휴 공간을 찾을 수 없습니다.');
    return sessions.map((s, i) => ({
      round: i + 1,
      title: s.title,
      description: s.description || null,
      durationMinutes: s.durationMinutes,
      spaceId: s.spaceId || null,
      locationText: (s.spaceId && spaceName.get(s.spaceId)) || '장소 미정',
    }));
  }

  private profileData(p: ClubProfileDto) {
    return {
      displayName: p.displayName,
      moodTags: p.moodTags,
      intro: p.intro,
      gallery: p.gallery,
      benefits: p.benefits,
      instagramFollowers: p.instagramFollowers ?? null,
    };
  }

  async openSeason(host: User, dto: OpenSeasonDto) {
    const { season } = dto;
    if (season.startDate <= new Date()) throw new BadRequestException('시즌 시작일은 오늘 이후여야 합니다.');
    const sessions = await this.resolveSessions(season.sessions);
    const profile = this.profileData(dto.profile);

    return this.prisma.$transaction(async (tx) => {
      let club;
      if (dto.clubId) {
        // 기존 하우스의 다음 시즌
        const found = await tx.club.findUnique({ where: { id: dto.clubId } });
        if (!found) throw new NotFoundException('하우스를 찾을 수 없습니다.');
        assertOwner(found, host);
        club = await tx.club.update({
          where: { id: found.id },
          data: profile,
          include: { seasons: { orderBy: { number: 'desc' }, take: 1 } },
        });
      } else {
        // 새 하우스
        const count = await tx.club.count({ where: { hostId: host.id } });
        if (count >= MAX_CLUBS_PER_HOST) {
          throw new ConflictException(`하우스는 최대 ${MAX_CLUBS_PER_HOST}개까지 만들 수 있어요.`);
        }
        club = await tx.club.create({
          data: { hostId: host.id, ...profile },
          include: { seasons: { orderBy: { number: 'desc' }, take: 1 } },
        });
      }
      const last = club.seasons[0];
      if (last && last.startDate > new Date()) {
        throw new ConflictException(`이미 멤버를 모집 중인 시즌 ${last.number}이 있어요.`);
      }
      return tx.season.create({
        data: {
          clubId: club.id,
          number: (last?.number ?? 0) + 1,
          price: season.price,
          maxCapacity: season.maxCapacity,
          startDate: season.startDate,
          endDate: seasonEndDate(season.startDate),
          openChatUrl: season.openChatUrl ?? null,
          sessions: { create: sessions },
        },
        include: { club: { select: { id: true } } },
      });
    });
  }

  /** 하우스 페이지(프로필) 수정 */
  async updateProfile(host: User, clubId: string, dto: ClubProfileDto) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new NotFoundException('하우스를 찾을 수 없습니다.');
    assertOwner(club, host);
    return this.prisma.club.update({ where: { id: club.id }, data: this.profileData(dto) });
  }

  /**
   * 시즌 수정.
   * - 커리큘럼/단톡방 링크: 시즌이 끝나기 전까지 수정 가능
   * - 시작일/정원/가격: 시즌 시작 전까지만. 가격은 합류 신청자가 없을 때만.
   * - 회차의 제휴 공간을 바꾸면 대관 상태가 '요청'으로 돌아간다.
   */
  async updateSeason(host: User, seasonId: string, dto: SeasonFieldsDto) {
    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
      include: { club: true, sessions: true, ...activeCount },
    });
    if (!season) throw new NotFoundException('시즌을 찾을 수 없습니다.');
    assertOwner(season.club, host);

    const now = new Date();
    if (season.endDate <= now) throw new BadRequestException('종료된 시즌은 수정할 수 없어요.');
    const started = season.startDate <= now;
    const members = season._count.orders;

    const startChanged = dto.startDate.getTime() !== season.startDate.getTime();
    if (started && (startChanged || dto.price !== season.price || dto.maxCapacity !== season.maxCapacity)) {
      throw new BadRequestException('이미 시작된 시즌은 시작일·가격·정원을 바꿀 수 없어요.');
    }
    if (startChanged && dto.startDate <= now) throw new BadRequestException('시즌 시작일은 오늘 이후여야 합니다.');
    if (dto.price !== season.price && members > 0) {
      throw new BadRequestException(`이미 합류 신청한 멤버(${members}명)가 있어 가격을 바꿀 수 없어요.`);
    }
    if (dto.maxCapacity < members) {
      throw new BadRequestException(`정원은 현재 합류 신청 인원(${members}명)보다 적게 줄일 수 없어요.`);
    }

    const sessions = await this.resolveSessions(dto.sessions);
    const prevByRound = new Map(season.sessions.map((s) => [s.round, s]));

    return this.prisma.$transaction(async (tx) => {
      for (const s of sessions) {
        const prev = prevByRound.get(s.round);
        const venueReset = !prev || prev.spaceId !== s.spaceId ? { venueStatus: VenueStatus.REQUESTED, scheduledAt: null } : {};
        await tx.seasonSession.upsert({
          where: { seasonId_round: { seasonId, round: s.round } },
          create: { seasonId, ...s },
          update: { ...s, ...venueReset },
        });
      }
      return tx.season.update({
        where: { id: seasonId },
        data: {
          price: dto.price,
          maxCapacity: dto.maxCapacity,
          startDate: dto.startDate,
          endDate: startChanged ? seasonEndDate(dto.startDate) : season.endDate,
          openChatUrl: dto.openChatUrl ?? null,
        },
        include: { club: { select: { id: true } } },
      });
    });
  }

  async seasonMembers(seasonId: string, viewer: User) {
    const season = await this.prisma.season.findUnique({ where: { id: seasonId }, include: { club: true } });
    if (!season) throw new NotFoundException('시즌을 찾을 수 없습니다.');
    assertOwner(season.club, viewer);
    return this.prisma.order.findMany({
      where: { seasonId },
      select: { id: true, applicantName: true, instagramId: true, contact: true, status: true, amount: true, appliedAt: true },
      orderBy: { appliedAt: 'asc' },
    });
  }

  // ───────────── 관리자 ─────────────

  async adminClubs() {
    const clubs = await this.prisma.club.findMany({
      include: { host: { select: hostSelect }, seasons: latestSeason, _count: { select: { seasons: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return clubs.map(({ seasons, gallery, ...c }) => ({
      ...c,
      coverImage: gallery[0] ?? null,
      season: seasons[0] ? seasonSummary(seasons[0]) : null,
    }));
  }

  setFeatured(id: string, isFeatured: boolean) {
    return this.prisma.club.update({ where: { id }, data: { isFeatured } });
  }

  adminSessions(status?: string) {
    const where: Prisma.SeasonSessionWhereInput = { season: { endDate: { gt: new Date() } } };
    if (status && (Object.values(VenueStatus) as string[]).includes(status)) where.venueStatus = status as VenueStatus;
    return this.prisma.seasonSession.findMany({
      where,
      include: {
        space: { select: { name: true, address: true, priceCondition: true } },
        season: { select: { id: true, number: true, startDate: true, club: { select: { id: true, displayName: true } } } },
      },
      orderBy: [{ season: { startDate: 'asc' } }, { round: 'asc' }],
      take: 300,
    });
  }

  async updateSessionVenue(id: string, venueStatus: VenueStatus, scheduledAt?: Date) {
    const session = await this.prisma.seasonSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('회차를 찾을 수 없습니다.');
    if (venueStatus === VenueStatus.FIXED && !session.spaceId) {
      throw new BadRequestException('제휴 공간이 선택되지 않은 회차는 대관 확정할 수 없습니다.');
    }
    return this.prisma.seasonSession.update({
      where: { id },
      data: { venueStatus, ...(scheduledAt !== undefined ? { scheduledAt } : {}) },
    });
  }
}
