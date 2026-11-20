import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Clock,
  User,
  Pencil,
  Printer,
  Shield,
  AlertTriangle,
  Flame,
  Truck,
  FlaskConical,
  Download,
  Calendar,
  Layers,
  FileCheck,
  FileText,
  History,
  Activity
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { PrintCardModal } from '@/components/hazmat/PrintCardModal';
import { GbfStructuredViewer } from '@/components/hazmat/gbf/GbfStructuredViewer';
import { hydrateGbfFromMaterial } from '@/components/hazmat/gbf/gbfSchema';

export default function MaterialViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const activeFacilityId = localStorage.getItem('activeFacilityId');
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'audit'>('details');

  // Return to origin (e.g. /hazmat/inventory, /hazmat/departments, or /hazmat/materials)
  const returnTo = location.state?.returnTo;

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/hazmat/materials');
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['material-details', id, activeFacilityId],
    queryFn: async () => {
      const url = activeFacilityId && activeFacilityId !== 'all'
        ? `/hazmat/materials/${id}?facilityId=${activeFacilityId}`
        : `/hazmat/materials/${id}`;
      const res = await api.get(url);
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
          <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs font-medium">Tehlikeli madde detayları yükleniyor...</span>
        </div>
      </AppLayout>
    );
  }

  if (!data?.material && !data?.id) {
    return (
      <AppLayout>
        <div className="py-20 text-center">
          <p className="text-sm font-semibold text-destructive">Kayıt bulunamadı.</p>
          <Button variant="outline" size="sm" onClick={handleBack} className="mt-3 text-xs h-8">
            Geri Dön
          </Button>
        </div>
      </AppLayout>
    );
  }

  const material = data.material || data;
  const facilityItem = data.facilityItem;
  const auditLogs: any[] = material.auditLogs || [];

  const renderField = (title: string, content: string | null | undefined) => {
    if (!content || !content.trim()) return null;
    return (
      <div className="space-y-0.5 py-1.5 border-b border-border/40 last:border-b-0">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
          {title}
        </span>
        <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
          {content}
        </p>
      </div>
    );
  };

  const getInitials = (name: string) => {
    if (!name) return 'S';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const hasEmergencyInfo = Boolean(
    material.hazardDescription ||
    material.firstAid ||
    material.fireFightingMeasures ||
    material.accidentalReleaseMeasures
  );

  const hasUsageInfo = Boolean(
    material.usageMethod ||
    material.composition ||
    material.handlingAndStorage ||
    material.exposureControlsPpe ||
    material.disposalConsiderations ||
    material.transportInfo
  );

  const hasTechnicalInfo = Boolean(
    material.physicalAndChemicalProperties ||
    material.stabilityAndReactivity ||
    material.toxicologicalInformation ||
    material.ecologicalInformation ||
    material.regulatoryInfo
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-4 pb-8 font-sans antialiased">
        {/* Top Header - Compact */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleBack}
              className="h-8 w-8 rounded-lg shrink-0 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {material.productName}
                </h1>
                {material.category?.name && (
                  <Badge variant="outline" className="text-[11px] font-normal bg-muted/40 px-2 py-0 h-5">
                    {material.category.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {material.brandName ? `Marka: ${material.brandName}` : 'Marka Belirtilmemiş'}
              </p>
            </div>
          </div>

          {/* Action Buttons - İkon Butonlar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {material.sdsExpiryDate && (
              <Badge
                variant="outline"
                className="h-8 text-[11px] font-medium border-border/80 bg-muted/30 gap-1.5 px-2.5 text-muted-foreground"
                title="SDS Geçerlilik Tarihi"
              >
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                SDS: {new Date(material.sdsExpiryDate).toLocaleDateString('tr-TR')}
              </Badge>
            )}

            {material.sdsUrl && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 shadow-2xs shrink-0"
                title="Güvenlik Bilgi Formu (SDS) Belgesini Aç"
                asChild
              >
                <a href={`${BASE_URL}${material.sdsUrl}`} target="_blank" rel="noreferrer">
                  <FileText className="w-4 h-4" />
                </a>
              </Button>
            )}

            <Button
              onClick={() => setPrintModalOpen(true)}
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shadow-2xs shrink-0"
              title="Bilgi Kartı Yazdır"
            >
              <Printer className="w-4 h-4" />
            </Button>

            <Button
              onClick={() =>
                navigate(`/hazmat/materials/edit/${id}`, {
                  state: { returnTo: returnTo || '/hazmat/materials' }
                })
              }
              size="icon"
              className="h-8 w-8 rounded-lg shadow-sm shrink-0"
              title="Düzenle"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation - Compact */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted/60 p-0.5 border border-border/60 rounded-lg h-8 inline-flex">
              <TabsTrigger
                value="details"
                className="gap-1.5 text-xs font-semibold py-1 px-3 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
              >
                <FlaskConical className="w-3.5 h-3.5 text-primary" />
                Ürün Detayları & Güvenlik
              </TabsTrigger>
              <TabsTrigger
                value="audit"
                className="gap-1.5 text-xs font-semibold py-1 px-3 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
              >
                <Clock className="w-3.5 h-3.5 text-primary" />
                İşlem Geçmişi
                {auditLogs.length > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0 h-4 rounded-full bg-primary/10 text-primary font-bold">
                    {auditLogs.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* SEKME 1: Ürün Detayları & Güvenlik */}
          <TabsContent value="details" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              {/* SOL KOLON: Tek Birleşik Ürün Kimlik, Miktar ve Tehlike Sınıfları Kartı */}
              <div className="lg:col-span-1">
                <Card className="border border-border/70 shadow-2xs rounded-lg overflow-hidden">
                  {/* 1. Ürün Görseli */}
                  <div className="p-3 bg-muted/10 flex flex-col items-center justify-center min-h-[150px] border-b border-border/50">
                    {material.imageUrl ? (
                      <img
                        src={`${BASE_URL}${material.imageUrl}`}
                        alt={material.productName}
                        className="max-w-full max-h-44 object-contain rounded-md p-1 bg-white shadow-2xs border border-border/60"
                      />
                    ) : (
                      <div className="text-center py-3">
                        <div className="w-10 h-10 bg-muted/80 rounded-xl mx-auto flex items-center justify-center mb-1.5 text-muted-foreground">
                          <FlaskConical className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-foreground">{material.productName}</p>
                        <p className="text-[10px] text-muted-foreground">Görsel Yüklenmemiş</p>
                      </div>
                    )}
                  </div>

                  {/* 2. Miktar / Ambalaj */}
                  <div className="p-3 border-b border-border/50 flex items-center justify-between bg-card">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Miktar / Ambalaj
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {facilityItem?.amountValue
                        ? `${facilityItem.amountValue} ${facilityItem.unit?.symbol || facilityItem.unit?.name || ''}`
                        : (material.amountValue
                          ? `${material.amountValue} ${material.unit?.symbol || material.unit?.name || ''}`
                          : 'Belirtilmemiş')}
                    </span>
                  </div>

                  {/* 3. GHS Tehlike Piktogramları */}
                  <div className="p-3 border-b border-border/50 space-y-2 bg-card">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                        GHS Tehlike Piktogramları
                      </span>
                    </div>
                    {material.hazardLabels && material.hazardLabels.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {material.hazardLabels.map((hl: any) => (
                          <div
                            key={hl.id || hl.label?.id}
                            title={hl.label?.name}
                            className="flex flex-col items-center bg-muted/20 p-1.5 rounded-lg border border-border/70 shadow-2xs w-[76px] text-center gap-1"
                          >
                            {hl.label?.imageUrl ? (
                              <img
                                src={hl.label.imageUrl}
                                alt={hl.label.name}
                                className="w-10 h-10 object-contain bg-white rounded-md p-0.5"
                              />
                            ) : (
                              <span className="text-[10px]">{hl.label?.name}</span>
                            )}
                            <span className="text-[9px] font-medium text-foreground leading-tight line-clamp-2">
                              {hl.label?.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">GHS işareti bulunmuyor</p>
                    )}
                  </div>

                  {/* 4. TDR (ADR) Taşıma İşaretleri */}
                  <div className="p-3 border-b border-border/50 space-y-2 bg-card">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                        TDR (ADR) Taşıma İşaretleri
                      </span>
                    </div>
                    {material.adrLabels && material.adrLabels.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {material.adrLabels.map((al: any) => (
                          <div
                            key={al.id || al.label?.id}
                            title={al.label?.name}
                            className="flex flex-col items-center bg-muted/20 p-1.5 rounded-lg border border-border/70 shadow-2xs w-[76px] text-center gap-1"
                          >
                            {al.label?.imageUrl ? (
                              <img
                                src={al.label.imageUrl}
                                alt={al.label.name}
                                className="w-10 h-10 object-contain bg-white rounded-md p-0.5"
                              />
                            ) : (
                              <span className="text-[10px]">{al.label?.name}</span>
                            )}
                            <span className="text-[9px] font-medium text-foreground leading-tight line-clamp-2">
                              {al.label?.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">ADR işareti bulunmuyor</p>
                    )}
                  </div>

                  {/* 5. Kişisel Koruyucu Donanımlar (KKD) */}
                  <div className="p-3 space-y-2 bg-card">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                        Kişisel Koruyucu Donanımlar (KKD)
                      </span>
                    </div>
                    {material.ppes && material.ppes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {material.ppes.map((p: any) => (
                          <div
                            key={p.id || p.ppe?.id}
                            title={p.ppe?.name}
                            className="flex flex-col items-center bg-muted/20 p-1.5 rounded-lg border border-border/70 shadow-2xs w-[76px] text-center gap-1"
                          >
                            {p.ppe?.imageUrl ? (
                              <img
                                src={p.ppe.imageUrl}
                                alt={p.ppe.name}
                                className="w-10 h-10 object-contain rounded-full bg-blue-50/60 p-0.5"
                              />
                            ) : (
                              <span className="text-[10px]">{p.ppe?.name}</span>
                            )}
                            <span className="text-[9px] font-medium text-foreground leading-tight line-clamp-2">
                              {p.ppe?.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Özel KKD bulunmuyor</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* SAĞ KOLON: Birleşik 16 Resmî Bölümlü GBF Görünümü (Hem yeni hem eski kayıtlar için) */}
              <div className="lg:col-span-2 space-y-4">
                {(material.sdsNumber || material.sdsRevision || material.sdsRegime || material.productKind) && (
                  <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border/70 bg-card text-xs shadow-2xs">
                    {material.sdsNumber && <Badge variant="secondary">GBF No: {material.sdsNumber}</Badge>}
                    {material.sdsRevision && <Badge variant="outline">Rev: {material.sdsRevision}</Badge>}
                    {material.sdsRegime && <Badge variant="outline">{material.sdsRegime}</Badge>}
                    {material.productKind && <Badge variant="outline" className="capitalize">{material.productKind}</Badge>}
                  </div>
                )}
                <GbfStructuredViewer doc={hydrateGbfFromMaterial(material)} />
              </div>
            </div>
          </TabsContent>

          {/* SEKME 2: İşlem Geçmişi & Denetim İzi - COMPACT & MODERN */}
          <TabsContent value="audit" className="space-y-3 mt-0">
            {/* Üst İstatistikler - Kompakt Tek Satır Şerit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 px-3.5 rounded-lg border border-border/70 bg-card flex items-center gap-2.5 shadow-2xs">
                <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <History className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Toplam İşlem
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-foreground">
                    {auditLogs.length} Kayıt
                  </span>
                </div>
              </div>

              <div className="p-2.5 px-3.5 rounded-lg border border-border/70 bg-card flex items-center gap-2.5 shadow-2xs">
                <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Kayıt Oluşturma
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-foreground">
                    {material.createdAt
                      ? new Date(material.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
                      : '-'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 px-3.5 rounded-lg border border-border/70 bg-card flex items-center gap-2.5 shadow-2xs">
                <div className="w-7 h-7 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Son Güncelleme
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-foreground">
                    {material.updatedAt
                      ? new Date(material.updatedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* İşlem Geçmişi Liste / Timeline Kartı - Kompakt & Sade */}
            <Card className="border border-border/70 shadow-2xs rounded-lg overflow-hidden">
              <CardHeader className="p-3 px-4 border-b border-border/60 bg-muted/15">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-foreground">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      İşlem Geçmişi & Denetim İzi
                    </CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                      Bu tehlikeli madde üzerinde gerçekleştirilen tüm oluşturma ve güncelleme adımları.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 font-semibold">
                    {auditLogs.length} Kayıt
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 px-4">
                {auditLogs.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {auditLogs.map((log: any) => {
                      const displayName = log.userFullName || log.username || 'Sistem Kullanıcısı';
                      const isCreate = log.action === 'CREATE';

                      return (
                        <div key={log.id} className="py-2.5 first:pt-1 last:pb-1 flex items-start gap-3">
                          {/* User Avatar */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                            isCreate
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                          }`}>
                            {getInitials(displayName)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-foreground">
                                  {displayName}
                                </span>
                                {log.userFullName && log.username && log.userFullName !== log.username && (
                                  <span className="text-[10px] text-muted-foreground">
                                    (@{log.username})
                                  </span>
                                )}
                                <Badge
                                  className={`text-[9px] px-1.5 py-0 h-4 font-semibold border ${
                                    isCreate
                                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
                                      : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25'
                                  }`}
                                >
                                  {isCreate ? 'Oluşturuldu' : 'Güncellendi'}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {new Date(log.createdAt).toLocaleString('tr-TR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Details text */}
                            <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
                              {log.details || (isCreate ? 'Yeni tehlikeli madde kaydı sisteme eklendi.' : 'Madde bilgileri güncellendi.')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-1.5">
                    <History className="w-7 h-7 text-muted-foreground/40" />
                    <p className="text-xs font-medium">Bu maddeye ait henüz bir işlem geçmişi bulunmuyor.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Print Modal */}
        {material && (
          <PrintCardModal
            isOpen={printModalOpen}
            onClose={() => setPrintModalOpen(false)}
            material={material}
          />
        )}
      </div>
    </AppLayout>
  );
}
