"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
exports.logCreate = logCreate;
exports.logUpdate = logUpdate;
exports.logDelete = logDelete;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Audit logger - activity log kaydı tutar
 */
async function logAudit(entry) {
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
    }
    catch (error) {
        console.error('Audit log error:', error);
        // Audit log hatası ana işlemi engellememeli
    }
}
/**
 * Log create action
 */
function logCreate(entityType, entityId, data, username) {
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
function logUpdate(entityType, entityId, oldData, newData, username) {
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
function logDelete(entityType, entityId, data, username, note) {
    return logAudit({
        entityType,
        entityId: String(entityId),
        action: 'ARCHIVE',
        oldValue: data,
        createdBy: username,
        note,
    });
}
