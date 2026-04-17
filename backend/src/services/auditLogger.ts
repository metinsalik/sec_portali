import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogEntry {
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE';
  oldValue?: any;
  newValue?: any;
  createdBy: string;
  note?: string;
}

/**
 * Audit logger - activity log kaydı tutar
 */
export async function logAudit(entry: AuditLogEntry) {
  try {
    await prisma.activityLog.create({
      data: {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        oldValue: entry.oldValue ? JSON.parse(JSON.stringify(entry.oldValue)) : undefined,
        newValue: entry.newValue ? JSON.parse(JSON.stringify(entry.newValue)) : undefined,
        createdBy: entry.createdBy,
        note: entry.note,
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
    // Audit log hatası ana işlemi engellememeli
  }
}

/**
 * Log create action
 */
export function logCreate(entityType: string, entityId: string, data: any, username: string) {
  return logAudit({
    entityType,
    entityId: String(entityId),
    action: 'CREATE',
    newValue: data,
    createdBy: username,
  });
}

/**
 * Log update action
 */
export function logUpdate(entityType: string, entityId: string, oldData: any, newData: any, username: string) {
  return logAudit({
    entityType,
    entityId: String(entityId),
    action: 'UPDATE',
    oldValue: oldData,
    newValue: newData,
    createdBy: username,
  });
}

/**
 * Log delete/archive action
 */
export function logDelete(entityType: string, entityId: string, data: any, username: string, note?: string) {
  return logAudit({
    entityType,
    entityId: String(entityId),
    action: 'ARCHIVE',
    oldValue: data,
    createdBy: username,
    note,
  });
}