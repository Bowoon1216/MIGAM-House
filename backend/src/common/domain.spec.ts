import { OrderStatus, Role } from '@prisma/client';
import {
  canSeePrivateInfo,
  canTransition,
  displayStatus,
  recruitStatus,
  safeReturnTo,
  seasonEndDate,
  seasonPhase,
} from './domain';

const now = new Date('2026-01-10T00:00:00Z');
const future = new Date('2026-02-01T00:00:00Z');
const past = new Date('2026-01-01T00:00:00Z');

describe('recruitStatus', () => {
  it('정원 미달 + 시즌 시작 전이면 모집중', () => {
    expect(recruitStatus({ startDate: future, maxCapacity: 5 }, 4, now)).toBe('OPEN');
  });
  it('정원이 차면 마감', () => {
    expect(recruitStatus({ startDate: future, maxCapacity: 5 }, 5, now)).toBe('CLOSED');
  });
  it('시즌이 시작되면 마감', () => {
    expect(recruitStatus({ startDate: past, maxCapacity: 5 }, 0, now)).toBe('CLOSED');
  });
});

describe('displayStatus', () => {
  it('확정 + 종료된 시즌은 시즌 종료', () => {
    expect(displayStatus(OrderStatus.CONFIRMED, past, now)).toBe('COMPLETED');
  });
  it('확정 + 진행 중/예정 시즌은 예약 확정', () => {
    expect(displayStatus(OrderStatus.CONFIRMED, future, now)).toBe('CONFIRMED');
  });
  it('대기는 그대로', () => {
    expect(displayStatus(OrderStatus.PENDING, past, now)).toBe('PENDING');
  });
});

describe('seasonPhase', () => {
  const s = { startDate: future, endDate: seasonEndDate(future), maxCapacity: 5 };
  it('시작 전 + 정원 미달이면 모집 중', () => expect(seasonPhase(s, 4, now)).toBe('RECRUITING'));
  it('시작 전 + 정원 마감', () => expect(seasonPhase(s, 5, now)).toBe('FULL'));
  it('시작 후 종료 전이면 진행 중', () => expect(seasonPhase(s, 0, new Date('2026-03-01T00:00:00Z'))).toBe('IN_PROGRESS'));
  it('종료 후', () => expect(seasonPhase(s, 0, new Date('2026-07-01T00:00:00Z'))).toBe('ENDED'));
});

describe('seasonEndDate', () => {
  it('시작일로부터 4개월 뒤', () => {
    expect(seasonEndDate(new Date('2026-03-01T00:00:00Z')).toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });
});

describe('canTransition', () => {
  it.each([
    [OrderStatus.PENDING, OrderStatus.CONFIRMED, true],
    [OrderStatus.PENDING, OrderStatus.CANCELED, true],
    [OrderStatus.CONFIRMED, OrderStatus.CANCELED, true],
    [OrderStatus.CONFIRMED, OrderStatus.PENDING, false],
    [OrderStatus.CANCELED, OrderStatus.CONFIRMED, false],
    [OrderStatus.PENDING, OrderStatus.PENDING, false],
  ])('%s -> %s = %s', (from, to, expected) => {
    expect(canTransition(from, to)).toBe(expected);
  });
});

describe('canSeePrivateInfo', () => {
  const user = { id: 'u1', role: Role.USER };
  it('비로그인은 불가', () => {
    expect(canSeePrivateInfo({ viewer: null, hostId: 'h1' })).toBe(false);
  });
  it('입금 대기 유저는 불가', () => {
    expect(canSeePrivateInfo({ viewer: user, hostId: 'h1', viewerOrderStatus: OrderStatus.PENDING })).toBe(false);
  });
  it('확정 유저는 가능', () => {
    expect(canSeePrivateInfo({ viewer: user, hostId: 'h1', viewerOrderStatus: OrderStatus.CONFIRMED })).toBe(true);
  });
  it('해당 클럽 호스트는 가능', () => {
    expect(canSeePrivateInfo({ viewer: { id: 'h1', role: Role.HOST }, hostId: 'h1' })).toBe(true);
  });
  it('다른 호스트는 불가', () => {
    expect(canSeePrivateInfo({ viewer: { id: 'h2', role: Role.HOST }, hostId: 'h1' })).toBe(false);
  });
  it('관리자는 가능', () => {
    expect(canSeePrivateInfo({ viewer: { id: 'a', role: Role.ADMIN }, hostId: 'h1' })).toBe(true);
  });
});

describe('safeReturnTo', () => {
  it.each([
    ['/clubs/1', '/clubs/1'],
    ['//evil.com', '/'],
    ['https://evil.com', '/'],
    ['/\\evil.com', '/'],
    [undefined, '/'],
  ])('%s -> %s', (input, expected) => {
    expect(safeReturnTo(input)).toBe(expected);
  });
});
