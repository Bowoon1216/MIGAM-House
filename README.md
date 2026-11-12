# 미감 (MIGAM) — 인플루언서 모임 플랫폼 MVP

PG 결제 연동 없이 **무통장 입금 + 관리자 수동 확인** 방식으로 운영하는 모임 플랫폼의 MVP입니다.

```
MIGAM/
├── frontend/   Next.js 15 (App Router) + Tailwind  → Vercel
├── backend/    NestJS 11 + Prisma 6                → Railway
└── package.json (npm workspaces)
```

| 구분 | 스택 |
| --- | --- |
| DB | Supabase Postgres (Prisma) |
| 이미지 | Supabase Storage (미설정 시 개발 환경은 로컬 `backend/uploads/`에 저장) |
| 인증 | 카카오/네이버 OAuth를 백엔드에서 직접 처리 → httpOnly JWT 쿠키 |
| 배포 | Vercel(frontend) + Railway(backend) |

## 아키텍처 핵심

- **화면은 모바일 우선 한 컬럼**입니다. 휴대폰에선 화면 전체, 데스크톱에선 화면의 절반(최소 480px)을 씁니다. Tailwind `sm/md/lg` 브레이크포인트는 이 컬럼 폭 기준으로 재정의되어 있어요. ([tailwind.config.ts](frontend/tailwind.config.ts))

- **브라우저는 항상 프론트 도메인의 `/api/*`만 호출합니다.** Next.js `rewrites`가 백엔드로 프록시합니다.
  그래서 쿠키가 프론트 도메인에 저장되고, Vercel ↔ Railway 사이의 크로스도메인 쿠키 문제가 생기지 않습니다.
- OAuth 콜백 URL도 프론트 도메인 기준입니다: `https://<프론트도메인>/api/auth/{kakao|naver}/callback`
- 권한: `USER` / `HOST` / `ADMIN`. 백엔드의 전역 `AuthGuard`와 `@Auth(Role.X)` 데코레이터로 검사합니다. (ADMIN은 모든 권한 포함)
- 신청 상태: `PENDING`(입금 확인 중) → `CONFIRMED`(예약 확정) → `CANCELED`(취소/환불).
  `시즌 종료`는 별도 상태 없이 "확정 + 시즌 종료일 경과"로 계산합니다. ([backend/src/common/domain.ts](backend/src/common/domain.ts))
- 회차별 정확한 주소와 멤버 단톡방 링크는 **입금 확정 멤버, 해당 호스트, 관리자에게만** 응답에 포함됩니다.

## 로컬 개발

```bash
# Node 20.12+ (권장: 22, .nvmrc 참고)
npm install

cp backend/.env.example backend/.env     # DATABASE_URL, DIRECT_URL 등 채우기
cp frontend/.env.example frontend/.env.local

npm run db:migrate    # 마이그레이션 적용
npm run db:seed       # 샘플 데이터 (관리자/유저, 인플루언서 클럽 4개, 무드 태그, 제휴 공간)
npm run dev           # backend :4000 + frontend :3000 동시 실행
```

http://localhost:3000 접속 후 **로그인 → 개발용 로그인 [USER / HOST / ADMIN]** 버튼으로 역할별 화면을 바로 확인할 수 있습니다.
(카카오/네이버 키가 없어도 동작하며, `NODE_ENV=production`에서는 비활성화됩니다.)

```bash
npm test              # 백엔드 도메인 로직 단위 테스트
npm run build         # 전체 빌드
```

## 화면 ↔ 라우트

| 명세 | 경로 |
| --- | --- |
| 1-1 메인 탐색 (하우스 카드 리스트) | `/` (`?tag=`, `?q=`) |
| 1-2 하우스 상세 | `/clubs/[id]` |
| 1-3 멤버십 신청/입금 안내 | `/clubs/[id]/apply` |
| 마이페이지 (나의 하우스) | `/mypage` |
| 2-1 호스트 대시보드 (내 하우스 최대 3개, 시즌별 멤버) | `/host` (`?house=`) |
| 하우스 페이지 수정 | `/host/edit?club=[id]` |
| 2-2 새 하우스 만들기 / 다음 시즌 오픈 (4단계) | `/host/season/new` / `/host/season/new?club=[id]` |
| 3 입금 확인 | `/admin/orders` |
| 3 회차별 대관 확정 | `/admin/venues` |
| 하우스 추천 / 무드 태그 | `/admin/clubs`, `/admin/mood-tags` |
| 호스트 / 제휴 공간 | `/admin/hosts`, `/admin/spaces` |

데이터 구조: `User` → `Club`(= 하우스, 호스트당 최대 3개) → `Season`(4개월 기수) → `SeasonSession`(1~4회차), `Order`는 `Season`에 대한 합류 신청입니다.

