import { Router, Response } from 'express';
// @ts-ignore
import ntlm from 'express-ntlm';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Password-less Login Endpoint (POST)
router.post('/login', async (req: any, res: Response) => {
  try {
    const { username: inputUsername } = req.body;

    if (!inputUsername) {
      return res.status(400).json({ error: 'Kullanıcı adı gereklidir.' });
    }

    const username = inputUsername.toLowerCase();

    let user = await prisma.user.findUnique({
      where: { username },
      include: {
        roles: { include: { role: true } },
        facilities: true,
      }
    });

    // Development auto-registration
    if (!user && process.env.NODE_ENV === 'development') {
      console.log(`Development mode: Auto-creating user ${username}`);
      
      // Ensure 'admin' and 'user' roles exist
      await prisma.role.upsert({ where: { name: 'admin' }, update: {}, create: { name: 'admin' } });
      await prisma.role.upsert({ where: { name: 'user' }, update: {}, create: { name: 'user' } });
      
      const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });

      user = await prisma.user.create({
        data: {
          username,
          fullName: username.split('.').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
          roles: {
            create: {
              roleId: adminRole!.id
            }
          }
        },
        include: {
          roles: { include: { role: true } },
          facilities: true,
        }
      });
    }

    if (!user) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı. Lütfen sistem yöneticinizle iletişime geçin.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Kullanıcı hesabı pasif durumda.' });
    }

    const payload = {
      username: user.username,
      fullName: user.fullName,
      roles: user.roles.map((r: any) => r.role.name),
      facilities: user.facilities.map((f: any) => f.facilityId),
      isAdmin: user.roles.some((r: any) => r.role.name === 'admin'),
      isManagement: user.roles.some((r: any) => r.role.name === 'management'),
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
      expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any,
    });

    return res.json({ token, user: payload });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// NTLM Login Endpoint (Keep as fallback)
router.get('/login', ntlm({
  domain: '',
  domaincontroller: ''
}), async (req: any, res: Response) => {
  try {
    let username = req.ntlm?.UserName;

    if (process.env.NODE_ENV === 'development' && process.env.DEV_USER) {
      username = process.env.DEV_USER;
    }

    if (!username) {
      return res.status(401).json({ error: 'NTLM authentication failed' });
    }

    username = username.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        roles: { include: { role: true } },
        facilities: true,
      }
    });

    if (!user || (!user.isActive && username !== process.env.DEV_USER)) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı veya pasif durumda.' });
    }

    const payload = {
      username: user.username,
      fullName: user.fullName,
      roles: user.roles.map((r: any) => r.role.name),
      facilities: user.facilities.map((f: any) => f.facilityId),
      isAdmin: user.roles.some((r: any) => r.role.name === 'admin'),
      isManagement: user.roles.some((r: any) => r.role.name === 'management'),
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
      expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any,
    });

    return res.json({ token, user: payload });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// Profile / Me Endpoint
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;
