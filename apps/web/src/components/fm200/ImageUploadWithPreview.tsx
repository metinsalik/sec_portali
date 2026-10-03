import React, { useState, useRef, useEffect } from 'react';
import { compressImage, formatFileSize } from '@/utils/imageCompressor';
import { Upload, X, Eye, Image as ImageIcon, Camera, Loader2, Paperclip, ClipboardPaste, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';

export interface PhotoItem {
  url: string;
  name: string;
  size?: number;
  type?: string;
  uploadedAt?: string;
}

interface ImageUploadWithPreviewProps {
  facilityId?: string;
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
  description = 'Görseller yüklenirken otomatik olarak sıkıştırılır. Kameradan çekebilir veya panodan (Ctrl+V) yapıştırabilirsiniz.',
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Dosyaları Sıkıştır ve Yükle
  const processAndUploadFiles = async (rawFiles: File[]) => {
    if (!rawFiles || rawFiles.length === 0) return;

    const effectiveFacilityId = facilityId || localStorage.getItem('activeFacilityId') || '';
    if (!effectiveFacilityId || effectiveFacilityId === 'all') {
      toast.error('Lütfen sol üst menüden geçerli bir tesis seçin');
      return;
    }

    if (photos.length + rawFiles.length > maxCount) {
      toast.error(`En fazla ${maxCount} adet görsel yükleyebilirsiniz`);
      return;
    }

    setIsUploading(true);
    const compressedFiles: File[] = [];

    try {
      // 1. İstemci tarafında görselleri optimize et (Maks 1600px, 0.82 kalite)
      for (let i = 0; i < rawFiles.length; i++) {
        const file = rawFiles[i];
        if (file.type.startsWith('image/')) {
          const res = await compressImage(file, { maxWidth: 1600, quality: 0.82 });
          compressedFiles.push(res.file);
        } else {
          compressedFiles.push(file);
        }
      }

      // 2. FormData ile backend API'ye gönder (Dinamik uploads/fm200/<facilityName>/ klasörüne)
      const formData = new FormData();
      compressedFiles.forEach(f => formData.append('files', f));

      const facNameParam = encodeURIComponent(facilityName || '');
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/fm200/upload?facilityId=${effectiveFacilityId}&facilityName=${facNameParam}`, {
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
      toast.success(`${uploadedList.length} görsel sıkıştırılarak yüklendi`);
    } catch (error: any) {
      console.error('Fotoğraf yükleme hatası:', error);
      toast.error(error.message || 'Fotoğraf yüklenirken hata oluştu');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processAndUploadFiles(Array.from(e.target.files));
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processAndUploadFiles(Array.from(e.target.files));
    }
  };

  // Panodan Görsel Yapıştırma (CTRL+V / CMD+V)
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (disabled || isUploading) return;
    const clipItems = e.clipboardData?.items;
    if (!clipItems) return;

    const files: File[] = [];
    for (let i = 0; i < clipItems.length; i++) {
      if (clipItems[i].type.indexOf('image') !== -1) {
        const file = clipItems[i].getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      processAndUploadFiles(files);
      toast.info('Panodan görsel yapıştırıldı, yükleniyor...');
    }
  };

  // Sürükle Bırak (Drag and Drop)
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled || isUploading) return;
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      f => f.type.startsWith('image/') || f.type === 'application/pdf'
    );
    if (droppedFiles.length > 0) {
      processAndUploadFiles(droppedFiles);
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
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-primary" />
            {label}
          </label>
          {description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          {photos.length} / {maxCount}
        </span>
      </div>

      {/* Sürükle-Bırak, Panodan Yapıştırma ve Mobil Aksiyon Kutusu */}
      {!disabled && photos.length < maxCount && (
        <div
          ref={dropZoneRef}
          tabIndex={0}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary/80 dark:hover:border-primary/80 rounded-2xl p-4 bg-slate-50/60 dark:bg-slate-900/40 text-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <div className="flex flex-col items-center justify-center py-1">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary flex items-center justify-center mb-2 shadow-xs">
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Görselleri sürükleyip bırakın veya panodan yapıştırın (<kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px] font-mono">Ctrl+V</kbd>)
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Otomatik olarak sıkıştırılır ve ilgili tesis klasörüne kaydedilir
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            {/* 1. Mobil Kamera Butonu (Doğrudan Cihaz Kamerasını Açar) */}
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors">
              <Camera className="w-4 h-4" />
              <span>Fotoğraf Çek (Kamera)</span>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCameraCapture}
                disabled={isUploading || disabled}
              />
            </label>

            {/* 2. Galeri / Dosya Seç Butonu */}
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0051d5] hover:bg-[#0042b0] text-white font-semibold text-xs shadow-xs transition-colors">
              <Upload className="w-4 h-4" />
              <span>Galeriden Seç</span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isUploading || disabled}
              />
            </label>
          </div>
        </div>
      )}

      {/* Grid: Yüklenmiş Fotoğraflar ve Önizlemeler */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
          {photos.map((photo, idx) => {
            const isImage = !photo.url.endsWith('.pdf') && photo.type !== 'application/pdf';
            return (
              <div
                key={idx}
                className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden aspect-square flex flex-col items-center justify-center p-1 shadow-xs transition-all hover:border-primary/50"
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
                    <Paperclip className="w-8 h-8 text-red-500 mb-1" />
                    <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                      {photo.name}
                    </span>
                  </div>
                )}

                {/* Hover Aksiyonları */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 rounded-xl backdrop-blur-[2px]">
                  {isImage && (
                    <button
                      type="button"
                      onClick={() => setPreviewPhoto(photo.url)}
                      className="p-1.5 bg-white/90 text-slate-800 hover:bg-white rounded-full shadow-md transition-transform hover:scale-110"
                      title="Önizle"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="p-1.5 bg-red-600/90 text-white hover:bg-red-600 rounded-full shadow-md transition-transform hover:scale-110"
                      title="Sil"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {photo.size && (
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white backdrop-blur-sm">
                    {formatFileSize(photo.size)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
