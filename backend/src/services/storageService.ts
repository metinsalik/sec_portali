import fs from 'fs';
import path from 'path';

export interface IStorageService {
  saveFile(file: Express.Multer.File, folderName: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
}

export class LocalDiskStorageService implements IStorageService {
  private baseUploadDir: string;

  constructor() {
    this.baseUploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File, folderName: string): Promise<string> {
    const targetDir = path.join(this.baseUploadDir, folderName);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Dosya adını güvenli ve benzersiz yap
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const safeFileName = `${uniqueSuffix}${ext}`;
    const targetPath = path.join(targetDir, safeFileName);

    // Dosyayı taşı
    await fs.promises.rename(file.path, targetPath);

    // Dışarıya erişilebilir URL formatını dön
    return `/uploads/${folderName}/${safeFileName}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl.startsWith('/uploads/')) return;

    const relativePath = fileUrl.replace('/uploads/', '');
    const absolutePath = path.join(this.baseUploadDir, relativePath);

    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
    }
  }
}

export const storageService = new LocalDiskStorageService();
