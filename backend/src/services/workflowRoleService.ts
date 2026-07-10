import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const workflowRoleService = {
  async getWorkflowUsers() {
    // Sadece 'WORKFLOW' modülü atanmış olan kullanıcıları getir
    // ve varsa workflowRollerini include et
    const users = await prisma.user.findMany({
      where: {
        modules: {
          some: {
            module: { code: 'WORKFLOW' }
          }
        }
      },
      include: {
        workflowRole: true
      },
      orderBy: { fullName: 'asc' }
    });

    return users.map(user => ({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      workflowRole: user.workflowRole?.moduleRole || 'MEMBER', // Default is MEMBER if they have access
    }));
  },

  async updateUserRole(username: string, moduleRole: string) {
    const validRoles = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];
    if (!validRoles.includes(moduleRole)) {
      throw new Error('Geçersiz rol türü');
    }

    // Check if user has workflow module
    const hasModule = await prisma.userModule.findFirst({
      where: { username, module: { code: 'WORKFLOW' } }
    });

    if (!hasModule) {
      throw new Error('Bu kullanıcının İş Takibi modülüne erişimi yok');
    }

    const updated = await prisma.workflowUserRole.upsert({
      where: { userId: username },
      update: { moduleRole },
      create: { userId: username, moduleRole }
    });

    return updated;
  }
};
