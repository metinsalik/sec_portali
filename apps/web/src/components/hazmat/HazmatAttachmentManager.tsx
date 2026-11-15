import React, { useState, useRef } from 'react';
import { 
  Camera, Upload, FileText, Image as ImageIcon, X, 
  Eye, Download, ZoomIn, ZoomOut, RotateCw, Loader2, FileSpreadsheet, FileCode
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface HazmatFileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface HazmatAttachmentManagerProps {
  facilityId?: string;
  facilityName?: string;
  photos: HazmatFileAttachment[];
  onPhotosChange: (photos: HazmatFileAttachment[]) => void;
  documents?: HazmatFileAttachment[];
  onDocumentsChange?: (documents: HazmatFileAttachment[]) => void;
  maxPhotos?: number;
  maxDocuments?: number;
  disabled?: boolean;
}

// 1. Client-Side WebP Compression
export async function compressImageToWebP(
  file: File, 
  maxDimension = 1920, 
  quality = 0.85
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

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
          resolve(file);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
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

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function HazmatAttachmentManager({
  facilityId,
  facilityName,
  photos = [],
  onPhotosChange,
  documents = [],
  onDocumentsChange,
  maxPhotos = 6,
  maxDocuments = 6,
  disabled = false,
}: HazmatAttachmentManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | File[], targetType: 'PHOTO' | 'DOCUMENT') => {
    if (!fileList || fileList.length === 0 || disabled) return;
    const rawArr = Array.from(fileList);

    if (targetType === 'PHOTO') {
      const remainingSlots = maxPhotos - photos.length;
      if (remainingSlots <= 0) {
        toast.error(`Maksimum ${maxPhotos} adet fotoğraf ekleyebilirsiniz.`);
        return;
      }
      const filesToUpload = rawArr.slice(0, remainingSlots);
      setUploading(true);

      try {
        const processedFiles: File[] = [];
        for (const f of filesToUpload) {
          if (f.type.startsWith('image/')) {
            try {
              const comp = await compressImageToWebP(f);
              processedFiles.push(comp);
            } catch {
              processedFiles.push(f);
            }
          } else {
            processedFiles.push(f);
          }
        }

        const formData = new FormData();
        processedFiles.forEach((file) => formData.append('files', file));

        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (facilityId) params.append('facilityId', facilityId);
        if (facilityName) params.append('facilityName', facilityName);

        const res = await fetch(`/api/hazmat/incidents/upload?${params.toString()}`, {
          method: 'POST',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Yükleme başarısız oldu.');
        }

        const newItems: HazmatFileAttachment[] = (data.files || []).map((f: any) => ({
          name: f.name,
          url: f.url,
          type: f.type,
          size: f.size,
          uploadedAt: f.uploadedAt || new Date().toISOString(),
        }));

        onPhotosChange([...photos, ...newItems]);
        toast.success(`${newItems.length} fotoğraf başarıyla yüklendi.`);
      } catch (err: any) {
        toast.error(err.message || 'Fotoğraf yüklenirken hata oluştu.');
      } finally {
        setUploading(false);
        if (photoInputRef.current) photoInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
      }
    } else {
      const remainingSlots = maxDocuments - documents.length;
      if (remainingSlots <= 0) {
        toast.error(`Maksimum ${maxDocuments} adet belge ekleyebilirsiniz.`);
        return;
      }
      const filesToUpload = rawArr.slice(0, remainingSlots);
      setUploading(true);

      try {
        const formData = new FormData();
        filesToUpload.forEach((file) => formData.append('files', file));

        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (facilityId) params.append('facilityId', facilityId);
        if (facilityName) params.append('facilityName', facilityName);

        const res = await fetch(`/api/hazmat/incidents/upload?${params.toString()}`, {
          method: 'POST',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Yükleme başarısız oldu.');
        }

        const newDocs: HazmatFileAttachment[] = (data.files || []).map((f: any) => ({
          name: f.name,
          url: f.url,
          type: f.type,
          size: f.size,
          uploadedAt: f.uploadedAt || new Date().toISOString(),
        }));

        if (onDocumentsChange) {
          onDocumentsChange([...documents, ...newDocs]);
        }
        toast.success(`${newDocs.length} belge başarıyla yüklendi.`);
      } catch (err: any) {
        toast.error(err.message || 'Belge yüklenirken hata oluştu.');
      } finally {
        setUploading(false);
        if (docInputRef.current) docInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    if (disabled) return;
    const next = [...photos];
    next.splice(index, 1);
    onPhotosChange(next);
  };

  const removeDocument = (index: number) => {
    if (disabled || !onDocumentsChange) return;
    const next = [...documents];
    next.splice(index, 1);
    onDocumentsChange(next);
  };

  const getDocIcon = (type: string, name: string) => {
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    if (type.includes('sheet') || type.includes('excel') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    }
    return <FileCode className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Gizli Inputlar */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files, 'PHOTO')}
        disabled={disabled || uploading}
      />
      <input
        type="file"
        ref={photoInputRef}
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files, 'PHOTO')}
        disabled={disabled || uploading}
      />
      <input
        type="file"
        ref={docInputRef}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files, 'DOCUMENT')}
        disabled={disabled || uploading}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* FOTOĞRAFLAR BÖLÜMÜ */}
        <div className="border border-border/70 rounded-xl p-3.5 bg-muted/15 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Olay Fotoğrafları</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                {photos.length} / {maxPhotos}
              </Badge>
            </div>

            {!disabled && photos.length < maxPhotos && (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploading}
                  className="h-7 px-2 text-[11px] gap-1 shadow-2xs"
                  title="Kamera ile çek"
                >
                  <Camera className="w-3.5 h-3.5 text-primary" />
                  <span className="hidden sm:inline">Kamera</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploading}
                  className="h-7 px-2 text-[11px] gap-1 shadow-2xs"
                  title="Fotoğraf seç"
                >
                  <Upload className="w-3.5 h-3.5 text-primary" />
                  <span>Fotoğraf Ekle</span>
                </Button>
              </div>
            )}
          </div>

          {photos.length === 0 ? (
            <div className="border border-dashed border-border/70 rounded-lg p-4 text-center text-xs text-muted-foreground bg-background/50">
              <p>Henüz fotoğraf yüklenmedi.</p>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                Olay anı, döküntü alanı veya hasarı belgelemek için fotoğraf ekleyin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((item, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-border/70 bg-background shadow-2xs"
                >
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxIndex(idx);
                        setZoomLevel(1);
                        setRotation(0);
                      }}
                      className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                      title="Görüntüle"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="p-1.5 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white transition-colors"
                        title="Sil"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-0.5 text-[9px] text-white truncate">
                    {item.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BELGELER BÖLÜMÜ */}
        <div className="border border-border/70 rounded-xl p-3.5 bg-muted/15 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-foreground">İlgili Belgeler & Raporlar</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                {documents.length} / {maxDocuments}
              </Badge>
            </div>

            {!disabled && documents.length < maxDocuments && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => docInputRef.current?.click()}
                disabled={uploading}
                className="h-7 px-2 text-[11px] gap-1 shadow-2xs"
                title="Belge ekle"
              >
                <Upload className="w-3.5 h-3.5 text-purple-600" />
                <span>Belge Ekle</span>
              </Button>
            )}
          </div>

          {documents.length === 0 ? (
            <div className="border border-dashed border-border/70 rounded-lg p-4 text-center text-xs text-muted-foreground bg-background/50">
              <p>Henüz belge yüklenmedi.</p>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                Kaza tutanağı, inceleme raporu veya SDS belgelerini ekleyebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-background text-xs hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {getDocIcon(doc.type, doc.name)}
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate max-w-[200px]" title={doc.name}>
                        {doc.name}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {formatBytes(doc.size)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="İndir / Görüntüle"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => removeDocument(idx)}
                        className="p-1 rounded hover:bg-rose-50 text-muted-foreground hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors"
                        title="Kaldır"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {uploading && (
        <div className="flex items-center justify-center gap-2 text-xs text-primary font-medium py-1">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Dosyalar optimize edilip yükleniyor...</span>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[10000] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-xs animate-in fade-in-0 duration-150"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Lightbox Üst Kontroller */}
          <div
            className="absolute top-4 inset-x-4 flex items-center justify-between text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs font-medium truncate max-w-md">
              {photos[lightboxIndex].name} ({lightboxIndex + 1} / {photos.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                title="Yakınlaştır"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                title="Uzaklaştır"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                title="Döndür"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <a
                href={photos[lightboxIndex].url}
                download={photos[lightboxIndex].name}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                title="İndir"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white ml-2"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Görsel */}
          <div
            className="max-w-4xl max-h-[80vh] flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIndex].url}
              alt={photos[lightboxIndex].name}
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                transition: 'transform 0.15s ease-out',
              }}
              className="max-w-full max-h-[80vh] object-contain rounded-md shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
