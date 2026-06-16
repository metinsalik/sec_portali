import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest<P = Record<string, string>, ReqBody = any, ReqQuery = Record<string, string | undefined>> extends Request<P, any, ReqBody, ReqQuery> {
  user?: {
    username: string;
    fullName: string;
    roles: string[];
    facilities: string[];
    isAdmin: boolean;
    isManagement: boolean;
    workflowRole?: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  let authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return res.status(401).json({ error: 'Yetkilendirme başlığı eksik veya hatalı.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token.' });
  }
};

/** Sadece Admin erişimi */
export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Bu işlem için yönetici yetkisi gerekiyor.' });
  }
  next();
};

/** Admin VEYA Management erişimi */
export const managementMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || (!req.user.isAdmin && !req.user.isManagement)) {
    return res.status(403).json({ error: 'Bu işlem için yönetici veya merkez yönetim yetkisi gerekiyor.' });
  }
  next();
};
