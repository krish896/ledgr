-- Partial unique index: only one active membership per (groupId, userId).
-- Rows where removedAt IS NOT NULL (removed members) are excluded, allowing
-- the same user to be re-added to a group after removal.
CREATE UNIQUE INDEX "GroupMember_groupId_userId_active_key"
ON "GroupMember"("groupId", "userId")
WHERE "removedAt" IS NULL;
