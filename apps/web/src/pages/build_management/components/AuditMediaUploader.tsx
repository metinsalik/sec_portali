import React, { useRef, useState } from 'react';
import {
  Camera,
  FileText,
  Upload,
  X,
  Eye,
  Loader2,
  Paperclip,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { uploadAuditFiles } from '../services/auditApi';
import {
  ImprovementMediaLightbox,
  formatBytes,
} from '../../operations/improvements/ImprovementMediaManager';
import type { FileAttachment } from '../types';

const MAX_PHOTOS = 5;

interface AuditMediaUploaderProps {
  files: FileAttachment[];
  onChange: (nextFiles: FileAttachment[]) => void;
  facilityId?: string;
  facilityName?: string;
  disabled?: boolean;
}

export const AuditMediaUploader: React.FC<AuditMediaUploaderProps> = ({
  files,
  onChange,
  facilityId,
  facilityName,
  disabled = false,
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const photos = files.filter((f) => f.type?.startsWith('image/'));
  const docs = files.filter((f) => !f.type?.startsWith('image/'));
  const remainingPhotoSlots = Math.max(0, MAX_PHOTOS - photos.length);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    if (selected.length === 0) return;

    if (remainingPhotoSlots <= 0) {
      toast.error(`En fazla ${MAX_PHOTOS} fotoğraf yükleyebilirsiniz.`);
      return;
    }

    const toUpload = selected.slice(0, remainingPhotoSlots);
    if (selected.length > remainingPhotoSlots) {
      toast.warning(`Fotoğraf limiti ${MAX_PHOTOS} olduğu için ilk ${remainingPhotoSlots} fotoğraf yükleniyor.`);
    }

    setUploadingPhotos(true);
    try {
      const uploaded = await uploadAuditFiles(toUpload, facilityId, facilityName);
      onChange([...files, ...uploaded]);
      toast.success(`${uploaded.length} fotoğraf WebP olarak sıkıştırılıp yüklendi.`);
    } catch {
      toast.error('Fotoğraf yüklenirken hata oluştu.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    if (selected.length === 0) return;

    setUploadingDocs(true);
    try {
      const uploaded = await uploadAuditFiles(selected, facilityId, facilityName);
      onChange([...files, ...uploaded]);
      toast.success(`${uploaded.length} doküman eklendi.`);
    } catch {
      toast.error('Doküman yüklenirken hata oluştu.');
    } finally {
      setUploadingDocs(false);
    }
  };

  const removeFile = (url: string) => {
    onChange(files.filter((f) => f.url !== url));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Fotoğraflar (Maks. 5 adet, WebP sıkıştırmalı, Lightbox önizlemeli) */}
      <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Fotoğraflar</span>
            <Badge variant="secondary" className="text-[10px] tabular-nums">
              {photos.length} / {MAX_PHOTOS}
            </Badge>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">WebP sıkıştırma</span>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingPhotos || remainingPhotoSlots === 0}
              onClick={() => photoInputRef.current?.click()}
              className="h-7 text-xs gap-1.5"
            >
              {uploadingPhotos ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              Fotoğraf Ekle
            </Button>
          )}
          <input
            ref={photoInputRef}
            type="file"
            multiple
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

        {photos.length === 0 ? (
          <button
            type="button"
            disabled={disabled || uploadingPhotos}
            onClick={() => photoInputRef.current?.click()}
            className="w-full py-5 rounded-md border border-dashed border-input bg-background/60 hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground disabled:opacity-50"
          >
            <Camera className="w-5 h-5 opacity-60" />
            <span className="text-xs font-medium text-foreground">Fotoğraf yükle veya kameradan çek</span>
            <span className="text-[11px]">Otomatik WebP sıkıştırma · Maks. {MAX_PHOTOS} adet</span>
          </button>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {photos.map((photo, idx) => (
              <div
                key={photo.url}
                className="relative group aspect-square rounded-md overflow-hidden border border-border bg-background"
              >
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightboxIndex(idx)}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className="p-1 rounded bg-white/20 hover:bg-white/30 text-white"
                    title="Önizle"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeFile(photo.url)}
                      className="p-1 rounded bg-red-600/90 hover:bg-red-600 text-white"
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

      {/* 2. Dokümanlar (PDF, Word, Excel) */}
      <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Dokümanlar</span>
            <Badge variant="secondary" className="text-[10px] tabular-nums">
              {docs.length}
            </Badge>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingDocs}
              onClick={() => docInputRef.current?.click()}
              className="h-7 text-xs gap-1.5"
            >
              {uploadingDocs ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              Doküman Ekle
            </Button>
          )}
          <input
            ref={docInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            className="hidden"
            onChange={handleDocUpload}
          />
        </div>

        {docs.length === 0 ? (
          <button
            type="button"
            disabled={disabled || uploadingDocs}
            onClick={() => docInputRef.current?.click()}
            className="w-full py-5 rounded-md border border-dashed border-input bg-background/60 hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground disabled:opacity-50"
          >
            <FileText className="w-5 h-5 opacity-60" />
            <span className="text-xs font-medium text-foreground">PDF, Excel veya Word ekle</span>
            <span className="text-[11px]">Rapor, tutanak veya ölçüm belgesi (Maks. 15MB)</span>
          </button>
        ) : (
          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
            {docs.map((doc) => (
              <div
                key={doc.url}
                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md border border-border bg-background text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate font-medium text-foreground">{doc.name}</span>
                  {doc.size ? (
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      ({formatBytes(doc.size)})
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Aç / İndir"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeFile(doc.url)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
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

      {/* Yüksek Kaliteli Lightbox Önizleme */}
      {lightboxIndex !== null && photos.length > 0 && (
        <ImprovementMediaLightbox
          photos={photos.map((p) => ({
            url: p.url,
            name: p.name,
            type: p.type,
            size: p.size,
          }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
};