## 배포 가이드

### 1. Supabase
1. 프로젝트를 생성합니다. 리전은 Seoul(ap-northeast-2)을 권장합니다.
2. **Project Settings → Database → Connection string**
   - `DATABASE_URL`: Transaction pooler (포트 6543) 뒤에 `?pgbouncer=true`
   - `DIRECT_URL`: Session pooler 또는 Direct (포트 5432). 마이그레이션에 사용합니다.
3. **Storage → New bucket → `meetings`**를 **Public**으로 생성합니다.
4. **Project Settings → API**에서 `SUPABASE_URL`과 `service_role` 키를 확인합니다. service_role 키는 백엔드에만 넣고 절대 프론트에 넣지 마세요.

### 2. Railway (backend)
1. New Project → Deploy from GitHub repo → 이 레포를 선택합니다.
2. Service Settings
   - **Root Directory: 비워두기 (레포 루트)**. npm workspaces는 루트의 `package-lock.json`을 사용하기 때문입니다.
   - **Config file path: `/backend/railway.json`**. 빌드/시작 명령과 헬스체크, watch 경로가 정의되어 있습니다.
3. Variables: [backend/.env.example](backend/.env.example) 항목을 모두 입력합니다. 특히 아래 값들을 확인하세요.
   - `NODE_ENV=production`, `JWT_SECRET`(긴 랜덤 문자열)
   - `FRONTEND_URL=https://<vercel 도메인>`
   - `ADMIN_SNS_IDS=KAKAO:<본인 카카오 회원번호>`. 최초 관리자 지정용입니다. 회원번호를 모르면 먼저 로그인한 뒤 DB의 `User.snsId`에서 확인하세요.
4. Settings → Networking → Generate Domain에서 백엔드 URL을 확보합니다.
5. 시작할 때 `prisma migrate deploy`가 자동으로 실행됩니다.

### 3. Vercel (frontend)
1. Import Project → 같은 레포를 선택합니다.
2. **Root Directory: `frontend`** (Framework: Next.js 자동 감지)
3. Environment Variables: `BACKEND_URL=https://<railway 도메인>`
   - rewrites는 **빌드 시점**에 결정되므로, 값을 바꾸면 반드시 Redeploy해야 합니다.

### 4. 소셜 로그인
- **카카오** (developers.kakao.com)
  - 플랫폼 → Web 사이트 도메인: `https://<vercel 도메인>`
  - 카카오 로그인 활성화. Redirect URI: `https://<vercel 도메인>/api/auth/kakao/callback`
  - 동의항목: 닉네임, 프로필 사진 (이메일은 선택)
  - `KAKAO_CLIENT_ID` = REST API 키. 보안 → Client Secret을 사용하는 경우 `KAKAO_CLIENT_SECRET`도 입력합니다.
- **네이버** (developers.naver.com)
  - 서비스 URL: `https://<vercel 도메인>`. Callback URL: `https://<vercel 도메인>/api/auth/naver/callback`
  - 제공 정보: 이름, 이메일, 프로필 사진
  - 검수 전에는 등록된 테스터 계정만 로그인할 수 있습니다.
- 로컬 테스트용으로는 `http://localhost:3000/api/auth/{provider}/callback`도 함께 등록합니다.

### 운영 흐름 (수동 입금 확인)
1. 유저가 신청하면 `/admin/orders`의 [입금 대기] 탭에 표시됩니다.
2. 은행 앱에서 입금자명과 금액을 대조한 뒤 **[입금 확인]**을 누릅니다.
3. 유저 마이페이지가 `예약 확정`으로 바뀌고 주소와 오픈채팅이 노출됩니다. 마이페이지는 포커스 시와 30초마다 갱신됩니다.
4. 알림톡/문자는 [NotificationsService](backend/src/notifications/notifications.service.ts)에 stub으로 준비되어 있습니다. 대행사(Solapi, NHN Cloud 등) 연동 시 이 서비스만 구현하면 됩니다.

### 호스트 등록
인플루언서가 카카오/네이버로 **한 번 로그인**한 뒤, 관리자가 `/admin/hosts`에서 검색해 **[호스트 권한 부여]**를 누르면 됩니다.

## MVP 이후 고려 사항
- PG 결제 연동 (토스페이먼츠 등) → `Order`에 결제 키 필드 추가
- 유저 본인 신청 취소, 환불 계좌 수집
- 모임 수정/삭제, 이미지 리사이즈
- 상세 페이지 SSR (SEO, 공유용 OG 이미지)

## 1. 실행
```bash
npm run dev
```
백엔드(:4000)와 프론트(:3000)가 함께 뜹니다. **http://localhost:3000** 에 접속하세요.
