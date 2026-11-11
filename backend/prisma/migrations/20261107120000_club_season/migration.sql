-- 단건 모임(Meeting) 구조를 클럽(Club) → 시즌(Season) → 회차(SeasonSession) 구조로 전환.
-- MVP 출시 전 전환이므로 기존 모임/신청 데이터는 이관하지 않는다.
DELETE FROM "Order";

-- CreateEnum
CREATE TYPE "VenueStatus" AS ENUM ('REQUESTED', 'FIXED');

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_hostId_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_spaceId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_meetingId_fkey";

-- DropIndex
DROP INDEX "Order_meetingId_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "meetingId",
ADD COLUMN     "seasonId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Meeting";

-- CreateTable
CREATE TABLE "MoodTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoodTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "moodTags" TEXT[],
    "gallery" TEXT[],
    "intro" TEXT NOT NULL,
    "benefits" TEXT[],
    "instagramFollowers" INTEGER,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "openChatUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonSession" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "spaceId" TEXT,
    "locationText" TEXT NOT NULL,
    "venueStatus" "VenueStatus" NOT NULL DEFAULT 'REQUESTED',
    "scheduledAt" TIMESTAMP(3),

    CONSTRAINT "SeasonSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MoodTag_name_key" ON "MoodTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Club_hostId_key" ON "Club"("hostId");

-- CreateIndex
CREATE INDEX "Club_isFeatured_idx" ON "Club"("isFeatured");

-- CreateIndex
CREATE INDEX "Season_startDate_idx" ON "Season"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Season_clubId_number_key" ON "Season"("clubId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonSession_seasonId_round_key" ON "SeasonSession"("seasonId", "round");

-- CreateIndex
CREATE INDEX "Order_seasonId_idx" ON "Order"("seasonId");

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonSession" ADD CONSTRAINT "SeasonSession_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonSession" ADD CONSTRAINT "SeasonSession_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

