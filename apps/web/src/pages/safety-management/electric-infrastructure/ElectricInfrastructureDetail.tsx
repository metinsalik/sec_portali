import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, Zap, Building2, MapPin, Calendar, User, ShieldAlert,
  AlertTriangle, CheckCircle2, Clock, Camera, Upload, Trash2,
  ExternalLink, Save, RefreshCw, FileText, Check, FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import {
  electricInfrastructureService,
  type ElectricInfrastructureRecord
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

export default function ElectricInfrastructureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [record, setRecord] = useState<ElectricInfrastructureRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<any>({});
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRecord = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await electricInfrastructureService.getRecordById(id);
      setRecord(data);
      setForm({
        ...data,
        inspectionDate: data.inspectionDate ? new Date(data.inspectionDate).toISOString().split('T')[0] : '',
        lastMaintenanceDate: data.lastMaintenanceDate ? new Date(data.lastMaintenanceDate).toISOString().split('T')[0] : '',
        deadlineDate: data.deadlineDate ? new Date(data.deadlineDate).toISOString().split('T')[0] : ''
      });
    } catch (err: any) {
      console.error(err);
      toast.error('Kayıt bilgileri alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!form.equipmentCategory || !form.equipmentCodeName || !form.locationDescription) {
      toast.error('Ekipman kategorisi, adı/kodu ve konumu zorunludur.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await electricInfrastructureService.updateRecord(id, form);
      setRecord(updated);
      toast.success('Ekipman kontrol verileri başarıyla kaydedildi.');
    } catch (err: any) {
      toast.error(err.message || 'Kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !id) return;

    setIsUploadingPhoto(true);
    try {
      const uploaded = await electricInfrastructureService.uploadEvidence(Array.from(files));
      const currentPhotos = Array.isArray(form.photoUrls) ? form.photoUrls : [];
      const updatedPhotos = [...currentPhotos, ...uploaded];

      const updated = await electricInfrastructureService.updateRecord(id, {
        photoUrls: updatedPhotos
      });

      setRecord(updated);
      setForm((prev: any) => ({ ...prev, photoUrls: updatedPhotos }));
      toast.success(`${uploaded.length} adet yeni kanıt/fotoğraf eklendi.`);
    } catch (err: any) {
      toast.error(err.message || 'Fotoğraf yüklenemedi.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async (indexToRemove: number) => {
    if (!id) return;
    const currentPhotos = Array.isArray(form.photoUrls) ? form.photoUrls : [];
    const updatedPhotos = currentPhotos.filter((_: any, idx: number) => idx !== indexToRemove);

    try {
      const updated = await electricInfrastructureService.updateRecord(id, {
        photoUrls: updatedPhotos
      });
      setRecord(updated);
      setForm((prev: any) => ({ ...prev, photoUrls: updatedPhotos }));
      toast.success('Kanıt görseli kaldırıldı.');
    } catch (err) {
      toast.error('Görsel silinemedi.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-500" />
        Ekipman kontrol detayları yükleniyor...
      </div>
    );
  }

  if (!record) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-500 mb-4">Ekipman kaydı bulunamadı.</p>
        <Button onClick={() => navigate('/safety-management/electric-infrastructure')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Listeye Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Breadcrumb / Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1a1f24] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/safety-management/electric-infrastructure')}
            className="h-9 w-9 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {record.equipmentCodeName}
              </h1>
              <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-300">
                {record.equipmentCategory}
              </Badge>
              <Badge className={`text-xs ${
                record.hasRisk === 'Var'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
              }`}>
                {record.hasRisk === 'Var' ? 'RİSK MEVCUT' : 'RİSK YOK'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {record.facility?.name || 'Tesis'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                {record.locationDescription}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            form="equipment-detail-form"
            disabled={isSaving}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Değişiklikleri Kaydet
          </Button>
        </div>
      </div>

      <form id="equipment-detail-form" onSubmit={handleSave} className="space-y-6">
        {/* Row 1: Temel Bilgiler & Özet Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Ekipman ve Konum Bilgileri
              </CardTitle>
              <CardDescription className="text-xs">
                Fiziksel pano veya altyapı ekipmanının tanımlayıcı bilgileri.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">İlgili Bölüm / Ekipman Türü *</Label>
                  <Select
                    value={form.equipmentCategory}
                    onValueChange={(v) => setForm({ ...form, equipmentCategory: v })}
                  >
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Pano / Ekipman Adı - Kodu *</Label>
                  <Input
                    value={form.equipmentCodeName || ''}
                    onChange={(e) => setForm({ ...form, equipmentCodeName: e.target.value })}
                    className="text-xs font-mono font-medium"
                    required
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Kat / Konum Tanımı *</Label>
                  <Input
                    value={form.locationDescription || ''}
                    onChange={(e) => setForm({ ...form, locationDescription: e.target.value })}
                    placeholder="Örn: Blok A - 2. Kat Ameliyathane Koridoru"
                    className="text-xs"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aksiyon & Kontrol Durumu Kartı */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange-500" />
                Durum & Sorumluluk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Kontrol Edildi mi?</Label>
                <Select
                  value={form.isInspected || 'Evet'}
                  onValueChange={(v) => setForm({ ...form, isInspected: v })}
                >
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Evet">Evet (Kontrol Edildi)</SelectItem>
                    <SelectItem value="Hayır">Hayır (Kontrol Edilmedi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Aksiyon Durumu</Label>
                <Select
                  value={form.actionStatus || 'Tamamlandı'}
                  onValueChange={(v) => setForm({ ...form, actionStatus: v })}
                >
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tamamlandı">Tamamlandı (Kapalı)</SelectItem>
                    <SelectItem value="Devam Ediyor">Devam Ediyor</SelectItem>
                    <SelectItem value="Açık">Açık (Aksiyon Bekliyor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Kontrol Eden Kişi</Label>
                <Input
                  value={form.inspectorName || ''}
                  onChange={(e) => setForm({ ...form, inspectorName: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Kontrol Tarihi</Label>
                <Input
                  type="date"
                  value={form.inspectionDate || ''}
                  onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: 11 Adet Teknik & Güvenlik Kriteri */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Teknik Kontrol Kriterleri ve Güvenlik Parametreleri
            </CardTitle>
            <CardDescription className="text-xs">
              Excel formunda yer alan tüm termal, elektriksel ve yangın güvenliği parametreleri.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                <Label className="text-xs font-semibold">Risk Var mı?</Label>
                <Select
                  value={form.hasRisk || 'Yok'}
                  onValueChange={(v) => setForm({ ...form, hasRisk: v })}
                >
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yok">Yok</SelectItem>
                    <SelectItem value="Var">Var</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                <Label className="text-xs font-semibold">Bakım Kaydı Var mı?</Label>
                <Select
                  value={form.hasMaintenanceRecord || 'Var'}
                  onValueChange={(v) => setForm({ ...form, hasMaintenanceRecord: v })}
                >
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Var">Var</SelectItem>
                    <SelectItem value="Yok">Yok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                <Label className="text-xs font-semibold">Son Bakım Tarihi</Label>
                <Input
                  type="date"
                  value={form.lastMaintenanceDate || ''}
                  onChange={(e) => setForm({ ...form, lastMaintenanceDate: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                <Label className="text-xs font-semibold">Termal Kontrol</Label>
                <Select
                  value={form.thermalControl || 'Uygun'}
                  onValueChange={(v) => setForm({ ...form, thermalControl: v })}
                >
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Uygun">Uygun</SelectItem>
                    <SelectItem value="Uygun Değil">Uygun Değil</SelectItem>
                    <SelectItem value="Yapılmadı">Yapılmadı</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                <Label className="text-xs font-semibold">Aşırı Yük / Isınma</Label>
                <Select
                  value={form.overloadHeat || 'Yok'}
                  onValueChange={(v) => setForm({ ...form, overloadHeat: v })}
                >
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yok">Yok</SelectItem>
                    <SelectItem value="Var">Var</SelectItem>
                    <SelectItem value="Kontrol Edilmedi">Kontrol Edilmedi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                <Label className="text-xs font-semibold">Bağlantı-Kablo-Şalter</Label>
                <Select
                  value={form.cablesBreakers || 'Uygun'}
                  onValueChange={(v) => setForm({ ...form, cablesBreakers: v })}
                >
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Uygun">Uygun</SelectItem>
                    <SelectItem value="Uygun Değil">Uygun Değil</SelectItem>
                    <SelectItem value="Kontrol Edilmedi">Kontrol Edilmedi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                <Label className="text-xs font-semibold">Temizlik / Havalandırma</Label>
                <Select
                  value={form.cleanlinessVentilation || 'Uygun'}
                  onValueChange={(v) => setForm({ ...form, cleanlinessVentilation: v })}
                >
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Uygun">Uygun</SelectItem>
                    <SelectItem value="Uygun Değil">Uygun Değil</SelectItem>
                    <SelectItem value="Kontrol Edilmedi">Kontrol Edilmedi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                <Label className="text-xs font-semibold">Söndürme Sistemi</Label>
                <Select
                  value={form.extinguishingSystem || 'Var ve Uygun'}
                  onValueChange={(v) => setForm({ ...form, extinguishingSystem: v })}
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

              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                <Label className="text-xs font-semibold">Sızdırmazlık / Yangın Durdurucu</Label>
                <Select
                  value={form.sealingFireStop || 'Var ve Uygun'}
                  onValueChange={(v) => setForm({ ...form, sealingFireStop: v })}
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

              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                <Label className="text-xs font-semibold">Koruma Sistemi</Label>
                <Select
                  value={form.protectionSystem || 'Uygun'}
                  onValueChange={(v) => setForm({ ...form, protectionSystem: v })}
                >
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Uygun">Uygun</SelectItem>
                    <SelectItem value="Uygun Değil">Uygun Değil</SelectItem>
                    <SelectItem value="Kontrol Edilmedi">Kontrol Edilmedi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                <Label className="text-xs font-semibold">Fotoğraf / Kanıt Belge No</Label>
                <Input
                  value={form.evidenceNo || ''}
                  onChange={(e) => setForm({ ...form, evidenceNo: e.target.value })}
                  placeholder="Örn: TRM-2026-091 veya Rapor-44"
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Row 3: Tespit Edilen Risk, Önerilen Önlem, Acil Aksiyon */}
        <Card className={`border shadow-sm transition-colors ${
          form.hasRisk === 'Var' ? 'border-rose-300 dark:border-rose-900/50 bg-rose-50/20' : 'border-slate-200 dark:border-slate-800'
        }`}>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Risk Tespiti, Öneriler ve Aksiyon Planı
            </CardTitle>
            <CardDescription className="text-xs">
              Uygunsuzluk tespit edildiğinde doldurulması gereken acil müdahale ve önlem alanları.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tespit Edilen Risk / Uygunsuzluk</Label>
                <Textarea
                  value={form.detectedRisk || ''}
                  onChange={(e) => setForm({ ...form, detectedRisk: e.target.value })}
                  rows={3}
                  className="text-xs"
                  placeholder="Tespit edilen ısınma, gevşeklik, kirlilik..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Önerilen Önlem</Label>
                <Textarea
                  value={form.suggestedAction || ''}
                  onChange={(e) => setForm({ ...form, suggestedAction: e.target.value })}
                  rows={3}
                  className="text-xs"
                  placeholder="Alınması gereken teknik önlem..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Yapılan Acil Aksiyon</Label>
                <Textarea
                  value={form.emergencyActionTaken || ''}
                  onChange={(e) => setForm({ ...form, emergencyActionTaken: e.target.value })}
                  rows={3}
                  className="text-xs"
                  placeholder="Yerinde derhal yapılan müdahale..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Sorumlu Kişi / Birim</Label>
                <Input
                  value={form.responsiblePerson || ''}
                  onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })}
                  className="text-xs"
                  placeholder="Örn: Tesis Teknik Sorumlusu"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Termin Tarihi</Label>
                <Input
                  type="date"
                  value={form.deadlineDate || ''}
                  onChange={(e) => setForm({ ...form, deadlineDate: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Ek Notlar / Gözlemler</Label>
                <Input
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="text-xs"
                  placeholder="İlave teknik açıklamalar..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Row 4: Çoklu Fotoğraf ve Kanıt Belgeleri */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-500" />
                  Fotoğraf ve Kanıt Belgeleri
                </CardTitle>
                <CardDescription className="text-xs">
                  Birden fazla termal kamera görüntüsü, pano içi fotoğrafı veya kontrol raporu ekleyebilirsiniz.
                </CardDescription>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                >
                  {isUploadingPhoto ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Fotoğraf / Dosya Ekle
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {Array.isArray(form.photoUrls) && form.photoUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {form.photoUrls.map((url: string, index: number) => {
                  const isPdf = url.toLowerCase().endsWith('.pdf');
                  return (
                    <div
                      key={index}
                      className="group relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video flex items-center justify-center shadow-sm"
                    >
                      {isPdf ? (
                        <div className="flex flex-col items-center gap-1.5 text-slate-600 dark:text-slate-300 p-2">
                          <FileSpreadsheet className="w-9 h-9 text-rose-500" />
                          <span className="text-[11px] font-medium truncate max-w-[140px]">PDF Raporu</span>
                        </div>
                      ) : (
                        <img
                          src={url}
                          alt={`Kanıt ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/90 rounded-full text-slate-800 hover:bg-white transition-colors"
                          title="Görüntüle"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="p-2 bg-rose-600/90 rounded-full text-white hover:bg-rose-600 transition-colors"
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
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
              >
                <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Henüz fotoğraf veya kanıt eklenmemiş.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Buraya tıklayarak birden fazla termal çekim veya pano görseli yükleyebilirsiniz.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
