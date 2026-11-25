import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Building2, Receipt, TrendingUp, AlertCircle, 
  ChevronRight, Calculator, FileText, CheckCircle2,
  RefreshCw, FileSpreadsheet, Loader2, Search, X,
  LayoutGrid, List, ArrowUpDown, FilterX, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Facility { id: string; name: string }
interface OSGBCompany { id: number; name: string }
interface Reconciliation {
  id: number; 
  facilityId: string; 
  facility: Facility; 
  osgbCompanyId: number;
  osgbCompany: OSGBCompany; 
  month: string; 
  calculatedAmount?: number;
  invoiceAmount?: number;
  difference?: number;
  status: string;
}

export default function ReconciliationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state synchronization
  const searchQuery = searchParams.get('q') || '';
  const statusFilter = searchParams.get('status') || 'all';
  const viewMode = (searchParams.get('view') as 'grid' | 'table') || 'grid';

  const updateFilters = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === 'all' || (key === 'view' && val === 'grid')) {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    });
    setSearchParams(next, { replace: true });
  };

  // Scroll restoration
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('panel_reconciliation_scrollY', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: items = [], isLoading } = useQuery<Reconciliation[]>({
    queryKey: ['reconciliation'],
    queryFn: async () => {
      const res = await api.get('/panel/reconciliation');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

  useEffect(() => {
    if (!isLoading) {
      const savedY = sessionStorage.getItem('panel_reconciliation_scrollY');
      if (savedY) {
        const y = parseInt(savedY, 10);
        if (!isNaN(y) && y > 0) {
          requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
        }
      }
    }
  }, [isLoading]);

  const autoSyncMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/panel/reconciliation/auto-sync', {});
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation'] });
      toast.success('Tüm aylar başarıyla senkronize edildi.');
    },
    onError: () => {
      toast.error('Senkronizasyon işlemi sırasında hata oluştu.');
    }
  });

  const handleExportAll = async () => {
    try {
      toast.info('Genel mutabakat raporu hazırlanıyor...');
      const res = await api.get('/panel/reconciliation/export');
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `genel_mutabakat_raporu_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Genel mutabakat raporu başarıyla indirildi.');
    } catch {
      toast.error('Dışa aktarma başarısız oldu.');
    }
  };

  // OSGB bazlı özet verileri hazırla
  const osgbSummaries = useMemo(() => {
    const groups: Record<number, { 
      osgb: OSGBCompany, 
      totalCalc: number, 
      totalInv: number, 
      totalDiff: number,
      pendingCount: number,
      mismatchCount: number,
      balancedCount: number,
      lastMonth: string
    }> = {};

    items.forEach(item => {
      const osgbId = item.osgbCompanyId;
      if (!groups[osgbId]) {
        groups[osgbId] = { 
          osgb: item.osgbCompany, 
          totalCalc: 0, 
          totalInv: 0, 
          totalDiff: 0,
          pendingCount: 0,
          mismatchCount: 0,
          balancedCount: 0,
          lastMonth: item.month
        };
      }
      
      groups[osgbId].totalCalc += item.calculatedAmount || 0;
      groups[osgbId].totalInv += item.invoiceAmount || 0;
      groups[osgbId].totalDiff += item.difference || 0;
      
      if (item.status === 'Beklemede') groups[osgbId].pendingCount++;
      else if (item.status === 'Uyuşmazlık') groups[osgbId].mismatchCount++;
      else if (item.status === 'Onaylandı') groups[osgbId].balancedCount++;
      if (item.month > groups[osgbId].lastMonth) groups[osgbId].lastMonth = item.month;
    });

    return Object.values(groups).sort((a, b) => b.mismatchCount - a.mismatchCount || a.osgb.name.localeCompare(b.osgb.name));
  }, [items]);

  // Filtreleme (Turkish locale-safe + doğru "Mutabık" filtresi)
  const filteredSummaries = useMemo(() => {
    const q = searchQuery.toLocaleLowerCase('tr-TR').trim();
    return osgbSummaries.filter(summary => {
      if (q && !summary.osgb.name.toLocaleLowerCase('tr-TR').includes(q)) return false;
      if (statusFilter === 'mismatch' && summary.mismatchCount === 0) return false;
      if (statusFilter === 'pending' && summary.pendingCount === 0) return false;
      if (statusFilter === 'balanced' && (summary.mismatchCount > 0 || summary.pendingCount > 0)) return false;
      return true;
    });
  }, [osgbSummaries, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const totalDiff = items.reduce((sum, i) => sum + (i.difference || 0), 0);
    const totalMismatch = items.filter(i => i.status === 'Uyuşmazlık').length;
    const totalPending = items.filter(i => i.status === 'Beklemede').length;
    return { totalDiff, totalMismatch, totalPending };
  }, [items]);

  const hasActiveFilters = Boolean(searchQuery || statusFilter !== 'all');

  return (
    <div className="space-y-4 pb-10">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Mutabakat Merkezi</h1>
            <Badge variant="outline" className="h-5 text-[11px] font-semibold px-2 tabular-nums">
              {osgbSummaries.length} OSGB
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            OSGB firmaları ile mali hesap hareketleri, aylık faturalar ve mutabakat dengesi
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportAll} className="h-8 text-xs rounded-lg">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Genel Rapor
          </Button>
          <Button 
            size="sm" 
            onClick={() => autoSyncMutation.mutate()} 
            disabled={autoSyncMutation.isPending}
            className="h-8 text-xs rounded-lg"
          >
            {autoSyncMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            )} 
            Ayları Senkronize Et
          </Button>
        </div>
      </div>

      {/* Compact KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="rounded-lg border border-border shadow-xs bg-card">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Toplam Bakiye</span>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className={cn(
              "text-xl font-bold tabular-nums tracking-tight mt-1",
              stats.totalDiff !== 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600"
            )}>
              ₺{stats.totalDiff.toLocaleString('tr-TR')}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Sistem ve fatura farkı</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "rounded-lg border shadow-xs bg-card",
          stats.totalMismatch > 0 ? "border-destructive/40 bg-destructive/5" : "border-border"
        )}>
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Uyuşmazlıklar</span>
              <AlertCircle className={cn("w-4 h-4", stats.totalMismatch > 0 ? "text-destructive" : "text-muted-foreground")} />
            </div>
            <p className={cn("text-xl font-bold tabular-nums tracking-tight mt-1", stats.totalMismatch > 0 ? "text-destructive" : "text-foreground")}>
              {stats.totalMismatch}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">İncelenmesi gereken kayıt</p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border shadow-xs bg-card">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Bekleyen</span>
              <Calculator className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xl font-bold tabular-nums tracking-tight text-amber-600 mt-1">
              {stats.totalPending}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Onay bekleyen dönem</p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border shadow-xs bg-card">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Aktif OSGB</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-bold tabular-nums tracking-tight text-foreground mt-1">
              {osgbSummaries.length}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Mutabakat portföyü</p>
          </CardContent>
        </Card>
      </div>

      {/* Arama ve Filtreleme Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-card border rounded-xl shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              value={searchQuery}
              onChange={(e) => updateFilters({ q: e.target.value })}
              placeholder="OSGB adına göre ara..."
              className="pl-9 pr-8 h-9 text-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => updateFilters({ q: null })} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            <Button
              variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => updateFilters({ status: 'all' })}
              className="h-8 text-xs font-medium"
            >
              Tümü ({osgbSummaries.length})
            </Button>
            <Button
              variant={statusFilter === 'mismatch' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => updateFilters({ status: 'mismatch' })}
              className={cn("h-8 text-xs font-medium", statusFilter === 'mismatch' && "text-red-600")}
            >
              Uyuşmazlık
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => updateFilters({ status: 'pending' })}
              className={cn("h-8 text-xs font-medium", statusFilter === 'pending' && "text-amber-600")}
            >
              Bekleyen
            </Button>
            <Button
              variant={statusFilter === 'balanced' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => updateFilters({ status: 'balanced' })}
              className={cn("h-8 text-xs font-medium", statusFilter === 'balanced' && "text-emerald-600")}
            >
              Mutabık
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => updateFilters({ q: null, status: null })}
              className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
            >
              <FilterX className="w-3.5 h-3.5" />
              Filtreleri Sıfırla
            </Button>
          )}

          <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => updateFilters({ view: 'grid' })}
              title="Kart Görünümü"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => updateFilters({ view: 'table' })}
              title="Liste Görünümü"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Yükleme Durumu (Skeleton) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="rounded-lg border-border shadow-xs p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="pt-2.5 border-t border-border flex justify-between items-center">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredSummaries.length === 0 ? (
        <div className="text-center py-14 bg-card rounded-lg border border-dashed border-border p-6">
          <div className="w-11 h-11 rounded-lg bg-muted/60 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
            <FileText className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Kayıt Bulunamadı</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Arama ve filtre kriterlerinize uygun mutabakat kaydı bulunamadı.'
              : 'Sistemde henüz kayıtlı hesap mutabakatı bulunmuyor.'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilters({ q: null, status: null })}
              className="mt-4 h-8 rounded-lg text-xs"
            >
              Filtreleri Temizle
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Görünümü */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSummaries.map((summary) => (
            <Card
              key={summary.osgb.id}
              className={cn(
                "group cursor-pointer rounded-lg border-border shadow-xs hover:shadow-sm hover:border-primary/50 transition-all duration-200 overflow-hidden relative flex flex-col justify-between bg-card",
                summary.mismatchCount > 0 && "hover:border-destructive/50"
              )}
              onClick={() => navigate(`/panel/reconciliation/${summary.osgb.id}`)}
            >
              {summary.mismatchCount > 0 && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge variant="destructive" className="font-semibold text-[10px] px-2 h-5">
                    {summary.mismatchCount} Uyuşmazlık
                  </Badge>
                </div>
              )}
              <CardHeader className="p-4 pb-2.5">
                <div className="flex items-center gap-3 pr-20">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-semibold tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {summary.osgb.name}
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 tabular-nums">
                      <Clock className="w-3 h-3" /> Son Dönem: <span className="font-mono font-medium text-foreground">{summary.lastMonth}</span>
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-3">
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">TOPLAM BAKİYE</p>
                    <p className={cn(
                      "text-sm font-mono font-bold tracking-tight tabular-nums",
                      summary.totalDiff !== 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      ₺{summary.totalDiff.toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">HESAPLANAN</p>
                    <p className="text-sm font-mono font-bold tracking-tight text-foreground tabular-nums">
                      ₺{summary.totalCalc.toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border">
                  <div className="flex items-center gap-1.5">
                    {summary.pendingCount > 0 ? (
                      <Badge variant="outline" className="text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                        {summary.pendingCount} Bekleyen
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                        Tümü Güncel
                      </Badge>
                    )}
                  </div>
                  <div className="text-primary flex items-center gap-1 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">
                    Hesap Defteri <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Liste (Table) Görünümü */
        <div className="border border-border rounded-lg overflow-hidden bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-2.5">OSGB Kuruluşu</th>
                  <th className="px-4 py-2.5">Son Dönem</th>
                  <th className="px-4 py-2.5 text-right">Hesaplanan Tutar</th>
                  <th className="px-4 py-2.5 text-right">Fatura Edilen</th>
                  <th className="px-4 py-2.5 text-right">Bakiye / Fark</th>
                  <th className="px-4 py-2.5 text-center">Durum</th>
                  <th className="px-4 py-2.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredSummaries.map((summary) => (
                  <tr
                    key={summary.osgb.id}
                    className="hover:bg-muted/20 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/panel/reconciliation/${summary.osgb.id}`)}
                  >
                    <td className="px-4 py-3 font-semibold text-xs text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                          <Receipt className="w-3.5 h-3.5" />
                        </div>
                        <span className="group-hover:text-primary transition-colors line-clamp-1">{summary.osgb.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">
                      {summary.lastMonth}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-foreground tabular-nums">
                      ₺{summary.totalCalc.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-foreground tabular-nums">
                      ₺{summary.totalInv.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold tabular-nums">
                      <span className={cn(
                        summary.totalDiff !== 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                      )}>
                        ₺{summary.totalDiff.toLocaleString('tr-TR')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {summary.mismatchCount > 0 ? (
                        <Badge variant="destructive" className="text-[10px] font-semibold">
                          {summary.mismatchCount} Uyuşmazlık
                        </Badge>
                      ) : summary.pendingCount > 0 ? (
                        <Badge variant="outline" className="text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                          {summary.pendingCount} Bekleyen
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                          Mutabık
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" className="h-7 rounded-lg text-xs font-semibold gap-1 text-primary">
                        Detay <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

