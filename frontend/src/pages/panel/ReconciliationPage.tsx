import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, Receipt, TrendingUp, AlertCircle, 
  ChevronRight, Calculator, FileText, CheckCircle2,
  RefreshCw, FileSpreadsheet, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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

  const { data: items = [], isLoading } = useQuery<Reconciliation[]>({
    queryKey: ['reconciliation'],
    queryFn: async () => {
      const res = await api.get('/panel/reconciliation');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

  const autoSyncMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/panel/reconciliation/auto-sync', {});
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation'] });
      alert('Tüm aylar başarıyla senkronize edildi.');
    },
  });

  const handleExportAll = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/panel/reconciliation/export`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `genel_mutabakat_raporu_${new Date().toLocaleDateString()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      alert('Dışa aktarma başarısız.');
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
          lastMonth: item.month
        };
      }
      
      groups[osgbId].totalCalc += item.calculatedAmount || 0;
      groups[osgbId].totalInv += item.invoiceAmount || 0;
      groups[osgbId].totalDiff += item.difference || 0;
      
      if (item.status === 'Beklemede') groups[osgbId].pendingCount++;
      if (item.status === 'Uyuşmazlık') groups[osgbId].mismatchCount++;
      if (item.month > groups[osgbId].lastMonth) groups[osgbId].lastMonth = item.month;
    });

    return Object.values(groups).sort((a, b) => b.mismatchCount - a.mismatchCount || a.osgb.name.localeCompare(b.osgb.name));
  }, [items]);

  const stats = useMemo(() => {
    const totalDiff = items.reduce((sum, i) => sum + (i.difference || 0), 0);
    const totalMismatch = items.filter(i => i.status === 'Uyuşmazlık').length;
    const totalPending = items.filter(i => i.status === 'Beklemede').length;
    return { totalDiff, totalMismatch, totalPending };
  }, [items]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mutabakat Merkezi</h1>
          <p className="text-sm text-muted-foreground">OSGB firmaları ile olan hesap dengesini ve fatura mutabakatlarını yönetin.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportAll}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Genel Rapor İndir
          </Button>
          <Button onClick={() => autoSyncMutation.mutate()} disabled={autoSyncMutation.isPending}>
            {autoSyncMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />} 
            Tüm Ayları Senkronize Et
          </Button>
        </div>
      </div>

      {/* Genel Durum Paneli */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-primary mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">TOPLAM BAKİYE</span>
            </div>
            <p className="text-2xl font-black font-mono">₺{stats.totalDiff.toLocaleString('tr-TR')}</p>
          </CardContent>
        </Card>
        <Card className={cn(stats.totalMismatch > 0 && "bg-red-50 border-red-100")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">UYUŞMAZLIKLAR</span>
            </div>
            <p className="text-2xl font-black font-mono">{stats.totalMismatch}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Calculator className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">BEKLEYENLER</span>
            </div>
            <p className="text-2xl font-black font-mono">{stats.totalPending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">AKTİF OSGB</span>
            </div>
            <p className="text-2xl font-black font-mono">{osgbSummaries.length}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-2xl" />)}
        </div>
      ) : osgbSummaries.length === 0 ? (
        <div className="text-center py-20 bg-background rounded-2xl border-2 border-dashed">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground font-medium">Henüz hesap hareketi bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {osgbSummaries.map((summary) => (
            <Card 
              key={summary.osgb.id} 
              className="group cursor-pointer hover:shadow-xl hover:ring-2 hover:ring-primary/20 transition-all duration-300 border-none shadow-md overflow-hidden relative"
              onClick={() => navigate(`/panel/reconciliation/${summary.osgb.id}`)}
            >
              {summary.mismatchCount > 0 && (
                <div className="absolute top-0 right-0 p-2">
                   <Badge variant="destructive" className="animate-pulse font-bold">{summary.mismatchCount} Hata</Badge>
                </div>
              )}
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-base font-bold line-clamp-1">{summary.osgb.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">TOPLAM BAKİYE</p>
                    <p className={cn(
                      "text-sm font-mono font-black",
                      summary.totalDiff !== 0 ? "text-red-600" : "text-emerald-600"
                    )}>₺{summary.totalDiff.toLocaleString('tr-TR')}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">SON DÖNEM</p>
                    <p className="text-sm font-mono font-bold">{summary.lastMonth}</p>
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-[10px] bg-background">{summary.pendingCount} Bekleyen</Badge>
                  </div>
                  <div className="text-primary flex items-center gap-1 text-xs font-bold group-hover:translate-x-1 transition-transform">
                    Hesap Defterini Aç <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
