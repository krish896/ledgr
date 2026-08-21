-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "groupId" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_groupId_createdAt_idx" ON "AuditLog"("groupId", "createdAt");
