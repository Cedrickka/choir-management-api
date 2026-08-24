-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('CDF', 'USD');

-- CreateEnum
CREATE TYPE "FinanceFundType" AS ENUM ('ORDINARY', 'ASSISTANCE', 'PROJECT', 'ACTIVITY', 'OTHER');

-- CreateEnum
CREATE TYPE "FinanceContributionFrequency" AS ENUM ('ONCE', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "FinanceTargetType" AS ENUM ('ALL_MEMBERS', 'VOICE_SECTIONS', 'MEMBERS');

-- CreateEnum
CREATE TYPE "FinancePaymentMethod" AS ENUM ('CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "FinanceEntryStatus" AS ENUM ('PENDING', 'VALIDATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FinanceMovementType" AS ENUM ('OPENING_BALANCE', 'CONTRIBUTION_PAYMENT', 'INCOME', 'EXPENSE', 'REVERSAL');

-- CreateEnum
CREATE TYPE "SongStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SongDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "LiturgicalSeason" AS ENUM ('ADVENT', 'CHRISTMAS', 'LENT', 'EASTER', 'ORDINARY_TIME', 'OTHER');

-- CreateEnum
CREATE TYPE "SongTrackType" AS ENUM ('SOPRANO', 'ALTO', 'TENOR', 'BASS', 'ENSEMBLE', 'INSTRUMENTAL', 'GUIDE', 'OTHER');

-- CreateEnum
CREATE TYPE "MediaVisibility" AS ENUM ('ALL_MEMBERS', 'VOICE_SECTION', 'LEADERS_ONLY');

-- CreateEnum
CREATE TYPE "SongMasteryStatus" AS ENUM ('TO_DISCOVER', 'IN_PROGRESS', 'MASTERED', 'TO_REVIEW');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');

-- CreateEnum
CREATE TYPE "AnnouncementAudienceType" AS ENUM ('ALL_MEMBERS', 'VOICE_SECTIONS', 'ROLES', 'MEMBERS');

-- CreateEnum
CREATE TYPE "AnnouncementTargetType" AS ENUM ('VOICE_SECTION', 'ROLE', 'MEMBERSHIP');

-- CreateTable
CREATE TABLE "finance_funds" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FinanceFundType" NOT NULL DEFAULT 'ORDINARY',
    "currency" "CurrencyCode" NOT NULL,
    "initialBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "finance_funds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributions" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "fundId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "frequency" "FinanceContributionFrequency" NOT NULL DEFAULT 'ONCE',
    "dueDate" DATE NOT NULL,
    "targetType" "FinanceTargetType" NOT NULL DEFAULT 'ALL_MEMBERS',
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contribution_targets" (
    "id" UUID NOT NULL,
    "contributionId" UUID NOT NULL,
    "membershipId" UUID,
    "voiceSectionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contribution_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contribution_obligations" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "contributionId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "dueDate" DATE NOT NULL,
    "waivedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contribution_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contribution_payments" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "obligationId" UUID NOT NULL,
    "contributionId" UUID NOT NULL,
    "fundId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "method" "FinancePaymentMethod" NOT NULL DEFAULT 'CASH',
    "status" "FinanceEntryStatus" NOT NULL DEFAULT 'VALIDATED',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),
    "validatedByMembershipId" UUID,
    "reference" TEXT,
    "notes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contribution_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_incomes" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "fundId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "source" TEXT,
    "description" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "method" "FinancePaymentMethod" NOT NULL DEFAULT 'CASH',
    "status" "FinanceEntryStatus" NOT NULL DEFAULT 'VALIDATED',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proofUrl" TEXT,
    "proofStorageKey" TEXT,
    "validatedAt" TIMESTAMP(3),
    "validatedByMembershipId" UUID,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "finance_incomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_expenses" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "fundId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "beneficiary" TEXT,
    "reason" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "method" "FinancePaymentMethod" NOT NULL DEFAULT 'CASH',
    "status" "FinanceEntryStatus" NOT NULL DEFAULT 'VALIDATED',
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proofUrl" TEXT,
    "proofStorageKey" TEXT,
    "validatedAt" TIMESTAMP(3),
    "validatedByMembershipId" UUID,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "finance_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_movements" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "fundId" UUID NOT NULL,
    "type" "FinanceMovementType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "finance_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "songs" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "composer" TEXT,
    "author" TEXT,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "category" TEXT,
    "liturgicalSeason" "LiturgicalSeason",
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficulty" "SongDifficulty",
    "status" "SongStatus" NOT NULL DEFAULT 'DRAFT',
    "lyrics" TEXT,
    "lyricsFormat" TEXT NOT NULL DEFAULT 'plain_text',
    "copyrightNotes" TEXT,
    "coverImageUrl" TEXT,
    "scorePdfUrl" TEXT,
    "createdByMembershipId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_tracks" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "songId" UUID NOT NULL,
    "voiceSectionId" UUID,
    "type" "SongTrackType" NOT NULL,
    "title" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "keySignature" TEXT,
    "comment" TEXT,
    "visibility" "MediaVisibility" NOT NULL DEFAULT 'ALL_MEMBERS',
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "song_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_rehearsals" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "songId" UUID NOT NULL,
    "activityId" UUID,
    "rehearsedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdByMembershipId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "song_rehearsals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_voice_section_masteries" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "songId" UUID NOT NULL,
    "voiceSectionId" UUID NOT NULL,
    "status" "SongMasteryStatus" NOT NULL DEFAULT 'TO_DISCOVER',
    "notes" TEXT,
    "updatedByMembershipId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "song_voice_section_masteries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mass_contents" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "activityId" UUID,
    "title" TEXT NOT NULL,
    "liturgicalDate" DATE NOT NULL,
    "readingsReferences" JSONB NOT NULL DEFAULT '{}',
    "firstReadingText" TEXT,
    "psalmText" TEXT,
    "secondReadingText" TEXT,
    "gospelText" TEXT,
    "summary" TEXT,
    "orientation" TEXT,
    "maestroMessage" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdByMembershipId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mass_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mass_songbooks" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "activityId" UUID,
    "title" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileUrl" TEXT,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "sizeBytes" INTEGER,
    "checksum" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isDownloadable" BOOLEAN NOT NULL DEFAULT true,
    "publicTokenHash" TEXT,
    "publicExpiresAt" TIMESTAMP(3),
    "publicRevokedAt" TIMESTAMP(3),
    "createdByMembershipId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mass_songbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
    "audienceType" "AnnouncementAudienceType" NOT NULL DEFAULT 'ALL_MEMBERS',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "readRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdByMembershipId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_targets" (
    "id" UUID NOT NULL,
    "announcementId" UUID NOT NULL,
    "targetType" "AnnouncementTargetType" NOT NULL,
    "membershipId" UUID,
    "voiceSectionId" UUID,
    "roleId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "announcement_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_reads" (
    "announcementId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("announcementId","membershipId")
);

-- CreateIndex
CREATE INDEX "finance_funds_choirId_currency_idx" ON "finance_funds"("choirId", "currency");
CREATE UNIQUE INDEX "finance_funds_choirId_name_currency_key" ON "finance_funds"("choirId", "name", "currency");
CREATE INDEX "contributions_choirId_dueDate_idx" ON "contributions"("choirId", "dueDate");
CREATE INDEX "contributions_fundId_idx" ON "contributions"("fundId");
CREATE INDEX "contribution_targets_membershipId_idx" ON "contribution_targets"("membershipId");
CREATE INDEX "contribution_targets_voiceSectionId_idx" ON "contribution_targets"("voiceSectionId");
CREATE UNIQUE INDEX "contribution_targets_contributionId_membershipId_key" ON "contribution_targets"("contributionId", "membershipId");
CREATE UNIQUE INDEX "contribution_targets_contributionId_voiceSectionId_key" ON "contribution_targets"("contributionId", "voiceSectionId");
CREATE INDEX "contribution_obligations_choirId_membershipId_dueDate_idx" ON "contribution_obligations"("choirId", "membershipId", "dueDate");
CREATE UNIQUE INDEX "contribution_obligations_contributionId_membershipId_key" ON "contribution_obligations"("contributionId", "membershipId");
CREATE INDEX "contribution_payments_choirId_membershipId_idx" ON "contribution_payments"("choirId", "membershipId");
CREATE INDEX "contribution_payments_obligationId_idx" ON "contribution_payments"("obligationId");
CREATE INDEX "finance_incomes_choirId_receivedAt_idx" ON "finance_incomes"("choirId", "receivedAt");
CREATE INDEX "finance_expenses_choirId_expenseDate_idx" ON "finance_expenses"("choirId", "expenseDate");
CREATE INDEX "finance_movements_choirId_occurredAt_idx" ON "finance_movements"("choirId", "occurredAt");
CREATE INDEX "finance_movements_fundId_currency_occurredAt_idx" ON "finance_movements"("fundId", "currency", "occurredAt");
CREATE UNIQUE INDEX "finance_movements_sourceType_sourceId_key" ON "finance_movements"("sourceType", "sourceId");
CREATE INDEX "songs_choirId_title_idx" ON "songs"("choirId", "title");
CREATE INDEX "songs_choirId_status_idx" ON "songs"("choirId", "status");
CREATE INDEX "song_tracks_choirId_songId_type_idx" ON "song_tracks"("choirId", "songId", "type");
CREATE INDEX "song_tracks_voiceSectionId_idx" ON "song_tracks"("voiceSectionId");
CREATE INDEX "song_rehearsals_choirId_rehearsedAt_idx" ON "song_rehearsals"("choirId", "rehearsedAt");
CREATE UNIQUE INDEX "song_rehearsals_songId_activityId_key" ON "song_rehearsals"("songId", "activityId");
CREATE INDEX "song_voice_section_masteries_choirId_status_idx" ON "song_voice_section_masteries"("choirId", "status");
CREATE UNIQUE INDEX "song_voice_section_masteries_songId_voiceSectionId_key" ON "song_voice_section_masteries"("songId", "voiceSectionId");
CREATE UNIQUE INDEX "mass_contents_activityId_key" ON "mass_contents"("activityId");
CREATE INDEX "mass_contents_choirId_liturgicalDate_idx" ON "mass_contents"("choirId", "liturgicalDate");
CREATE INDEX "mass_contents_choirId_status_idx" ON "mass_contents"("choirId", "status");
CREATE UNIQUE INDEX "mass_songbooks_publicTokenHash_key" ON "mass_songbooks"("publicTokenHash");
CREATE INDEX "mass_songbooks_choirId_activityId_idx" ON "mass_songbooks"("choirId", "activityId");
CREATE INDEX "announcements_choirId_status_publishAt_idx" ON "announcements"("choirId", "status", "publishAt");
CREATE INDEX "announcements_choirId_expiresAt_idx" ON "announcements"("choirId", "expiresAt");
CREATE INDEX "announcement_targets_announcementId_targetType_idx" ON "announcement_targets"("announcementId", "targetType");
CREATE INDEX "announcement_targets_membershipId_idx" ON "announcement_targets"("membershipId");
CREATE INDEX "announcement_targets_voiceSectionId_idx" ON "announcement_targets"("voiceSectionId");
CREATE INDEX "announcement_targets_roleId_idx" ON "announcement_targets"("roleId");
CREATE INDEX "announcement_reads_membershipId_readAt_idx" ON "announcement_reads"("membershipId", "readAt");

-- AddForeignKey
ALTER TABLE "finance_funds" ADD CONSTRAINT "finance_funds_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "finance_funds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contribution_targets" ADD CONSTRAINT "contribution_targets_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "contributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contribution_targets" ADD CONSTRAINT "contribution_targets_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contribution_targets" ADD CONSTRAINT "contribution_targets_voiceSectionId_fkey" FOREIGN KEY ("voiceSectionId") REFERENCES "voice_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contribution_obligations" ADD CONSTRAINT "contribution_obligations_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contribution_obligations" ADD CONSTRAINT "contribution_obligations_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "contributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contribution_obligations" ADD CONSTRAINT "contribution_obligations_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contribution_payments" ADD CONSTRAINT "contribution_payments_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contribution_payments" ADD CONSTRAINT "contribution_payments_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "contribution_obligations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contribution_payments" ADD CONSTRAINT "contribution_payments_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "contributions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contribution_payments" ADD CONSTRAINT "contribution_payments_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "finance_funds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contribution_payments" ADD CONSTRAINT "contribution_payments_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contribution_payments" ADD CONSTRAINT "contribution_payments_validatedByMembershipId_fkey" FOREIGN KEY ("validatedByMembershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "finance_incomes" ADD CONSTRAINT "finance_incomes_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_incomes" ADD CONSTRAINT "finance_incomes_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "finance_funds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "finance_incomes" ADD CONSTRAINT "finance_incomes_validatedByMembershipId_fkey" FOREIGN KEY ("validatedByMembershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "finance_expenses" ADD CONSTRAINT "finance_expenses_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_expenses" ADD CONSTRAINT "finance_expenses_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "finance_funds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "finance_expenses" ADD CONSTRAINT "finance_expenses_validatedByMembershipId_fkey" FOREIGN KEY ("validatedByMembershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "finance_movements" ADD CONSTRAINT "finance_movements_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_movements" ADD CONSTRAINT "finance_movements_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "finance_funds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "songs" ADD CONSTRAINT "songs_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "songs" ADD CONSTRAINT "songs_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "song_tracks" ADD CONSTRAINT "song_tracks_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "song_tracks" ADD CONSTRAINT "song_tracks_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "song_tracks" ADD CONSTRAINT "song_tracks_voiceSectionId_fkey" FOREIGN KEY ("voiceSectionId") REFERENCES "voice_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "song_rehearsals" ADD CONSTRAINT "song_rehearsals_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "song_rehearsals" ADD CONSTRAINT "song_rehearsals_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "song_rehearsals" ADD CONSTRAINT "song_rehearsals_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "song_rehearsals" ADD CONSTRAINT "song_rehearsals_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "song_voice_section_masteries" ADD CONSTRAINT "song_voice_section_masteries_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "song_voice_section_masteries" ADD CONSTRAINT "song_voice_section_masteries_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "song_voice_section_masteries" ADD CONSTRAINT "song_voice_section_masteries_voiceSectionId_fkey" FOREIGN KEY ("voiceSectionId") REFERENCES "voice_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "song_voice_section_masteries" ADD CONSTRAINT "song_voice_section_masteries_updatedByMembershipId_fkey" FOREIGN KEY ("updatedByMembershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mass_contents" ADD CONSTRAINT "mass_contents_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mass_contents" ADD CONSTRAINT "mass_contents_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mass_contents" ADD CONSTRAINT "mass_contents_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mass_songbooks" ADD CONSTRAINT "mass_songbooks_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mass_songbooks" ADD CONSTRAINT "mass_songbooks_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mass_songbooks" ADD CONSTRAINT "mass_songbooks_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "announcement_targets" ADD CONSTRAINT "announcement_targets_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcement_targets" ADD CONSTRAINT "announcement_targets_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcement_targets" ADD CONSTRAINT "announcement_targets_voiceSectionId_fkey" FOREIGN KEY ("voiceSectionId") REFERENCES "voice_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcement_targets" ADD CONSTRAINT "announcement_targets_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
