import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../../middleware/auth';
import { improvementRecordService } from '../../services/improvements/improvementRecord.service';
import { improvementExcelService } from '../../services/improvements/improvementExcel.service';

export const recordsRouter = Router();

// Multer geçici dizin ayarı
const tempUploadDir = path.join(process.cwd(), 'uploads', 'temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const upload = multer({
  dest: tempUploadDir,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB sınır
});

// 1. BULGULARI LİSTELE
recordsRouter.get('/records', async (req: AuthRequest, res: Response) => {
  try {
    const {
      facilityId,
      moduleGroup,
      sheetType,
      riskScore,
      status,
      category,
      reportId,
      search,
      page,
      limit,
    } = req.query;

    const data = await improvementRecordService.getRecords({
      facilityId: facilityId as string,
      moduleGroup: moduleGroup as string,
      sheetType: sheetType as string,
      riskScore: riskScore as string,
      status: status as string,
      category: category as string,
      reportId: reportId as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 500,
    });

    res.json({
      success: true,
      data: data.records,
      pagination: data.pagination,
    });
  } catch (error: any) {
    console.error('Error fetching records:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. KRİTİK KALEMLER
recordsRouter.get('/critical', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, sheetType, category, status } = req.query;
    const records = await improvementRecordService.getCriticalRecords({
      facilityId: facilityId as string,
      sheetType: sheetType as string,
      category: category as string,
      status: status as string,
    });
    res.json({ success: true, data: records, total: records.length });
  } catch (error: any) {
    console.error('Error fetching critical records:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. TEKİL KAYIT DETAYI
recordsRouter.get('/records/:id', async (req: AuthRequest, res: Response) => {
  try {
    const record = await improvementRecordService.getRecordById(req.params.id);
    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
});

// 4. TEKİL BULGU OLUŞTUR
recordsRouter.post('/records', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.username || 'system';
    const record = await improvementRecordService.createRecord(req.body, userId);
    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error creating record:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 5. BULGU GÜNCELLE
recordsRouter.put('/records/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.username || 'system';
    const updated = await improvementRecordService.updateRecord(req.params.id, req.body, userId);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating record:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 6. HIZLI AKSİYON NOTU GİR (Aksiyon Gir butonu için)
recordsRouter.patch('/records/:id/action-note', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.username || 'system';
    const { currentNote, status, actionPlan, dueDate, recordDate } = req.body;
    const updated = await improvementRecordService.updateRecord(
      req.params.id,
      { currentNote, status, actionPlan, dueDate, recordDate },
      userId
    );
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 7. BULGU SİL (Soft Delete)
recordsRouter.delete('/records/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.username || 'system';
    const { deleteReason } = req.body || {};
    const deleted = await improvementRecordService.deleteRecord(req.params.id, userId, deleteReason);
    res.json({ success: true, message: 'Kayıt silindi.', data: deleted });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 8. FOTOĞRAF EKLEME (Maks. 5 Fotoğraf, Sürükle-Bırak & Mobil)
recordsRouter.post('/records/:id/photos', upload.array('photos', 5), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.username || 'system';
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'Yüklenecek fotoğraf bulunamadı.' });
    }

    const updatedPhotos = await improvementRecordService.addPhotos(req.params.id, files, userId);
    res.json({
      success: true,
      message: `${files.length} fotoğraf başarıyla yüklendi.`,
      data: updatedPhotos,
    });
  } catch (error: any) {
    console.error('Error uploading photos:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 9. FOTOĞRAF SİLME
recordsRouter.delete('/records/:id/photos/:photoId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.username || 'system';
    const updatedPhotos = await improvementRecordService.deletePhoto(
      req.params.id,
      req.params.photoId,
      userId
    );
    res.json({
      success: true,
      message: 'Fotoğraf silindi.',
      data: updatedPhotos,
    });
  } catch (error: any) {
    console.error('Error deleting photo:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 10. EXCEL İÇE AKTARMA (Import Sheet)
recordsRouter.post('/import-sheet', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.username || 'system';
    const { facilityId, sheetName, rows, sourceFileName, mode } = req.body;

    if (!facilityId) {
      return res.status(400).json({ success: false, message: 'Hedef hastane seçilmelidir.' });
    }
    if (!sheetName || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Geçerli bir sekme ve en az bir satır veri gereklidir.' });
    }

    const result = await improvementExcelService.importSheetRows({
      facilityId,
      sheetName,
      rows,
      sourceFileName,
      mode,
      userId,
    });

    res.json({
      success: true,
      message: `${sheetName} sekmesinden ${result.insertedCount} kayıt başarıyla aktarıldı.`,
      insertedCount: result.insertedCount,
      sheetType: result.sheetType,
    });
  } catch (error: any) {
    console.error('Error importing sheet:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 11. HASTANE / SEKME BAZLI TOPLU TEMİZLEME
recordsRouter.delete('/facility-records', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, sheetType } = req.body;
    if (!facilityId) {
      return res.status(400).json({ success: false, message: 'facilityId zorunludur.' });
    }

    const where: any = { facilityId };
    if (sheetType && sheetType !== 'ALL') {
      where.sheetType = sheetType;
    }

    // Soft delete
    const result = await improvementRecordService.deleteRecord(facilityId, req.user?.username || 'system');
    res.json({ success: true, message: 'Kayıtlar temizlendi.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
