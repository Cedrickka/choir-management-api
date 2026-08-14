ALTER TABLE "users" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE "choirs" ADD COLUMN "settings" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "memberships" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "voice_sections" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "member_profiles"
  ADD COLUMN "gender" TEXT,
  ADD COLUMN "functionTitle" TEXT,
  ADD COLUMN "emergencyContactName" TEXT,
  ADD COLUMN "emergencyContactPhone" TEXT,
  ADD COLUMN "whatsappConsentAt" TIMESTAMP(3),
  ADD COLUMN "whatsappConsentSource" TEXT;
CREATE TABLE "voice_section_assignments" (
  "id" UUID NOT NULL,
  "membershipId" UUID NOT NULL,
  "voiceSectionId" UUID NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "voice_section_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "voice_section_assignments_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "voice_section_assignments_voiceSectionId_fkey" FOREIGN KEY ("voiceSectionId") REFERENCES "voice_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "voice_section_assignments_membershipId_startsAt_idx" ON "voice_section_assignments"("membershipId", "startsAt");
