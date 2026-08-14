CREATE TYPE "AttendanceScanType" AS ENUM ('ARRIVAL', 'DEPARTURE');
ALTER TYPE "MembershipStatus" ADD VALUE IF NOT EXISTS 'ON_LEAVE';
ALTER TYPE "MembershipStatus" ADD VALUE IF NOT EXISTS 'FORMER';
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'SEVERELY_LATE', 'ABSENT');
CREATE TYPE "ParticipationStatus" AS ENUM ('PENDING', 'COMPLETE', 'PARTIAL', 'INSUFFICIENT');
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'PUSH');
CREATE TYPE "NotificationTrigger" AS ENUM ('ACTIVITY_REMINDER', 'LATE_ARRIVAL', 'ACTIVITY_ENDED', 'MANUAL');
CREATE TYPE "NotificationJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');

CREATE TABLE "attendances" (
  "id" UUID NOT NULL, "choirId" UUID NOT NULL, "activityId" UUID NOT NULL, "membershipId" UUID NOT NULL,
  "arrivedAt" TIMESTAMP(3), "leftAt" TIMESTAMP(3), "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
  "participationStatus" "ParticipationStatus" NOT NULL DEFAULT 'PENDING', "minutesLate" INTEGER NOT NULL DEFAULT 0,
  "durationMinutes" INTEGER, "voiceSectionId" UUID, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "attendance_qr_tokens" (
  "id" UUID NOT NULL, "choirId" UUID NOT NULL, "activityId" UUID NOT NULL, "membershipId" UUID NOT NULL,
  "tokenHash" TEXT NOT NULL, "scanType" "AttendanceScanType" NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attendance_qr_tokens_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "attendance_scans" (
  "id" UUID NOT NULL, "attendanceId" UUID NOT NULL, "qrTokenId" UUID NOT NULL,
  "scanType" "AttendanceScanType" NOT NULL, "scannedById" UUID NOT NULL, "deviceId" TEXT,
  "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "attendance_scans_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL, "choirId" UUID NOT NULL, "actorUserId" UUID NOT NULL, "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL, "entityId" TEXT NOT NULL, "reason" TEXT, "before" JSONB, "after" JSONB,
  "correlationId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "device_tokens" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "token" TEXT NOT NULL, "platform" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "notification_templates" (
  "id" UUID NOT NULL, "choirId" UUID NOT NULL, "name" TEXT NOT NULL, "trigger" "NotificationTrigger" NOT NULL,
  "channel" "NotificationChannel" NOT NULL, "title" TEXT NOT NULL, "body" TEXT NOT NULL,
  "rules" JSONB NOT NULL DEFAULT '{}', "enabled" BOOLEAN NOT NULL DEFAULT true, "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "notification_jobs" (
  "id" UUID NOT NULL, "choirId" UUID NOT NULL, "templateId" UUID, "membershipId" UUID NOT NULL,
  "activityId" UUID, "channel" "NotificationChannel" NOT NULL, "trigger" "NotificationTrigger" NOT NULL,
  "titleSnapshot" TEXT NOT NULL, "bodySnapshot" TEXT NOT NULL, "scheduledAt" TIMESTAMP(3) NOT NULL,
  "status" "NotificationJobStatus" NOT NULL DEFAULT 'QUEUED', "idempotencyKey" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3), "failedAt" TIMESTAMP(3), "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_jobs_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "in_app_notifications" (
  "id" UUID NOT NULL, "jobId" UUID NOT NULL, "membershipId" UUID NOT NULL, "title" TEXT NOT NULL,
  "body" TEXT NOT NULL, "readAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "in_app_notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "attendances_activityId_membershipId_key" ON "attendances"("activityId", "membershipId");
CREATE INDEX "attendances_choirId_activityId_idx" ON "attendances"("choirId", "activityId");
CREATE UNIQUE INDEX "attendance_qr_tokens_tokenHash_key" ON "attendance_qr_tokens"("tokenHash");
CREATE INDEX "attendance_qr_tokens_choirId_activityId_membershipId_idx" ON "attendance_qr_tokens"("choirId", "activityId", "membershipId");
CREATE UNIQUE INDEX "attendance_scans_qrTokenId_key" ON "attendance_scans"("qrTokenId");
CREATE INDEX "attendance_scans_attendanceId_scannedAt_idx" ON "attendance_scans"("attendanceId", "scannedAt");
CREATE INDEX "audit_logs_choirId_entityType_entityId_idx" ON "audit_logs"("choirId", "entityType", "entityId");
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");
CREATE INDEX "device_tokens_userId_active_idx" ON "device_tokens"("userId", "active");
CREATE UNIQUE INDEX "notification_templates_choirId_name_channel_key" ON "notification_templates"("choirId", "name", "channel");
CREATE UNIQUE INDEX "notification_jobs_idempotencyKey_key" ON "notification_jobs"("idempotencyKey");
CREATE INDEX "notification_jobs_status_scheduledAt_idx" ON "notification_jobs"("status", "scheduledAt");
CREATE INDEX "notification_jobs_choirId_membershipId_idx" ON "notification_jobs"("choirId", "membershipId");
CREATE UNIQUE INDEX "in_app_notifications_jobId_key" ON "in_app_notifications"("jobId");
CREATE INDEX "in_app_notifications_membershipId_readAt_createdAt_idx" ON "in_app_notifications"("membershipId", "readAt", "createdAt");

ALTER TABLE "attendances" ADD CONSTRAINT "attendances_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance_qr_tokens" ADD CONSTRAINT "attendance_qr_tokens_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_qr_tokens" ADD CONSTRAINT "attendance_qr_tokens_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_scans" ADD CONSTRAINT "attendance_scans_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "attendances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_scans" ADD CONSTRAINT "attendance_scans_qrTokenId_fkey" FOREIGN KEY ("qrTokenId") REFERENCES "attendance_qr_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance_scans" ADD CONSTRAINT "attendance_scans_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_jobs" ADD CONSTRAINT "notification_jobs_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_jobs" ADD CONSTRAINT "notification_jobs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notification_jobs" ADD CONSTRAINT "notification_jobs_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_jobs" ADD CONSTRAINT "notification_jobs_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "notification_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
