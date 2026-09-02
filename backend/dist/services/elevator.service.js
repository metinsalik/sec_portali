"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elevatorService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.elevatorService = {
    getElevators: async (facilityId, filters) => {
        const whereClause = {};
        if (facilityId !== 'all') {
            whereClause.facilityId = facilityId;
        }
        if (filters?.brand) {
            whereClause.brand = { contains: filters.brand, mode: 'insensitive' };
        }
        if (filters?.maintenanceCompany) {
            whereClause.maintenanceCompany = { contains: filters.maintenanceCompany, mode: 'insensitive' };
        }
        if (filters?.label) {
            whereClause.label = { contains: filters.label, mode: 'insensitive' };
        }
        if (filters?.status) {
            whereClause.status = { contains: filters.status, mode: 'insensitive' };
        }
        return prisma.elevator.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: { facility: true }
        });
    },
    getElevatorById: async (id) => {
        return prisma.elevator.findUnique({
            where: { id },
            include: {
                facility: true,
                inspections: {
                    orderBy: { inspectionDate: 'desc' }
                }
            }
        });
    },
    addInspection: async (elevatorId, data) => {
        return prisma.$transaction(async (tx) => {
            const { nextInspectionDate, ...inspectionData } = data;
            const inspection = await tx.elevatorInspection.create({
                data: {
                    ...inspectionData,
                    elevatorId
                }
            });
            // Update elevator's next and last inspection dates based on this new inspection
            if (inspectionData.inspectionDate) {
                const insDate = new Date(inspectionData.inspectionDate);
                let nextDate;
                if (nextInspectionDate) {
                    nextDate = new Date(nextInspectionDate);
                }
                else {
                    nextDate = new Date(insDate);
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                }
                await tx.elevator.update({
                    where: { id: elevatorId },
                    data: {
                        lastInspectionDate: insDate,
                        nextInspectionDate: nextDate,
                        label: inspectionData.label || undefined
                    }
                });
            }
            return inspection;
        });
    },
    createElevator: async (data) => {
        return prisma.elevator.create({
            data
        });
    },
    updateElevator: async (id, data) => {
        return prisma.elevator.update({
            where: { id },
            data
        });
    },
    deleteElevator: async (id) => {
        return prisma.elevator.delete({
            where: { id }
        });
    }
};
