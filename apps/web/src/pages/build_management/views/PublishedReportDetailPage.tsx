import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  TrendingUp,
  Printer,
  Edit3,
  Search,
  ChevronDown,
  MessageSquare,
  Plus,
  Upload,
  X,
  Users,
  ClipboardList,
  MapPin,
  Tag,
  Loader2,
  Trash2,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import { useIRSC } from '../context/IRSCContext';
import { useAuth } from '@/context/AuthContext';
import {
  type ActionStep,
  type Finding,
  type StepStatus,
  type ImprovementStatus,
  RISK_COLORS,
  normalizeRiskLevel,
  getRiskBadgeClass,
  getRiskBorderClass,
} from '../types';
import { saveAudit, uploadAuditFiles, deleteAudit } from '../services/auditApi';
import ReportTemplate from './ReportTemplate';
import { AUDIT_RICH_CONTENT_CLASS } from '../components/AuditRichTextEditor';
import { AuditActionStepDialog } from '../components/AuditActionStepDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface PublishedReportDetailPageProps {
  reportId: string;
}

export default function PublishedReportDetailPage({ reportId }: PublishedReportDetailPageProps) {
  const { audits, setAudits, facilities, departments } = useIRSC();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isManager = !!(
    user?.isAdmin ||
    user?.isManagement ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('management') ||
    user?.roles?.includes('safety')
  );

  const canDeletePublished = !!(
    user?.isAdmin ||
    user?.isManagement ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('management')
  );

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmUsername, setConfirmUsername] = useState('');
  const [deletingReport, setDeletingReport] = useState(false);

  const audit = useMemo(() => audits.find((a) => a.id === reportId), [audits, reportId]);
  const facility = useMemo(
    () => facilities.find((f) => f.id === audit?.meta?.locationId),
    [facilities, audit?.meta?.locationId]
  );

  const [activeTab, setActiveTab] = useState<'FINDINGS' | 'SUMMARY' | 'ANALYTICS' | 'PRINT'>('FINDINGS');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL_HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [expandedFindings, setExpandedFindings] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Aksiyon ekleme state'i (yayınlanmış rapordaki bulgulara aksiyon girişi)
  const [actionFormFindingId, setActionFormFindingId] = useState<string | null>(null);
  const [newAction, setNewAction] = useState<Partial<ActionStep>>({
    department: '',
    title: '',
    explanation: '',
    status: 'Devam Ediyor',
    actionDate: new Date().toISOString().split('T')[0],
    files: [],
  });
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [savingAction, setSavingAction] = useState(false);

  const sanitizePdfPart = (val: string) =>
    val
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, '_');
  const pdfFileName = [
    sanitizePdfPart(audit?.meta?.reportNo || ''),
    sanitizePdfPart(facility?.name || ''),
  ]
    .filter(Boolean)
    .join('_') || 'IRSC_Denetim_Raporu';

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: pdfFileName,
  });

  if (!audit) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-muted mx-auto flex items-center justify-center text-muted-foreground">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">Rapor Bulunamadı</h3>
            <p className="text-sm text-muted-foreground">
              Aradığınız denetim raporu silinmiş veya bu rapora erişim yetkiniz bulunmuyor.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/renovation-report/reports')} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Rapor Listesine Dön
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Standart kullanıcı taslak rapora URL ile girmeye çalışırsa engelle
  if (!isManager && audit.status !== 'PUBLISHED') {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">Erişim Yetkisi Yok</h3>
            <p className="text-sm text-muted-foreground">
              Bu rapor henüz yayınlanmamış (taslak) aşamasındadır. Yalnızca yayınlanmış raporlar görüntülenebilir.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/renovation-report/reports')}>
            Yayınlanan Raporlara Dön
          </Button>
        </CardContent>
      </Card>
    );
  }

  const findings: Finding[] = Array.isArray(audit.findings) ? audit.findings : [];
  const totalFindings = findings.length;
  const closedFindings = findings.filter((f) => f.status === 'Tamamlanan').length;
  const openFindings = totalFindings - closedFindings;
  const criticalHighOpen = findings.filter(
    (f) =>
      f.status !== 'Tamamlanan' &&
      ['Kritik', 'Yüksek'].includes(normalizeRiskLevel(f.risk))
  ).length;
  const improvementRate = totalFindings > 0 ? Math.round((closedFindings / totalFindings) * 100) : 0;

  const filteredFindings = findings.filter((f) => {
    const isClosed = f.status === 'Tamamlanan';
    if (statusFilter === 'OPEN' && isClosed) return false;
    if (statusFilter === 'CLOSED' && !isClosed) return false;

    const normRisk = normalizeRiskLevel(f.risk);
    const isCritHigh = normRisk === 'Kritik' || normRisk === 'Yüksek';
    const isMed = normRisk === 'Önemli';
    if (riskFilter === 'CRITICAL_HIGH' && !isCritHigh) return false;
    if (riskFilter === 'MEDIUM' && !isMed) return false;
    if (riskFilter === 'LOW' && (isCritHigh || isMed)) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const locStr = [f.building, f.floor, f.department, f.room, f.area, f.subarea].filter(Boolean).join(' ').toLowerCase();
    return (
      (f.no || '').toLowerCase().includes(q) ||
      (f.findingDesc || '').toLowerCase().includes(q) ||
      (f.recommendation || '').toLowerCase().includes(q) ||
      (f.category || '').toLowerCase().includes(q) ||
      locStr.includes(q)
    );
  });

  const riskChartData = Object.entries(
    findings.reduce((acc, f) => {
      const k = normalizeRiskLevel(f.risk);
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value, color: RISK_COLORS[normalizeRiskLevel(name)] || '#64748b' }));

  const categoryBreakdown = Object.entries(
    findings.reduce((acc, f) => {
      const cat = f.category || 'Diğer';
      if (!acc[cat]) acc[cat] = { total: 0, open: 0 };
      acc[cat].total++;
      if (f.status !== 'Tamamlanan') acc[cat].open++;
      return acc;
    }, {} as Record<string, { total: number; open: number }>)
  ).sort((a, b) => b[1].total - a[1].total);

  const formatDate = (val?: string) => {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toLocaleDateString('tr-TR');
  };

  const handleSaveActionStep = async (findingId: string) => {
    if (!newAction.department || !newAction.explanation?.trim()) {
      toast.error('Lütfen sorumlu birim ve aksiyon açıklamasını doldurun.');
      return;
    }

    setSavingAction(true);
    try {
      const updatedFindings = findings.map((f) => {
        if (f.id !== findingId) return f;
        const step: ActionStep = {
          id: `step_${Date.now()}`,
          department: newAction.department!,
          title: newAction.title?.trim() || 'Aksiyon Güncellemesi',
          order: (f.steps?.length || 0) + 1,
          status: (newAction.status as StepStatus) || 'Devam Ediyor',
          actionDate: newAction.actionDate || new Date().toISOString().split('T')[0],
          files: newAction.files || [],
          explanation: newAction.explanation!.trim(),
        };
        const nextStatus: ImprovementStatus =
          newAction.status === 'Tamamlandı'
            ? 'Tamamlanan'
            : newAction.status === 'Devam Ediyor'
              ? 'Kısmen İyileştirilen'
              : f.status;

        return {
          ...f,
          status: nextStatus,
          steps: [...(f.steps || []), step],
        };
      });

      const payload = {
        ...audit,
        findings: updatedFindings,
      };

      const saved = await saveAudit(payload as any, audit.meta.locationId);
      setAudits(audits.map((a) => (a.id === audit.id ? saved : a)));
      setActionFormFindingId(null);
      setNewAction({
        department: '',
        title: '',
        explanation: '',
        status: 'Devam Ediyor',
        actionDate: new Date().toISOString().split('T')[0],
        files: [],
      });
      toast.success('Aksiyon adımı rapora kaydedildi.');
    } catch (err) {
      console.error('Aksiyon kaydedilemedi:', err);
      toast.error('Aksiyon kaydedilirken hata oluştu.');
    } finally {
      setSavingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık ve Aksiyon Barı */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/renovation-report/reports')}
            aria-label="Rapor listesine dön"
            className="h-9 w-9 shrink-0 mt-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {audit.meta?.reportNo || 'Denetim Raporu'}
              </h1>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Yayınlandı
              </Badge>
              {facility && (
                <Badge variant="outline" className="gap-1">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  {facility.name}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap tabular-nums">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Rapor Tarihi: {formatDate(audit.meta?.reportDate)}
              </span>
              {audit.meta?.start && (
                <>
                  <span>•</span>
                  <span>
                    Denetim Dönemi: {formatDate(audit.meta.start)}
                    {audit.meta.end ? ` – ${formatDate(audit.meta.end)}` : ''}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveTab('PRINT');
              setTimeout(() => handlePrint(), 150);
            }}
            className="gap-1.5"
          >
            <Printer className="w-4 h-4" />
            PDF / Yazdır
          </Button>
          {isManager && (
            <Button
              size="sm"
              onClick={() => navigate(`/renovation-report/workspace/${audit.id}`)}
              className="gap-1.5"
            >
              <Edit3 className="w-4 h-4" />
              Çalışma Alanında Aç
            </Button>
          )}
          {canDeletePublished && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConfirmUsername('');
                setDeleteModalOpen(true);
              }}
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Raporu Sil
            </Button>
          )}
        </div>
      </div>

      {/* 4 Özet KPI Kartı */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Toplam Bulgu</p>
              <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{totalFindings}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Açık Bulgu</p>
              <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400 mt-1">
                {openFindings}
              </p>
              <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                {criticalHighOpen} kritik / yüksek
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tamamlanan</p>
              <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                {closedFindings}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">İyileştirme Oranı</p>
                <p className="text-2xl font-bold tabular-nums text-foreground mt-1">%{improvementRate}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${improvementRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sekmeli Rapor Detay İçeriği */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="grid w-full sm:w-fit grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="FINDINGS" className="text-xs py-2">
            Bulgular &amp; Aksiyonlar ({totalFindings})
          </TabsTrigger>
          <TabsTrigger value="SUMMARY" className="text-xs py-2">
            Rapor Bilgileri &amp; Özet
          </TabsTrigger>
          <TabsTrigger value="ANALYTICS" className="text-xs py-2">
            Analiz &amp; Grafikler
          </TabsTrigger>
          <TabsTrigger value="PRINT" className="text-xs py-2">
            Resmi Rapor (PDF)
          </TabsTrigger>
        </TabsList>

        {/* SEKME 1: BULGULAR & AKSİYONLAR */}
        <TabsContent value="FINDINGS" className="space-y-4 mt-0">
          {/* Filtre Barı */}
          <Card>
            <CardContent className="p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Bulgu no, tespit, mahal veya kategori ara..."
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {([
                  { id: 'ALL', label: 'Tüm Riskler' },
                  { id: 'CRITICAL_HIGH', label: 'Kritik / Yüksek' },
                  { id: 'MEDIUM', label: 'Önemli' },
                  { id: 'LOW', label: 'Olası / Önemsiz' },
                ] as const).map((r) => (
                  <Button
                    key={r.id}
                    size="sm"
                    variant={riskFilter === r.id ? 'default' : 'outline'}
                    onClick={() => setRiskFilter(r.id)}
                    className="h-8 text-xs"
                  >
                    {r.label}
                  </Button>
                ))}
                <div className="w-px h-5 bg-border mx-1 hidden sm:block" />
                {([
                  { id: 'ALL', label: 'Tümü' },
                  { id: 'OPEN', label: `Açık (${openFindings})` },
                  { id: 'CLOSED', label: `Tamamlanan (${closedFindings})` },
                ] as const).map((s) => (
                  <Button
                    key={s.id}
                    size="sm"
                    variant={statusFilter === s.id ? 'secondary' : 'ghost'}
                    onClick={() => setStatusFilter(s.id)}
                    className="h-8 text-xs"
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {filteredFindings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Seçili filtrelere uygun bulgu bulunamadı.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredFindings.map((f) => {
                const borderAccent = getRiskBorderClass(f.risk);
                const locationText =
                  [f.building, f.floor, f.department, f.room].filter(Boolean).join(' > ') ||
                  [f.area, f.subarea].filter(Boolean).join(' / ') ||
                  'Mahal belirtilmemiş';
                const assignedDepts = Array.from(
                  new Set([...(f.departments || []), ...(f.steps?.map((s) => s.department) || [])])
                );
                const isOverdue =
                  f.status !== 'Tamamlanan' &&
                  f.targetDate &&
                  new Date(f.targetDate) < new Date();
                const isOpen = expandedFindings[f.id] ?? true;

                return (
                  <Card key={f.id} className={`border-l-4 ${borderAccent} overflow-hidden transition-all duration-200`}>
                    <CardHeader className="p-4 pb-3 bg-muted/20 border-b border-border/60">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground tabular-nums">{f.no}</span>
                          <Badge className={`text-[11px] border ${getRiskBadgeClass(f.risk)}`}>
                            {f.risk}
                          </Badge>
                          {f.category && (
                            <Badge variant="outline" className="text-[11px] gap-1">
                              <Tag className="w-3 h-3" /> {f.category}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[11px] ${f.status === 'Tamamlanan'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              }`}
                          >
                            {f.status || 'Yeni Tespit Edilen'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <span className="max-w-xs truncate" title={locationText}>{locationText}</span>
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              setExpandedFindings((prev) => ({ ...prev, [f.id]: !isOpen }))
                            }
                            aria-label="Detayı aç/kapat"
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {isOpen && (
                      <CardContent className="p-4 space-y-4 text-sm">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Tespit (Mevcut Durum)
                            </span>
                            <p className="text-foreground whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                              {f.findingDesc || 'Belirtilmemiş'}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Risk / Olası Etki
                            </span>
                            <p className="text-foreground whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                              {f.riskDesc || 'Belirtilmemiş'}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                              Öneri / Aksiyon Planı
                            </span>
                            <p className="text-foreground whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                              {f.recommendation || 'Belirtilmemiş'}
                            </p>
                          </div>
                        </div>

                        {/* Meta Satırı + Kanıt Fotoğrafları */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs">
                          <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              Sorumlu:{' '}
                              <strong className="text-foreground">
                                {assignedDepts.length > 0 ? assignedDepts.join(', ') : 'Atanmadı'}
                              </strong>
                            </span>
                            <span
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-md border tabular-nums ${isOverdue
                                ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 font-semibold'
                                : 'bg-muted/40 border-border'
                                }`}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              Termin: {formatDate(f.targetDate)}
                              {isOverdue ? ' (GECİKTİ)' : ''}
                            </span>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActionFormFindingId(f.id)}
                            className="h-8 text-xs gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Süreç / Aksiyon Gir
                          </Button>
                        </div>

                        {f.files && f.files.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {f.files.map((file, idx) => (
                              <div
                                key={idx}
                                className="w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted cursor-pointer hover:border-primary transition-colors"
                                onClick={() => file.type.startsWith('image/') && setPreviewImage(file.url)}
                              >
                                {file.type.startsWith('image/') ? (
                                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                ) : (
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full h-full flex items-center justify-center text-muted-foreground"
                                  >
                                    <FileText className="w-5 h-5" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Mevcut Aksiyon Adımları */}
                        {f.steps && f.steps.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-border/60">
                            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-primary" />
                              Aksiyon ve İyileştirme Süreç Geçmişi ({f.steps.length})
                            </span>
                            <div className="space-y-2">
                              {f.steps.map((step, sIdx) => (
                                <div
                                  key={step.id || sIdx}
                                  className="p-3 rounded-lg border border-border bg-muted/20 space-y-1.5 text-xs"
                                >
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-foreground">
                                        Adım {sIdx + 1}: {step.title || step.department}
                                      </span>
                                      {step.performedByName && (
                                        <span className="text-[11px] text-muted-foreground">
                                          • <strong className="text-foreground">{step.performedByName}</strong>
                                          {step.performedByTitle ? ` (${step.performedByTitle})` : ''}
                                        </span>
                                      )}
                                      {step.department && (
                                        <Badge variant="secondary" className="text-[10px]">
                                          {step.department}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {typeof step.progress === 'number' && (
                                        <Badge variant="outline" className="text-[10px] tabular-nums bg-primary/10 text-primary border-primary/20">
                                          %{step.progress}
                                        </Badge>
                                      )}
                                      {step.actionDate && (
                                        <span className="text-muted-foreground tabular-nums">
                                          {formatDate(step.actionDate)}
                                        </span>
                                      )}
                                      <Badge variant="outline" className="text-[10px]">
                                        {step.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  <p className="text-muted-foreground whitespace-pre-wrap">
                                    {step.explanation}
                                  </p>
                                  {step.files && step.files.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {step.files.map((sf, sfIdx) => (
                                        <div
                                          key={sfIdx}
                                          className="w-12 h-12 rounded-md overflow-hidden border border-border cursor-pointer"
                                          onClick={() => sf.type.startsWith('image/') && setPreviewImage(sf.url)}
                                        >
                                          {sf.type.startsWith('image/') ? (
                                            <img src={sf.url} alt={sf.name} className="w-full h-full object-cover" />
                                          ) : (
                                            <a
                                              href={sf.url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="w-full h-full flex items-center justify-center bg-background text-muted-foreground"
                                            >
                                              <FileText className="w-4 h-4" />
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* SEKME 2: RAPOR BİLGİLERİ & YÖNETİCİ ÖZETİ */}
        <TabsContent value="SUMMARY" className="space-y-4 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Denetim Kapsamı ve Amacı</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {audit.meta?.purpose || 'Denetim amacı girilmemiş.'}
                </p>
                {(audit.meta?.criteria || []).length > 0 && (
                  <div className="pt-3 border-t border-border space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Değerlendirme Kriterleri
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(audit.meta.criteria || []).filter(Boolean).map((c: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Değerlendirme Ekibi &amp; Katılımcılar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <span className="font-semibold text-muted-foreground uppercase block mb-1.5">
                    Değerlendirme Ekibi
                  </span>
                  {(audit.meta?.team || []).filter(Boolean).length > 0 ? (
                    <ul className="space-y-1 text-foreground">
                      {(audit.meta.team || []).filter(Boolean).map((t: string, i: number) => (
                        <li key={i} className="px-2.5 py-1.5 rounded-md bg-muted/40 border border-border">
                          {t}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Belirtilmemiş.</p>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground uppercase block mb-1.5">
                    Katılımcılar
                  </span>
                  {(audit.meta?.participants || []).filter(Boolean).length > 0 ? (
                    <ul className="space-y-1 text-foreground">
                      {(audit.meta.participants || []).filter(Boolean).map((p: string, i: number) => (
                        <li key={i} className="px-2.5 py-1.5 rounded-md bg-muted/40 border border-border">
                          {p}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Belirtilmemiş.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {audit.meta?.executiveSummary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Yönetici Özeti</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={AUDIT_RICH_CONTENT_CLASS}
                  dangerouslySetInnerHTML={{ __html: audit.meta.executiveSummary }}
                />
              </CardContent>
            </Card>
          )}

          {audit.meta?.generalConclusion && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Genel Değerlendirme ve Sonuç</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={AUDIT_RICH_CONTENT_CLASS}
                  dangerouslySetInnerHTML={{ __html: audit.meta.generalConclusion }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SEKME 3: ANALİZ & GRAFİKLER */}
        <TabsContent value="ANALYTICS" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Risk Düzeyi Dağılımı</CardTitle>
                <CardDescription>Bu rapordaki bulguların Fine Kinney risk dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center h-56">
                  <div className="w-1/2 h-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskChartData.length ? riskChartData : [{ name: 'Yok', value: 1, color: '#e2e8f0' }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={82}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {(riskChartData.length ? riskChartData : [{ color: '#e2e8f0' }]).map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold tabular-nums text-foreground">{totalFindings}</span>
                      <span className="text-[10px] font-semibold text-muted-foreground">BULGU</span>
                    </div>
                  </div>
                  <div className="w-1/2 pl-5 space-y-2.5 border-l border-border">
                    {riskChartData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          {d.name}
                        </span>
                        <span className="font-semibold tabular-nums text-foreground">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Kategori Dağılımı</CardTitle>
                <CardDescription>Süreç ve kategorilere göre toplam / açık bulgu sayısı</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 pt-2">
                {categoryBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Veri yok.</p>
                ) : (
                  categoryBreakdown.map(([name, stat]) => (
                    <div key={name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate pr-2">{name}</span>
                        <span className="tabular-nums text-muted-foreground">
                          <strong className="text-foreground">{stat.total}</strong> ({stat.open} açık)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${totalFindings > 0 ? (stat.total / totalFindings) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SEKME 4: RESMİ RAPOR ÖNİZLEME & PDF */}
        <TabsContent value="PRINT" className="space-y-4 mt-0">
          <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border border-border">
            <div>
              <h3 className="text-sm font-bold text-foreground">Resmi Denetim Raporu Önizlemesi</h3>
              <p className="text-xs text-muted-foreground">PDF olarak kaydetmek veya yazdırmak için butona basın.</p>
            </div>
            <Button size="sm" onClick={() => handlePrint()} className="gap-1.5">
              <Printer className="w-4 h-4" /> PDF / Yazdır
            </Button>
          </div>
          <div className="bg-muted/40 p-4 rounded-lg border border-border overflow-x-auto flex justify-center">
            <div className="w-[1000px] shadow-xl bg-white border border-border">
              <ReportTemplate
                ref={printRef}
                findings={findings}
                auditMeta={audit.meta}
                facility={facility}
                facilityAudits={audits.filter(
                  (a) => a.meta?.locationId === audit.meta?.locationId && a.status === 'PUBLISHED'
                )}
                logoUrl="https://raw.githubusercontent.com/metinsalik/self-agent/refs/heads/main/mlpcare.jpg"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Ortak Süreç & Aksiyon Giriş Penceresi */}
      <AuditActionStepDialog
        open={Boolean(actionFormFindingId)}
        finding={findings.find((x) => x.id === actionFormFindingId) || null}
        departments={departments}
        facilityId={audit.meta?.locationId}
        facilityName={facility?.name}
        defaultTemplateId="TALEP_ACILDI"
        saving={savingAction}
        onClose={() => setActionFormFindingId(null)}
        onSaveStep={async (findingId, step, nextFindingStatus, nextProgress) => {
          setSavingAction(true);
          try {
            const updatedFindings = findings.map((item) => {
              if (item.id !== findingId) return item;
              return {
                ...item,
                status: nextFindingStatus,
                progress: nextProgress,
                isStarted: true,
                closedInReportNo:
                  nextFindingStatus === 'Tamamlanan'
                    ? audit.meta?.reportNo || item.closedInReportNo || null
                    : null,
                closedAt:
                  nextFindingStatus === 'Tamamlanan'
                    ? step.actionDate || new Date().toISOString().split('T')[0]
                    : null,
                steps: [...(item.steps || []), step],
              };
            });
            const saved = await saveAudit(
              { ...audit, findings: updatedFindings } as any,
              audit.meta.locationId
            );
            setAudits(audits.map((a) => (a.id === audit.id ? saved : a)));
            setActionFormFindingId(null);
            toast.success('Süreç adımı ve aksiyon rapora kaydedildi.');
          } catch (err) {
            console.error('Aksiyon kaydedilemedi:', err);
            toast.error('Aksiyon kaydedilirken hata oluştu.');
          } finally {
            setSavingAction(false);
          }
        }}
      />

      {/* Yayınlanmış Rapor Silme Onay Penceresi */}
      <Dialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          if (!deletingReport) {
            setDeleteModalOpen(open);
            if (!open) setConfirmUsername('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md w-[95vw] rounded-lg border border-border bg-card p-0 overflow-hidden shadow-lg flex flex-col gap-0">
          <DialogHeader className="px-5 py-3.5 bg-muted/30 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                  Yayınlanmış Raporu Sil
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground truncate mt-0.5">
                  {audit.meta?.reportNo || 'Denetim Raporu'}
                  {facility ? ` — ${facility.name}` : ''}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const expected = (user?.username || '').trim().toLowerCase();
              if (!expected || confirmUsername.trim().toLowerCase() !== expected) {
                toast.error('Kullanıcı adınız eşleşmiyor.');
                return;
              }
              setDeletingReport(true);
              try {
                await deleteAudit(audit.id, confirmUsername.trim());
                setAudits(audits.filter((a) => a.id !== audit.id));
                setDeleteModalOpen(false);
                toast.success('Yayınlanmış rapor kalıcı olarak silindi.');
                navigate('/renovation-report/reports');
              } catch (err: any) {
                toast.error(err?.message || 'Rapor silinemedi.');
              } finally {
                setDeletingReport(false);
              }
            }}
            className="flex flex-col"
          >
            <div className="p-5 space-y-4">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive leading-relaxed">
                  Bu işlem <strong>geri alınamaz</strong>. Yayınlanmış denetim raporu, tüm bulguları ({totalFindings} adet) ve aksiyon geçmişi kalıcı olarak silinecektir.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block">
                  Onaylamak için kullanıcı adınızı (
                  <span className="font-mono font-semibold text-destructive">{user?.username}</span>
                  ) yazın *
                </label>
                <Input
                  value={confirmUsername}
                  onChange={(e) => setConfirmUsername(e.target.value)}
                  placeholder={user?.username || 'Kullanıcı adınız'}
                  autoComplete="off"
                  className="h-9 rounded-lg text-xs font-mono"
                  disabled={deletingReport}
                  required
                />
              </div>
            </div>

            <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-3.5 bg-muted/30 border-t border-border shrink-0 gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setConfirmUsername('');
                }}
                disabled={deletingReport}
                className="h-8 rounded-lg text-xs"
              >
                Vazgeç
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={
                  deletingReport ||
                  !user?.username ||
                  confirmUsername.trim().toLowerCase() !== user.username.trim().toLowerCase()
                }
                className="h-8 px-4 rounded-lg text-xs font-semibold gap-1.5"
              >
                {deletingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Kalıcı Olarak Sil
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Görsel Önizleme Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setPreviewImage(null)}
              aria-label="Önizlemeyi kapat"
              className="absolute top-4 right-4 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
            <img
              src={previewImage}
              alt="Kanıt önizleme"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
