function serialize(snapshot) {
  if (snapshot == null) return null;
  return JSON.parse(
    JSON.stringify(snapshot, (_, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

async function writeAuditLog(tx, { actorId, groupId, entityType, entityId, action, before, after }) {
  return tx.auditLog.create({
    data: {
      actorId,
      groupId: groupId ?? null,
      entityType,
      entityId,
      action,
      before: serialize(before),
      after: serialize(after),
    },
  });
}

module.exports = { writeAuditLog };
