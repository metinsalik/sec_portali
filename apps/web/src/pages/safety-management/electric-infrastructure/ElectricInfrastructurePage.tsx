import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Zap, Plus, FileSpreadsheet, Sparkles, AlertTriangle, CheckCircle2,
  XCircle, Clock, ShieldAlert, Image as ImageIcon, Upload, Trash2,
  Edit2, Eye, RefreshCw, Search, Filter, Camera, Download, ExternalLink,
  ChevronRight, Building2, MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  electricInfrastructureService,
  type ElectricInfrastructureRecord,
  type ElectricInfrastructureStats
} from '@/services/electric-infrastructure.service';

const CATEGORIES = [
  'Ana Dağıtım Panosu (ADP)',
  'ADP odası',
  'Kat panosu',
  'Tali elektrik panosu',
  'MCC / mekanik pano',
  'Kompanzasyon panosu',
  'UPS giriş-çıkış panosu',
  'UPS cihazı / akü odası',
  'Trafo',
  'OG hücre',
  'Jeneratör',
  'Jeneratör panosu / ATS',
  'Kablo şaftı / tava / penetrasyon',
  'Elektrik odası söndürme sistemi',
  'Diğer'
];

export default function ElectricInfrastructurePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFacilityId, setActiveFacilityId] = useState<string>(
    localStorage.getItem('activeFacilityId') || 'all'
  );

  const [records, setRecords] = useState<ElectricInfrastructureRecord[]>([]);
  const [stats, setStats] = useState<ElectricInfrastructureStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State for New / Edit Record
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<ElectricInfrastructureRecord> | null>(null);
  const [modalSaving, setModalSaving] = useState(false);

  // Evidence Photos Modal
  const [photoModalRecord, setPhotoModalRecord] = useState<ElectricInfrastructureRecord | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick View / Detail Modal
  const [viewRecord, setViewRecord] = useState<ElectricInfrastructureRecord | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await electricInfrastructureService.downloadExcel(activeFacilityId);
      toast.success('Excel dosyası başarıyla indirildi.');
    } catch (err: any) {
      toast.error(err.message || 'Excel indirilemedi.');
    } finally {
      setIsExporting(false);
    }
  };

  const fetchData = async (facId = activeFacilityId) => {
    setLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        electricInfrastructureService.getRecords({
          facilityId: facId,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          risk: riskFilter !== 'all' ? riskFilter : undefined,
          actionStatus: statusFilter !== 'all' ? statusFilter : undefined,
          search: search || undefined
        }),
        electricInfrastructureService.getStats(facId)
      ]);
      setRecords(data);
      setStats(statsData);
    } catch (err: any) {
      console.error(err);
      toast.error('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleFacilityChanged = () => {
      const current = localStorage.getItem('activeFacilityId') || 'all';
      setActiveFacilityId(current);
      fetchData(current);
    };

    window.addEventListener('facilityChanged', handleFacilityChanged);
    fetchData(activeFacilityId);

    return () => {
      window.removeEventListener('facilityChanged', handleFacilityChanged);
    };
  }, [activeFacilityId, categoryFilter, riskFilter, statusFilter, search]);

  const handleOpenNewModal = () => {
    if (activeFacilityId === 'all') {
      toast.info('Lütfen yeni ekipman eklemek için sol menüden belirli bir tesis seçiniz.');
      return;
    }
    setEditingRecord({
      facilityId: activeFacilityId,
      equipmentCategory: 'Kat panosu',
      equipmentCodeName: '',
      locationDescription: '',
      isInspected: 'Evet',
      hasRisk: 'Yok',
      hasMaintenanceRecord: 'Var',
      thermalControl: 'Uygun',
      overloadHeat: 'Yok',
      cablesBreakers: 'Uygun',
      cleanlinessVentilation: 'Uygun',
      extinguishingSystem: 'Var ve Uygun',
      sealingFireStop: 'Var ve Uygun',
      protectionSystem: 'Uygun',
      actionStatus: 'Tamamlandı',
      inspectorName: user?.fullName || user?.username || '',
      inspectionDate: new Date().toISOString().split('T')[0],
      photoUrls: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec: ElectricInfrastructureRecord) => {
    setEditingRecord({
      ...rec,
      inspectionDate: rec.inspectionDate ? new Date(rec.inspectionDate).toISOString().split('T')[0] : '',
      lastMaintenanceDate: rec.lastMaintenanceDate ? new Date(rec.lastMaintenanceDate).toISOString().split('T')[0] : '',
      deadlineDate: rec.deadlineDate ? new Date(rec.deadlineDate).toISOString().split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    if (!editingRecord.equipmentCategory || !editingRecord.equipmentCodeName || !editingRecord.locationDescription) {
      toast.error('Ekipman türü, adı ve konumu zorunludur.');
      return;
    }

    setModalSaving(true);
    try {
      if (editingRecord.id) {
        await electricInfrastructureService.updateRecord(editingRecord.id, editingRecord);
        toast.success('Ekipman kontrol kaydı güncellendi.');
      } else {
        await electricInfrastructureService.createRecord(editingRecord);
        toast.success('Yeni ekipman kontrol kaydı eklendi.');
      }
      setIsModalOpen(false);
      setEditingRecord(null);
      fetchData(activeFacilityId);
    } catch (err: any) {
      toast.error(err.message || 'Kaydedilemedi.');
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Bu ekipman kontrol kaydını silmek istediğinize emin misiniz?')) return;
    try {
      await electricInfrastructureService.deleteRecord(id);
      toast.success('Kayıt silindi.');
      fetchData(activeFacilityId);
    } catch (err: any) {
      toast.error('Silme başarısız oldu.');
    }
  };

  const handleInitTemplate = async () => {
    if (activeFacilityId === 'all') {
      toast.info('Şablon oluşturmak için sol menüden belirli bir tesis seçmelisiniz.');
      return;
    }
    if (!confirm('Excel şablonundaki standart 14 ekipman listesi bu tesis için oluşturulsun mu?')) return;

    try {
      const res = await electricInfrastructureService.initTemplate(activeFacilityId);
      toast.success(res.message);
      fetchData(activeFacilityId);
    } catch (err: any) {
      toast.error(err.message || 'Şablon yüklenemedi.');
    }
  };

  const handleInlineQuickUpdate = async (id: string, field: string, value: string) => {
    try {
      await electricInfrastructureService.updateRecord(id, { [field]: value });
      setRecords(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
      // Re-fetch stats in background
      electricInfrastructureService.getStats(activeFacilityId).then(setStats);
      toast.success('Güncellendi', { duration: 1500 });
    } catch (err: any) {
      toast.error('Güncellenemedi.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !photoModalRecord) return;

    setIsUploadingPhoto(true);
    try {
      const uploaded = await electricInfrastructureService.uploadEvidence(Array.from(files));
      const currentPhotos = Array.isArray(photoModalRecord.photoUrls) ? photoModalRecord.photoUrls : [];
      const updatedPhotos = [...currentPhotos, ...uploaded];

      const updated = await electricInfrastructureService.updateRecord(photoModalRecord.id, {
        photoUrls: updatedPhotos
      });

      setPhotoModalRecord(updated);
      setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
      toast.success('Kanıt fotoğrafları yüklendi.');
    } catch (err: any) {
      toast.error(err.message || 'Yükleme başarısız.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async (indexToRemove: number) => {
    if (!photoModalRecord) return;
    const currentPhotos = Array.isArray(photoModalRecord.photoUrls) ? photoModalRecord.photoUrls : [];
    const updatedPhotos = currentPhotos.filter((_, idx) => idx !== indexToRemove);

    try {
      const updated = await electricInfrastructureService.updateRecord(photoModalRecord.id, {
        photoUrls: updatedPhotos
      });
      setPhotoModalRecord(updated);
      setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
      toast.success('Görsel kaldırıldı.');
    } catch (err) {
      toast.error('Kaldırılamadı.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1a1f24] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Elektrik Altyapı Sistemleri Kontrol Formu
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Tesis bazında elektrik panoları, jeneratörler, UPS ve altyapı ekipmanlarının eşzamanlı denetimi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={isExporting}
            className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 h-9 px-3 text-emerald-600 dark:text-emerald-400 font-medium"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-1.5" />}
            Excel'e Aktar
          </Button>

          <Button
            onClick={handleOpenNewModal}
            className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Yeni Ekipman / Konum Ekle
          </Button>
        </div>
      </div>

      {/* Excel Row 6 Summary Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Toplam Kayıt */}
        <div className="bg-white dark:bg-[#1a1f24] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">GİRİLEN KAYIT</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats?.totalCount || 0}</span>
            <span className="text-[11px] text-slate-400">adet ekipman</span>
          </div>
        </div>

        {/* Risk Var */}
        <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between transition-colors ${
          (stats?.riskCount || 0) > 0
            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
            : 'bg-white dark:bg-[#1a1f24] border-slate-200/80 dark:border-slate-800'
        }`}>
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            RİSK VAR
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats?.riskCount || 0}</span>
            <span className="text-[11px] text-rose-500/70">tespit</span>
          </div>
        </div>

        {/* Bakım Kaydı Yok */}
        <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between transition-colors ${
          (stats?.noMaintenanceCount || 0) > 0
            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
            : 'bg-white dark:bg-[#1a1f24] border-slate-200/80 dark:border-slate-800'
        }`}>
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            BAKIM KAYDI YOK
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats?.noMaintenanceCount || 0}</span>
            <span className="text-[11px] text-amber-500/70">ekipman</span>
          </div>
        </div>

        {/* Açık/Devam Eden */}
        <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between transition-colors ${
          (stats?.openActionCount || 0) > 0
            ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50'
            : 'bg-white dark:bg-[#1a1f24] border-slate-200/80 dark:border-slate-800'
        }`}>
          <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            AÇIK / DEVAM EDEN
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats?.openActionCount || 0}</span>
            <span className="text-[11px] text-orange-500/70">aksiyon</span>
          </div>
        </div>

        {/* Kontrol Edilmedi */}
        <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between transition-colors ${
          (stats?.notInspectedCount || 0) > 0
            ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
            : 'bg-white dark:bg-[#1a1f24] border-slate-200/80 dark:border-slate-800'
        }`}>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            KONTROL EDİLMEDİ
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-700 dark:text-slate-200">{stats?.notInspectedCount || 0}</span>
            <span className="text-[11px] text-slate-400">bekliyor</span>
          </div>
        </div>

        {/* Teyit / Hazırlık Durumu */}
        <div className="bg-white dark:bg-[#1a1f24] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">DURUM DEĞERLENDİRME</span>
          <div className="mt-2">
            <Badge
              className={`text-xs py-1 px-2.5 font-semibold ${
                stats?.statusColor === 'green'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-200'
                  : stats?.statusColor === 'red'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-200'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {stats?.statusText || 'VERİ GİRİLMEDİ'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-[#1a1f24] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pano kodu, konum, sorumlu ara..."
            className="pl-9 h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <span className="truncate">
                {categoryFilter === 'all' ? 'Tüm Ekipmanlar' : categoryFilter}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Ekipmanlar</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <span className="truncate">
                {riskFilter === 'all' ? 'Tüm Risk Durumları' : riskFilter === 'Var' ? 'Risk Var' : 'Risk Yok'}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Risk Durumları</SelectItem>
              <SelectItem value="Var">Risk Var</SelectItem>
              <SelectItem value="Yok">Risk Yok</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <span className="truncate">
                {statusFilter === 'all' ? 'Tüm Aksiyon Durumları' : statusFilter}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Aksiyon Durumları</SelectItem>
              <SelectItem value="Açık">Açık</SelectItem>
              <SelectItem value="Devam Ediyor">Devam Ediyor</SelectItem>
              <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchData(activeFacilityId)}
            className="h-9 w-9 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Dynamic Table */}
      <div className="bg-white dark:bg-[#1a1f24] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-12 text-center">Sıra</th>
                {activeFacilityId === 'all' && <th className="py-3 px-3">Tesis</th>}
                <th className="py-3 px-3 min-w-[170px]">Bölüm / Ekipman Türü</th>
                <th className="py-3 px-3 min-w-[150px]">Pano / Ekipman Kodu</th>
                <th className="py-3 px-3 min-w-[150px]">Kat / Konum</th>
                <th className="py-3 px-3 text-center">Kontrol</th>
                <th className="py-3 px-3 text-center">Risk</th>
                <th className="py-3 px-3 text-center">Bakım</th>
                <th className="py-3 px-3 text-center">Termal</th>
                <th className="py-3 px-3 text-center">Aşırı Yük</th>
                <th className="py-3 px-3 text-center">Aksiyon Durumu</th>
                <th className="py-3 px-3 text-center">Kanıt / Foto</th>
                <th className="py-3 px-3 min-w-[110px]">Kontrol Eden</th>
                <th className="py-3 px-3 text-right sticky right-0 bg-slate-50 dark:bg-slate-800 z-10 shadow-[-4px_0_8px_rgba(0,0,0,0.05)]">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={activeFacilityId === 'all' ? 14 : 13} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Kayıtlar yükleniyor...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={activeFacilityId === 'all' ? 14 : 13} className="py-12 text-center text-slate-400">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    Henüz kayıt bulunamadı. "Yeni Ekipman / Konum Ekle" veya "Standart Şablon Listesini Getir" butonuyla başlayabilirsiniz.
                  </td>
                </tr>
              ) : (
                records.map((rec, idx) => {
                  const hasPhotos = Array.isArray(rec.photoUrls) && rec.photoUrls.length > 0;
                  const isRisk = rec.hasRisk === 'Var';

                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isRisk ? 'bg-rose-50/40 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Sıra No */}
                      <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">
                        {rec.orderIndex || idx + 1}
                      </td>

                      {/* Tesis (Only if 'all' selected) */}
                      {activeFacilityId === 'all' && (
                        <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-1 text-[11px]">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {rec.facility?.name || 'Tesis'}
                          </span>
                        </td>
                      )}

                      {/* Bölüm / Ekipman Türü */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                          {rec.equipmentCategory}
                        </span>
                        {rec.notes && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[160px] block" title={rec.notes}>
                            {rec.notes}
                          </span>
                        )}
                      </td>

                      {/* Pano / Ekipman Kodu */}
                      <td className="py-3 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                        {rec.equipmentCodeName}
                      </td>

                      {/* Kat / Konum */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                          {rec.locationDescription}
                        </span>
                      </td>

                      {/* Kontrol Edildi mi */}
                      <td className="py-3 px-3 text-center">
                        <select
                          value={rec.isInspected || 'Evet'}
                          onChange={(e) => handleInlineQuickUpdate(rec.id, 'isInspected', e.target.value)}
                          className="bg-transparent border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-[11px] font-medium focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="Evet">Evet</option>
                          <option value="Hayır">Hayır</option>
                        </select>
                      </td>

                      {/* Risk Var mı */}
                      <td className="py-3 px-3 text-center">
                        <select
                          value={rec.hasRisk || 'Yok'}
                          onChange={(e) => handleInlineQuickUpdate(rec.id, 'hasRisk', e.target.value)}
                          className={`rounded px-1.5 py-0.5 text-[11px] font-semibold border ${
                            rec.hasRisk === 'Var'
                              ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400'
                          }`}
                        >
                          <option value="Yok">Yok</option>
                          <option value="Var">Var</option>
                        </select>
                      </td>

                      {/* Bakım Kaydı */}
                      <td className="py-3 px-3 text-center">
                        <select
                          value={rec.hasMaintenanceRecord || (rec.lastMaintenanceDate ? 'Var' : 'Yok')}
                          onChange={(e) => handleInlineQuickUpdate(rec.id, 'hasMaintenanceRecord', e.target.value)}
                          className={`rounded px-1.5 py-0.5 text-[11px] font-medium border ${
                            rec.hasMaintenanceRecord === 'Yok' || !rec.lastMaintenanceDate
                              ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          <option value="Var">Var</option>
                          <option value="Yok">Yok</option>
                        </select>
                        {rec.lastMaintenanceDate ? (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 whitespace-nowrap">
                            {new Date(rec.lastMaintenanceDate).toLocaleDateString('tr-TR')}
                          </div>
                        ) : (
                          <div className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                            Tarih yok
                          </div>
                        )}
                      </td>

                      {/* Termal Kontrol */}
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                          rec.thermalControl === 'Uygun Değil'
                            ? 'text-rose-600 font-bold'
                            : rec.thermalControl === 'Uygun'
                            ? 'text-emerald-600'
                            : 'text-slate-500'
                        }`}>
                          {rec.thermalControl || '-'}
                        </span>
                      </td>

                      {/* Aşırı Yük / Isınma */}
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[11px] font-medium ${
                          rec.overloadHeat === 'Var' ? 'text-rose-600 font-bold' : 'text-slate-500'
                        }`}>
                          {rec.overloadHeat || '-'}
                        </span>
                      </td>

                      {/* Aksiyon Durumu */}
                      <td className="py-3 px-3 text-center">
                        <select
                          value={rec.actionStatus || 'Tamamlandı'}
                          onChange={(e) => handleInlineQuickUpdate(rec.id, 'actionStatus', e.target.value)}
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold border ${
                            rec.actionStatus === 'Açık'
                              ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400'
                              : rec.actionStatus === 'Devam Ediyor'
                              ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-400'
                              : 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400'
                          }`}
                        >
                          <option value="Tamamlandı">Tamamlandı</option>
                          <option value="Devam Ediyor">Devam Ediyor</option>
                          <option value="Açık">Açık</option>
                        </select>
                      </td>

                      {/* Kanıt / Fotoğraflar */}
                      <td className="py-3 px-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPhotoModalRecord(rec)}
                          className={`h-7 px-2 text-[11px] flex items-center gap-1 ${
                            hasPhotos
                              ? 'text-blue-600 dark:text-blue-400 font-semibold'
                              : 'text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          {hasPhotos ? `${(rec.photoUrls as any[]).length} Foto` : 'Ekle'}
                        </Button>
                      </td>

                      {/* Kontrol Eden */}
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={rec.inspectorName || ''}>
                        {rec.inspectorName || '-'}
                      </td>

                      {/* İşlemler - Sticky Right */}
                      <td className={`py-3 px-3 text-right whitespace-nowrap sticky right-0 z-10 shadow-[-4px_0_8px_rgba(0,0,0,0.05)] ${
                        isRisk ? 'bg-[#fff5f5] dark:bg-[#251b1f]' : 'bg-white dark:bg-[#1a1f24]'
                      }`}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-500 hover:text-blue-600"
                            onClick={() => setViewRecord(rec)}
                            title="Önizle / Hızlı Gör"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-500 hover:text-indigo-600"
                            onClick={() => navigate(`/safety-management/electric-infrastructure/${rec.id}`)}
                            title="Tam Detay Sayfasına Git"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-500 hover:text-amber-600"
                            onClick={() => handleOpenEditModal(rec)}
                            title="Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-500 hover:text-rose-600"
                            onClick={() => handleDeleteRecord(rec.id)}
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Yeni / Düzenle Ekipman Kontrol Kaydı */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-amber-500" />
              {editingRecord?.id ? 'Ekipman Kontrol Kaydını Düzenle' : 'Yeni Ekipman / Konum Kontrolü Ekle'}
            </DialogTitle>
            <DialogDescription>
              Excel formunda yer alan tüm teknik kriterleri, risk tespitlerini ve aksiyonları buradan girebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          {editingRecord && (
            <form onSubmit={handleSaveModal} className="space-y-6 pt-2">
              {/* Temel Ekipman Bilgileri */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Ekipman & Konum Bilgileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">İlgili Bölüm / Ekipman Türü *</Label>
                    <Select
                      value={editingRecord.equipmentCategory}
                      onValueChange={(v) => setEditingRecord({ ...editingRecord, equipmentCategory: v })}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Ekipman seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Pano / Ekipman Adı - Kodu *</Label>
                    <Input
                      value={editingRecord.equipmentCodeName || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, equipmentCodeName: e.target.value })}
                      placeholder="Örn: ADP-01 veya KP-3A"
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Kat / Konum *</Label>
                    <Input
                      value={editingRecord.locationDescription || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, locationDescription: e.target.value })}
                      placeholder="Örn: Blok A - Kat 3 Koridor"
                      className="text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Teknik Kontrol Kriterleri (Excel Row 9 Sütunları) */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Teknik Kontrol ve Güvenlik Kriterleri</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Kontrol Edildi mi?</Label>
                    <Select
                      value={editingRecord.isInspected || 'Evet'}
                      onValueChange={(v) => setEditingRecord({ ...editingRecord, isInspected: v })}
                    >
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Evet">Evet</SelectItem>
                        <SelectItem value="Hayır">Hayır</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Risk Var mı?</Label>
                    <Select
                      value={editingRecord.hasRisk || 'Yok'}
                      onValueChange={(v) => setEditingRecord({ ...editingRecord, hasRisk: v })}
                    >
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yok">Yok</SelectItem>
                        <SelectItem value="Var">Var</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Bakım Kaydı Var mı?</Label>
                    <Select
                      value={editingRecord.hasMaintenanceRecord || 'Var'}
                      onValueChange={(v) => setEditingRecord({ ...editingRecord, hasMaintenanceRecord: v })}
                    >
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Var">Var</SelectItem>
                        <SelectItem value="Yok">Yok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Son Bakım Tarihi</Label>
                    <Input
                      type="date"
                      value={editingRecord.lastMaintenanceDate || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, lastMaintenanceDate: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Termal Kontrol</Label>
                    <Select
                      value={editingRecord.thermalControl || 'Uygun'}
                      onValueChange={(v) => setEditingRecord({ ...editingRecord, thermalControl: v })}
                    >
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Uygun">Uygun</SelectItem>
                        <SelectItem value="Uygun Değil">Uygun Değil</SelectItem>
                        <SelectItem value="Yapılmadı">Yapılmadı</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Aşırı Yük / Isınma</Label>
                    <Select
                      value={editingRecord.overloadHeat || 'Yok'}
                      onValueChange={(v) => setEditingRecord({ ...editingRecord, overloadHeat: v })}
                    >
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yok">Yok</SelectItem>
                        <SelectItem value="Var">Var</SelectItem>
                        <SelectItem value="Kontrol Edilmedi">Kontrol Edilmedi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Bağlantı-Kablo-Şalter</Label>
                    <Select
                      value={editingRecord.cablesBreakers || 'Uygun'}
                      onValueChange={(v) => setEditingRecord({ ...editingRecord, cablesBreakers: v })}
                    >
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Uygun">Uygun</SelectItem>
                        <SelectItem value="Uygun Değil">Uygun Değil</SelectItem>
                        <SelectItem value="Kontrol Edilmedi">Kontrol Edilmedi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Temizlik / Havalandırma</Label>
                    <Select
                      value={editingRecord.cleanlinessVentilation || 'Uygun'}
                      onValueChange={(v) => setEditingRecord({ ...editingRecord, cleanlinessVentilation: v })}
                    >
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Uygun">Uygun</SelectItem>
                        <SelectItem value="Uygun Değil">Uygun Değil</SelectItem>
                        <SelectItem value="Kontrol Edilmedi">Kontrol Edilmedi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Söndürme Sistemi</Label>
                    <Select
                      value={editingRecord.extinguishingSystem || 'Var ve Uygun'}
                      onValueChange={(v) => setEditingRecord({ ...editingRecord, extinguishingSystem: v })}
                    >
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Var ve Uygun">Var ve Uygun</SelectItem>
                        <SelectItem value="Yok">Yok</SelectItem>
                        <SelectItem value="Uygun Değil">Uygun Değil</SelectItem>
                        <SelectItem value="Uygulanamaz">Uygulanamaz</SelectItem>
                        <SelectItem value="Kontrol Edilmedi">Kontrol Edilmedi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Sızdırmazlık / Yangın Durdurucu</Label>
                    <Select
                      value={editingRecord.sealingFireStop || 'Var ve Uygun'}
                      onValueChange={(v) => setEditingRecord({ ...editingRecord, sealingFireStop: v })}
                    >
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Var ve Uygun">Var ve Uygun</SelectItem>
                        <SelectItem value="Yok">Yok</SelectItem>
                        <SelectItem value="Uygun Değil">Uygun Değil</SelectItem>
                        <SelectItem value="Uygulanamaz">Uygulanamaz</SelectItem>
                        <SelectItem value="Kontrol Edilmedi">Kontrol Edilmedi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Koruma Sistemi</Label>
                    <Select
                      value={editingRecord.protectionSystem || 'Uygun'}
                      onValueChange={(v) => setEditingRecord({ ...editingRecord, protectionSystem: v })}
                    >
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Uygun">Uygun</SelectItem>
                        <SelectItem value="Uygun Değil">Uygun Değil</SelectItem>
                        <SelectItem value="Kontrol Edilmedi">Kontrol Edilmedi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Kontrol Tarihi</Label>
                    <Input
                      type="date"
                      value={editingRecord.inspectionDate || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, inspectionDate: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Risk ve Aksiyon Detayları */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">3. Tespit, Acil Aksiyon ve Sorumluluk</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3 space-y-1.5">
                    <Label className="text-xs">Tespit Edilen Risk / Uygunsuzluk</Label>
                    <Textarea
                      value={editingRecord.detectedRisk || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, detectedRisk: e.target.value })}
                      placeholder="Risk varsa detaylı tanımı..."
                      className="text-xs"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Önerilen Önlem</Label>
                    <Textarea
                      value={editingRecord.suggestedAction || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, suggestedAction: e.target.value })}
                      placeholder="Örn: Termal gevşeklik giderilmeli"
                      className="text-xs"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Yapılan Acil Aksiyon</Label>
                    <Textarea
                      value={editingRecord.emergencyActionTaken || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, emergencyActionTaken: e.target.value })}
                      placeholder="Yerinde yapılan acil müdahale..."
                      className="text-xs"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Ek Notlar</Label>
                    <Textarea
                      value={editingRecord.notes || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                      placeholder="Diğer açıklama ve notlar..."
                      className="text-xs"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Sorumlu Kişi / Birim</Label>
                    <Input
                      value={editingRecord.responsiblePerson || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, responsiblePerson: e.target.value })}
                      placeholder="Örn: Teknik Servis Şefi"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Termin Tarihi</Label>
                    <Input
                      type="date"
                      value={editingRecord.deadlineDate || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, deadlineDate: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Aksiyon Durumu</Label>
                    <Select
                      value={editingRecord.actionStatus || 'Tamamlandı'}
                      onValueChange={(v) => setEditingRecord({ ...editingRecord, actionStatus: v })}
                    >
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                        <SelectItem value="Devam Ediyor">Devam Ediyor</SelectItem>
                        <SelectItem value="Açık">Açık</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Vazgeç
                </Button>
                <Button type="submit" disabled={modalSaving} className="bg-amber-600 hover:bg-amber-700 text-white">
                  {modalSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingRecord?.id ? 'Güncelle' : 'Kaydet'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Kanıt / Fotoğraf Yükleme & Önizleme */}
      <Dialog open={!!photoModalRecord} onOpenChange={(open) => !open && setPhotoModalRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-500" />
              Fotoğraf ve Kanıt Belgeleri
            </DialogTitle>
            <DialogDescription>
              {photoModalRecord?.equipmentCategory} - {photoModalRecord?.equipmentCodeName} ({photoModalRecord?.locationDescription})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*,.pdf"
                className="hidden"
              />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Pano, termal kamera fotoğrafı veya kontrol belgesi yükleyin
              </p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG veya PDF (Maks. 20MB)</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="mt-3"
              >
                {isUploadingPhoto ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : <Upload className="w-4 h-4 mr-1.5" />}
                Dosya Seç
              </Button>
            </div>

            {/* Photos Grid */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Yüklü Kanıtlar ({Array.isArray(photoModalRecord?.photoUrls) ? photoModalRecord.photoUrls.length : 0})
              </h5>

              {Array.isArray(photoModalRecord?.photoUrls) && photoModalRecord.photoUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photoModalRecord.photoUrls.map((url: string, index: number) => {
                    const isPdf = url.toLowerCase().endsWith('.pdf');
                    return (
                      <div
                        key={index}
                        className="group relative rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video flex items-center justify-center"
                      >
                        {isPdf ? (
                          <div className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300 p-2">
                            <FileSpreadsheet className="w-8 h-8 text-rose-500" />
                            <span className="text-[10px] truncate max-w-[120px]">PDF Belgesi</span>
                          </div>
                        ) : (
                          <img
                            src={url}
                            alt={`Kanıt ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-white/90 rounded-full text-slate-800 hover:bg-white"
                            title="Görüntüle"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="p-1.5 bg-rose-600/90 rounded-full text-white hover:bg-rose-600"
                            title="Kaldır"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">Bu ekipmana ait yüklenmiş fotoğraf veya belge bulunmuyor.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Detay Görünümü */}
      <Dialog open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-500" />
              Ekipman Kontrol Özeti
            </DialogTitle>
            <DialogDescription>
              {viewRecord?.equipmentCategory} - {viewRecord?.equipmentCodeName}
            </DialogDescription>
          </DialogHeader>

          {viewRecord && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border">
                <div><span className="text-slate-400 block">Tesis:</span> <strong className="text-slate-800 dark:text-slate-200">{viewRecord.facility?.name || '-'}</strong></div>
                <div><span className="text-slate-400 block">Konum:</span> <strong className="text-slate-800 dark:text-slate-200">{viewRecord.locationDescription}</strong></div>
                <div><span className="text-slate-400 block">Kontrol Tarihi:</span> <strong className="text-slate-800 dark:text-slate-200">{viewRecord.inspectionDate ? new Date(viewRecord.inspectionDate).toLocaleDateString('tr-TR') : '-'}</strong></div>
                <div><span className="text-slate-400 block">Kontrol Eden:</span> <strong className="text-slate-800 dark:text-slate-200">{viewRecord.inspectorName || '-'}</strong></div>
                <div><span className="text-slate-400 block">Son Bakım:</span> <strong className="text-slate-800 dark:text-slate-200">{viewRecord.lastMaintenanceDate ? new Date(viewRecord.lastMaintenanceDate).toLocaleDateString('tr-TR') : '-'}</strong></div>
                <div><span className="text-slate-400 block">Aksiyon Durumu:</span> <strong className="text-slate-800 dark:text-slate-200">{viewRecord.actionStatus}</strong></div>
              </div>

              <div className="border rounded-lg p-3 space-y-2">
                <h5 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">Kontrol Kriterleri</h5>
                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                  <div>Termal Kontrol: <span className="font-semibold text-slate-800 dark:text-slate-200">{viewRecord.thermalControl || '-'}</span></div>
                  <div>Aşırı Yük / Isınma: <span className="font-semibold text-slate-800 dark:text-slate-200">{viewRecord.overloadHeat || '-'}</span></div>
                  <div>Bağlantı-Kablo-Şalter: <span className="font-semibold text-slate-800 dark:text-slate-200">{viewRecord.cablesBreakers || '-'}</span></div>
                  <div>Temizlik / Havalandırma: <span className="font-semibold text-slate-800 dark:text-slate-200">{viewRecord.cleanlinessVentilation || '-'}</span></div>
                  <div>Söndürme Sistemi: <span className="font-semibold text-slate-800 dark:text-slate-200">{viewRecord.extinguishingSystem || '-'}</span></div>
                  <div>Sızdırmazlık: <span className="font-semibold text-slate-800 dark:text-slate-200">{viewRecord.sealingFireStop || '-'}</span></div>
                  <div>Koruma Sistemi: <span className="font-semibold text-slate-800 dark:text-slate-200">{viewRecord.protectionSystem || '-'}</span></div>
                  <div>Risk Durumu: <span className="font-semibold text-rose-600">{viewRecord.hasRisk || 'Yok'}</span></div>
                </div>
              </div>

              {(viewRecord.detectedRisk || viewRecord.suggestedAction || viewRecord.emergencyActionTaken) && (
                <div className="border rounded-lg p-3 space-y-2 bg-rose-50/20 dark:bg-rose-950/10">
                  <h5 className="font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider text-[11px]">Risk & Aksiyon Detayları</h5>
                  {viewRecord.detectedRisk && <p><strong>Tespit Edilen Risk:</strong> {viewRecord.detectedRisk}</p>}
                  {viewRecord.suggestedAction && <p><strong>Önerilen Önlem:</strong> {viewRecord.suggestedAction}</p>}
                  {viewRecord.emergencyActionTaken && <p><strong>Yapılan Acil Aksiyon:</strong> {viewRecord.emergencyActionTaken}</p>}
                  {viewRecord.responsiblePerson && <p><strong>Sorumlu:</strong> {viewRecord.responsiblePerson} (Termin: {viewRecord.deadlineDate ? new Date(viewRecord.deadlineDate).toLocaleDateString('tr-TR') : '-'})</p>}
                </div>
              )}

              {/* Yüklü Kanıt / Fotoğraflar */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-500" />
                    Kanıt & Fotoğraflar ({Array.isArray(viewRecord.photoUrls) ? viewRecord.photoUrls.length : 0})
                  </h5>
                </div>

                {Array.isArray(viewRecord.photoUrls) && viewRecord.photoUrls.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    {viewRecord.photoUrls.map((url: string, index: number) => {
                      const isPdf = url.toLowerCase().endsWith('.pdf');
                      return (
                        <div
                          key={index}
                          className="group relative rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video flex items-center justify-center"
                        >
                          {isPdf ? (
                            <div className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300 p-2">
                              <FileSpreadsheet className="w-7 h-7 text-rose-500" />
                              <span className="text-[10px] truncate max-w-[110px]">PDF Raporu</span>
                            </div>
                          ) : (
                            <img
                              src={url}
                              alt={`Kanıt ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          )}
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 py-2 text-center text-[11px]">Yüklü fotoğraf veya kanıt bulunmuyor.</p>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setViewRecord(null)}
                >
                  Kapat
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => {
                    const recId = viewRecord.id;
                    setViewRecord(null);
                    navigate(`/safety-management/electric-infrastructure/${recId}`);
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Tam Sayfa Detayına Git
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
