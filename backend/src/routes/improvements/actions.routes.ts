import { Router, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { improvementActionService } from '../../services/improvements/improvementAction.service';

export const actionsRouter = Router();

// 1. BULGUNUN AKSİYONLARINI LİSTELE
actionsRouter.get('/records/:id/actions', async (req: AuthRequest, res: Response) => {
  try {
    const actions = await improvementActionService.getRecordActions(req.params.id);
    res.json({ success: true, data: actions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. YENİ AKSİYON KARTI EKLE
actionsRouter.post('/records/:id/actions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.username || 'system';
    const action = await improvementActionService.createAction(
      req.params.id,
      req.body,
      userId
    );
    res.json({ success: true, message: 'Aksiyon kaydedildi.', data: action });
  } catch (error: any) {
    console.error('Error creating action:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 3. AKSİYON SİL
actionsRouter.delete('/actions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.username || 'system';
    const deleted = await improvementActionService.deleteAction(req.params.id, userId);
    res.json({ success: true, message: 'Aksiyon silindi.', data: deleted });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});
