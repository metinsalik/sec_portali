import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { ImageUploadWithPreview, type PhotoItem } from '@/components/fm200/ImageUploadWithPreview';
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  FileCheck,
  Building2,
  Flame,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Send,
  Eye,
  FileText,
  FileSpreadsheet,
  Calendar,
  Wrench,
  Layers,
  MapPin,
  ExternalLink,
  ChevronDown,
  Camera,
  ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';

export default function Fm200WorkOrdersPage() {
  const queryClient = useQueryClient();
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(() => {
    return localStorage.getItem('activeFacilityId') || 'all';
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [laneFilter, setLaneFilter] = useState<string>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Termin Tarihi & Detay Düzenleme Modalı
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [editDueDate, setEditDueDate] = useState<string>('');
  const [editResponsible, setEditResponsible] = useState<string>('Teknik');
  const [editTitle, setEditTitle] = useState<string>('');

  // Kanıt Ekleme & Uygulandı Modalı
  const [actionJob, setActionJob] = useState<any | null>(null);
  const [actionEvidences, setActionEvidences] = useState<PhotoItem[]>([]);
  const [actionCompanyTrackNo, setActionCompanyTrackNo] = useState('');

  // Doğrulama & Onay Modalı (Teknik Sorumlu)
  const [verifyJob, setVerifyJob] = useState<any | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [createPhysicalFollowUp, setCreatePhysicalFollowUp] = useState(false);
  const [followUpTitle, setFollowUpTitle] = useState('');

  // Tesisleri Çek
  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Tesisler alınamadı');
      return res.json();
    }
  });

  // İş Emirlerini Çek
  const { data: workOrders = [], isLoading } = useQuery<any[]>({
    queryKey: ['fm200WorkOrders', selectedFacilityId, statusFilter, laneFilter, responsibleFilter],
    queryFn: async () => {
      let url = `/fm200/work-orders?facilityId=${selectedFacilityId}&status=${statusFilter}&trackLane=${laneFilter}&responsible=${responsibleFilter}`;
      const res = await api.get(url);
      if (!res.ok) throw new Error('İş emirleri alınamadı');
      return res.json();
    }
  });

  // Termin Tarihi & Sorumlu Güncelleme Mutation
  const updateJobMutation = useMutation({
    mutationFn: async () => {
      if (!editingJob) return;
      const res = await api.put(`/fm200/work-orders/${editingJob.id}`, {
        dueDate: editDueDate || null,
        responsible: editResponsible,
        title: editTitle
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'İş güncellenemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fm200WorkOrders'] });
      toast.success('İş emri termin tarihi ve bilgileri güncellendi.');
      setEditingJob(null);
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Saha Aksiyonu (Uygulandı Yap)
  const submitActionMutation = useMutation({
    mutationFn: async () => {
      if (!actionJob) return;
      const res = await api.post(`/fm200/work-orders/${actionJob.id}/action`, {
        companyTrackNo: actionCompanyTrackNo,
        evidences: actionEvidences.map(e => ({
          fileType: 'Foto_Sonrasi',
          fileUrl: e.url,
          fileName: e.name
        }))
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'İşlem kaydedilemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fm200WorkOrders'] });
      queryClient.invalidateQueries({ queryKey: ['fm200Locations'] });
      toast.success('İş kaydı kanıtlarla birlikte "Uygulandı" olarak işaretlendi.');
      setActionJob(null);
      setActionEvidences([]);
      setActionCompanyTrackNo('');
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Doğrulama & Onay (Tamamlandı veya Revize)
  const verifyMutation = useMutation({
    mutationFn: async (decision: 'Tamamlandi' | 'Revize_Gerekli') => {
      if (!verifyJob) return;
      const res = await api.post(`/fm200/work-orders/${verifyJob.id}/verify`, {
        decision,
        revisionNote,
        createPhysicalFollowUp,
        followUpTitle
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Doğrulama başarısız');
      }
      return res.json();
    },
    onSuccess: (_, decision) => {
      queryClient.invalidateQueries({ queryKey: ['fm200WorkOrders'] });
      queryClient.invalidateQueries({ queryKey: ['fm200Locations'] });
      if (decision === 'Tamamlandi') {
        toast.success('İş emri teknik sorumlu tarafından onaylanarak kapatıldı.');
      } else {
        toast.warning('İş emri revizyon notuyla birlikte sahaya geri gönderildi.');
      }
      setVerifyJob(null);
      setRevisionNote('');
      setCreatePhysicalFollowUp(false);
      setFollowUpTitle('');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const filteredOrders = workOrders.filter(w => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      w.title?.toLowerCase().includes(q) ||
      w.sourceCode?.toLowerCase().includes(q) ||
      w.questionText?.toLowerCase().includes(q) ||
      w.customNote?.toLowerCase().includes(q) ||
      w.location?.systemUid?.toLowerCase().includes(q) ||
      w.location?.roomType?.toLowerCase().includes(q) ||
      w.location?.floor?.toLowerCase().includes(q) ||
      w.location?.block?.toLowerCase().includes(q) ||
      w.location?.customRoomName?.toLowerCase().includes(q) ||
      w.location?.facility?.name?.toLowerCase().includes(q)
    );
  });

  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Görseli Base64'e çeviren yardımcı fonksiyon
  const urlToBase64 = async (url: string): Promise<{ base64: string; extension: 'jpeg' | 'png' } | null> => {
    try {
      // Eğer görsel göreceli path ise origin ekle
      const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
      const response = await fetch(fullUrl);
      if (!response.ok) return null;
      const blob = await response.blob();
      const ext = blob.type.includes('png') ? 'png' : 'jpeg';
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve({ base64: base64Data, extension: ext });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  // EXCEL RAPORU OLUŞTURUCU (Görselleri Hücre İçine Gömülü, Kurumsal Format)
  const handleExportExcel = async () => {
    if (filteredOrders.length === 0) {
      toast.error('Dışa aktarılacak iş emri bulunmuyor.');
      return;
    }

    setIsExportingExcel(true);
    const toastId = toast.loading('Excel raporu hazırlanıyor ve saha fotoğrafları gömülüyor...');

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'SEC Portalı - FM-200 Denetim Sistemi';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('FM-200 Saha İş Listesi', {
        views: [{ showGridLines: true }],
        pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
      });

      // 1. ÜST BAŞLIK (BANNER / HEADER)
      worksheet.mergeCells('A1:N1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'FM-200 GAZLI SÖNDÜRME SİSTEMİ - SAHA UYGUNSUZLUK & İŞ LİSTESİ';
      titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF004085' } // Koyu Lacivert
      };
      worksheet.getRow(1).height = 36;

      // 2. BİLGİLENDİRME SATIRI
      worksheet.mergeCells('A2:N2');
      const infoCell = worksheet.getCell('A2');
      const facilityTitle = activeFac?.name || 'Tüm Tesisler';
      infoCell.value = `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')} | Tesis: ${facilityTitle} | Toplam Uygunsuzluk / İş Sayısı: ${filteredOrders.length} Adet`;
      infoCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF333333' } };
      infoCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      infoCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEBF3FB' }
      };
      worksheet.getRow(2).height = 22;

      // 3. TABLO SÜTUN BAŞLIKLARI
      const headers = [
        'Sıra',
        'İş Kodu',
        'Tesis',
        'Konum (Bina / Blok / Kat)',
        'Pano / Mahal Türü',
        'Pano / Mahal Adı (UID)',
        'Denetim Kriteri & Sorusu',
        'Seçilen Hazır Kalıp Tespitler',
        'Ek Saha Açıklaması / Not',
        'Sorumlu Ekip',
        'Termin Tarihi',
        'Durum',
        'Saha Görseli (Fotoğraf)',
        'Kayıt Tarihi'
      ];

      const headerRow = worksheet.getRow(3);
      headerRow.height = 30;

      headers.forEach((h, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = h;
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E293B' } // Koyu Slate Gri
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'medium', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
      });

      // Sütun Genişlikleri
      worksheet.columns = [
        { width: 6 },  // A: Sıra
        { width: 12 }, // B: İş Kodu
        { width: 22 }, // C: Tesis
        { width: 26 }, // D: Konum (Bina / Blok / Kat)
        { width: 18 }, // E: Pano / Mahal Türü
        { width: 24 }, // F: Pano / Mahal Adı
        { width: 36 }, // G: Kriter & Soru
        { width: 36 }, // H: Kalıp Tespitler
        { width: 32 }, // I: Saha Notu
        { width: 18 }, // J: Sorumlu
        { width: 15 }, // K: Termin Tarihi
        { width: 16 }, // L: Durum
        { width: 28 }, // M: Saha Görseli (Fotoğraf alanı)
        { width: 14 }  // N: Kayıt Tarihi
      ];

      // 4. VERİ SATIRLARI & GÖRSEL GÖMME
      let currentRowNumber = 4;

      for (let i = 0; i < filteredOrders.length; i++) {
        const job = filteredOrders[i];
        const row = worksheet.getRow(currentRowNumber);

        // Kalıp cevaplar listesi
        const templatesText = Array.isArray(job.templates) && job.templates.length > 0
          ? job.templates.map((t: string) => `• ${t}`).join('\n')
          : '-';

        // Termin tarihi
        const formattedDueDate = job.dueDate
          ? new Date(job.dueDate).toLocaleDateString('tr-TR')
          : 'Belirlenmedi';

        // Durum
        const statusTr = job.status === 'Tamamlandi'
          ? 'Tamamlandı'
          : job.status === 'Uygulandi'
          ? 'Uygulandı (Onay Bekliyor)'
          : job.status === 'Revize_Gerekli'
          ? 'Revize Gerekli'
          : 'Planlandı';

        // Konum metni
        const locationText = `${job.location?.building || 'Ana Bina'}${job.location?.block ? ` / ${job.location?.block}` : ''}\nKat: ${job.location?.floor || '-'}`;

        // Satır Değerleri
        row.getCell(1).value = i + 1;
        row.getCell(2).value = job.sourceCode || `S${i + 1}`;
        row.getCell(3).value = job.location?.facility?.name || '-';
        row.getCell(4).value = locationText;
        row.getCell(5).value = job.location?.roomType || '-';
        row.getCell(6).value = `${job.location?.systemUid || ''}\n${job.location?.customRoomName || job.location?.roomType || ''}`;
        row.getCell(7).value = job.questionText || job.title;
        row.getCell(8).value = templatesText;
        row.getCell(9).value = job.customNote || '-';
        row.getCell(10).value = job.responsible === 'Teknik' ? 'Teknik Hizmetler' : 'Yetkili Firma';
        row.getCell(11).value = formattedDueDate;
        row.getCell(12).value = statusTr;
        row.getCell(13).value = ''; // Görsel varsa bu hücrenin üzerine eklenecek
        row.getCell(14).value = new Date(job.createdAt).toLocaleDateString('tr-TR');

        // Satır yüksekliği: Görsel varsa en az 95px, yoksa metne göre
        const hasPhotos = Array.isArray(job.photos) && job.photos.length > 0;
        row.height = hasPhotos ? 95 : 55;

        // Stil & Kenarlıklar
        for (let col = 1; col <= 14; col++) {
          const cell = row.getCell(col);
          cell.font = { name: 'Calibri', size: 9 };
          cell.alignment = {
            vertical: 'middle',
            horizontal: [1, 2, 10, 11, 12, 14].includes(col) ? 'center' : 'left',
            wrapText: true
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };

          // Duruma göre renklendirme
          if (col === 12) {
            cell.font = { name: 'Calibri', size: 9, bold: true };
            if (job.status === 'Tamamlandi') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Yeşil
              cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF166534' } };
            } else if (job.status === 'Uygulandi') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } }; // Mor
              cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF6B21A8' } };
            } else {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Sarı
              cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF92400E' } };
            }
          }
        }

        // FOTOĞRAF GÖMME (İLK FOTOĞRAFI HÜCREYE YERLEŞTİR)
        if (hasPhotos) {
          const photoUrl = job.photos[0]?.url;
          if (photoUrl) {
            const imgData = await urlToBase64(photoUrl);
            if (imgData) {
              const imageId = workbook.addImage({
                base64: imgData.base64,
                extension: imgData.extension
              });

              // M sütunu (index 12, 0-tabanlı)
              worksheet.addImage(imageId, {
                tl: { col: 12.1, row: currentRowNumber - 0.9 },
                ext: { width: 140, height: 85 }
              });
            } else {
              row.getCell(13).value = 'Fotoğraf Yüklenemedi';
              row.getCell(13).font = { name: 'Calibri', size: 8, italic: true, color: { argb: 'FF94A3B8' } };
            }
          }
        } else {
          row.getCell(13).value = 'Görsel Yok';
          row.getCell(13).font = { name: 'Calibri', size: 8, italic: true, color: { argb: 'FF94A3B8' } };
        }

        currentRowNumber++;
      }

      // Excel Dosyasını İndir
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const fileName = `FM200_Saha_Is_Listesi_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`;
      anchor.download = fileName;
      anchor.click();
      window.URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success(`Excel raporu fotoğraflarla birlikte oluşturuldu: ${fileName}`);
    } catch (error: any) {
      console.error('Excel rapor oluşturma hatası:', error);
      toast.dismiss(toastId);
      toast.error('Excel oluşturulurken bir hata meydana geldi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setIsExportingExcel(false);
    }
  };

  const activeFac = facilities.find((f: any) => f.id === actionJob?.location?.facilityId || f.id === selectedFacilityId);

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Açıklama & Excel İndir Butonu */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0051d5] dark:text-[#b4c5ff]">
              <ClipboardList className="w-5 h-5" />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0051d5] dark:text-[#b4c5ff]">
                Saha & Firma Görev Takibi
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                FM-200 İş Listesi & Uygunsuzluk Aksiyonları
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
            Denetimlerde tespit edilen uygunsuzluklar, hazır kalıp maddeler, pano konumları ve fotoğraflar burada listelenir.
            Her işe termin tarihi atayabilir ve sahaya verilmek üzere tek tıkla Excel'e aktarabilirsiniz.
          </p>
        </div>

        {/* Aksiyon Butonu & Sayaçlar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isExportingExcel ? 'Görsellerle Rapor Hazırlanıyor...' : 'İş Listesini Excel Raporu Olarak Aktar'}
          </Button>

          {/* Özet Sayaçlar */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-center">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-semibold">Açık / Planlanan</span>
              <span className="text-sm font-extrabold text-amber-800 dark:text-amber-300">
                {workOrders.filter(w => w.status === 'Planlandi').length}
              </span>
            </div>
            <div className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900 text-center">
              <span className="text-[10px] text-purple-700 dark:text-purple-400 block font-semibold">Onay Bekleyen</span>
              <span className="text-sm font-extrabold text-purple-800 dark:text-purple-300">
                {workOrders.filter(w => w.status === 'Uygulandi').length}
              </span>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 text-center">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-semibold">Tamamlanan</span>
              <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                {workOrders.filter(w => w.status === 'Tamamlandi').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtre Çubuğu */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div>
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
          >
            <option value="all">Tüm Tesisler ({facilities.length})</option>
            {facilities.map((f: any) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="Planlandi">Planlandı</option>
            <option value="Uygulandi">Uygulandı (Onay Bekliyor)</option>
            <option value="Revize_Gerekli">Revize Gerekli</option>
            <option value="Tamamlandi">Tamamlandı</option>
          </select>
        </div>

        <div>
          <select
            value={laneFilter}
            onChange={(e) => setLaneFilter(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
          >
            <option value="all">Tüm Kulvarlar (Fiziksel / Doküman)</option>
            <option value="Fiziksel">Fiziksel Yol (Saha İşi)</option>
            <option value="Dokuman">Doküman Yolu (Mühendislik / Ofis)</option>
          </select>
        </div>

        <div>
          <select
            value={responsibleFilter}
            onChange={(e) => setResponsibleFilter(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
          >
            <option value="all">Tüm Sorumlular</option>
            <option value="Teknik">Teknik Hizmetler</option>
            <option value="Firma">Yetkili Firma</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="İş adı, kod, pano veya soru ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-white dark:bg-slate-900 text-xs"
          />
        </div>
      </div>

      {/* İş Emirleri Listesi */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">İş listesi yükleniyor...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Kayıtlı İş Emri Bulunmuyor
          </h3>
          <p className="text-xs text-slate-500 mt-1">Seçili filtrelere uygun herhangi bir iş emri bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredOrders.map((job) => {
            const isEscalated = job.repeatCount > 1;
            const hasDueDate = !!job.dueDate;
            const formattedDueDate = job.dueDate
              ? new Date(job.dueDate).toLocaleDateString('tr-TR')
              : null;

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-primary/40 transition-colors flex flex-col lg:flex-row lg:items-start justify-between gap-4"
              >
                <div className="space-y-2.5 flex-1">
                  {/* Üst Rozetler ve Konum / Pano Bilgisi */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {job.sourceCode}
                    </span>
                    <span className="font-mono text-xs text-primary font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40">
                      {job.location?.systemUid}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {job.location?.facility?.shortName || job.location?.facility?.name} · {job.location?.building || 'Ana Bina'} {job.location?.block ? `/ ${job.location?.block}` : ''} ({job.location?.floor})
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Pano: <strong className="text-slate-700 dark:text-slate-200">{job.location?.customRoomName || `${job.location?.roomType} #${job.location?.index}`}</strong>
                    </span>

                    {/* Sorumlu Rozeti */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      job.responsible === 'Teknik'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                    }`}>
                      {job.responsible === 'Teknik' ? 'Teknik Hizmetler' : 'Yetkili Firma'}
                    </span>

                    {/* Kulvar */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        job.trackLane === 'Fiziksel'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {job.trackLane} Yol
                    </span>

                    {/* Mükerrer Sayaç */}
                    {isEscalated && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {job.repeatCount} Dönemdir Açık
                      </span>
                    )}
                  </div>

                  {/* Kriter / Soru Metni */}
                  {job.questionText && (
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                      <span className="text-primary font-bold mr-1">Denetim Kriteri:</span>
                      {job.questionText}
                    </div>
                  )}

                  {/* İş Başlığı */}
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {job.title}
                  </h4>

                  {/* Seçilen Hazır Kalıp Tespitler */}
                  {Array.isArray(job.templates) && job.templates.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs">
                      <span className="font-bold text-amber-900 dark:text-amber-300 block mb-1">
                        Seçilen Hazır Kalıp Tespitler:
                      </span>
                      <ul className="space-y-0.5 text-slate-700 dark:text-slate-300 text-[11px] list-disc list-inside">
                        {job.templates.map((tpl: string, i: number) => (
                          <li key={i}>{tpl}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Ek Saha Açıklaması */}
                  {job.customNote && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 italic">
                      <strong>Saha Notu:</strong> "{job.customNote}"
                    </div>
                  )}

                  {/* Revizyon Notu Varsa */}
                  {job.status === 'Revize_Gerekli' && job.revisionNote && (
                    <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-red-800 dark:text-red-300 flex items-start gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        <b>Teknik Sorumlu Notu:</b> {job.revisionNote}
                      </span>
                    </div>
                  )}

                  {/* Denetimde Çekilen Fotoğraflar */}
                  {Array.isArray(job.photos) && job.photos.length > 0 && (
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Camera className="w-3 h-3 text-slate-400" />
                        Denetim Fotoğrafları ({job.photos.length}):
                      </span>
                      {job.photos.map((ph: any, i: number) => (
                        <a
                          key={i}
                          href={ph.url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-8 h-8 rounded-lg border border-slate-200 overflow-hidden shrink-0 hover:scale-110 transition-transform shadow-2xs"
                        >
                          <img src={ph.url} alt={ph.name || 'Foto'} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Kanıt Görselleri (Onarım Sonrası) */}
                  {job.evidences?.length > 0 && (
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Onarım Kanıtları ({job.evidences.length}):
                      </span>
                      {job.evidences.map((ev: any) => (
                        <a
                          key={ev.id}
                          href={ev.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-8 h-8 rounded-lg border border-purple-200 overflow-hidden shrink-0 hover:scale-110 transition-transform shadow-2xs"
                        >
                          <img src={ev.fileUrl} alt="Kanıt" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sağ Kolon: Termin Tarihi, Durum ve Aksiyonlar */}
                <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 min-w-[200px]">
                  {/* Durum Rozeti */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      job.status === 'Tamamlandi'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200'
                        : job.status === 'Uygulandi'
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200'
                        : job.status === 'Revize_Gerekli'
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {job.status === 'Tamamlandi'
                      ? 'Tamamlandı'
                      : job.status === 'Uygulandi'
                      ? 'Doğrulama Bekliyor'
                      : job.status === 'Revize_Gerekli'
                      ? 'Revize Gerekli'
                      : 'Planlandı'}
                  </span>

                  {/* Termin Tarihi Kutucuğu */}
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-left sm:text-right w-full sm:w-auto">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1 sm:justify-end">
                      <Calendar className="w-3 h-3 text-slate-400" /> Termin Tarihi
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {hasDueDate ? formattedDueDate : 'Tarih Atanmadı'}
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setEditingJob(job);
                        setEditDueDate(job.dueDate ? new Date(job.dueDate).toISOString().split('T')[0] : '');
                        setEditResponsible(job.responsible || 'Teknik');
                        setEditTitle(job.title || '');
                      }}
                      className="p-0 h-auto text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1"
                    >
                      {hasDueDate ? 'Termini Düzenle' : '+ Termin Ata'}
                    </Button>
                  </div>

                  {/* Aksiyon Butonları */}
                  {job.status !== 'Tamamlandi' && (
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActionJob(job);
                          setActionCompanyTrackNo(job.companyTrackNo || '');
                        }}
                        className="text-xs h-8 rounded-lg"
                      >
                        Kanıt Ekle & Uygulandı
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => {
                          setVerifyJob(job);
                          setFollowUpTitle(`Yeni tasarıma uygun olarak 1 adet ilave nozul montajı`);
                        }}
                        className="text-xs h-8 rounded-lg bg-[#0051d5] hover:bg-[#0042b0] text-white"
                      >
                        İncele & Onayla
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Termin Tarihi & Sorumlu Düzenleme Modalı */}
      <Dialog open={!!editingJob} onOpenChange={() => setEditingJob(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0051d5]" />
              Termin Tarihi & Görev Düzenle
            </DialogTitle>
            <DialogDescription className="text-xs">
              Bu pano için işin tamamlanması gereken hedef termin tarihini ve sorumlu birimi belirleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-primary block mb-0.5">
                {editingJob?.location?.systemUid} — {editingJob?.location?.roomType}
              </span>
              <p className="text-slate-600 dark:text-slate-400">{editingJob?.title}</p>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Hedef Termin Tarihi:
              </Label>
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="h-9 mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Sorumlu Birim:
              </Label>
              <select
                value={editResponsible}
                onChange={(e) => setEditResponsible(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs mt-1"
              >
                <option value="Teknik">Teknik Hizmetler</option>
                <option value="Firma">Yetkili Firma</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                İş Tanımı:
              </Label>
              <Textarea
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                rows={2}
                className="text-xs mt-1"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setEditingJob(null)} className="text-xs">
              Vazgeç
            </Button>
            <Button
              size="sm"
              onClick={() => updateJobMutation.mutate()}
              disabled={updateJobMutation.isPending}
              className="bg-[#0051d5] hover:bg-[#0042b0] text-white text-xs font-bold"
            >
              {updateJobMutation.isPending ? 'Kaydediliyor...' : 'Termini Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kanıt Ekleme & "Uygulandı" Modalı */}
      <Dialog open={!!actionJob} onOpenChange={() => setActionJob(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              Saha Aksiyonu ve Fotoğraflı Kanıt Girişi
            </DialogTitle>
            <DialogDescription className="text-xs">
              İş tanımına istinaden yapılan onarım veya temin edilen dokümana ait görsel kanıtları yükleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                İş Tanımı:
              </span>
              <p className="text-slate-600 dark:text-slate-400">{actionJob?.title}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Firma Takip / Servis Fişi No
              </label>
              <Input
                placeholder="Ör: SRV-2026-9912"
                value={actionCompanyTrackNo}
                onChange={(e) => setActionCompanyTrackNo(e.target.value)}
                className="h-9 mt-1 text-xs font-mono"
              />
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <ImageUploadWithPreview
                facilityId={actionJob?.location?.facility?.id || selectedFacilityId}
                facilityName={activeFac?.name}
                photos={actionEvidences}
                onChange={setActionEvidences}
                label="Onarım / Kanıt Fotoğrafları"
                description="Tamamlanan işin net çekilmiş fotoğrafını yükleyin."
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setActionJob(null)} className="text-xs">
              İptal
            </Button>
            <Button
              onClick={() => submitActionMutation.mutate()}
              disabled={submitActionMutation.isPending || actionEvidences.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
            >
              {submitActionMutation.isPending ? 'İşleniyor...' : 'Uygulandı Olarak Bildir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teknik Sorumlu İnceleme & Onay Modalı */}
      <Dialog open={!!verifyJob} onOpenChange={() => setVerifyJob(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0051d5]" />
              Teknik Sorumlu Doğrulama Ekranı
            </DialogTitle>
            <DialogDescription className="text-xs">
              Yüklenen kanıtları değerlendirerek işi nihai olarak onaylayın veya revizyon notuyla sahaya iade edin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
                {verifyJob?.sourceCode} — {verifyJob?.location?.systemUid}
              </span>
              <p className="text-slate-600 dark:text-slate-400">{verifyJob?.title}</p>
            </div>

            {/* Kanıt Önizleme */}
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Sunulan Kanıtlar:
              </span>
              {verifyJob?.evidences?.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {verifyJob.evidences.map((ev: any) => (
                    <a
                      key={ev.id}
                      href={ev.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="aspect-square rounded-lg border border-slate-200 overflow-hidden block hover:opacity-90"
                    >
                      <img src={ev.fileUrl} alt="Kanıt" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-600 italic">
                  Henüz bu iş için fotoğraflı kanıt yüklenmemiştir.
                </p>
              )}
            </div>

            {/* Düzeltme İstenirse Zorunlu Not */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Revizyon / Ret Gerekçesi (Düzeltme İsteniyorsa Zorunlu)
              </label>
              <Input
                placeholder="Ör: Fitil yenilenmiş ancak kasa kenarında hala sızıntı boşluğu var..."
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                className="h-9 mt-1 text-xs"
              />
            </div>

            {/* Spesifikasyon Bölüm 9.2: Doküman işinden Fiziksel İş Doğurma */}
            {verifyJob?.trackLane === 'Dokuman' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-blue-950 dark:text-blue-200">
                  <input
                    type="checkbox"
                    checked={createPhysicalFollowUp}
                    onChange={(e) => setCreatePhysicalFollowUp(e.target.checked)}
                    className="rounded text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>Doküman incelemesi sahada yeni bir fiziksel tadilat gerektiriyor</span>
                </label>

                {createPhysicalFollowUp && (
                  <div className="pt-1">
                    <label className="text-[11px] font-medium text-blue-800 dark:text-blue-300">
                      Açılacak Yeni Fiziksel İş Tanımı:
                    </label>
                    <Input
                      value={followUpTitle}
                      onChange={(e) => setFollowUpTitle(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => verifyMutation.mutate('Revize_Gerekli')}
              disabled={!revisionNote || verifyMutation.isPending}
              className="text-xs text-red-600 border-red-300 hover:bg-red-50 w-full sm:w-auto"
            >
              Düzeltme İste (Sahaya İade)
            </Button>

            <Button
              onClick={() => verifyMutation.mutate('Tamamlandi')}
              disabled={verifyMutation.isPending}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto font-bold"
            >
              {verifyMutation.isPending ? 'Onaylanıyor...' : 'Onayla ve Tamamlandı Olarak Kapat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
