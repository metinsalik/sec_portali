import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Modül rol hiyerarşisi
const ROLE_HIERARCHY = {
  DIREKTOR: 5,
  MUDUR: 4,
  SORUMLU: 3,
  UYE: 2,
  IZLEYICI: 1
};

export const requireWorkflowRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // @ts-ignore - req.user will be populated by standard auth middleware
      const username = req.user?.username;
      
      if (!username) {
        return res.status(401).json({ error: 'Yetkisiz erişim' });
      }

      const userRole = await prisma.workflowUserRole.findUnique({
        where: { userId: username },
      });

      if (!userRole) {
        return res.status(403).json({ error: 'İş Takip modülü rolünüz bulunmamaktadır.' });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole.moduleRole)) {
        return res.status(403).json({ error: 'Bu işlem için modül yetkiniz yetersiz.' });
      }

      // @ts-ignore
      req.workflowRole = userRole.moduleRole;
      next();
    } catch (error) {
      console.error('Workflow Auth Error:', error);
      res.status(500).json({ error: 'Yetki kontrolü sırasında bir hata oluştu.' });
    }
  };
};
