import React, { useState, useRef } from 'react';
import { 
  Camera, Upload, Image as ImageIcon, Trash2, Maximize2, 
  RotateCw, ZoomIn, ZoomOut, Download, AlertCircle, Check, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { type ImprovementPhoto, MAX_PHOTOS_PER_RECORD } from '../types';
import { compressImage, formatBytes } from '@/utils/imageCompression';
import { useImprovementMutations } from '../hooks/useImprovementsQueries';

interface ImprovementPhotoManagerProps {
  recordId: string;
  photos?: ImprovementPhoto[];
  onPhotosChange?: (photos: ImprovementPhoto[]) => void;
  readOnly?: boolean;
  maxPhotos?: number;
}

export const ImprovementPhotoManager: React.FC<ImprovementPhotoManagerProps> = ({
  recordId,
  photos = [],
  onPhotosChange,
  readOnly = false,
  maxPhotos = MAX_PHOTOS_PER_RECORD,
}) => {
  const { uploadPhotosMutation, deletePhotoMutation } = useImprovementMutations();

  const [isDragging, setIsDragging] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);

  // Lightbox state
  const [selectedPhoto, setSelectedPhoto] = useState<ImprovementPhoto | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // File Inputs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const remainingSlots = Math.max(0, maxPhotos - photos.length);
  const isLimitReached = remainingSlots <= 0;

  // Dosyaları işleme ve tarayıcıda akıllı sıkıştırma
  const handleFiles = async (rawFiles: FileList | File[]) => {
    if (readOnly || isLimitReached) return;

    const fileArray = Array.from(rawFiles).filter((f) =>
      f.type.startsWith('image/')
    );

    if (fileArray.length === 0) {
      toast.error('Lütfen geçerli görsel dosyaları seçin (JPEG, PNG, WebP).');
      return;
    }

    if (fileArray.length > remainingSlots) {
      toast.error(
        `En fazla ${maxPhotos} fotoğraf eklenebilir. Yalnızca ${remainingSlots} adet fotoğraf seçildi.`
      );
    }

    const filesToProcess = fileArray.slice(0, remainingSlots);

    try {
      setCompressing(true);
      setCompressionInfo('Görseller sıkıştırılıyor...');

      let totalOriginalSize = 0;
      let totalCompressedSize = 0;
      const compressedFiles: File[] = [];

      for (const file of filesToProcess) {
        totalOriginalSize += file.size;
        const res = await compressImage(file);
        totalCompressedSize += res.compressedSize;
        compressedFiles.push(res.compressedFile);
      }

      const savings = Math.max(
        0,
        Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100)
      );

      const infoMsg = `${formatBytes(totalOriginalSize)} → ${formatBytes(totalCompressedSize)} (%${savings} tasarruf)`;
      setCompressionInfo(infoMsg);

      // Sunucuya yükle
      const updated = await uploadPhotosMutation.mutateAsync({
        recordId,
        files: compressedFiles,
      });

      if (onPhotosChange) {
        onPhotosChange(updated);
      }
    } catch (err: any) {
      console.error('Photo upload error:', err);
      toast.error(err.message || 'Fotoğraf yüklenemedi.');
    } finally {
      setCompressing(false);
      setTimeout(() => setCompressionInfo(null), 4000);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  // Sürükle - Bırak Olayları
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly && !isLimitReached) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!readOnly && !isLimitReached && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Fotoğraf Silme
  const handleDeletePhoto = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    if (readOnly) return;

    if (!confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const updated = await deletePhotoMutation.mutateAsync({
        recordId,
        photoId,
      });
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto(null);
      }
      if (onPhotosChange) {
        onPhotosChange(updated);
      }
    } catch (err: any) {
      toast.error(err.message || 'Fotoğraf silinemedi.');
    }
  };

  return (
    <div className="space-y-3">
      {/* Gizli File Inputlar */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Üst Başlık & Fotoğraf Sayacı */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Saha Tespit Fotoğrafları
          </span>
          <Badge
            variant={isLimitReached ? 'default' : 'secondary'}
            className={`text-[10px] px-2 py-0.5 ${
              isLimitReached ? 'bg-amber-600 text-white' : ''
            }`}
          >
            {photos.length} / {maxPhotos} Fotoğraf
          </Badge>
        </div>

        {compressionInfo && (
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            {compressionInfo}
          </span>
        )}
      </div>

      {/* Fotoğraf Küçük Resimler Galerisi (Thumbnails) */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {photos.map((photo, index) => (
            <div
              key={photo.id || index}
              onClick={() => {
                setSelectedPhoto(photo);
                setZoomLevel(1);
                setRotation(0);
              }}
              className="group relative aspect-square rounded-lg border border-border bg-muted/30 overflow-hidden cursor-pointer hover:border-primary transition-all duration-200 shadow-sm"
            >
              <img
                src={photo.url}
                alt={photo.name || `Fotoğraf ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />

              {/* Karartma Overlay ve Büyütme Butonu */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
                  title="Tam Ekran İncele"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </Button>

                {!readOnly && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => handleDeletePhoto(e, photo.id)}
                    className="h-7 w-7 text-destructive hover:bg-destructive/20 rounded-full"
                    title="Fotoğrafı Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {/* Boyut Rozeti */}
              <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/60 text-[9px] text-white font-mono pointer-events-none">
                {formatBytes(photo.size)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Yükleme ve Sürükle - Bırak Alanı (Maks. 5 Dolmadıysa Göster) */}
      {!readOnly && !isLimitReached && (
        <Card
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-4 transition-all duration-200 text-center ${
            isDragging
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50 bg-card'
          }`}
        >
          {compressing ? (
            <div className="flex flex-col items-center justify-center py-3 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-medium">
                Görseller sıkıştırılıyor ve yükleniyor...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground">
                  Fotoğrafları buraya sürükleyip bırakın
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  veya bilgisayarınızdan / telefonunuzdan ekleyin (En fazla {remainingSlots} adet daha)
                </p>
              </div>

              {/* Masaüstü & Mobil Aksiyon Butonları */}
              <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => galleryInputRef.current?.click()}
                  className="h-8 text-xs gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Dosya Seç</span>
                </Button>

                {/* Mobilde Kamerayı Doğrudan Açar */}
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  className="h-8 text-xs gap-1.5 shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Kamera ile Çek</span>
                </Button>
              </div>

              <div className="text-[10px] text-muted-foreground/75 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-muted-foreground" />
                <span>Fotoğraflar tarayıcıda otomatik WebP formatında sıkıştırılarak yüklenir.</span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 5 Fotoğraf Doldu Uyarısı */}
      {!readOnly && isLimitReached && (
        <div className="p-2.5 rounded-lg bg-muted/60 border border-border text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Check className="w-4 h-4 text-primary" />
          <span>Bu madde için maksimum 5 fotoğraf yüklendi. Yeni fotoğraf eklemek için mevcutlardan birini siliniz.</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* LIGHTBOX MODAL (Tam Ekran İnceleme, Büyütme, Döndürme, İndirme)    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-md border rounded-2xl">
          <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
            <div className="min-w-0 pr-4">
              <DialogTitle className="text-sm font-semibold truncate">
                {selectedPhoto?.name || 'Fotoğraf Önizleme'}
              </DialogTitle>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {selectedPhoto?.size ? formatBytes(selectedPhoto.size) : ''} ·{' '}
                {selectedPhoto?.uploadedAt
                  ? new Date(selectedPhoto.uploadedAt).toLocaleString('tr-TR')
                  : ''}
              </p>
            </div>

            {/* Lightbox Araçları */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                title="Uzaklaştır"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                title="Yakınlaştır"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                title="Döndür"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </Button>
              {selectedPhoto && (
                <a
                  href={selectedPhoto.url}
                  download={selectedPhoto.name || 'foto.webp'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-input bg-background hover:bg-accent text-foreground"
                  title="İndir"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </DialogHeader>

          {/* Görsel Görüntüleme Sahnesi */}
          <div className="p-4 flex items-center justify-center bg-black/5 dark:bg-black/40 min-h-[420px] max-h-[75vh] overflow-hidden">
            {selectedPhoto && (
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.name}
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-out',
                }}
                className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
