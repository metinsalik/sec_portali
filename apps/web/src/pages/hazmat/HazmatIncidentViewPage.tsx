import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Edit, Trash2, Printer, ShieldAlert,
  MapPin, Clock, HeartPulse, Skull, Users,
  CheckCircle2, XCircle, FileText, Loader2, Calendar,
  Building, AlertTriangle, Camera, Image as ImageIcon, Download, Eye, ZoomIn, ZoomOut, RotateCw, X
} from 'lucide-react';
import { toast } from 'sonner';
import { formatLocationBreadcrumb } from '@/utils/locationHierarchy';
import HazmatIncidentReportPage from './HazmatIncidentReportPage';

export default function HazmatIncidentViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const { data: incident, isLoading, error } = useQuery({
    queryKey: ['hazmat-incident', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get(`/hazmat/incidents/${id}`);
      if (!res.ok) throw new Error('Olay detayları yüklenemedi.');
      return res.json();
    },
    enabled: Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const res = await api.delete(`/hazmat/incidents/${id}`);
      if (!res.ok) throw new Error('Olay silinemedi.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-incidents'] });
      toast.success('Olay kaydı başarıyla silindi.');
      navigate('/hazmat/incidents');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Olay silinirken hata oluştu.');
    },
  });

  const handleDelete = () => {
    if (window.confirm('Bu olağan dışı olay bildirimini kalıcı olarak silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate();
    }
  };

  const safeFormatDate = (date: any, formatStr = 'dd MMMM yyyy HH:mm') => {
    if (!date) return '-';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '-';
      return format(d, formatStr, { locale: tr });
    } catch {
      return '-';
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <span className="text-sm">Olay detayları getiriliyor...</span>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Olay Bulunamadı</h2>
        <p className="text-xs text-muted-foreground">
          Görüntülemek istediğiniz olay silinmiş veya erişim yetkiniz bulunmuyor olabilir.
        </p>
        <Button onClick={() => navigate('/hazmat/incidents')} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Olay Listesine Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 font-sans antialiased">
      {/* ÜST BAŞLIK & AKSİYONLAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/hazmat/incidents')}
            className="h-9 w-9 rounded-lg shrink-0 shadow-2xs"
            title="Olay Listesine Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {incident.incidentType?.name || incident.category?.name || 'Olağan Dışı Olay'}
              </h1>
              <Badge variant="outline" className="text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">
                {incident.incidentType?.name || 'Olay Bildirimi'}
              </Badge>
              {incident.facility?.name && (
                <Badge variant="secondary" className="text-xs font-medium">
                  {incident.facility.name}
                </Badge>
              )}
            </div>
            {incident.incidentType?.description && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {incident.incidentType.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Olay Tarihi: {safeFormatDate(incident.incidentDate)}</span>
            </p>
          </div>
        </div>

        {/* Eylem Butonları */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReportOpen(true)}
            className="h-8 text-xs font-medium gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-muted-foreground" />
            Rapor / Yazdır
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/hazmat/incidents/edit/${id}`)}
            className="h-8 text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Edit className="w-3.5 h-3.5" />
            Düzenle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="h-8 text-xs font-medium text-destructive hover:bg-destructive/10 border-destructive/30"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Sil
          </Button>
        </div>
      </div>

      {/* ÖZET İSTATİSTİK ŞERİDİ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/70 shadow-2xs bg-muted/15">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Kontrol Saati</p>
              <p className="text-xs font-bold text-foreground truncate">
                {safeFormatDate(incident.controlTime, 'HH:mm (dd MMM)')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-2xs bg-muted/15">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
              <HeartPulse className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Yaralı / Vefat</p>
              <p className="text-xs font-bold text-foreground">
                {incident.injuredCount || 0} Yaralı / {incident.deceasedCount || 0} Vefat
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-2xs bg-muted/15">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Tahliye Edilen</p>
              <p className="text-xs font-bold text-foreground">
                {(incident.evacuatedStaffCount || 0) + (incident.evacuatedPatientCount || 0)} Kişi
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-2xs bg-muted/15">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Döküntü Kiti</p>
              <p className="text-xs font-bold text-foreground">
                {incident.kitUsed ? 'Kullanıldı' : 'Kullanılmadı'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DETAY KARTLARI (2 KOLONLU GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SOL KOLON */}
        <div className="space-y-6">
          {/* 1. Tesis & Fiziksel Lokasyon */}
          <Card className="border-border/70 shadow-2xs">
            <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Tesis ve Lokasyon Bilgisi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Tesis:</span>
                <span className="font-semibold text-foreground">{incident.facility?.name || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Fiziksel Lokasyon:</span>
                <span className="font-medium text-foreground text-right">
                  {incident.location ? formatLocationBreadcrumb(incident.location) : 'Belirtilmemiş'}
                </span>
              </div>
              {incident.rootCause && (
                <div className="text-xs pt-1">
                  <span className="text-muted-foreground block mb-1">Kök Neden:</span>
                  <div className="p-2.5 rounded-md bg-muted/30 border border-border/60 text-foreground space-y-1">
                    <div className="font-semibold">{incident.rootCause}</div>
                    {incident.rootCauseDef?.description && (
                      <div className="text-[11px] text-muted-foreground font-normal">
                        Örnek kapsam: {incident.rootCauseDef.description}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Müdahale & Destek Süreci */}
          <Card className="border-border/70 shadow-2xs">
            <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Zaman ve Müdahale Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Olay Zamanı:</span>
                <span className="font-semibold">{safeFormatDate(incident.incidentDate)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Müdahale Yapıldı mı?:</span>
                <span className="font-semibold">
                  {incident.interventionRequired ? 'Evet (Müdahale Edildi)' : 'Müdahale Gerekmedi'}
                </span>
              </div>
              {incident.interventionTime && (
                <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Müdahale Başlangıç Saati:</span>
                  <span className="font-semibold">{safeFormatDate(incident.interventionTime)}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Kontrol Altına Alınma Saati:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {safeFormatDate(incident.controlTime)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Destek Birimi:</span>
                <span className="font-semibold">{incident.supportUnit?.name || 'Alınmadı'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Acil Durum Anonsu / Kodu:</span>
                <span className="font-semibold">
                  {incident.emergencyCode?.name
                    ? `${incident.emergencyCode.code ? `${incident.emergencyCode.code} - ` : ''}${incident.emergencyCode.name}`
                    : 'Anons Yapılmadı'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Döküntü Kiti Kullanımı:</span>
                <span className="font-semibold">
                  {incident.kitUsed ? 'Evet (Kit Kullanıldı)' : 'Hayır'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 3. İlgili Tehlikeli Maddeler */}
          <Card className="border-border/70 shadow-2xs">
            <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  İlgili Tehlikeli Maddeler
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {incident.materials?.length || 0} Kayıt
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {!incident.materials || incident.materials.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Bu olay ile ilişkilendirilmiş tehlikeli madde kaydı bulunmuyor.
                </p>
              ) : (
                <div className="space-y-2">
                  {incident.materials.map((mat: any) => (
                    <div
                      key={mat.id}
                      className="p-2.5 rounded-md border border-border/60 bg-muted/20 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{mat.productName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {mat.brandName ? `Marka: ${mat.brandName}` : 'Marka Belirtilmemiş'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[11px] shrink-0"
                        onClick={() => navigate(`/hazmat/materials/view/${mat.id}`)}
                      >
                        Malzeme Kartı
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. Olay Fotoğrafları ve Belgeler */}
          <Card className="border-border/70 shadow-2xs">
            <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" />
                  Fotoğraf ve Belge Ekleri
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {Array.isArray(incident.photos) ? incident.photos.length : 0} Fotoğraf
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {Array.isArray(incident.documents) ? incident.documents.length : 0} Belge
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Fotoğraflar Grid */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-primary" /> Saha Fotoğrafları
                </span>
                {Array.isArray(incident.photos) && incident.photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {incident.photos.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setLightboxIndex(idx);
                          setZoomLevel(1);
                          setRotation(0);
                        }}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-border/70 bg-background shadow-2xs cursor-pointer"
                      >
                        <img
                          src={item.url}
                          alt={item.name || `Fotoğraf ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5 text-[9px] text-white truncate">
                          {item.name}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic p-3 border border-dashed rounded-lg text-center bg-muted/10">
                    Fotoğraf eklenmemiş.
                  </p>
                )}
              </div>

              {/* Belgeler Listesi */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" /> Belgeler ve Tutanaklar
                </span>
                {Array.isArray(incident.documents) && incident.documents.length > 0 ? (
                  <div className="space-y-1.5">
                    {incident.documents.map((doc: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-muted/20 text-xs hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="font-medium text-foreground truncate" title={doc.name}>
                            {doc.name}
                          </span>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center gap-1 text-[11px]"
                          title="İndir"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>İndir</span>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic p-3 border border-dashed rounded-lg text-center bg-muted/10">
                    Belge eklenmemiş.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SAĞ KOLON */}
        <div className="space-y-6">
          {/* 4. Etki & Zarar Tablosu */}
          <Card className="border-border/70 shadow-2xs">
            <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                Etki ve Zarar Değerlendirmesi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <span className="text-[10px] font-bold text-orange-600 uppercase block">Yaralı</span>
                  <span className="text-lg font-black text-orange-700 dark:text-orange-400">
                    {incident.injuredCount || 0}
                  </span>
                </div>
                <div className="p-2.5 bg-rose-500/10 rounded-lg border border-rose-500/20">
                  <span className="text-[10px] font-bold text-rose-600 uppercase block">Vefat</span>
                  <span className="text-lg font-black text-rose-700 dark:text-rose-400">
                    {incident.deceasedCount || 0}
                  </span>
                </div>
                <div className="p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <span className="text-[10px] font-bold text-blue-600 uppercase block">Tahliye Personel</span>
                  <span className="text-lg font-black text-blue-700 dark:text-blue-400">
                    {incident.evacuatedStaffCount || 0}
                  </span>
                </div>
                <div className="p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <span className="text-[10px] font-bold text-blue-600 uppercase block">Tahliye Hasta</span>
                  <span className="text-lg font-black text-blue-700 dark:text-blue-400">
                    {incident.evacuatedPatientCount || 0}
                  </span>
                </div>
              </div>

              {incident.serviceInterrupted && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Hizmet {incident.interruptionDuration || 0} saat kesintiye uğradı.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 5. Detaylı Tespitler & Açıklamalar */}
          <Card className="border-border/70 shadow-2xs">
            <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Detaylı Açıklamalar ve Tespitler
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs leading-relaxed">
              {incident.incidentMode && (
                <div>
                  <span className="font-semibold text-foreground block mb-0.5">Olay Şekli / Oluş Biçimi:</span>
                  <p className="text-muted-foreground p-2 rounded-md bg-muted/20">{incident.incidentMode}</p>
                </div>
              )}
              {incident.causeDetail && (
                <div>
                  <span className="font-semibold text-foreground block mb-0.5">Neden Detay:</span>
                  <p className="text-muted-foreground p-2 rounded-md bg-muted/20">{incident.causeDetail}</p>
                </div>
              )}
              {incident.detectedEffect && (
                <div>
                  <span className="font-semibold text-foreground block mb-0.5">Tespit Edilen Etki:</span>
                  <p className="text-muted-foreground p-2 rounded-md bg-muted/20">{incident.detectedEffect}</p>
                </div>
              )}
              {incident.observations && (
                <div>
                  <span className="font-semibold text-foreground block mb-0.5">Olaya İlişkin Gözlemler:</span>
                  <p className="text-muted-foreground p-2 rounded-md bg-muted/20">{incident.observations}</p>
                </div>
              )}
              {incident.actionsTaken && (
                <div>
                  <span className="font-semibold text-foreground block mb-0.5">Alınan Aksiyonlar / Müdahaleler:</span>
                  <p className="text-muted-foreground p-2 rounded-md bg-muted/20">{incident.actionsTaken}</p>
                </div>
              )}
              {incident.resultEvaluation && (
                <div>
                  <span className="font-semibold text-foreground block mb-0.5">Sonuç ve Değerlendirme:</span>
                  <p className="text-muted-foreground p-2 rounded-md bg-muted/20">{incident.resultEvaluation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 6. Olay Sonrası Aksiyon ve İyileştirme Bilgileri */}
          <Card className="border-border/70 shadow-2xs">
            <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Alınan Aksiyon ve İyileştirme
                </span>
                <Badge
                  variant={
                    incident.actionStatus === 'Tamamlandı'
                      ? 'default'
                      : incident.actionStatus === 'Devam Ediyor'
                      ? 'secondary'
                      : 'outline'
                  }
                  className={`text-[10px] font-semibold ${
                    incident.actionStatus === 'Tamamlandı'
                      ? 'bg-emerald-600 text-white'
                      : incident.actionStatus === 'Devam Ediyor'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                      : ''
                  }`}
                >
                  {incident.actionStatus || 'Aksiyon Alınmadı'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs leading-relaxed">
              {incident.actionPlan || incident.actionResponsible || incident.actionResult ? (
                <>
                  {incident.actionResponsible && (
                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Aksiyon Sorumlusu:</span>
                      <span className="font-semibold text-foreground">{incident.actionResponsible}</span>
                    </div>
                  )}
                  {incident.actionDate && (
                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Aksiyon Tarihi / Hedef:</span>
                      <span className="font-medium text-foreground">{safeFormatDate(incident.actionDate, 'dd MMMM yyyy')}</span>
                    </div>
                  )}
                  {incident.actionPlan && (
                    <div>
                      <span className="font-semibold text-foreground block mb-0.5">Yapılan İşlemler / İyileştirme:</span>
                      <p className="text-muted-foreground p-2 rounded-md bg-muted/20 whitespace-pre-wrap">{incident.actionPlan}</p>
                    </div>
                  )}
                  {incident.actionResult && (
                    <div>
                      <span className="font-semibold text-foreground block mb-0.5">Sonuç Değerlendirmesi:</span>
                      <p className="text-muted-foreground p-2 rounded-md bg-muted/20 whitespace-pre-wrap">{incident.actionResult}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic p-2 text-center">
                  Bu olay için henüz aksiyon kaydı girilmemiştir.
                </p>
              )}
            </CardContent>
          </Card>

          {/* 7. Kayıt & Denetim İzi */}
          <Card className="border-border/70 shadow-2xs">
            <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/20">
              <CardTitle className="text-sm font-bold">Kayıt ve Denetim İzi</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Bildiren Kullanıcı:</span>
                <span className="font-semibold">{incident.creator?.fullName || incident.createdBy || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Kayıt Tarihi:</span>
                <span className="font-medium">{safeFormatDate(incident.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Son Güncelleme:</span>
                <span className="font-medium">{safeFormatDate(incident.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* RAPOR YAZDIRMA MODALİ */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <HazmatIncidentReportPage incident={incident} onCancel={() => setIsReportOpen(false)} />
          </div>
        </div>
      )}

      {/* LIGHTBOX FOTOĞRAF GÖRÜNTÜLEYİCİ */}
      {lightboxIndex !== null && Array.isArray(incident.photos) && incident.photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[10000] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-xs animate-in fade-in-0 duration-150"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="absolute top-4 inset-x-4 flex items-center justify-between text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs font-medium truncate max-w-md">
              {incident.photos[lightboxIndex].name} ({lightboxIndex + 1} / {incident.photos.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Yakınlaştır"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Uzaklaştır"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Döndür"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <a
                href={incident.photos[lightboxIndex].url}
                download={incident.photos[lightboxIndex].name}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                title="İndir"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white ml-2 cursor-pointer"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            className="max-w-4xl max-h-[80vh] flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={incident.photos[lightboxIndex].url}
              alt={incident.photos[lightboxIndex].name}
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
