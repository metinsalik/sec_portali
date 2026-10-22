import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Download,
  Info,
  RefreshCw,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeReportInfo?: {
    fileName?: string;
    uploadedAt?: string;
    totalFacilities?: number;
    totalItems?: number;
    overallSecurityReportRate?: number;
  };
}

export default function FieldReportUploadModal({
  isOpen,
  onClose,
  activeReportInfo
}: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Dosya Yükleme Mutasyonu
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/fm200/field-report/upload', formData);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Dosya yükleme başarısız oldu');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Saha raporu Exceli başarıyla sisteme aktarıldı ve konsolide edildi.');
      queryClient.invalidateQueries({ queryKey: ['fm200HospitalMatrix'] });
      queryClient.invalidateQueries({ queryKey: ['fm200FieldReport'] });
      queryClient.invalidateQueries({ queryKey: ['fm200FieldFacilityDetail'] });
      setSelectedFile(null);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Excel dosyası işlenirken bir hata oluştu');
    }
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
      } else {
        toast.error('Lütfen sadece .xlsx veya .xls uzantılı bir Excel dosyası seçiniz.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Mevcut Excel'i İndir
  const handleDownloadActiveReport = () => {
    window.open('/api/fm200/field-report/download', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !uploadMutation.isPending && onClose()}>
      <DialogContent className="max-w-xl! w-[92vw]! p-0 overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 dark:from-slate-900 dark:to-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Saha Durum Raporu Exceli Yükleme
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Canlı ortamda hastanelerden gelen en güncel saha iş ve uygunsuzluk listesini sisteme aktarın.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Bilgilendirme Notu */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/40 text-blue-950 dark:text-blue-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#0051d5] dark:text-blue-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Otomatik Eşleme & Hesaplama Kuralları:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pl-1 leading-relaxed">
              <li><b>FM-200 Saha İş Listesi</b>: Tesis bazlı 2000+ saha aksiyonunu ve mahallerini okur.</li>
              <li><b>Güvenlik Raporu Katsayısı</b>: <i>Tamamlandı</i> = 1.0 katsayı, <i>Devam Ediyor</i> = 0.5 katsayı ile hesaplanır.</li>
              <li><b>Akıllı Kavram Eşleme</b>: 8 ana Kategori ve 8 ana Risk kavramı otomatik eşlenir.</li>
              <li><b>Hastane İletim Notları</b>: İletildi/Levent Erol gibi saha notları tesis bazında saklanır.</li>
            </ul>
          </div>

          {/* Sürükle Bırak / Dosya Seçim Alanı */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              dragActive
                ? 'border-[#0051d5] bg-blue-50/60 dark:bg-blue-950/40 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <FileCheck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedFile.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Boyut: {(selectedFile.size / 1024).toFixed(1)} KB · Yüklemeye hazır
                  </p>
                </div>
                <span className="text-[11px] font-bold text-[#0051d5] hover:underline">
                  Dosyayı Değiştir
                </span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-[#0051d5] flex items-center justify-center">
                  <Upload className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Excel Dosyasını Buraya Sürükleyin veya Seçin
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    FM200_Saha_Is_Listesi_Raporu_*.xlsx dosyası (.xlsx, .xls)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-bold border-slate-200"
                >
                  Bilgisayardan Dosya Seç
                </Button>
              </>
            )}
          </div>

          {/* Aktif Sistem Durumu Bilgi Çubuğu */}
          {activeReportInfo && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Sistemde Yüklü Rapor:
                </span>
                <span className="text-[11px] text-slate-400">
                  {activeReportInfo.fileName || 'FM200_Saha_Is_Listesi_Raporu_2026-10-06_V1.xlsx'} · {activeReportInfo.totalFacilities || 31} Tesis ({activeReportInfo.totalItems || 2009} Kalem)
                </span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDownloadActiveReport}
                className="h-8 text-xs font-bold text-emerald-600 hover:bg-emerald-50"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                İndir
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between sm:justify-between w-full">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={uploadMutation.isPending}
            className="text-xs font-bold"
          >
            İptal
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => selectedFile && uploadMutation.mutate(selectedFile)}
            disabled={!selectedFile || uploadMutation.isPending}
            className="text-xs font-bold bg-[#0051d5] hover:bg-[#0042b0] text-white h-9 px-4 shadow-sm"
          >
            {uploadMutation.isPending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                İşleniyor ve Konsolide Ediliyor...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Sisteme Yükle ve Canlıya Al
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
