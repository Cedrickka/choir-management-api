-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JustificationKind" AS ENUM ('ABSENCE', 'LATE');

-- CreateEnum
CREATE TYPE "JustificationReason" AS ENUM ('ILLNESS', 'WORK', 'TRAVEL', 'FAMILY', 'STUDIES', 'OTHER');

-- CreateEnum
CREATE TYPE "RsvpAnswer" AS ENUM ('YES', 'NO', 'MAYBE');

-- CreateEnum
CREATE TYPE "SubscriptionPlanCode" AS ENUM ('FREE', 'PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MessagingChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "MessagingProviderCode" AS ENUM ('MOCK', 'INFOBIP', 'META_CLOUD_API', 'OTHER');

-- CreateEnum
CREATE TYPE "MessagingAttemptStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentProviderType" AS ENUM ('MOCK', 'MOBILE_MONEY', 'BANK', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OfflineSyncStatus" AS ENUM ('RECEIVED', 'APPLIED', 'DUPLICATE', 'REJECTED');

-- CreateEnum
CREATE TYPE "OfflineEventType" AS ENUM ('ATTENDANCE_SCAN', 'PROFILE_UPDATE', 'GENERIC');

-- AlterTable
ALTER TABLE "contribution_payments" ADD COLUMN     "paymentTransactionId" UUID;

-- CreateTable
CREATE TABLE "justifications" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "activityId" UUID,
    "attendanceId" UUID,
    "kind" "JustificationKind" NOT NULL,
    "reason" "JustificationReason" NOT NULL,
    "comment" TEXT,
    "attachmentUrl" TEXT,
    "attachmentStorageKey" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedByMembershipId" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "justifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispensations" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" "JustificationReason" NOT NULL,
    "comment" TEXT,
    "attachmentUrl" TEXT,
    "attachmentStorageKey" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "excludeFromStatistics" BOOLEAN NOT NULL DEFAULT true,
    "reviewedByMembershipId" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispensations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rsvp_requests" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "activityId" UUID NOT NULL,
    "message" TEXT,
    "deadlineAt" TIMESTAMP(3),
    "minByVoiceSection" JSONB NOT NULL DEFAULT '{}',
    "createdByMembershipId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rsvp_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rsvp_responses" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "activityId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "answer" "RsvpAnswer" NOT NULL,
    "comment" TEXT,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rsvp_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL,
    "code" "SubscriptionPlanCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "yearlyPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'USD',
    "quotas" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_subscriptions" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingPeriod" "BillingPeriod" NOT NULL DEFAULT 'MONTHLY',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3),
    "graceUntil" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging_templates" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "MessagingProviderCode" NOT NULL DEFAULT 'MOCK',
    "providerTemplateName" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "body" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messaging_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging_attempts" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "membershipId" UUID,
    "templateId" UUID,
    "channel" "MessagingChannel" NOT NULL DEFAULT 'WHATSAPP',
    "provider" "MessagingProviderCode" NOT NULL DEFAULT 'MOCK',
    "to" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "variables" JSONB NOT NULL DEFAULT '{}',
    "idempotencyKey" TEXT NOT NULL,
    "status" "MessagingAttemptStatus" NOT NULL DEFAULT 'QUEUED',
    "providerMessageId" TEXT,
    "costCredits" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messaging_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "provider" "PaymentProviderType" NOT NULL DEFAULT 'MOCK',
    "internalReference" TEXT NOT NULL,
    "providerReference" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "payerMembershipId" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "confirmedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocations" (
    "id" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "obligationId" UUID NOT NULL,
    "contributionPaymentId" UUID,
    "amount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" UUID NOT NULL,
    "choirId" UUID,
    "transactionId" UUID,
    "provider" "PaymentProviderType" NOT NULL,
    "eventId" TEXT NOT NULL,
    "signatureValid" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_devices" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "membershipId" UUID,
    "deviceIdentifier" TEXT NOT NULL,
    "label" TEXT,
    "publicKey" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "authorizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offline_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_sync_events" (
    "id" UUID NOT NULL,
    "choirId" UUID NOT NULL,
    "offlineDeviceId" UUID NOT NULL,
    "clientEventId" TEXT NOT NULL,
    "type" "OfflineEventType" NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "localTimestamp" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "OfflineSyncStatus" NOT NULL DEFAULT 'RECEIVED',
    "result" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "offline_sync_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "justifications_choirId_status_createdAt_idx" ON "justifications"("choirId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "justifications_membershipId_createdAt_idx" ON "justifications"("membershipId", "createdAt");

-- CreateIndex
CREATE INDEX "justifications_activityId_idx" ON "justifications"("activityId");

-- CreateIndex
CREATE INDEX "dispensations_choirId_status_startsAt_endsAt_idx" ON "dispensations"("choirId", "status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "dispensations_membershipId_startsAt_endsAt_idx" ON "dispensations"("membershipId", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "rsvp_requests_activityId_key" ON "rsvp_requests"("activityId");

-- CreateIndex
CREATE INDEX "rsvp_requests_choirId_deadlineAt_idx" ON "rsvp_requests"("choirId", "deadlineAt");

-- CreateIndex
CREATE INDEX "rsvp_responses_choirId_activityId_answer_idx" ON "rsvp_responses"("choirId", "activityId", "answer");

-- CreateIndex
CREATE INDEX "rsvp_responses_membershipId_respondedAt_idx" ON "rsvp_responses"("membershipId", "respondedAt");

-- CreateIndex
CREATE UNIQUE INDEX "rsvp_responses_requestId_membershipId_key" ON "rsvp_responses"("requestId", "membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");

-- CreateIndex
CREATE INDEX "organization_subscriptions_organizationId_status_idx" ON "organization_subscriptions"("organizationId", "status");

-- CreateIndex
CREATE INDEX "organization_subscriptions_planId_idx" ON "organization_subscriptions"("planId");

-- CreateIndex
CREATE INDEX "messaging_templates_choirId_active_idx" ON "messaging_templates"("choirId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "messaging_templates_choirId_name_provider_key" ON "messaging_templates"("choirId", "name", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "messaging_attempts_idempotencyKey_key" ON "messaging_attempts"("idempotencyKey");

-- CreateIndex
CREATE INDEX "messaging_attempts_choirId_status_createdAt_idx" ON "messaging_attempts"("choirId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "messaging_attempts_membershipId_idx" ON "messaging_attempts"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_internalReference_key" ON "payment_transactions"("internalReference");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_idempotencyKey_key" ON "payment_transactions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payment_transactions_choirId_status_createdAt_idx" ON "payment_transactions"("choirId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_provider_providerReference_key" ON "payment_transactions"("provider", "providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "payment_allocations_contributionPaymentId_key" ON "payment_allocations"("contributionPaymentId");

-- CreateIndex
CREATE INDEX "payment_allocations_obligationId_idx" ON "payment_allocations"("obligationId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_allocations_transactionId_obligationId_key" ON "payment_allocations"("transactionId", "obligationId");

-- CreateIndex
CREATE INDEX "payment_webhook_events_transactionId_idx" ON "payment_webhook_events"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_provider_eventId_key" ON "payment_webhook_events"("provider", "eventId");

-- CreateIndex
CREATE INDEX "offline_devices_choirId_active_idx" ON "offline_devices"("choirId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "offline_devices_choirId_deviceIdentifier_key" ON "offline_devices"("choirId", "deviceIdentifier");

-- CreateIndex
CREATE INDEX "offline_sync_events_choirId_status_receivedAt_idx" ON "offline_sync_events"("choirId", "status", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "offline_sync_events_choirId_offlineDeviceId_clientEventId_key" ON "offline_sync_events"("choirId", "offlineDeviceId", "clientEventId");

-- CreateIndex
CREATE INDEX "contribution_payments_paymentTransactionId_idx" ON "contribution_payments"("paymentTransactionId");

-- AddForeignKey
ALTER TABLE "contribution_payments" ADD CONSTRAINT "contribution_payments_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "justifications" ADD CONSTRAINT "justifications_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "justifications" ADD CONSTRAINT "justifications_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "justifications" ADD CONSTRAINT "justifications_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "justifications" ADD CONSTRAINT "justifications_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "attendances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "justifications" ADD CONSTRAINT "justifications_reviewedByMembershipId_fkey" FOREIGN KEY ("reviewedByMembershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispensations" ADD CONSTRAINT "dispensations_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispensations" ADD CONSTRAINT "dispensations_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispensations" ADD CONSTRAINT "dispensations_reviewedByMembershipId_fkey" FOREIGN KEY ("reviewedByMembershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_requests" ADD CONSTRAINT "rsvp_requests_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_requests" ADD CONSTRAINT "rsvp_requests_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_requests" ADD CONSTRAINT "rsvp_requests_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_responses" ADD CONSTRAINT "rsvp_responses_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "rsvp_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_responses" ADD CONSTRAINT "rsvp_responses_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_responses" ADD CONSTRAINT "rsvp_responses_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_responses" ADD CONSTRAINT "rsvp_responses_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_templates" ADD CONSTRAINT "messaging_templates_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_attempts" ADD CONSTRAINT "messaging_attempts_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_attempts" ADD CONSTRAINT "messaging_attempts_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_attempts" ADD CONSTRAINT "messaging_attempts_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "messaging_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "payment_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "contribution_obligations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_contributionPaymentId_fkey" FOREIGN KEY ("contributionPaymentId") REFERENCES "contribution_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_webhook_events" ADD CONSTRAINT "payment_webhook_events_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_webhook_events" ADD CONSTRAINT "payment_webhook_events_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_devices" ADD CONSTRAINT "offline_devices_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_devices" ADD CONSTRAINT "offline_devices_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_sync_events" ADD CONSTRAINT "offline_sync_events_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_sync_events" ADD CONSTRAINT "offline_sync_events_offlineDeviceId_fkey" FOREIGN KEY ("offlineDeviceId") REFERENCES "offline_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
