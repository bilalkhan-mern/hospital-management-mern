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
  // Simple mode: disable audit logging to reduce complexity for demos/interviews.
  if (String(process.env.SIMPLE_MODE || '').toLowerCase() === 'true') {
    return null;
  }

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
