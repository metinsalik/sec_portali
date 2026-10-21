import React, { useState, useRef } from 'react';
import { 
  Camera, Upload, FileText, Image as ImageIcon, X, 
  Eye, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, AlertCircle, Loader2 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { type ImprovementFileAttachment, formatAttachmentName } from './types';

const API = import.meta.env.VITE_API_URL || '';

// ─────────────────────────────────────────────────────────────────────────────
// 1. İstemci Tarafı WebP Sıkıştırma Motoru
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Mobil cihazlardan veya bilgisayardan yüklenen yüksek çözünürlüklü fotoğrafları (10-25 MB)
 * kalitesini kaybetmeden maksimum 1920px genişlik/yükseklik sınırına getirip
 * standart WebP formatına sıkıştırır (~150-280 KB).
 */
export async function compressImageToWebP(
  file: File, 
  maxDimension = 1920, 
  quality = 0.85
): Promise<File> {
  // Eğer dosya resim değilse (örn. PDF) doğrudan kendisini döndür
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // En boy oranını koruyarak yeniden boyutlandır
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // Canvas hatası olursa orijinal dosyayı döndür
          return;
        }

        // Yumuşak piksel enterpolasyonu
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // WebP formatında blob oluştur
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Dosya adının uzantısını .webp yap
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            const compressedFile = new File([blob], `${nameWithoutExt}.webp`, {
              type: 'image/webp',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Dosya Yükleme API İstemcisi (Tesis Bazlı Klasörleme)
// ─────────────────────────────────────────────────────────────────────────────
export async function uploadImprovementFiles(
  files: File[],
  facilityId?: string,
  facilityName?: string
): Promise<ImprovementFileAttachment[]> {
  if (!files || files.length === 0) return [];

  // 1. Görselleri önce istemci tarafında hızlıca sıkıştır
  const processedFiles: File[] = [];
  for (const f of files) {
    if (f.type.startsWith('image/')) {
      try {
        const compressed = await compressImageToWebP(f);
        processedFiles.push(compressed);
      } catch {
        processedFiles.push(f);
      }
    } else {
      processedFiles.push(f);
    }
  }

  // 2. FormData ile backend'e gönder
  const formData = new FormData();
  processedFiles.forEach((file) => {
    formData.append('files', file);
  });

  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  if (facilityId) params.append('facilityId', facilityId);
  if (facilityName) params.append('facilityName', facilityName);

  const res = await fetch(`${API}/api/operations/improvements/upload?${params.toString()}`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Dosya yükleme başarısız oldu.');
  }

  return data.files || [];
}

// Dosya boyutunu okunabilir formata çevir (KB / MB)
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Yüksek Kaliteli Fotoğraf Lightbox (Büyütme & Gezinme Modalı)
// ─────────────────────────────────────────────────────────────────────────────
interface LightboxProps {
  photos: ImprovementFileAttachment[];
  initialIndex?: number;
  onClose: () => void;
  title?: string;
}

export const ImprovementMediaLightbox: React.FC<LightboxProps> = ({
  photos,
  initialIndex = 0,
  onClose,
  title = 'Fotoğraf Önizleme',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!photos || photos.length === 0) return null;
  const currentPhoto = photos[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    setZoomLevel(1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Üst Çubuk */}
      <div className="flex items-center justify-between text-white z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <Badge className="bg-white/20 text-white font-mono text-xs">
            {currentIndex + 1} / {photos.length}
          </Badge>
          <span className="text-sm font-semibold truncate max-w-[280px] sm:max-w-md">
            {currentPhoto?.name || title}
          </span>
          {currentPhoto?.size && (
            <span className="text-xs text-white/60 font-mono">
              ({formatBytes(currentPhoto.size)})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Yakınlaştır / Uzaklaştır */}
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(z + 0.3, 3))}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Yakınlaştır"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(z - 0.3, 0.7))}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Uzaklaştır"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* İndir */}
          <a
            href={currentPhoto.url}
            download={currentPhoto.name || 'foto.webp'}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Orijinal Boyutta İndir"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Kapat */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/20 hover:bg-red-600 text-white transition-colors"
            title="Kapat (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Orta Görsel Alanı */}
      <div 
        className="flex-1 flex items-center justify-center relative overflow-hidden my-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sol Ok */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 sm:left-6 z-10 p-3 rounded-full bg-white/10 hover:bg-white/30 text-white backdrop-blur-sm transition-all"
            title="Önceki Fotoğraf"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <img
          src={currentPhoto.url}
          alt={currentPhoto.name || 'Önizleme'}
          style={{ transform: `scale(${zoomLevel})` }}
          className="max-h-[82vh] max-w-[92vw] object-contain transition-transform duration-150 rounded-lg shadow-2xl"
        />

        {/* Sağ Ok */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 sm:right-6 z-10 p-3 rounded-full bg-white/10 hover:bg-white/30 text-white backdrop-blur-sm transition-all"
            title="Sonraki Fotoğraf"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Alt Küçük Resim Şeridi */}
      {photos.length > 1 && (
        <div 
          className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10" 
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCurrentIndex(idx);
                setZoomLevel(1);
              }}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                idx === currentIndex ? 'border-primary ring-2 ring-primary/40 scale-105' : 'border-white/20 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Bulgu & Aksiyon Ekleri Yükleyici ve Önizleme Bileşeni
// ─────────────────────────────────────────────────────────────────────────────
interface UploaderProps {
  facilityId?: string;
  facilityName?: string;
  photos: ImprovementFileAttachment[];
  onPhotosChange: (photos: ImprovementFileAttachment[]) => void;
  documents?: ImprovementFileAttachment[];
  onDocumentsChange?: (documents: ImprovementFileAttachment[]) => void;
  maxPhotos?: number; // Varsayılan 3
  isReadOnly?: boolean;
}

export const ImprovementAttachmentManager: React.FC<UploaderProps> = ({
  facilityId,
  facilityName,
  photos,
  onPhotosChange,
  documents = [],
  onDocumentsChange,
  maxPhotos = 3,
  isReadOnly = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Dosya Yükleme Olayı
  const handleFiles = async (fileList: FileList | File[], targetType: 'PHOTO' | 'DOCUMENT') => {
    if (!fileList || fileList.length === 0) return;
    const rawArr = Array.from(fileList);

    if (targetType === 'PHOTO') {
      const remainingSlots = maxPhotos - photos.length;
      if (remainingSlots <= 0) {
        toast.error(`Her bulgu için en fazla ${maxPhotos} adet fotoğraf yüklenebilir.`);
        return;
      }

      if (rawArr.length > remainingSlots) {
        toast.error(`Sadece ${remainingSlots} fotoğraf daha ekleyebilirsiniz (Maks. ${maxPhotos}).`);
      }

      const filesToUpload = rawArr.slice(0, remainingSlots);
      setUploading(true);
      try {
        const uploaded = await uploadImprovementFiles(filesToUpload, facilityId, facilityName);
        const imageFiles = uploaded.filter(f => f.type.startsWith('image/'));
        onPhotosChange([...photos, ...imageFiles].slice(0, maxPhotos));
        toast.success(`${imageFiles.length} fotoğraf WebP formatında optimize edilerek yüklendi.`);
      } catch (err: any) {
        toast.error(err.message || 'Fotoğraf yüklenemedi.');
      } finally {
        setUploading(false);
      }
    } else {
      // PDF veya Doküman yükleme
      setUploading(true);
      try {
        const uploaded = await uploadImprovementFiles(rawArr, facilityId, facilityName);
        if (onDocumentsChange) {
          onDocumentsChange([...documents, ...uploaded]);
        }
        toast.success(`${uploaded.length} doküman yüklendi.`);
      } catch (err: any) {
        toast.error(err.message || 'Doküman yüklenemedi.');
      } finally {
        setUploading(false);
      }
    }
  };

  const removePhoto = (idx: number) => {
    onPhotosChange(photos.filter((_, i) => i !== idx));
  };

  const removeDocument = (idx: number) => {
    if (onDocumentsChange) {
      onDocumentsChange(documents.filter((_, i) => i !== idx));
    }
  };

  const canAddPhoto = photos.length < maxPhotos && !isReadOnly;

  return (
    <div className="space-y-3">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. FOTOĞRAF ALANI (Maks. 3 Sınırı)                                */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="bg-muted/30 border rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-primary" />
              Bulgu Fotoğrafları
            </span>
            <Badge 
              variant="outline" 
              className={`text-[10px] font-mono ${
                photos.length >= maxPhotos 
                  ? 'border-amber-500 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20' 
                  : 'text-muted-foreground'
              }`}
            >
              {photos.length} / {maxPhotos} Fotoğraf
            </Badge>
          </div>

          {/* Yükleme Butonları (Mobil Kamera & PC Galeri) */}
          {!isReadOnly && (
            <div className="flex items-center gap-1.5">
              {/* Mobil Kamera Butonu (capture="environment") */}
              <button
                type="button"
                disabled={!canAddPhoto || uploading}
                onClick={() => cameraInputRef.current?.click()}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white shadow-2xs transition-all ${
                  canAddPhoto && !uploading 
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95' 
                    : 'bg-muted-foreground/40 cursor-not-allowed opacity-50'
                }`}
                title="Mobil Cihaz Kamerasını Aç"
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kamera</span>
              </button>

              {/* Galeri / Dosya Butonu */}
              <button
                type="button"
                disabled={!canAddPhoto || uploading}
                onClick={() => fileInputRef.current?.click()}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white shadow-2xs transition-all ${
                  canAddPhoto && !uploading 
                    ? 'bg-primary hover:bg-primary/90 active:scale-95' 
                    : 'bg-muted-foreground/40 cursor-not-allowed opacity-50'
                }`}
                title="Galeriden veya Bilgisayardan Fotoğraf Seç"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Dosya Seç</span>
              </button>

              {/* Gizli Inputlar */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files, 'PHOTO');
                  e.target.value = '';
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files, 'PHOTO');
                  e.target.value = '';
                }}
              />
            </div>
          )}
        </div>

        {/* Fotoğraf Izgarası / Küçük Resimler */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {photos.map((photo, idx) => (
              <div 
                key={idx}
                className="relative group rounded-xl overflow-hidden border border-border/80 bg-background aspect-4/3 shadow-2xs flex items-center justify-center"
              >
                <img
                  src={photo.url}
                  alt={photo.name || `Fotoğraf #${idx + 1}`}
                  className="w-full h-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                  onClick={() => setLightboxIndex(idx)}
                />

                {/* Üst Karartma ve Önizleme İkonu */}
                <div 
                  onClick={() => setLightboxIndex(idx)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                  title="Büyüt ve Önizle"
                >
                  <Eye className="w-5 h-5 drop-shadow-md" />
                </div>

                {/* Fotoğraf Sıra Numarası Rozeti */}
                <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] font-mono px-1.5 py-0.5 rounded backdrop-blur-xs pointer-events-none">
                  #{idx + 1}
                </span>

                {/* Silme Butonu */}
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-90 hover:opacity-100 shadow-md transition-all active:scale-90 z-10"
                    title="Fotoğrafı Kaldır"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div 
            onClick={() => canAddPhoto && fileInputRef.current?.click()}
            className={`text-center py-4 border-2 border-dashed rounded-xl transition-colors ${
              canAddPhoto 
                ? 'border-muted hover:border-primary/50 cursor-pointer bg-background/50 hover:bg-primary/5' 
                : 'border-muted bg-muted/20 text-muted-foreground'
            }`}
          >
            <ImageIcon className="w-6 h-6 text-muted-foreground/60 mx-auto mb-1" />
            <p className="text-xs font-medium text-foreground">
              {isReadOnly ? 'Fotoğraf eklenmemiş' : 'Fotoğraf yüklemek için tıklayın veya kamera ile çekin'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Otomatik WebP sıkıştırmasıyla kalite kaybı olmadan kaydedilir (Maks. 3 adet).
            </p>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. DOKÜMAN / PDF ALANI                                            */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {onDocumentsChange && (
        <div className="bg-muted/20 border rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                İlişkili Dokümanlar & PDF
              </span>
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                {documents.length} Dosya
              </Badge>
            </div>

            {!isReadOnly && (
              <div>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => docInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-2xs transition-all active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF Ekle</span>
                </button>
                <input
                  ref={docInputRef}
                  type="file"
                  accept="application/pdf,.pdf,.doc,.docx,.xls,.xlsx"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleFiles(e.target.files, 'DOCUMENT');
                    e.target.value = '';
                  }}
                />
              </div>
            )}
          </div>

          {documents.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg border bg-background text-xs"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileText className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="font-medium text-foreground truncate" title={doc.name}>
                      {formatAttachmentName(doc.name)}
                    </span>
                    {doc.size && (
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                        ({formatBytes(doc.size)})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground text-[11px] font-medium"
                      title="Yeni Sekmede Aç / Görüntüle"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Görüntüle</span>
                    </a>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => removeDocument(idx)}
                        className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Dokümanı Kaldır"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground italic">
              Ekli rapor, teknik şartname veya PDF dokümanı bulunmuyor.
            </p>
          )}
        </div>
      )}

      {/* Lightbox Tam Ekran Önizleme */}
      {lightboxIndex !== null && (
        <ImprovementMediaLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          title="Bulgu Fotoğrafı"
        />
      )}
    </div>
  );
};
