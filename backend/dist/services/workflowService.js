"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowService = exports.WorkflowService = void 0;
const client_1 = require("@prisma/client");
const telegramService_1 = require("./telegramService");
const index_1 = require("../index");
const prisma = new client_1.PrismaClient();
class WorkflowService {
    // Plans
    async getPlans(user, query) {
        // role based visibility logic here
        return await prisma.wfPlan.findMany({
            include: { owner: true, tasks: true, category: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getPlanById(id) {
        return await prisma.wfPlan.findUnique({
            where: { id },
            include: { tasks: true, owner: true, category: true }
        });
    }
    async createPlan(user, data) {
        return await prisma.wfPlan.create({
            data: {
                title: data.title,
                goal: data.goal,
                categoryId: data.categoryId,
                startDate: data.startDate,
                dueDate: data.dueDate,
                priority: data.priority,
                ownerId: data.ownerId || user.username
            }
        });
    }
    // Alerts
    async getAlerts(user) {
        const hasAdminAccess = user?.workflowRole === 'ADMIN' || user?.workflowRole === 'MANAGER' || user?.roles?.includes('admin') || user?.roles?.includes('management') || user?.isAdmin;
        // Creator or admin logic
        const taskWhere = hasAdminAccess ? {} : { creatorId: user.username };
        const blockedTasks = await prisma.wfTask.findMany({
            where: { ...taskWhere, status: 'BLOCKED' },
            include: {
                creator: { select: { username: true, fullName: true } },
                assignee: { select: { username: true, fullName: true } },
                plan: true
            },
            orderBy: { updatedAt: 'desc' }
        });
        const reviewTasks = await prisma.wfTask.findMany({
            where: { ...taskWhere, status: 'REVIEW' },
            include: {
                creator: { select: { username: true, fullName: true } },
                assignee: { select: { username: true, fullName: true } },
                plan: true
            },
            orderBy: { updatedAt: 'desc' }
        });
        const dueRequests = await prisma.wfDueChangeRequest.findMany({
            where: {
                status: 'PENDING',
                task: hasAdminAccess ? undefined : { creatorId: user.username }
            },
            include: {
                task: true,
                requestedBy: { select: { username: true, fullName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        const transferRequests = await prisma.wfTransferRequest.findMany({
            where: {
                status: 'PENDING',
                ...(hasAdminAccess ? {} : { targetUserId: user.username })
            },
            include: {
                task: true,
                requestedByUser: { select: { username: true, fullName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return { blockedTasks, reviewTasks, dueRequests, transferRequests };
    }
    // Tasks
    async getDashboardStats(user) {
        const hasAdminAccess = user?.workflowRole === 'ADMIN' || user?.workflowRole === 'MANAGER' || user?.roles?.includes('admin') || user?.roles?.includes('management') || user?.isAdmin;
        const where = {};
        if (!hasAdminAccess) {
            where.assigneeId = user.username;
        }
        const tasks = await prisma.wfTask.findMany({
            where,
            select: {
                id: true,
                status: true,
                priority: true,
                dueDate: true,
                createdAt: true,
                updatedAt: true,
                assigneeId: true,
                assignee: { select: { fullName: true } }
            }
        });
        const now = new Date();
        // Global Stats
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'DONE');
        const openTasks = tasks.filter(t => t.status !== 'DONE');
        const overdueTasks = openTasks.filter(t => new Date(t.dueDate) < now);
        const blockedTasks = openTasks.filter(t => t.status === 'BLOCKED');
        // Performance metrics
        let totalCompletionTimeMs = 0;
        let onTimeCompleted = 0;
        completedTasks.forEach(t => {
            const completionTime = new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
            totalCompletionTimeMs += completionTime;
            if (new Date(t.updatedAt) <= new Date(t.dueDate)) {
                onTimeCompleted++;
            }
        });
        const avgCompletionTimeMs = completedTasks.length > 0 ? totalCompletionTimeMs / completedTasks.length : 0;
        // avg in hours
        const avgCompletionHours = avgCompletionTimeMs / (1000 * 60 * 60);
        const onTimePercentage = completedTasks.length > 0 ? (onTimeCompleted / completedTasks.length) * 100 : 0;
        // Workload Distribution (only relevant for Admins, but we return it anyway)
        const userWorkload = tasks.reduce((acc, task) => {
            if (!acc[task.assigneeId]) {
                acc[task.assigneeId] = {
                    name: task.assignee?.fullName || task.assigneeId,
                    total: 0,
                    completed: 0,
                    overdue: 0
                };
            }
            acc[task.assigneeId].total++;
            if (task.status === 'DONE')
                acc[task.assigneeId].completed++;
            if (task.status !== 'DONE' && new Date(task.dueDate) < now)
                acc[task.assigneeId].overdue++;
            return acc;
        }, {});
        const workloadArray = Object.values(userWorkload);
        // Status distribution
        const statusDistribution = [
            { name: 'Bekliyor', value: tasks.filter(t => t.status === 'TODO').length, color: '#f1f5f9' },
            { name: 'Devam Ediyor', value: tasks.filter(t => t.status === 'DOING').length, color: '#dbeafe' },
            { name: 'Kontrolde', value: tasks.filter(t => t.status === 'REVIEW').length, color: '#f3e8ff' },
            { name: 'Blokeli', value: blockedTasks.length, color: '#fee2e2' },
            { name: 'Tamamlandı', value: completedTasks.length, color: '#dcfce3' }
        ];
        return {
            totalTasks,
            completedCount: completedTasks.length,
            openCount: openTasks.length,
            overdueCount: overdueTasks.length,
            blockedCount: blockedTasks.length,
            avgCompletionHours,
            onTimePercentage,
            statusDistribution,
            workload: workloadArray,
            isAdmin: hasAdminAccess,
            // Pass the actual urgent tasks to the frontend
            urgentTasks: openTasks.filter(t => t.priority === 'CRITICAL' || new Date(t.dueDate) < now)
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 10)
        };
    }
    async updatePlan(id, data, user) {
        const plan = await prisma.wfPlan.findUnique({ where: { id } });
        if (!plan)
            throw new Error('Plan not found');
        const hasAdminAccess = user?.workflowRole === 'ADMIN' || user?.workflowRole === 'MANAGER' || user?.roles?.includes('admin') || user?.roles?.includes('management') || user?.isAdmin;
        if (!hasAdminAccess && plan.ownerId !== user.username) {
            throw new Error('Planı düzenleme yetkiniz yok. Sadece planı oluşturan kişi düzenleyebilir.');
        }
        return await prisma.wfPlan.update({
            where: { id },
            data
        });
    }
    async deletePlan(id, user) {
        const plan = await prisma.wfPlan.findUnique({ where: { id } });
        if (!plan)
            throw new Error('Plan not found');
        const hasAdminAccess = user?.workflowRole === 'ADMIN' || user?.workflowRole === 'MANAGER' || user?.roles?.includes('admin') || user?.roles?.includes('management') || user?.isAdmin;
        if (!hasAdminAccess && plan.ownerId !== user.username) {
            throw new Error('Planı silme yetkiniz yok. Sadece planı oluşturan kişi silebilir.');
        }
        const taskCount = await prisma.wfTask.count({ where: { planId: id } });
        if (taskCount > 0) {
            throw new Error('Bu planın içinde görevler mevcut. Lütfen önce görevleri silin.');
        }
        return await prisma.wfPlan.delete({ where: { id } });
    }
    async getTasks(user, filters) {
        const where = {};
        if (filters.status)
            where.status = filters.status;
        if (filters.priority)
            where.priority = filters.priority;
        if (filters.planId)
            where.planId = filters.planId;
        if (filters.assigneeId)
            where.assigneeId = filters.assigneeId;
        const hasAdminAccess = user?.workflowRole === 'ADMIN' || user?.workflowRole === 'MANAGER' || user?.roles?.includes('admin') || user?.roles?.includes('management') || user?.isAdmin;
        if (!hasAdminAccess) {
            where.OR = [
                { assigneeId: user.username },
                { followerId: user.username },
                { creatorId: user.username }
            ];
        }
        return await prisma.wfTask.findMany({
            where,
            include: {
                creator: { select: { username: true, fullName: true } },
                assignee: { select: { username: true, fullName: true } },
                plan: true,
                _count: { select: { chatMessages: true } },
                chatMessages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { senderId: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getTaskById(id) {
        return await prisma.wfTask.findUnique({
            where: { id },
            include: {
                creator: { select: { username: true, fullName: true } },
                assignee: { select: { username: true, fullName: true } },
                follower: { select: { username: true, fullName: true } },
                plan: true,
                checklist: { orderBy: { order: 'asc' } },
                comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
                activityLogs: { include: { actor: true }, orderBy: { createdAt: 'desc' } },
                dueHistories: { include: { changedBy: true }, orderBy: { createdAt: 'desc' } },
                dueRequests: { include: { requestedBy: { select: { username: true, fullName: true } }, reviewedBy: { select: { username: true, fullName: true } } }, orderBy: { createdAt: 'desc' } },
                transferRequests: { include: { requestedByUser: true, targetUser: true } },
                _count: { select: { chatMessages: true } }
            }
        });
    }
    async createTask(user, data) {
        const task = await prisma.wfTask.create({
            data: {
                title: data.title,
                description: data.description,
                planId: data.planId,
                status: data.status || 'TODO',
                assigneeId: data.assigneeId,
                followerId: data.followerId,
                creatorId: data.creatorId || user.username,
                priority: data.priority,
                category: data.category,
                labels: data.labels || [],
                startDate: new Date(data.startDate),
                dueDate: new Date(data.dueDate),
                estimateHours: data.estimateHours,
                blockNote: data.blockNote,
                checklist: {
                    create: data.checklist?.map(c => ({
                        text: c.text,
                        order: c.order,
                        requireEvidence: c.requireEvidence || false,
                        requireDescription: c.requireDescription || false
                    })) || []
                }
            }
        });
        await this.logActivity(user.username, "Görev oluşturuldu", `Görev ID: ${task.id}`);
        // Telegram Notification
        await (0, telegramService_1.sendTelegramMessage)(data.assigneeId, `🚨 <b>Yeni Görev Atandı</b>\n\n<b>Görev:</b> ${data.title}\n<b>Öncelik:</b> ${data.priority}\n<b>Son Tarih:</b> ${new Date(data.dueDate).toLocaleDateString('tr-TR')}\n\nLütfen portal üzerinden kontrol ediniz.`);
        index_1.io.emit('task_updated', task.id);
        return task;
    }
    async rejectTask(taskId, reason, stepId, userId) {
        const task = await prisma.wfTask.findUnique({ where: { id: taskId } });
        if (!task)
            throw new Error('Görev bulunamadı');
        if (task.status !== 'REVIEW') {
            throw new Error('Görev kontrolde (REVIEW) değil. Yalnızca kontroldeki görevler iade edilebilir.');
        }
        const updatedTask = await prisma.wfTask.update({
            where: { id: taskId },
            data: { status: 'DOING' }
        });
        let commentText = `[İADE NEDENİ] - Açıklama: ${reason}`;
        if (stepId) {
            const step = await prisma.wfChecklistStep.findUnique({ where: { id: stepId } });
            if (step) {
                commentText = `[İADE NEDENİ] - Hatalı Adım: "${step.text}" - Açıklama: ${reason}`;
            }
        }
        await prisma.wfComment.create({
            data: {
                taskId,
                authorId: userId,
                body: commentText
            }
        });
        await prisma.wfActivityLog.create({
            data: {
                actorId: userId,
                taskId,
                action: 'TASK_REJECTED',
                detail: `Görev eksiklik sebebiyle iade edildi.`
            }
        });
        if (task.assigneeId) {
            await (0, telegramService_1.sendTelegramMessage)(task.assigneeId, `⚠️ <b>Görev İade Edildi</b>\n\n<b>Görev:</b> ${task.title}\n\nYönetici görevi eksik bularak size iade etti.\nAçıklama: ${reason}`);
        }
        return updatedTask;
    }
    async updateTask(id, data, user) {
        const task = await prisma.wfTask.findUnique({ where: { id } });
        if (!task)
            throw new Error('Task not found');
        const hasAdminAccess = user?.workflowRole === 'ADMIN' || user?.workflowRole === 'MANAGER' || user?.roles?.includes('admin') || user?.roles?.includes('management') || user?.isAdmin;
        // Only creator, follower or admin can edit
        if (!hasAdminAccess && task.creatorId !== user.username && task.followerId !== user.username) {
            throw new Error('Görevi düzenleme yetkiniz yok. Sadece görevi veren kişi düzenleyebilir.');
        }
        const { checklist, ...taskData } = data;
        if (taskData.startDate)
            taskData.startDate = new Date(taskData.startDate);
        if (taskData.dueDate)
            taskData.dueDate = new Date(taskData.dueDate);
        const updated = await prisma.wfTask.update({
            where: { id },
            data: taskData
        });
        if (checklist) {
            // Very basic approach: delete old and create new
            await prisma.wfChecklistStep.deleteMany({ where: { taskId: id } });
            let order = 0;
            for (const step of checklist) {
                await prisma.wfChecklistStep.create({
                    data: {
                        text: step.text || step.title || '',
                        done: step.isDone || step.done || false,
                        order: step.order ?? order++,
                        requireEvidence: step.requireEvidence || false,
                        requireDescription: step.requireDescription || false,
                        taskId: id
                    }
                });
            }
        }
        await this.logActivity(user.username, "Görev güncellendi", `Görev ID: ${id}`);
        index_1.io.emit('task_updated', id);
        return updated;
    }
    async deleteTask(id, user) {
        const task = await prisma.wfTask.findUnique({ where: { id } });
        if (!task)
            throw new Error('Task not found');
        const hasAdminAccess = user?.workflowRole === 'ADMIN' || user?.workflowRole === 'MANAGER' || user?.roles?.includes('admin') || user?.roles?.includes('management') || user?.isAdmin;
        // Only creator or admin can delete
        if (!hasAdminAccess && task.creatorId !== user.username) {
            throw new Error('Görevi silme yetkiniz yok. Sadece görevi veren (açan) kişi silebilir.');
        }
        return await prisma.wfTask.delete({ where: { id } });
    }
    async updateTaskStatus(id, user, status) {
        const task = await prisma.wfTask.findUnique({ where: { id } });
        if (!task)
            throw new Error("Task not found");
        if (status === client_1.WfStatus.DONE && task.progress < 100) {
            throw new Error("Tüm adımlar tamamlanmadan görev kapatılamaz.");
        }
        // Check if assignee is trying to set DONE
        let finalStatus = status;
        if (status === client_1.WfStatus.DONE && user.username === task.assigneeId && user.username !== task.creatorId && user.username !== task.followerId && user.role !== 'ADMIN') {
            finalStatus = client_1.WfStatus.REVIEW;
        }
        const res = await prisma.wfTask.update({
            where: { id },
            data: {
                status: finalStatus,
                ...(finalStatus !== client_1.WfStatus.BLOCKED ? { blockNote: null } : {})
            },
        });
        if (finalStatus === 'REVIEW' && task.creatorId) {
            await (0, telegramService_1.sendTelegramMessage)(task.creatorId, `✅ <b>Görev Onay Bekliyor</b>\n\n<b>Görev:</b> ${task.title}\n\nGörevi yapan kişi tüm adımları tamamladı, kontrolünüzü bekliyor.`);
        }
        if (finalStatus === 'BLOCKED' && task.creatorId) {
            await (0, telegramService_1.sendTelegramMessage)(task.creatorId, `🚫 <b>Görevin Önünde Engel Var!</b>\n\n<b>Görev:</b> ${task.title}\n\nGörevi yapan kişi bir engel bildirdi.`);
        }
        // Log Activity
        await prisma.wfActivityLog.create({
            data: {
                actorId: user.username,
                taskId: id,
                action: 'STATUS_UPDATE',
                detail: `Görev durumu '${finalStatus}' olarak güncellendi.`
            }
        });
        return res;
    }
    async unblockTask(id, user, resolutionNote) {
        const task = await prisma.wfTask.findUnique({ where: { id } });
        if (!task)
            throw new Error("Task not found");
        if (task.status !== client_1.WfStatus.BLOCKED)
            throw new Error("Görev engellenmiş durumda değil.");
        const res = await prisma.wfTask.update({
            where: { id },
            data: {
                status: client_1.WfStatus.DOING,
                blockNote: null
            },
        });
        await prisma.wfActivityLog.create({
            data: {
                actorId: user.username,
                taskId: id,
                action: 'UNBLOCK',
                detail: `Engel kaldırıldı. Çözüm: ${resolutionNote}`
            }
        });
        return res;
    }
    async addChecklistStep(taskId, user, data) {
        const task = await prisma.wfTask.findUnique({ where: { id: taskId }, include: { checklist: true } });
        if (!task)
            throw new Error('Task not found');
        const hasAdminAccess = user?.workflowRole === 'ADMIN' || user?.workflowRole === 'MANAGER' || user?.roles?.includes('admin') || user?.roles?.includes('management') || user?.isAdmin;
        if (!hasAdminAccess && task.creatorId !== user.username) {
            throw new Error('Yetkisiz işlem. Adımları sadece yöneticiler veya görevi açan kişi değiştirebilir.');
        }
        const newOrder = task.checklist.length > 0 ? Math.max(...task.checklist.map(s => s.order)) + 1 : 0;
        const newStep = await prisma.wfChecklistStep.create({
            data: {
                taskId,
                text: data.text,
                order: newOrder,
                requireEvidence: data.requireEvidence || false,
                requireDescription: data.requireDescription || false
            }
        });
        return newStep;
    }
    async updateChecklistStepDefinition(taskId, stepId, user, data) {
        const task = await prisma.wfTask.findUnique({ where: { id: taskId } });
        if (!task)
            throw new Error('Task not found');
        const hasAdminAccess = user?.workflowRole === 'ADMIN' || user?.workflowRole === 'MANAGER' || user?.roles?.includes('admin') || user?.roles?.includes('management') || user?.isAdmin;
        if (!hasAdminAccess && task.creatorId !== user.username) {
            throw new Error('Yetkisiz işlem. Adımları sadece yöneticiler veya görevi açan kişi değiştirebilir.');
        }
        await prisma.wfChecklistStep.update({
            where: { id: stepId },
            data: {
                text: data.text,
                requireEvidence: data.requireEvidence,
                requireDescription: data.requireDescription
            }
        });
        const steps = await prisma.wfChecklistStep.findMany({ where: { taskId } });
        const total = steps.length;
        const completed = steps.filter((s) => s.done).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        const currentTask = await prisma.wfTask.findUnique({ where: { id: taskId } });
        await prisma.wfTask.update({ where: { id: taskId }, data: { progress } });
        if (progress === 100 && currentTask?.status !== 'DONE') {
            await prisma.wfTask.update({ where: { id: taskId }, data: { status: 'REVIEW' } });
        }
        return this.getTaskById(taskId);
    }
    async deleteChecklistStep(taskId, stepId, user) {
        const taskCurrent = await prisma.wfTask.findUnique({ where: { id: taskId } });
        if (!taskCurrent)
            throw new Error('Task not found');
        const hasAdminAccess = user?.workflowRole === 'ADMIN' || user?.workflowRole === 'MANAGER' || user?.roles?.includes('admin') || user?.roles?.includes('management') || user?.isAdmin;
        if (!hasAdminAccess && taskCurrent.creatorId !== user.username) {
            throw new Error('Yetkisiz işlem. Adımları sadece yöneticiler veya görevi açan kişi silebilir.');
        }
        await prisma.wfChecklistStep.delete({
            where: { id: stepId }
        });
        // Reorder remaining steps
        const task = await prisma.wfTask.findUnique({ where: { id: taskId }, include: { checklist: { orderBy: { order: 'asc' } } } });
        if (task && task.checklist.length > 0) {
            for (let i = 0; i < task.checklist.length; i++) {
                await prisma.wfChecklistStep.update({
                    where: { id: task.checklist[i].id },
                    data: { order: i + 1 }
                });
            }
        }
        const steps = await prisma.wfChecklistStep.findMany({ where: { taskId } });
        const total = steps.length;
        const completed = steps.filter((s) => s.done).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        const currentTask = await prisma.wfTask.findUnique({ where: { id: taskId } });
        await prisma.wfTask.update({ where: { id: taskId }, data: { progress } });
        if (progress === 100 && currentTask?.status !== 'DONE') {
            await prisma.wfTask.update({ where: { id: taskId }, data: { status: 'REVIEW' } });
        }
        return this.getTaskById(taskId);
    }
    async updateChecklistStep(taskId, stepId, user, data) {
        const task = await prisma.wfTask.findUnique({
            where: { id: taskId },
            include: { checklist: true }
        });
        if (!task)
            throw new Error("Görev bulunamadı");
        await prisma.wfChecklistStep.update({
            where: { id: stepId },
            data: {
                ...(data.done !== undefined && {
                    done: data.done,
                    doneById: data.done ? user.username : null,
                    doneAt: data.done ? new Date() : null,
                }),
                ...(data.evidence !== undefined && {
                    evidence: data.evidence,
                    evidenceName: data.evidenceName || null,
                    evidenceById: data.evidence ? user.username : null,
                    evidenceAt: data.evidence ? new Date() : null,
                }),
                ...(data.description !== undefined && {
                    description: data.description,
                })
            }
        });
        // Recalculate progress
        const steps = await prisma.wfChecklistStep.findMany({ where: { taskId } });
        const total = steps.length;
        const completed = steps.filter(s => s.done).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        const updatedTask = await prisma.wfTask.update({
            where: { id: taskId },
            data: { progress }
        });
        if (progress === 100 && task.status !== 'DONE') {
            await prisma.wfTask.update({ where: { id: taskId }, data: { status: 'REVIEW' } });
        }
        return updatedTask;
    }
    // Due Requests
    async createDueRequest(taskId, user, data) {
        const task = await prisma.wfTask.findUnique({ where: { id: taskId }, include: { dueRequests: true } });
        if (!task)
            throw new Error("Task not found");
        if (data.requestedDue <= new Date())
            throw new Error("Yeni tarih geçmişte olamaz");
        if (data.requestedDue.getTime() === task.dueDate.getTime())
            throw new Error("Yeni termin mevcut terminle aynı olamaz");
        const pendingRequests = task.dueRequests.filter(r => r.status === client_1.WfDueRequestStatus.PENDING && r.requestedById === user.username);
        if (pendingRequests.length > 0)
            throw new Error("Zaten bekleyen bir talebiniz var");
        const req = await prisma.wfDueChangeRequest.create({
            data: {
                taskId,
                requestedById: user.username,
                oldDue: task.dueDate,
                requestedDue: data.requestedDue,
                reason: data.reason
            }
        });
        await this.logActivity(user.username, "Termin değişikliği talebi", `Görev ID: ${taskId}`);
        return req;
    }
    async respondDueRequest(reqId, user, approve) {
        const request = await prisma.wfDueChangeRequest.findUnique({ where: { id: reqId }, include: { task: true } });
        if (!request)
            throw new Error("Request not found");
        const status = approve ? client_1.WfDueRequestStatus.APPROVED : client_1.WfDueRequestStatus.REJECTED;
        await prisma.wfDueChangeRequest.update({
            where: { id: reqId },
            data: {
                status,
                reviewedById: user.username,
                reviewedAt: new Date()
            }
        });
        if (approve) {
            await prisma.wfTask.update({
                where: { id: request.taskId },
                data: {
                    dueDate: request.requestedDue,
                    dueChangeCount: { increment: 1 }
                }
            });
            await prisma.wfDueHistory.create({
                data: {
                    taskId: request.taskId,
                    oldDue: request.oldDue,
                    newDue: request.requestedDue,
                    changedById: user.username,
                    source: "Talep onayı",
                    requestId: reqId
                }
            });
            await this.logActivity(user.username, "Termin onaylandı", `Görev ID: ${request.taskId}`);
            await (0, telegramService_1.sendTelegramMessage)(request.requestedById, `✅ <b>Termin Talebi Onaylandı</b>\n\n<b>Görev ID:</b> ${request.taskId}\n<b>Yeni Tarih:</b> ${new Date(request.requestedDue).toLocaleDateString('tr-TR')}\n<b>Onaylayan:</b> ${user.fullName || user.username}`);
        }
        else {
            await this.logActivity(user.username, "Termin reddedildi", `Görev ID: ${request.taskId}`);
            await (0, telegramService_1.sendTelegramMessage)(request.requestedById, `❌ <b>Termin Talebi Reddedildi</b>\n\n<b>Görev ID:</b> ${request.taskId}\n<b>İstemiş Olduğunuz Tarih:</b> ${new Date(request.requestedDue).toLocaleDateString('tr-TR')}\n<b>Reddeden:</b> ${user.fullName || user.username}`);
        }
        return status;
    }
    async addComment(taskId, user, body) {
        return await prisma.wfComment.create({
            data: {
                taskId,
                authorId: user.username,
                body
            }
        });
    }
    async logActivity(actorId, action, detail) {
        return await prisma.wfActivityLog.create({
            data: {
                actorId,
                action,
                detail
            }
        });
    }
    async createTransferRequest(taskId, user, targetUserId) {
        const task = await prisma.wfTask.findUnique({ where: { id: taskId } });
        if (!task)
            throw new Error("Görev bulunamadı");
        // Yalnızca Sorumlu (assignee), Görevi Yapan (creator) veya Adminler devredebilir
        if (task.creatorId !== user.username && task.assigneeId !== user.username && user.workflowRole !== 'ADMIN') {
            throw new Error("Bu görevi devretme yetkiniz yok.");
        }
        const request = await prisma.wfTransferRequest.create({
            data: {
                taskId,
                requestedBy: user.username,
                targetUserId,
                status: client_1.WfDueRequestStatus.PENDING
            }
        });
        await this.logActivity(user.username, "Görev devir talebi", `Görev ID: ${taskId}, Yeni Sorumlu: ${targetUserId}`);
        return request;
    }
    async respondTransferRequest(reqId, user, approve) {
        const request = await prisma.wfTransferRequest.findUnique({ where: { id: reqId }, include: { task: true } });
        if (!request)
            throw new Error("Devir talebi bulunamadı");
        if (request.status !== client_1.WfDueRequestStatus.PENDING)
            throw new Error("Bu talep zaten yanıtlanmış");
        // Sadece hedef kişi (targetUserId) veya ADMIN onaylayabilir/reddedebilir
        if (request.targetUserId !== user.username && user.workflowRole !== 'ADMIN') {
            throw new Error("Bu talebi yanıtlama yetkiniz yok");
        }
        const newStatus = approve ? client_1.WfDueRequestStatus.APPROVED : client_1.WfDueRequestStatus.REJECTED;
        await prisma.wfTransferRequest.update({
            where: { id: reqId },
            data: { status: newStatus }
        });
        if (approve) {
            await prisma.wfTask.update({
                where: { id: request.taskId },
                data: {
                    creatorId: request.targetUserId,
                }
            });
            await this.logActivity(user.username, "Görev devri kabul edildi", `Görev ID: ${request.taskId}`);
            try {
                const msg = `✅ *Devir Talebi Onaylandı*\n\n${user.fullName || user.username} görev devrini kabul etti.\n📌 Görev: ${request.task.title}`;
                await (0, telegramService_1.sendTelegramMessage)(request.requestedBy, msg);
            }
            catch (err) {
                console.error("Telegram gönderme hatası:", err);
            }
        }
        else {
            await this.logActivity(user.username, "Görev devri reddedildi", `Görev ID: ${request.taskId}`);
            try {
                const msg = `❌ *Devir Talebi Reddedildi*\n\n${user.fullName || user.username} görev devrini reddetti.\n📌 Görev: ${request.task.title}`;
                await (0, telegramService_1.sendTelegramMessage)(request.requestedBy, msg);
            }
            catch (err) {
                console.error("Telegram gönderme hatası:", err);
            }
        }
        index_1.io.emit('task_updated', request.taskId);
        return newStatus;
    }
}
exports.WorkflowService = WorkflowService;
exports.workflowService = new WorkflowService();
