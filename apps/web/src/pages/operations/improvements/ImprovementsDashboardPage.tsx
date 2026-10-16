import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Clock, AlertTriangle, ShieldAlert, 
  TrendingUp, Building2, ChevronRight, Layers,
  RefreshCw, Activity, AlertOctagon, Zap, ClipboardList, Shield,
  ArrowRight, Eye, Calendar, DollarSign, UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  type FacilityOption, 
  type ImprovementRecord, 
  IMPROVEMENT_SHEET_DEFINITIONS 
} from './types';
import { 
  useDashboardStatsQuery, 
  useCriticalRecordsQuery 
} from './hooks/useImprovementsQueries';

import { DataQualityNotice } from './components/DataQualityNotice';
import { HospitalFindingAccordion } from './components/HospitalFindingAccordion';
import { CompactInspectDialog } from './components/dialogs/CompactInspectDialog';
import { ActionWorkspaceDialog } from './components/dialogs/ActionWorkspaceDialog';

export const ImprovementsDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedFacilityId, facilities } = useOutletContext<{
    selectedFacilityId: string;
    facilities: FacilityOption[];
  }>();

  // Dashboard Stats & Kritik Kayıtlar
  const { 
    data: stats, 
    isLoading: isStatsLoading, 
    refetch: refetchStats 
  } = useDashboardStatsQuery(selectedFacilityId);

  const { 
    data: criticalRecords = [], 
    isLoading: isCriticalLoading, 
    refetch: refetchCritical 
  } = useCriticalRecordsQuery({
    facilityId: selectedFacilityId === 'ALL' ? undefined : selectedFacilityId,
  });

  // Dialog State
  const [inspectRecord, setInspectRecord] = useState<ImprovementRecord | null>(null);
  const [actionRecord, setActionRecord] = useState<ImprovementRecord | null>(null);

  const handleRefresh = () => {
    refetchStats();
    refetchCritical();
  };

  const kpis = stats?.kpis || {
    totalFindings: 0,
    completed: 0,
    completionRateDisplay: '0%',
    completionRate: 0,
    hasIncompleteStatus: false,
    openCritical: 0,
    openHigh: 0,
    missingStatusCount: 0,
    missingRiskCount: 0,
    missingOwnerCount: 0,
  };

  const qualityGrid = stats?.qualityGrid || {
    emptyStatus: 0,
    undefinedStatus: 0,
    emptyRisk: 0,
    undefinedRisk: 0,
    emptyOwner: 0,
    emptyAction: 0,
    emptyDate: 0,
    emptyFacility: 0,
  };

  const areaMatrix = stats?.areaSummaryMatrix || [];
  const hospitalMatrix = stats?.hospitalComparisonMatrix || [];
  const accordionItems = stats?.hospitalFindingAccordion || [];

  const selectedFacilityName = React.useMemo(() => {
    if (selectedFacilityId === 'ALL') return 'Tüm Hastaneler Konsolide';
    const found = facilities.find((f) => f.id === selectedFacilityId);
    return found ? found.name : 'Seçili Hastane';
  }, [selectedFacilityId, facilities]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── ÜST BAŞLIK & YENİLE ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              İyileştirme ve Aksiyon Takip Dashboard
            </h1>
            <Badge variant="outline" className="text-xs font-semibold">
              9 Takip Alanı
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kapsam: <span className="font-semibold text-foreground">{selectedFacilityName}</span> • Denetimler ve elektrik/PK altyapı bulguları yönetim merkezi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isStatsLoading || isCriticalLoading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/operations-management/improvements/critical')}
            className="h-8 text-xs gap-1.5 shadow-sm bg-rose-600 hover:bg-rose-700 text-white"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Kritik Bulgular ({kpis.openCritical})
          </Button>
        </div>
      </div>

      {/* ── 6 KPI KARTLARI (ŞARTNAME STANDARDI) ───────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Toplam Bulgu */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Toplam Bulgu</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-foreground">
              {kpis.totalFindings.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">tüm takip alanları</p>
          </CardContent>
        </Card>

        {/* 2. Tamamlanan */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tamamlanan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {kpis.completed.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">kapatılan aksiyon</p>
          </CardContent>
        </Card>

        {/* 3. Tamamlanma Oranı */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Başarı Oranı</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-primary">
              {kpis.completionRateDisplay}
            </div>
            <div className="w-full bg-muted h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(kpis.completionRate || 0, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 4. Açık Kritik */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Açık Kritik</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {kpis.openCritical.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">yüksek riskli açık</p>
          </CardContent>
        </Card>

        {/* 5. Açık Yüksek */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Açık Yüksek</span>
            <AlertOctagon className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {kpis.openHigh.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">önemli açık kayıt</p>
          </CardContent>
        </Card>

        {/* 6. Eksik / Boş Bilgi */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Eksik Veri</span>
            <ShieldAlert className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {kpis.missingStatusCount + kpis.missingRiskCount + kpis.missingOwnerCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">durum/risk/sorumlu</p>
          </CardContent>
        </Card>
      </div>

      {/* ── VERİ KALİTESİ VE UYARI BANNERI ───────────────────────── */}
      <DataQualityNotice
        notice={stats?.notice || null}
        qualityGrid={qualityGrid}
      />

      {/* ── 9 TAKİP ALANI İCMAL MATRİSİ ──────────────────────────── */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="p-4 pb-2 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              9 Takip Alanı İcmal Matrisi
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Denetim ve 8 elektrik tablosundaki bulguların durum, oran ve kritik dağılımı
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            9 Alan
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="py-2.5 px-3">Takip Alanı</th>
                  <th className="py-2.5 px-3 text-center">Grup</th>
                  <th className="py-2.5 px-3 text-center">Toplam</th>
                  <th className="py-2.5 px-3 text-center">Tamamlanan</th>
                  <th className="py-2.5 px-3 text-center">Devam Eden</th>
                  <th className="py-2.5 px-3 text-center">Başlamadı</th>
                  <th className="py-2.5 px-3 text-center">İptal</th>
                  <th className="py-2.5 px-3 text-center">Başarı Oranı</th>
                  <th className="py-2.5 px-3 text-center">Kritik</th>
                  <th className="py-2.5 px-3 text-center">Aksiyon</th>
                  <th className="py-2.5 px-3 text-right">Git</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {areaMatrix.map((row) => (
                  <tr key={row.sheetType} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {row.moduleGroup === 'DENETIM' ? (
                          <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span>{row.label}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant="outline" className="text-[10px]">
                        {row.moduleGroup === 'DENETIM' ? 'Denetim' : 'Elektrik/PK'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-foreground">
                      {row.total}
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                      {row.completed}
                    </td>
                    <td className="py-2.5 px-3 text-center text-blue-600 dark:text-blue-400">
                      {row.inProgress}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500">
                      {row.notStarted}
                    </td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground">
                      {row.cancelled}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold ${
                          row.completionRateDisplay.includes('%100')
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : row.completionRateDisplay === 'n.a.'
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {row.completionRateDisplay}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.openCritical > 0 ? (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                          {row.openCritical}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground">
                      {row.actionsCount}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/operations-management/improvements/${row.path}`)}
                        className="h-6 text-[11px] gap-1 px-2 text-primary hover:text-primary hover:bg-primary/10"
                      >
                        Aç
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── HASTANELER KARŞILAŞTIRMA MATRİSİ ──────────────────────── */}
      {selectedFacilityId === 'ALL' && hospitalMatrix.length > 0 && (
        <Card className="border-border bg-card shadow-sm overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Hastaneler Karşılaştırma Matrisi
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Grup geneli hastanelerin bulgu sayıları ve tamamlanma başarı oranları
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {hospitalMatrix.length} Hastane
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Hastane</th>
                    <th className="py-2.5 px-3 text-center">Şehir</th>
                    <th className="py-2.5 px-3 text-center">Toplam</th>
                    <th className="py-2.5 px-3 text-center">Tamamlanan</th>
                    <th className="py-2.5 px-3 text-center">Devam Eden</th>
                    <th className="py-2.5 px-3 text-center">Başlamadı</th>
                    <th className="py-2.5 px-3 text-center">Başarı Oranı</th>
                    <th className="py-2.5 px-3 text-center">Kritik</th>
                    <th className="py-2.5 px-3 text-center">Yüksek</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {hospitalMatrix.map((h) => (
                    <tr key={h.facilityId} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{h.facilityName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-muted-foreground">
                        {h.city || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-foreground">
                        {h.total}
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        {h.completed}
                      </td>
                      <td className="py-2.5 px-3 text-center text-blue-600 dark:text-blue-400">
                        {h.inProgress}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">
                        {h.notStarted}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-bold ${
                            h.completionRateDisplay.includes('%100')
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : h.completionRateDisplay === 'n.a.'
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {h.completionRateDisplay}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {h.openCritical > 0 ? (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                            {h.openCritical}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {h.openHigh > 0 ? (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 px-1.5 py-0.5">
                            {h.openHigh}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── 3 SEVİYELİ AKORDİYON (HASTANE -> TAKİP ALANI -> KATEGORİ) */}
      <HospitalFindingAccordion items={accordionItems} />

      {/* ── KRİTİK KALEMLER ÖNİZLEMESİ ───────────────────────────── */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="p-4 pb-2 border-b border-border bg-rose-500/5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Açık Kritik ve Yüksek Riskli Bulgular
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kapatılmamış en acil {Math.min(criticalRecords.length, 10)} bulgu
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/operations-management/improvements/critical')}
            className="h-7 text-xs gap-1 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            Tümünü Gör ({criticalRecords.length})
            <ArrowRight className="w-3 h-3" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {criticalRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Açık kritik veya yüksek riskli bulgu bulunmamaktadır. Tebrikler!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="py-2 px-3">Hastane</th>
                    <th className="py-2 px-3">Alan</th>
                    <th className="py-2 px-3">Risk</th>
                    <th className="py-2 px-3">Tespit / Uygunsuzluk</th>
                    <th className="py-2 px-3">Sorumlu</th>
                    <th className="py-2 px-3">Durum</th>
                    <th className="py-2 px-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {criticalRecords.slice(0, 10).map((r) => (
                    <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-foreground whitespace-nowrap">
                        {r.facility?.name || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                        {IMPROVEMENT_SHEET_DEFINITIONS[r.sheetType]?.label || r.sheetType}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge
                          variant="destructive"
                          className="text-[10px] font-bold"
                        >
                          {r.riskScore}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-foreground line-clamp-2 max-w-md">
                        {r.finding}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                        {r.assignedTo || '-'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            r.status === 'Tamamlandı'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {r.status || 'Açık'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInspectRecord(r)}
                            className="h-6 text-[11px] px-2 text-primary"
                          >
                            İncele
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActionRecord(r)}
                            className="h-6 text-[11px] px-2"
                          >
                            Aksiyon
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── DİALOGLAR ─────────────────────────────────────────── */}
      <CompactInspectDialog
        record={inspectRecord}
        open={!!inspectRecord}
        onOpenChange={(open) => !open && setInspectRecord(null)}
        onOpenActionWorkspace={() => {
          const rec = inspectRecord;
          setInspectRecord(null);
          setActionRecord(rec);
        }}
      />

      <ActionWorkspaceDialog
        record={actionRecord}
        open={!!actionRecord}
        onOpenChange={(open) => !open && setActionRecord(null)}
      />
    </div>
  );
};
