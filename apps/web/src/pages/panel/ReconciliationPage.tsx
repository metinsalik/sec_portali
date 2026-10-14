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
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/panel/reconciliation/export`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `genel_mutabakat_raporu_${new Date().toLocaleDateString('tr-TR')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
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

  // Filtreleme
  const filteredSummaries = useMemo(() => {
    return osgbSummaries.filter(summary => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!summary.osgb.name.toLowerCase().includes(q)) return false;
      }
      if (statusFilter === 'mismatch' && summary.mismatchCount === 0) return false;
      if (statusFilter === 'pending' && summary.pendingCount === 0) return false;
      if (statusFilter === 'balanced' && summary.mismatchCount > 0) return false;
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
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Mutabakat Merkezi</h1>
            <Badge variant="outline" className="text-xs font-semibold px-2">
              {osgbSummaries.length} OSGB
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            OSGB firmaları ile olan mali hesap hareketlerini, aylık faturaları ve mutabakat dengesini yönetin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportAll} className="h-9">
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
            Genel Rapor İndir
          </Button>
          <Button 
            size="sm" 
            onClick={() => autoSyncMutation.mutate()} 
            disabled={autoSyncMutation.isPending}
            className="h-9 shadow-sm"
          >
            {autoSyncMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )} 
            Tüm Ayları Senkronize Et
          </Button>
        </div>
      </div>

      {/* KPI İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm bg-card transition-all hover:border-primary/40">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Toplam Bakiye</span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className={cn(
              "text-2xl font-black font-mono tracking-tight",
              stats.totalDiff !== 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600"
            )}>
              ₺{stats.totalDiff.toLocaleString('tr-TR')}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Sistem ve fatura farkı</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-border/60 shadow-sm bg-card transition-all",
          stats.totalMismatch > 0 ? "border-red-500/40 bg-red-500/5 hover:border-red-500/60" : "hover:border-primary/40"
        )}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Uyuşmazlıklar</span>
              <div className={cn("p-2 rounded-lg", stats.totalMismatch > 0 ? "bg-red-500/10 text-red-600" : "bg-muted text-muted-foreground")}>
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <p className={cn("text-2xl font-black font-mono tracking-tight", stats.totalMismatch > 0 ? "text-red-600" : "text-foreground")}>
              {stats.totalMismatch}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">İncelenmesi gereken kayıt</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-card transition-all hover:border-primary/40">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bekleyen Kayıtlar</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                <Calculator className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black font-mono tracking-tight text-amber-600">
              {stats.totalPending}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Onay bekleyen dönem</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-card transition-all hover:border-primary/40">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Aktif OSGB</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black font-mono tracking-tight text-foreground">
              {osgbSummaries.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Mutabakat portföyü</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="border-border/60 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="pt-3 border-t flex justify-between items-center">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredSummaries.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border/70 p-8">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4 text-muted-foreground">
            <FileText className="w-7 h-7 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold text-foreground">Kayıt Bulunamadı</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {hasActiveFilters 
              ? 'Arama ve filtre kriterlerinize uygun mutabakat kaydı bulunamadı.' 
              : 'Sistemde henüz kayıtlı hesap mutabakatı bulunmuyor.'}
          </p>
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => updateFilters({ q: null, status: null })}
              className="mt-4 text-xs"
            >
              Filtreleri Temizle
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Görünümü */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSummaries.map((summary) => (
            <Card 
              key={summary.osgb.id} 
              className={cn(
                "group cursor-pointer border-border/70 shadow-xs hover:shadow-md hover:border-primary/50 transition-all duration-200 overflow-hidden relative flex flex-col justify-between bg-card",
                summary.mismatchCount > 0 && "hover:border-red-500/50"
              )}
              onClick={() => navigate(`/panel/reconciliation/${summary.osgb.id}`)}
            >
              {summary.mismatchCount > 0 && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge variant="destructive" className="font-semibold text-[11px] px-2 shadow-xs animate-pulse">
                    {summary.mismatchCount} Uyuşmazlık
                  </Badge>
                </div>
              )}
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center gap-3 pr-20">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {summary.osgb.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> Son Dönem: <span className="font-mono font-medium text-foreground">{summary.lastMonth}</span>
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-2 space-y-4">
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border border-border/40">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">TOPLAM BAKİYE</p>
                    <p className={cn(
                      "text-base font-mono font-bold tracking-tight",
                      summary.totalDiff !== 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600"
                    )}>
                      ₺{summary.totalDiff.toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">HESAPLANAN</p>
                    <p className="text-base font-mono font-bold tracking-tight text-foreground">
                      ₺{summary.totalCalc.toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border/60">
                  <div className="flex items-center gap-1.5">
                    {summary.pendingCount > 0 ? (
                      <Badge variant="outline" className="text-[10px] font-medium bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50">
                        {summary.pendingCount} Bekleyen
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/50">
                        Tümü Güncel
                      </Badge>
                    )}
                  </div>
                  <div className="text-primary flex items-center gap-1 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">
                    Hesap Defteri <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Liste (Table) Görünümü */
        <div className="border border-border/60 rounded-xl overflow-hidden bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="px-5 py-3">OSGB Kuruluşu</th>
                  <th className="px-5 py-3">Son Dönem</th>
                  <th className="px-5 py-3 text-right">Hesaplanan Tutar</th>
                  <th className="px-5 py-3 text-right">Fatura Edilen</th>
                  <th className="px-5 py-3 text-right">Bakiye / Fark</th>
                  <th className="px-5 py-3 text-center">Durum</th>
                  <th className="px-5 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredSummaries.map((summary) => (
                  <tr 
                    key={summary.osgb.id} 
                    className="hover:bg-muted/20 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/panel/reconciliation/${summary.osgb.id}`)}
                  >
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <span className="group-hover:text-primary transition-colors line-clamp-1">{summary.osgb.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                      {summary.lastMonth}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-foreground">
                      ₺{summary.totalCalc.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-foreground">
                      ₺{summary.totalInv.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold">
                      <span className={cn(
                        summary.totalDiff !== 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600"
                      )}>
                        ₺{summary.totalDiff.toLocaleString('tr-TR')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {summary.mismatchCount > 0 ? (
                        <Badge variant="destructive" className="text-[10px] font-semibold">
                          {summary.mismatchCount} Uyuşmazlık
                        </Badge>
                      ) : summary.pendingCount > 0 ? (
                        <Badge variant="outline" className="text-[10px] font-semibold bg-amber-500/10 text-amber-600 border-amber-200">
                          {summary.pendingCount} Bekleyen
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-200">
                          Mutabık
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold gap-1 text-primary">
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

