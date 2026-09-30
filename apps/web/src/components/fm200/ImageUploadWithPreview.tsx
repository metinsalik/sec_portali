import React, { useState, useRef } from 'react';
import { compressImage, formatFileSize } from '@/utils/imageCompressor';
import { Upload, X, Eye, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface PhotoItem {
  url: string;
  name: string;
  size?: number;
  type?: string;
  uploadedAt?: string;
}

interface ImageUploadWithPreviewProps {
  facilityId: string;
  facilityName?: string;
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
  maxCount?: number;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export const ImageUploadWithPreview: React.FC<ImageUploadWithPreviewProps> = ({
  facilityId,
  facilityName = '',
  photos = [],
  onChange,
  maxCount = 10,
  label = 'Fotoğraf ve Kanıt Yükleme',
  description = 'Görseller yüklenirken otomatik olarak optimize edilir ve sıkıştırılır.',
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!facilityId) {
      toast.error('Lütfen önce bir tesis seçin');
      return;
    }

    if (photos.length + files.length > maxCount) {
      toast.error(`En fazla ${maxCount} adet görsel yükleyebilirsiniz`);
      return;
    }

    setIsUploading(true);
    const compressedFiles: File[] = [];

    try {
      // 1. İstemci tarafında görselleri sıkıştır
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const res = await compressImage(file, { maxWidth: 1600, quality: 0.82 });
          compressedFiles.push(res.file);
        } else {
          // PDF veya belge ise olduğu gibi aktar
          compressedFiles.push(file);
        }
      }

      // 2. FormData hazırla ve backend API'ye gönder
      const formData = new FormData();
      compressedFiles.forEach(f => formData.append('files', f));

      const facNameParam = encodeURIComponent(facilityName || '');
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/fm200/upload?facilityId=${facilityId}&facilityName=${facNameParam}`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Yükleme başarısız');
      }

      const uploadedList = await response.json();
      const newPhotos: PhotoItem[] = [
        ...photos,
        ...uploadedList.map((item: any) => ({
          url: item.url,
          name: item.name,
          size: item.size,
          type: item.type,
          uploadedAt: item.uploadedAt
        }))
      ];

      onChange(newPhotos);
      toast.success(`${uploadedList.length} adet dosya sıkıştırılarak yüklendi`);
    } catch (error: any) {
      console.error('Fotoğraf yükleme hatası:', error);
      toast.error(error.message || 'Fotoğraf yüklenirken hata oluştu');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-primary" />
            {label}
          </label>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
        <span className="text-xs font-medium text-slate-400">
          {photos.length} / {maxCount}
        </span>
      </div>

      {/* Grid: Yüklenmiş Fotoğraflar ve Önizlemeler */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {photos.map((photo, idx) => {
          const isImage = !photo.url.endsWith('.pdf') && photo.type !== 'application/pdf';
          return (
            <div
              key={idx}
              className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 overflow-hidden aspect-square flex flex-col items-center justify-center p-1.5 shadow-sm transition-all hover:border-primary/50"
            >
              {isImage ? (
                <img
                  src={photo.url}
                  alt={photo.name || `Fotoğraf ${idx + 1}`}
                  className="w-full h-full object-cover rounded-lg cursor-pointer transition-transform group-hover:scale-105"
                  onClick={() => setPreviewPhoto(photo.url)}
                />
              ) : (
                <div
                  className="flex flex-col items-center justify-center p-2 text-center cursor-pointer"
                  onClick={() => window.open(photo.url, '_blank')}
                >
                  <span className="material-symbols-outlined text-[36px] text-red-500 mb-1">picture_as_pdf</span>
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                    {photo.name}
                  </span>
                </div>
              )}

              {/* Hover Aksiyonları */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl backdrop-blur-[2px]">
                {isImage && (
                  <button
                    type="button"
                    onClick={() => setPreviewPhoto(photo.url)}
                    className="p-1.5 bg-white/90 text-slate-800 hover:bg-white rounded-full shadow-md transition-transform hover:scale-110"
                    title="Büyüt / Önizle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 bg-red-600/90 text-white hover:bg-red-600 rounded-full shadow-md transition-transform hover:scale-110"
                    title="Sil"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {photo.size && (
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white backdrop-blur-sm">
                  {formatFileSize(photo.size)}
                </div>
              )}
            </div>
          );
        })}

        {/* Yükleme Buton Kutusu */}
        {!disabled && photos.length < maxCount && (
          <label
            className={`border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary/80 dark:hover:border-primary/80 rounded-xl aspect-square flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors bg-white dark:bg-slate-900/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 ${
              isUploading ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading || disabled}
            />
            {isUploading ? (
              <>
                <Loader2 className="w-6 h-6 text-primary animate-spin mb-1.5" />
                <span className="text-[11px] font-medium text-primary">Sıkıştırılıyor...</span>
              </>
            ) : (
              <>
                <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-primary mb-1.5">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Fotoğraf Ekle</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Sıkıştırılarak Yüklenir</span>
              </>
            )}
          </label>
        )}
      </div>

      {/* Büyük Görsel Modal Önizlemesi (Lightbox) */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewPhoto}
              alt="Büyük Önizleme"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl border border-white/10"
            />
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-3 -right-3 p-2 bg-slate-900 text-white hover:bg-slate-800 rounded-full border border-slate-700 shadow-xl transition-transform hover:scale-110"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
