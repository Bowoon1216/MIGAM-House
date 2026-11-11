import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, User } from '@prisma/client';
import { ACTIVE_ORDER_STATUSES, canTransition, displayStatus } from '../common/domain';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(user: User, seasonId: string, dto: CreateOrderDto) {
    try {
      const order = await this.prisma.$transaction(
        async (tx) => {
          const season = await tx.season.findUnique({ where: { id: seasonId } });
          if (!season) throw new NotFoundException('시즌을 찾을 수 없습니다.');
          if (season.startDate <= new Date()) throw new BadRequestException('이미 시작된 시즌이라 합류할 수 없어요.');

          const existing = await tx.order.findFirst({
            where: { seasonId, userId: user.id, status: { in: ACTIVE_ORDER_STATUSES } },
          });
          if (existing) throw new ConflictException('이미 합류 신청한 시즌입니다.');

          const count = await tx.order.count({ where: { seasonId, status: { in: ACTIVE_ORDER_STATUSES } } });
          if (count >= season.maxCapacity) throw new ConflictException('이번 시즌 멤버 모집이 마감되었습니다.');

          return tx.order.create({
            data: {
              userId: user.id,
              seasonId,
              amount: season.price,
              applicantName: dto.applicantName,
              contact: dto.contact,
              instagramId: dto.instagramId,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      // 다음 신청 시 자동 입력되도록 인스타 ID 저장
      if (!user.instagramId) {
        await this.prisma.user.update({ where: { id: user.id }, data: { instagramId: dto.instagramId } });
      }
      return order;
    } catch (e) {
      // 동시 신청으로 직렬화 충돌 시
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
        throw new ConflictException('신청이 몰리고 있습니다. 잠시 후 다시 시도해주세요.');
      }
      throw e;
    }
  }

  async mine(user: User) {
    const orders = await this.prisma.order.findMany({
      where: { userId: user.id },
      include: {
        season: {
          include: {
            club: { select: { id: true, displayName: true, gallery: true } },
            sessions: { orderBy: { round: 'asc' }, include: { space: { select: { address: true } } } },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
    return orders.map(({ season, ...o }) => {
      const confirmed = o.status === OrderStatus.CONFIRMED;
      const { club, sessions, openChatUrl, ...s } = season;
      return {
        ...o,
        displayStatus: displayStatus(o.status, season.endDate),
        season: {
          ...s,
          club: { id: club.id, displayName: club.displayName, coverImage: club.gallery[0] ?? null },
          sessions: sessions.map(({ space, ...x }) => ({ ...x, ...(confirmed ? { address: space?.address ?? null } : {}) })),
          ...(confirmed ? { openChatUrl } : {}),
        },
      };
    });
  }

  adminList(status?: string) {
    const where: Prisma.OrderWhereInput = {};
    if (status && (Object.values(OrderStatus) as string[]).includes(status)) where.status = status as OrderStatus;
    return this.prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        season: { select: { id: true, number: true, startDate: true, club: { select: { id: true, displayName: true } } } },
      },
      orderBy: { appliedAt: 'desc' },
      take: 500,
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { season: { include: { club: { select: { displayName: true } } } } },
    });
    if (!order) throw new NotFoundException('신청 내역을 찾을 수 없습니다.');
    if (!canTransition(order.status, status)) {
      throw new BadRequestException(`${order.status} 상태에서 ${status}(으)로 변경할 수 없습니다.`);
    }
    const updated = await this.prisma.order.update({
      where: { id, status: order.status }, // 낙관적 잠금: 그 사이 상태가 바뀌었으면 실패
      data: {
        status,
        confirmedAt: status === OrderStatus.CONFIRMED ? new Date() : undefined,
        canceledAt: status === OrderStatus.CANCELED ? new Date() : undefined,
      },
    });
    if (status === OrderStatus.CONFIRMED) {
      this.notifications
        .orderConfirmed({
          contact: order.contact,
          applicantName: order.applicantName,
          clubName: order.season.club.displayName,
          seasonNumber: order.season.number,
          startDate: order.season.startDate,
        })
        .catch((e) => console.error('[notifications] failed', e));
    }
    return updated;
  }
}
