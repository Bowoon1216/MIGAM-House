-- 호스트 1명당 여러 개(최대 3개)의 하우스 허용
DROP INDEX "Club_hostId_key";

CREATE INDEX "Club_hostId_idx" ON "Club"("hostId");
