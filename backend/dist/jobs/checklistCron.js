"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startChecklistCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const prisma = new client_1.PrismaClient();
// This cron job checks ChecklistAssignment to automatically create submissions (BEKLEYEN) and send notifications
const startChecklistCronJobs = () => {
    node_cron_1.default.schedule('0 1 * * *', async () => {
        console.log('[CRON] Running checklist assignments job...');
        try {
            const assignments = await prisma.checklistAssignment.findMany({
                where: {
                    isPeriodic: true,
                    periodValue: { not: null },
                    periodType: { not: null },
                    startDate: { not: null },
                },
                include: {
                    template: true
                }
            });
            const now = new Date();
            for (const assignment of assignments) {
                if (!assignment.startDate || !assignment.periodValue || !assignment.periodType)
                    continue;
                if (assignment.endDate && now > assignment.endDate)
                    continue;
                for (const facilityId of assignment.facilityIds) {
                    const lastSubmission = await prisma.checklistSubmission.findFirst({
                        where: {
                            templateId: assignment.templateId,
                            facilityId: facilityId,
                        },
                        orderBy: { createdAt: 'desc' }
                    });
                    let nextDueDate = new Date(assignment.startDate);
                    if (lastSubmission) {
                        const baseDate = lastSubmission.createdAt;
                        if (assignment.periodType === 'DAY') {
                            nextDueDate = (0, date_fns_1.addDays)(baseDate, assignment.periodValue);
                        }
                        else if (assignment.periodType === 'WEEK') {
                            nextDueDate = (0, date_fns_1.addWeeks)(baseDate, assignment.periodValue);
                        }
                        else if (assignment.periodType === 'MONTH') {
                            nextDueDate = (0, date_fns_1.addMonths)(baseDate, assignment.periodValue);
                        }
                        else if (assignment.periodType === 'YEAR') {
                            nextDueDate = (0, date_fns_1.addYears)(baseDate, assignment.periodValue);
                        }
                    }
                    if (now >= nextDueDate) {
                        console.log(`[CRON] Generating checklist submission for facility ${facilityId}, template: ${assignment.templateId}`);
                        const newSubmission = await prisma.checklistSubmission.create({
                            data: {
                                templateId: assignment.templateId,
                                facilityId: facilityId,
                                auditDate: now,
                                status: 'BEKLEYEN',
                            }
                        });
                        // Send notification to RiskExpertFacility users
                        const experts = await prisma.riskExpertFacility.findMany({
                            where: { facilityId }
                        });
                        const notifications = experts.map(expert => ({
                            title: 'Yeni Denetim Atandı',
                            message: `${assignment.template.title} formunu doldurmanız gerekmektedir.`,
                            type: 'INFO',
                            module: 'CHECKLIST',
                            username: expert.expertUsername,
                            link: `/checklists/submissions/${newSubmission.id}`,
                        }));
                        if (notifications.length > 0) {
                            await prisma.notification.createMany({ data: notifications });
                        }
                    }
                }
            }
        }
        catch (err) {
            console.error('[CRON] Error during checklist assignments job:', err);
        }
    });
    console.log('[CRON] Checklist assignments cron job scheduled.');
};
exports.startChecklistCronJobs = startChecklistCronJobs;
