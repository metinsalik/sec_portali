"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const prisma = new client_1.PrismaClient();
// This cron job runs every midnight at 00:00.
// It checks if any recurring WfTask needs to be cloned.
const startCronJobs = () => {
    node_cron_1.default.schedule('0 0 * * *', async () => {
        console.log('[CRON] Running recurring tasks job...');
        try {
            const recurringTasks = await prisma.wfTask.findMany({
                where: {
                    recurrence: { not: null }
                },
                include: {
                    checklist: true
                }
            });
            const now = new Date();
            for (const task of recurringTasks) {
                if (!task.recurrence)
                    continue;
                // Görevin başlangıç tarihi gelmemişse (veya geçmemişse) henüz oluşturma
                if (now < task.startDate)
                    continue;
                let newStartDate = new Date(task.startDate);
                let newDueDate = new Date(task.dueDate);
                // Süreyi korumak için farkı hesapla
                const durationMs = task.dueDate.getTime() - task.startDate.getTime();
                if (task.recurrence === 'DAILY') {
                    newStartDate = (0, date_fns_1.addDays)(task.startDate, 1);
                }
                else if (task.recurrence === 'WEEKLY') {
                    newStartDate = (0, date_fns_1.addWeeks)(task.startDate, 1);
                }
                else if (task.recurrence === 'MONTHLY') {
                    newStartDate = (0, date_fns_1.addMonths)(task.startDate, 1);
                }
                else if (task.recurrence === '6MONTHS') {
                    newStartDate = (0, date_fns_1.addMonths)(task.startDate, 6);
                }
                else if (task.recurrence === 'YEARLY') {
                    newStartDate = (0, date_fns_1.addYears)(task.startDate, 1);
                }
                newDueDate = new Date(newStartDate.getTime() + durationMs);
                console.log(`[CRON] Cloning task ${task.id} (${task.title}) for recurrence: ${task.recurrence}`);
                // Create the new task
                const newTask = await prisma.wfTask.create({
                    data: {
                        title: task.title,
                        description: task.description,
                        planId: task.planId,
                        assigneeId: task.assigneeId,
                        followerId: task.followerId,
                        creatorId: task.creatorId,
                        status: 'TODO',
                        priority: task.priority,
                        recurrence: task.recurrence,
                        parentTaskId: task.id,
                        startDate: newStartDate,
                        dueDate: newDueDate
                    }
                });
                // Clone the checklist
                for (const step of task.checklist) {
                    await prisma.wfChecklistStep.create({
                        data: {
                            taskId: newTask.id,
                            text: step.text,
                            order: step.order,
                            requireEvidence: step.requireEvidence,
                            requireDescription: step.requireDescription
                        }
                    });
                }
                // Clear recurrence from parent, so it doesn't spawn anymore.
                // The new task has the recurrence now, and its startDate will be used for the next trigger!
                await prisma.wfTask.update({
                    where: { id: task.id },
                    data: { recurrence: null }
                });
                console.log(`[CRON] Cloned successfully as ${newTask.id}`);
            }
        }
        catch (err) {
            console.error('[CRON] Error during recurring tasks job:', err);
        }
    });
    console.log('[CRON] Recurring tasks cron job scheduled.');
};
exports.startCronJobs = startCronJobs;
