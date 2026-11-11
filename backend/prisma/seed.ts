import { AuthProvider, PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
};
const addMonths = (d: Date, n: number) => {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
};
/** 세로형 샘플 사진 (실제 서비스에서는 인플루언서가 업로드) */
const photo = (seed: string) => `https://picsum.photos/seed/${seed}/900/1200`;

async function upsertUser(snsId: string, name: string, role: Role, instagramId?: string) {
  return prisma.user.upsert({
    where: { provider_snsId: { provider: AuthProvider.DEV, snsId } },
    update: { role, name, instagramId },
    create: { provider: AuthProvider.DEV, snsId, name, role, instagramId },
  });
}

const MOOD_TAGS = ['프렌치시크', '으른여자', '올드머니룩', '힙스터', '미니멀', '빈티지', '꾸안꾸', '러블리'];

const DEFAULT_CURRICULUM = [
  { title: '웰컴 티타임', description: '서로의 취향을 알아가는 첫 만남', durationMinutes: 120 },
  { title: '스타일 체인지', description: '나에게 맞는 퍼스널 무드 찾기', durationMinutes: 150 },
  { title: '핫플 투어', description: '제가 영감받는 장소에 함께 가요', durationMinutes: 180 },
  { title: '프라이빗 와인 파티', description: '시즌을 마무리하는 작별 인사', durationMinutes: 150 },
];

const CLUBS = [
  {
    snsId: 'host', // 개발용 로그인 [HOST] 계정
    name: '김지수',
    instagramId: 'jisu.mood',
    displayName: 'Jisu',
    moodTags: ['프렌치시크', '으른여자', '미니멀'],
    followers: 128000,
    intro:
      '저는 힘을 뺀 듯 단정한 옷차림, 오후 네 시의 햇살, 오래 쓴 가죽 가방 같은 것들을 사랑해요.\n화려하지 않아도 오래 기억되는 사람이 되는 법을 함께 이야기하고 싶어요.',
    benefits: ['나만의 시그니처 무드 찾기', '사진이 잘 나오는 포즈와 각도', '말투와 애티튜드에서 나오는 분위기', '흔들리지 않는 멘탈 관리법'],
    price: 200000,
    maxCapacity: 10,
    startIn: 21,
    featured: true,
  },
  {
    snsId: 'host:seed-yuna',
    name: '박유나',
    instagramId: 'yuna_oldmoney',
    displayName: 'Yuna',
    moodTags: ['올드머니룩', '으른여자', '빈티지'],
    followers: 86000,
    intro: '좋은 소재 하나가 옷차림 전체를 바꾼다고 믿어요.\n유행보다 오래가는 취향, 조용한 고급스러움을 함께 만들어가요.',
    benefits: ['기본 아이템으로 고급스럽게 입는 법', '빈티지 쇼핑 노하우', '레스토랑·호텔 매너와 애티튜드'],
    price: 240000,
    maxCapacity: 8,
    startIn: 28,
    featured: false,
  },
  {
    snsId: 'host:seed-hana',
    name: '이하나',
    instagramId: 'hana.hipster',
    displayName: 'Hana',
    moodTags: ['힙스터', '빈티지', '꾸안꾸'],
    followers: 54000,
    intro: '을지로 골목, 필름 카메라, 레코드 가게.\n남들이 안 가는 곳에서 나만의 무드를 찾는 걸 좋아해요.',
    benefits: ['필름 카메라로 감도 높은 사진 찍기', '숨은 핫플 리스트', '믹스매치 스타일링'],
    price: 180000,
    maxCapacity: 12,
    startIn: 14,
    featured: false,
  },
  {
    snsId: 'host:seed-sora',
    name: '정소라',
    instagramId: 'sora.lovely',
    displayName: 'Sora',
    moodTags: ['러블리', '프렌치시크'],
    followers: 210000,
    intro: '꽃집 앞에서 걸음을 멈추는 사람이에요.\n일상을 조금 더 사랑스럽게 만드는 작은 습관들을 나눠요.',
    benefits: ['러블리하지만 과하지 않은 메이크업', '셀프 브랜딩을 위한 피드 구성', '자존감을 지키는 대화법'],
    price: 200000,
    maxCapacity: 10,
    startIn: 35,
    featured: false,
  },
];

async function main() {
  await upsertUser('admin', '관리자', Role.ADMIN);
  await upsertUser('user', '홍길동', Role.USER, 'gildong.hong');

  for (const [i, name] of MOOD_TAGS.entries()) {
    await prisma.moodTag.upsert({ where: { name }, update: {}, create: { name, sortOrder: i } });
  }

  if ((await prisma.space.count()) === 0) {
    await prisma.space.createMany({
      data: [
        { name: '성수 A 스튜디오', address: '서울 성동구 성수이로 00', priceCondition: '무료' },
        { name: '한남 B 라운지', address: '서울 용산구 한남대로 00', priceCondition: '5만원' },
        { name: '청담 C 와인바', address: '서울 강남구 도산대로 00', priceCondition: '음료 1잔 이상' },
      ],
    });
  }
  const spaces = await prisma.space.findMany({ orderBy: { createdAt: 'asc' } });

  for (const c of CLUBS) {
    const host = await upsertUser(c.snsId, c.name, Role.HOST, c.instagramId);
    if (await prisma.club.findUnique({ where: { hostId: host.id } })) continue;

    const key = c.displayName.toLowerCase();
    const startDate = daysFromNow(c.startIn);
    await prisma.club.create({
      data: {
        hostId: host.id,
        displayName: c.displayName,
        moodTags: c.moodTags,
        gallery: Array.from({ length: 6 }, (_, n) => photo(`${key}${n}`)),
        intro: c.intro,
        benefits: c.benefits,
        instagramFollowers: c.followers,
        isFeatured: c.featured,
        seasons: {
          create: {
            number: 1,
            price: c.price,
            maxCapacity: c.maxCapacity,
            startDate,
            endDate: addMonths(startDate, 4),
            openChatUrl: 'https://open.kakao.com/o/example',
            sessions: {
              create: DEFAULT_CURRICULUM.map((s, n) => {
                const space = spaces[n % spaces.length];
                return { ...s, round: n + 1, spaceId: space?.id, locationText: space?.name ?? '장소 미정' };
              }),
            },
          },
        },
      },
    });
  }
  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
