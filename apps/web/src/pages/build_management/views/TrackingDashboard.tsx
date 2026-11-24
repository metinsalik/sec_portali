import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useIRSC } from '../context/IRSCContext';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Plus,
  FileText,
  Clock,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RISK_COLORS, RISK_LEVELS, normalizeRiskLevel, getRiskBadgeClass } from '../types';

export default function TrackingDashboard() {
  const { facilities, audits = [] } = useIRSC();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isManager = !!(
    user?.isAdmin ||
    user?.isManagement ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('management') ||
    user?.roles?.includes('safety')
  );

  // Sol menüdeki FacilitySwitcher ile senkronize aktif tesis
  const [sidebarFacilityId, setSidebarFacilityId] = useState<string>(
    () => localStorage.getItem('activeFacilityId') || 'all'
  );

  useEffect(() => {
    const syncFacility = () => {
      setSidebarFacilityId(localStorage.getItem('activeFacilityId') || 'all');
    };
    window.addEventListener('facilityChanged', syncFacility);
    window.addEventListener('storage', syncFacility);
    return () => {
      window.removeEventListener('facilityChanged', syncFacility);
      window.removeEventListener('storage', syncFacility);
    };
  }, []);

  const facilityMap = useMemo(() => {
    const map = new Map<string, string>();
    facilities.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [facilities]);

  const activeFacilityName =
    sidebarFacilityId && sidebarFacilityId !== 'all'
      ? facilityMap.get(sidebarFacilityId) || 'Seçili Tesis'
      : 'Tüm Tesisler';

  // Rol ve seçili tesise göre görünür denetimler
  const scopedAudits = useMemo(() => {
    const userFacs = user?.facilities || [];
    return audits.filter((a) => {
      const locId = a.meta?.locationId || '';
      // Standart kullanıcılar sadece yayınlanmış ve yetkili oldukları tesislerin raporlarını görür
      if (!isManager) {
        if (a.status !== 'PUBLISHED') return false;
        if (userFacs.length > 0 && !userFacs.includes(locId)) return false;
      }
      // Sol menüde belirli bir tesis seçiliyse ona göre süz
      if (sidebarFacilityId && sidebarFacilityId !== 'all') {
        return locId === sidebarFacilityId;
      }
      return true;
    });
  }, [audits, isManager, user?.facilities, sidebarFacilityId]);

  const {
    publishedCount,
    draftCount,
    totalFindings,
    openTotal,
    closedTotal,
    criticalOpenCount,
    overdueCount,
    improvementRate,
    riskDistribution,
    facilityStats,
    categoryStats,
    recentPublished,
    activeDrafts,
    priorityOpenFindings,
  } = useMemo(() => {
    const publishedAudits = scopedAudits
      .filter((a) => a.status === 'PUBLISHED')
      .sort((a, b) => b.id.localeCompare(a.id));
    const draftAudits = scopedAudits
      .filter((a) => a.status === 'DRAFT')
      .sort((a, b) => b.id.localeCompare(a.id));

    // Her tesisin EN GÜNCEL yayınlanmış raporu üzerinden KPI hesapla
    const latestByFacility: Record<string, any> = {};
    publishedAudits.forEach((audit) => {
      const facId = audit.meta?.locationId;
      if (facId && !latestByFacility[facId]) {
        latestByFacility[facId] = audit;
      }
    });

    const riskCounts: Record<string, number> = {
      'Kritik': 0,
      'Yüksek': 0,
      'Önemli': 0,
      'Olası': 0,
      'Önemsiz': 0,
    };

    const facStatsMap: Record<string, { name: string; Açık: number; Kapalı: number }> = {};
    const catCounts: Record<string, { total: number; open: number }> = {};
    const priorityList: Array<{
      id: string;
      no: string;
      risk: string;
      desc: string;
      facilityName: string;
      auditId: string;
      reportNo: string;
      targetDate?: string;
    }> = [];

    let totalF = 0;
    let openF = 0;
    let closedF = 0;
    let critOpen = 0;
    let overdue = 0;
    const now = new Date();

    Object.values(latestByFacility).forEach((audit: any) => {
      const facId = audit.meta?.locationId || '';
      const facName = facilityMap.get(facId) || 'Tesis';
      if (!facStatsMap[facId]) {
        facStatsMap[facId] = { name: facName, Açık: 0, Kapalı: 0 };
      }

      (audit.findings || []).forEach((finding: any) => {
        totalF++;
        const riskKey = normalizeRiskLevel(finding.risk);
        if (riskCounts[riskKey] !== undefined) {
          riskCounts[riskKey]++;
        }

        const isClosed = finding.status === 'Tamamlanan' || finding.status === 'CLOSED';
        if (isClosed) {
          closedF++;
          facStatsMap[facId].Kapalı++;
        } else {
          openF++;
          facStatsMap[facId].Açık++;
          const isHighCrit = riskKey === 'Kritik' || riskKey === 'Yüksek';
          if (isHighCrit) {
            critOpen++;
            priorityList.push({
              id: finding.id,
              no: finding.no || '-',
              risk: riskKey,
              desc: finding.findingDesc || 'Açıklama belirtilmemiş',
              facilityName: facName,
              auditId: audit.id,
              reportNo: audit.meta?.reportNo || 'Rapor',
              targetDate: finding.targetDate,
            });
          }
          if (finding.targetDate) {
            const td = new Date(finding.targetDate);
            if (!isNaN(td.getTime()) && td < now) {
              overdue++;
            }
          }
        }

        const cat = finding.category || 'Diğer';
        if (!catCounts[cat]) catCounts[cat] = { total: 0, open: 0 };
        catCounts[cat].total++;
        if (!isClosed) catCounts[cat].open++;
      });
    });

    const pieData = Object.keys(riskCounts)
      .filter((k) => riskCounts[k] > 0)
      .map((k) => ({ name: k, value: riskCounts[k] }));

    const barData = Object.values(facStatsMap).filter((f) => f.Açık + f.Kapalı > 0);

    const catData = Object.entries(catCounts)
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    const rate = totalF > 0 ? Math.round((closedF / totalF) * 100) : 0;

    return {
      publishedCount: publishedAudits.length,
      draftCount: draftAudits.length,
      totalFindings: totalF,
      openTotal: openF,
      closedTotal: closedF,
      criticalOpenCount: critOpen,
      overdueCount: overdue,
      improvementRate: rate,
      riskDistribution: pieData,
      facilityStats: barData,
      categoryStats: catData,
      recentPublished: publishedAudits.slice(0, 5),
      activeDrafts: draftAudits.slice(0, 5),
      priorityOpenFindings: priorityList.slice(0, 5),
    };
  }, [scopedAudits, facilityMap]);

  const formatAuditDate = (audit: any) => {
    if (!audit) return '—';
    if (audit.meta?.reportDate) {
      const d = new Date(audit.meta.reportDate);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('tr-TR');
    }
    const ts = parseInt(String(audit.id).split('_')[1], 10);
    if (!isNaN(ts)) return new Date(ts).toLocaleDateString('tr-TR');
    return '—';
  };

  const isSingleFacilityView = Boolean(sidebarFacilityId && sidebarFacilityId !== 'all');

  return (
    <div className="space-y-6">
      {/* Üst Başlık ve Rol Bazlı Aksiyonlar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {isManager ? 'Merkezi Denetim Özeti' : 'Yayınlanmış Denetim Özeti'}
            </h2>
            <Badge variant="outline" className="text-xs font-semibold gap-1">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              {activeFacilityName}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {isManager
              ? 'Sol menüden seçili kapsam için yayınlanmış son denetimlerin yönetici özeti.'
              : 'Yetkili olduğunuz tesislere ait yayınlanmış merkezi denetim raporları ve açık aksiyon özeti.'}
          </p>
        </div>

        {isManager && (
          <Button
            size="sm"
            onClick={() => navigate('/renovation-report/new')}
            className="gap-1.5 transition-all duration-200 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Yeni Denetim
          </Button>
        )}
      </div>

      {/* 4 Yönetici Özet KPI Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="transition-all duration-200 hover:border-primary/40">
          <CardContent className="p-5 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Yayınlanan Rapor</p>
              <p className="text-3xl font-bold tabular-nums text-foreground">{publishedCount}</p>
              <p className="text-[11px] text-muted-foreground">
                {isManager ? `${draftCount} devam eden taslak` : 'Görüntülenebilir rapor'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:border-amber-500/40">
          <CardContent className="p-5 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Aktif Bulgu (Son Rapor)</p>
              <p className="text-3xl font-bold tabular-nums text-foreground">{totalFindings}</p>
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {openTotal} açık • {closedTotal} kapalı
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:border-red-500/40">
          <CardContent className="p-5 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Kritik / Yüksek Açık</p>
              <p className="text-3xl font-bold tabular-nums text-red-600 dark:text-red-400">
                {criticalOpenCount}
              </p>
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {overdueCount > 0 ? `${overdueCount} termin gecikmeli` : 'Geciken termin yok'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:border-emerald-500/40">
          <CardContent className="p-5 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">İyileştirme Oranı</p>
                <p className="text-3xl font-bold tabular-nums text-foreground">%{improvementRate}</p>
              </div>
              <div className="w-11 h-11 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${improvementRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analitik Grafikler Satırı */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col h-[370px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Risk Seviyesi Dağılımı</CardTitle>
            <CardDescription>Fine Kinney risk skorlarına göre aktif bulgu özeti</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            {riskDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="48%"
                    innerRadius={65}
                    outerRadius={102}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RISK_COLORS[normalizeRiskLevel(entry.name)] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} Bulgu`, 'Adet']}
                    contentStyle={{
                      borderRadius: '0.5rem',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--card))',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Seçili kapsamda yayınlanmış denetim bulgusu bulunmuyor.
              </div>
            )}
          </CardContent>
        </Card>

        {!isSingleFacilityView ? (
          <Card className="flex flex-col h-[370px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tesis Bazlı Bulgu Özeti</CardTitle>
              <CardDescription>Denetim yayınlanan tesislerin açık / kapalı bulgu karşılaştırması</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {facilityStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={facilityStats} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                      contentStyle={{
                        borderRadius: '0.5rem',
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--card))',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                    <Legend verticalAlign="top" height={32} />
                    <Bar dataKey="Açık" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} maxBarSize={38} />
                    <Bar dataKey="Kapalı" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={38} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Henüz yayınlanmış denetim verisi yok.
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="flex flex-col h-[370px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Kategori Bazlı Bulgu Dağılımı</CardTitle>
              <CardDescription>{activeFacilityName} — son rapordaki kategori yoğunluğu</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3.5 pt-2">
              {categoryStats.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Bu tesis için yayınlanmış bulgu bulunmuyor.
                </div>
              ) : (
                categoryStats.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground truncate pr-2">{cat.name}</span>
                      <span className="tabular-nums text-muted-foreground shrink-0">
                        <strong className="text-foreground">{cat.total}</strong> toplam ({cat.open} açık)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-200"
                        style={{ width: `${totalFindings > 0 ? (cat.total / totalFindings) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alt Yönetici Özet Kartları (Tesis listesi yerine doğrudan rapor ve kritik aksiyon özeti) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol: Son Yayınlanan Raporlar */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 border-b border-border">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Son Yayınlanan Raporlar
              </CardTitle>
              <CardDescription>Görüntülemek veya aksiyon girmek için raporu seçin</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/renovation-report/reports')}
              className="text-xs text-primary gap-1"
            >
              Tümü <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            {recentPublished.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Bu kapsamda yayınlanmış denetim raporu bulunmuyor.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentPublished.map((audit) => {
                  const facName = facilityMap.get(audit.meta?.locationId || '') || 'Tesis';
                  const openCount = (audit.findings || []).filter(
                    (f: any) => f.status !== 'Tamamlanan' && f.status !== 'CLOSED'
                  ).length;
                  return (
                    <div
                      key={audit.id}
                      className="p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors duration-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {audit.meta?.reportNo || 'İsimsiz Rapor'}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {facName}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 tabular-nums">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatAuditDate(audit)}
                          </span>
                          <span>•</span>
                          <span>{audit.findings?.length || 0} Bulgu</span>
                          {openCount > 0 && (
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              ({openCount} açık)
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/renovation-report/reports/${audit.id}`)}
                        className="h-8 text-xs gap-1 shrink-0"
                      >
                        Rapor Detayı <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sağ: Yöneticiler için Taslaklar + Öncelikli Açık Bulgular / Kullanıcılar için Öncelikli Açık Bulgular */}
        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base flex items-center gap-2">
              {isManager && activeDrafts.length > 0 ? (
                <>
                  <Clock className="w-4 h-4 text-amber-600" />
                  Devam Eden Taslak Denetimler
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Öncelikli Açık Bulgular (Kritik / Yüksek)
                </>
              )}
            </CardTitle>
            <CardDescription>
              {isManager && activeDrafts.length > 0
                ? 'Yayınlanmayı bekleyen taslak raporlar — kaldığınız yerden devam edin'
                : 'Son yayınlanan raporlardaki en yüksek öncelikli açık tespitler'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {isManager && activeDrafts.length > 0 ? (
              <div className="space-y-2.5">
                {activeDrafts.map((audit) => {
                  const facName = facilityMap.get(audit.meta?.locationId || '') || 'Tesis';
                  return (
                    <div
                      key={audit.id}
                      className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 transition-colors duration-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {audit.meta?.reportNo || 'Taslak Rapor'}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {facName}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 tabular-nums">
                          {formatAuditDate(audit)} • {audit.findings?.length || 0} Bulgu
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/renovation-report/workspace/${audit.id}`)}
                        className="h-8 text-xs gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300 shrink-0"
                      >
                        Devam Et <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : priorityOpenFindings.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Kritik veya yüksek riskli açık bulgu bulunmuyor.
              </div>
            ) : (
              <div className="space-y-2.5">
                {priorityOpenFindings.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-border bg-card hover:border-red-500/40 transition-colors duration-200 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[10px] border ${getRiskBadgeClass(item.risk)}`}>
                          {normalizeRiskLevel(item.risk)}
                        </Badge>
                        <span className="text-xs font-semibold text-foreground">{item.no}</span>
                        {!isSingleFacilityView && (
                          <span className="text-[11px] text-muted-foreground">• {item.facilityName}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.desc}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/renovation-report/reports/${item.auditId}`)}
                      className="h-8 text-xs text-primary shrink-0"
                    >
                      Aç
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
