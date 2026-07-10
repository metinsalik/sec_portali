"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = exports.LocalDiskStorageService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class LocalDiskStorageService {
    baseUploadDir;
    constructor() {
        this.baseUploadDir = path_1.default.join(process.cwd(), 'uploads');
        if (!fs_1.default.existsSync(this.baseUploadDir)) {
            fs_1.default.mkdirSync(this.baseUploadDir, { recursive: true });
        }
    }
    async saveFile(file, folderName) {
        const targetDir = path_1.default.join(this.baseUploadDir, folderName);
        if (!fs_1.default.existsSync(targetDir)) {
            fs_1.default.mkdirSync(targetDir, { recursive: true });
        }
        // Dosya adını güvenli ve benzersiz yap
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        const safeFileName = `${uniqueSuffix}${ext}`;
        const targetPath = path_1.default.join(targetDir, safeFileName);
        // Dosyayı taşı
        await fs_1.default.promises.rename(file.path, targetPath);
        // Dışarıya erişilebilir URL formatını dön
        return `/uploads/${folderName}/${safeFileName}`;
    }
    async deleteFile(fileUrl) {
        if (!fileUrl.startsWith('/uploads/'))
            return;
        const relativePath = fileUrl.replace('/uploads/', '');
        const absolutePath = path_1.default.join(this.baseUploadDir, relativePath);
        if (fs_1.default.existsSync(absolutePath)) {
            await fs_1.default.promises.unlink(absolutePath);
        }
    }
}
exports.LocalDiskStorageService = LocalDiskStorageService;
exports.storageService = new LocalDiskStorageService();
