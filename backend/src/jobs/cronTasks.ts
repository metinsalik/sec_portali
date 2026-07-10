import cron from 'node-cron';
import { PrismaClient, WfTask } from '@prisma/client';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

const prisma = new PrismaClient();

// This cron job runs every midnight at 00:00.
// It checks if any recurring WfTask needs to be cloned.
export const startCronJobs = () => {
  cron.schedule('0 0 * * *', async () => {
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
        if (!task.recurrence) continue;
        
        // Görevin başlangıç tarihi gelmemişse (veya geçmemişse) henüz oluşturma
        if (now < task.startDate) continue;

        let newStartDate = new Date(task.startDate);
        let newDueDate = new Date(task.dueDate);
        
        // Süreyi korumak için farkı hesapla
        const durationMs = task.dueDate.getTime() - task.startDate.getTime();

        if (task.recurrence === 'DAILY') {
          newStartDate = addDays(task.startDate, 1);
        } else if (task.recurrence === 'WEEKLY') {
          newStartDate = addWeeks(task.startDate, 1);
        } else if (task.recurrence === 'MONTHLY') {
          newStartDate = addMonths(task.startDate, 1);
        } else if (task.recurrence === '6MONTHS') {
          newStartDate = addMonths(task.startDate, 6);
        } else if (task.recurrence === 'YEARLY') {
          newStartDate = addYears(task.startDate, 1);
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
    } catch (err) {
      console.error('[CRON] Error during recurring tasks job:', err);
    }
  });

  console.log('[CRON] Recurring tasks cron job scheduled.');
};
