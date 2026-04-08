import AuditLog from '../models/AuditLog.js';

export const createAuditLog = async ({
  actor,
  actorRole,
  action,
  entityType,
  entityId,
  message,
  metadata = {},
}) => {
  if (!actor || !actorRole || !action || !entityType || !entityId || !message) {
    return null;
  }

  return AuditLog.create({
    actor,
    actorRole,
    action,
    entityType,
    entityId,
    message,
    metadata,
  });
};
