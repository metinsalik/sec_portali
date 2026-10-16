import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  Zap, ArrowRight, AlertTriangle, CheckCircle2, Clock, 
  Calendar, Building2, DollarSign, Activity, FileCheck2,
  RefreshCw, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  type FacilityOption, 
  IMPROVEMENT_SHEET_DEFINITIONS 
} from './types';
import { useGroupStatsQuery } from './hooks/useImprovementsQueries';

export const GroupDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedFacilityId, facilities } = useOutletContext<{
    selectedFacilityId: string;
    facilities: FacilityOption[];
  }>();

  const { data: stats, isLoading, refetch } = useGroupStatsQuery(
    'ELEKTRIK_BAKIM_KONTROL',
    selectedFacilityId
  );

  const selectedFacilityName = React.useMemo(() => {
    if (selectedFacilityId === 'ALL') return 'Tüm Hastaneler';
    const found = facilities.find((f) => f.id === selectedFacilityId);
    return found ? found.name : 'Seçili Hastane';
  }, [selectedFacilityId, facilities]);

  const kpis = stats?.groupKpis || {
    totalFindings: 0,
    completed: 0,
    completionRateDisplay: '0%',
    openCritical: 0,
    totalActionsCost: 0,
  };

  const opMetrics = stats?.operationMetrics || {
    totalHospitals: facilities.length,
    facilitiesWithReports: 0,
    overdueReports: 0,
    clearReports: 0,
    findingsReports: 0,
  };

  const groupSummary = stats?.groupSummaryTable || [];
  const hospitalMatrix = stats?.hospitalOperationTable || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── GRUP BAŞLIĞI ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center font-bold shadow-sm">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Elektrik & Periyodik Kontroller Grubu
              </h1>
              <Badge variant="outline" className="text-xs font-semibold border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40">
                8 Alt Takip Alanı
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kapsam: <span className="font-semibold text-foreground">{selectedFacilityName}</span> • Trafo, pano, jeneratör, topraklama ve periyodik kontrol operasyonları konsolide görünümü.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/operations-management/improvements/electrical/elektrik-pk')}
            className="h-8 text-xs gap-1.5 shadow-sm"
          >
            Tablolara Git
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ── 5 GRUP KPI KARTLARI ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Toplam Bulgu</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-foreground">
              {kpis.totalFindings.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">8 elektrik alanında</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tamamlanan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {kpis.completed.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">kapatılan uygunsuzluk</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tamamlanma Oranı</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-primary">
              {kpis.completionRateDisplay}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">net aksiyon başarı oranı</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Açık Kritik Bulgu</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {kpis.openCritical.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">acil müdahale gereken</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs col-span-2 md:col-span-1">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Aksiyon Maliyeti</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              ₺{kpis.totalActionsCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">toplam aksiyon harcaması</p>
          </CardContent>
        </Card>
      </div>

      {/* ── OPERASYON & RAPORLAMA METRİKLERİ BANDI ───────────────── */}
      <Card className="border-border bg-muted/20 shadow-xs">
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{opMetrics.totalHospitals}</div>
              <div className="text-[11px] text-muted-foreground">Toplam Hastane</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center text-blue-600">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{opMetrics.facilitiesWithReports}</div>
              <div className="text-[11px] text-muted-foreground">Raporu Girilen</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center text-rose-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400">{opMetrics.overdueReports}</div>
              <div className="text-[11px] text-muted-foreground">Süresi Geçen PK</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{opMetrics.clearReports}</div>
              <div className="text-[11px] text-muted-foreground">Temiz Rapor</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{opMetrics.findingsReports}</div>
              <div className="text-[11px] text-muted-foreground">Bulgulu Rapor</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 8 ALT ALAN GRUP ÖZET TABLOSU ─────────────────────────── */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="p-4 pb-2 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              Elektrik Takip Alanları İcmali
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              8 elektrik alt tablosundaki bulgu sayıları ve net başarı durumları
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {groupSummary.length} Alan
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="py-2.5 px-3">Takip Alanı</th>
                  <th className="py-2.5 px-3 text-center">Toplam</th>
                  <th className="py-2.5 px-3 text-center">Tamamlanan</th>
                  <th className="py-2.5 px-3 text-center">Açık / Devam</th>
                  <th className="py-2.5 px-3 text-center">Başarı Oranı</th>
                  <th className="py-2.5 px-3 text-center">Kritik</th>
                  <th className="py-2.5 px-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {groupSummary.map((row) => (
                  <tr key={row.sheetType} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>{row.label}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-foreground">
                      {row.total}
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                      {row.completed}
                    </td>
                    <td className="py-2.5 px-3 text-center text-blue-600 dark:text-blue-400 font-medium">
                      {row.open}
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
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/operations-management/improvements/${row.path}`)}
                        className="h-6 text-[11px] gap-1 px-2 text-primary hover:text-primary hover:bg-primary/10"
                      >
                        Tabloya Git
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

      {/* ── HASTANE OPERASYON MATRİSİ ────────────────────────────── */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="p-4 pb-2 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              Hastane Operasyon ve Periyodik Kontrol Durumları
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tüm hastanelerin periyodik muayene ve bakım takvimleri, gecikme durumları ve açık bulguları
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
                  <th className="py-2.5 px-3 text-center">Son Kontrol</th>
                  <th className="py-2.5 px-3 text-center">Sonraki Kontrol</th>
                  <th className="py-2.5 px-3 text-center">Kontrol Durumu</th>
                  <th className="py-2.5 px-3 text-center">Son Bakım</th>
                  <th className="py-2.5 px-3 text-center">Sonraki Bakım</th>
                  <th className="py-2.5 px-3 text-center">Bakım Durumu</th>
                  <th className="py-2.5 px-3 text-center">Açık Bulgu</th>
                  <th className="py-2.5 px-3 text-center">Kritik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {hospitalMatrix.map((h) => (
                  <tr key={h.facilityId} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>{h.facilityName}</span>
                      </div>
                    </td>

                    {/* Son Kontrol Tarihi */}
                    <td className="py-2.5 px-3 text-center text-muted-foreground">
                      {h.latestInspectionDate ? new Date(h.latestInspectionDate).toLocaleDateString('tr-TR') : '-'}
                    </td>

                    {/* Sonraki Kontrol Tarihi */}
                    <td className="py-2.5 px-3 text-center text-muted-foreground">
                      {h.nextInspectionDate ? new Date(h.nextInspectionDate).toLocaleDateString('tr-TR') : '-'}
                    </td>

                    {/* Kontrol Durumu / Gecikme */}
                    <td className="py-2.5 px-3 text-center">
                      {h.isInspectionOverdue ? (
                        <Badge variant="destructive" className="text-[10px] gap-1 px-1.5">
                          <Clock className="w-2.5 h-2.5" />
                          Gecikti
                        </Badge>
                      ) : h.inspectionResult ? (
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            h.inspectionResult === 'CLEAR'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {h.inspectionResult === 'CLEAR' ? 'Temiz' : 'Bulgulu'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Son Bakım Tarihi */}
                    <td className="py-2.5 px-3 text-center text-muted-foreground">
                      {h.latestMaintenanceDate ? new Date(h.latestMaintenanceDate).toLocaleDateString('tr-TR') : '-'}
                    </td>

                    {/* Sonraki Bakım Tarihi */}
                    <td className="py-2.5 px-3 text-center text-muted-foreground">
                      {h.nextMaintenanceDate ? new Date(h.nextMaintenanceDate).toLocaleDateString('tr-TR') : '-'}
                    </td>

                    {/* Bakım Durumu */}
                    <td className="py-2.5 px-3 text-center">
                      {h.isMaintenanceOverdue ? (
                        <Badge variant="destructive" className="text-[10px] gap-1 px-1.5">
                          <Clock className="w-2.5 h-2.5" />
                          Gecikti
                        </Badge>
                      ) : h.maintenanceResult ? (
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            h.maintenanceResult === 'CLEAR'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {h.maintenanceResult === 'CLEAR' ? 'Temiz' : 'Bulgulu'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Açık Bulgu Sayısı */}
                    <td className="py-2.5 px-3 text-center font-semibold text-foreground">
                      {h.openCount}
                    </td>

                    {/* Kritik Bulgu Sayısı */}
                    <td className="py-2.5 px-3 text-center">
                      {h.criticalCount > 0 ? (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                          {h.criticalCount}
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
    </div>
  );
};
