CREATE TYPE "ActivityType" AS ENUM ('REHEARSAL','MASS','CONCERT','MEETING','TRAINING','RECOLLECTION','OUTING','PERFORMANCE','OTHER');
CREATE TYPE "ActivityStatus" AS ENUM ('SCHEDULED','CANCELLED','POSTPONED','COMPLETED');
CREATE TYPE "ActivityVisibility" AS ENUM ('ALL_MEMBERS','LEADERS_ONLY','TARGETED');
CREATE TYPE "RecurrenceType" AS ENUM ('WEEKLY','MONTHLY','CUSTOM');
CREATE TABLE "pastoral_years" (
  "id" UUID NOT NULL,
  "choirId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pastoral_years_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pastoral_years_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "pastoral_years_choirId_name_key" ON "pastoral_years"("choirId","name");
CREATE INDEX "pastoral_years_choirId_startDate_endDate_idx" ON "pastoral_years"("choirId","startDate","endDate");
CREATE UNIQUE INDEX "pastoral_years_one_active_per_choir" ON "pastoral_years"("choirId") WHERE "isActive" = true;
CREATE TABLE "activity_series" (
  "id" UUID NOT NULL,
  "choirId" UUID NOT NULL,
  "recurrenceType" "RecurrenceType" NOT NULL,
  "interval" INTEGER NOT NULL DEFAULT 1,
  "daysOfWeek" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "customDates" TIMESTAMP(3)[] NOT NULL DEFAULT ARRAY[]::TIMESTAMP(3)[],
  "until" TIMESTAMP(3) NOT NULL,
  "timezone" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "activity_series_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "activity_series_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "activity_series_choirId_idx" ON "activity_series"("choirId");
CREATE TABLE "activities" (
  "id" UUID NOT NULL,
  "choirId" UUID NOT NULL,
  "pastoralYearId" UUID,
  "seriesId" UUID,
  "type" "ActivityType" NOT NULL,
  "status" "ActivityStatus" NOT NULL DEFAULT 'SCHEDULED',
  "title" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "timezone" TEXT NOT NULL,
  "location" TEXT,
  "description" TEXT,
  "responsibleMembershipId" UUID,
  "visibility" "ActivityVisibility" NOT NULL DEFAULT 'ALL_MEMBERS',
  "attendanceRequired" BOOLEAN NOT NULL DEFAULT true,
  "reminderOffsetsMinutes" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "cancellationReason" TEXT,
  "isSeriesOverride" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "activities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "activities_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "activities_pastoralYearId_fkey" FOREIGN KEY ("pastoralYearId") REFERENCES "pastoral_years"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "activities_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "activity_series"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "activities_responsibleMembershipId_fkey" FOREIGN KEY ("responsibleMembershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "activities_seriesId_startsAt_key" ON "activities"("seriesId","startsAt");
CREATE INDEX "activities_choirId_startsAt_idx" ON "activities"("choirId","startsAt");
CREATE INDEX "activities_pastoralYearId_idx" ON "activities"("pastoralYearId");
CREATE TABLE "activity_targets" (
  "activityId" UUID NOT NULL,
  "membershipId" UUID NOT NULL,
  CONSTRAINT "activity_targets_pkey" PRIMARY KEY ("activityId","membershipId"),
  CONSTRAINT "activity_targets_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "activity_targets_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
