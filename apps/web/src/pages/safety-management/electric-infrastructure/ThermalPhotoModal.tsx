import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Trash2, X, Plus, AlertCircle, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { thermalInspectionService, type ThermalInspectionItem } from '@/services/thermal-inspection.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: ThermalInspectionItem | null;
  facilityId: string;
  onPhotosUpdated: (updatedItem: ThermalInspectionItem) => void;
}

export const ThermalPhotoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  item,
  facilityId,
  onPhotosUpdated
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  const photos = item?.photoUrls || [];
  const remainingSlots = 5 - photos.length;

  // Handle clipboard paste (Ctrl+V / Cmd+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      const imageFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        uploadFiles(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, item, remainingSlots, facilityId]);

  const uploadFiles = async (files: File[]) => {
    if (!item || !facilityId) return;

    if (files.length === 0) return;

    if (files.length > remainingSlots) {
      toast.error(`En fazla 5 fotoğraf ekleyebilirsiniz. Yalnızca ${remainingSlots} fotoğraf hakkınız kaldı.`);
      return;
    }

    setIsUploading(true);
    try {
      const res = await thermalInspectionService.uploadPhotos(item.id, facilityId, files);
      toast.success(res.message || 'Fotoğraflar yüklendi.');
      onPhotosUpdated(res.item);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || 'Fotoğraf yüklenemedi.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      uploadFiles(fileList);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (fileList.length === 0) {
        toast.error('Lütfen sadece resim dosyası bırakın.');
        return;
      }
      uploadFiles(fileList);
    }
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!item) return;
    if (!confirm('Bu görseli silmek istediğinize emin misiniz?')) return;

    try {
      const res = await thermalInspectionService.removePhoto(item.id, photoUrl);
      toast.success('Görsel silindi.');
      const updatedItem = { ...item, photoUrls: res.photoUrls };
      onPhotosUpdated(updatedItem);
      if (selectedPreview === photoUrl) {
        setSelectedPreview(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Görsel silinemedi.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border dark:border-slate-800" ref={modalContainerRef}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Termal Kamera Görselleri
              </DialogTitle>
            </div>
            <Badge variant="outline" className={`${photos.length >= 5 ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30' : 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'}`}>
              {photos.length} / 5 Fotoğraf
            </Badge>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            {item ? `${item.panelName} ${item.floorSection ? `(${item.floorSection})` : ''} panosu için termal ve mekanik görseller.` : ''}
          </DialogDescription>
        </DialogHeader>

        {/* Action Buttons & Drop Area */}
        {remainingSlots > 0 ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
              dragOver
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                {/* Mobile Camera Direct Button */}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  Kamera ile Çek (Mobil)
                </Button>

                {/* Desktop Upload Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-1.5 border-slate-300 dark:border-slate-700"
                >
                  <Upload className="w-4 h-4" />
                  Dosya Seç
                </Button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Görselleri buraya <strong>sürükleyip bırakabilir</strong> veya ekran görüntüsü alıp <strong>Ctrl+V / Cmd+V</strong> ile doğrudan yapıştırabilirsiniz.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Bu satır için maksimum limit olan 5 fotoğrafa ulaşıldı. Yeni eklemek için mevcutlardan birini siliniz.
          </div>
        )}

        {/* Photos Grid */}
        <div className="mt-2">
          {photos.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Henüz görsel eklenmedi.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {photos.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square shadow-sm"
                >
                  <img
                    src={url}
                    alt={`Görsel ${idx + 1}`}
                    onClick={() => setSelectedPreview(url)}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="w-6 h-6 rounded-full shadow"
                      onClick={() => handleDeletePhoto(url)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                    #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox / Preview Modal */}
        {selectedPreview && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedPreview(null)}
          >
            <div className="relative max-w-3xl max-h-[85vh] bg-slate-900 rounded-lg overflow-hidden border border-slate-700 p-1">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-white bg-black/50 hover:bg-black/80 rounded-full"
                onClick={() => setSelectedPreview(null)}
              >
                <X className="w-5 h-5" />
              </Button>
              <img
                src={selectedPreview}
                alt="Büyük Görünüm"
                className="max-h-[80vh] w-auto mx-auto object-contain rounded"
              />
            </div>
          </div>
        )}

        <DialogFooter className="mt-2 border-t pt-3 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
