import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Building2, Calendar, Calculator, Check,
  AlertCircle, ChevronDown, ChevronUp, Receipt,
  History, Info, Loader2, User, ArrowLeft, FileText, Download, FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Facility { id: string; name: string }
interface OSGBCompany { id: number; name: string }
interface CalculationDetail {
  professionalId: number;
  professionalName: string;
  assignmentId: number;
  durationMinutes: number;
  isFullTime: boolean;
  unitPrice: number;
  cost: number;
  invoiceAmount?: number;
  description: string;
}
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
  calculationDetails?: CalculationDetail[];
  amount?: number;
  note?: string;
  status: string;
  createdAt: string;
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  'Beklemede': 'secondary',
  'Onaylandı': 'outline',
  'Reddedildi': 'destructive',
  'Uyuşmazlık': 'destructive',
};

export default function ReconciliationDetailsPage() {
  const { id: osgbId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  // Scroll restoration
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('panel_reconciliation_details_scrollY', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: allItems = [], isLoading } = useQuery<Reconciliation[]>({
    queryKey: ['reconciliation'],
    queryFn: async () => {
      const res = await api.get('/panel/reconciliation');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

  useEffect(() => {
    if (!isLoading) {
      const savedY = sessionStorage.getItem('panel_reconciliation_details_scrollY');
      if (savedY) {
        const y = parseInt(savedY, 10);
        if (!isNaN(y) && y > 0) {
          requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
        }
      }
    }
  }, [isLoading]);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => item.osgbCompanyId === parseInt(osgbId || '0'));
  }, [allItems, osgbId]);

  const osgbInfo = useMemo(() => {
    return filteredItems[0]?.osgbCompany;
  }, [filteredItems]);

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, Reconciliation[]> = {};
    filteredItems.forEach(item => {
      if (!groups[item.month]) groups[item.month] = [];
      groups[item.month].push(item);
    });
    return Object.entries(groups).sort(([mA], [mB]) => mB.localeCompare(mA));
  }, [filteredItems]);

  const syncMutation = useMutation({
    mutationFn: async (month: string) => {
      const res = await api.post('/panel/reconciliation/sync', { month });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation'] });
      setSyncModalOpen(false);
      toast.success('Dönem hesaplaması başarıyla tamamlandı.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Hesaplama yapılırken bir hata oluştu.');
    }
  });

  const handleExport = async (month?: string) => {
    try {
      toast.info('Rapor hazırlanıyor...');
      const path = month
        ? `/panel/reconciliation/export?osgbId=${osgbId}&month=${month}`
        : `/panel/reconciliation/export?osgbId=${osgbId}`;
      const res = await api.get(path);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `mutabakat_${osgbInfo?.name || 'export'}_${month || 'tum'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Mutabakat raporu indirildi.');
    } catch {
      toast.error('Dışa aktarma başarısız oldu.');
    }
  };

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await api.put(`/panel/reconciliation/${id}`, data);
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation'] });
      toast.success('Mutabakat kaydı güncellendi.');
    },
    onError: () => {
      toast.error('Kayıt güncellenemedi.');
    }
  });

  const handleUpdateProfessionalInvoice = (item: Reconciliation, profId: number, value: string) => {
    const newDetails = (item.calculationDetails || []).map(d => {
      if (d.professionalId === profId) {
        return { ...d, invoiceAmount: value ? parseFloat(value) : undefined };
      }
      return d;
    });
    const totalInvoice = newDetails.reduce((sum, d) => sum + (d.invoiceAmount || 0), 0);
    updateMutation.mutate({ id: item.id, data: { calculationDetails: newDetails, invoiceAmount: totalInvoice } });
  };

  const handleUpdateFacilityInvoice = (item: Reconciliation, value: string) => {
    updateMutation.mutate({ id: item.id, data: { invoiceAmount: value } });
  };

  const handleStatusChange = (item: Reconciliation, status: string) => {
    updateMutation.mutate({ id: item.id, data: { status } });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
        <div className="space-y-3 pt-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate('/panel/reconciliation')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{osgbInfo?.name || 'OSGB Detayları'}</h1>
            <p className="text-xs text-muted-foreground">Hesap Defteri & Aylık Mutabakat Geçmişi</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1.5" onClick={() => handleExport()}>
            <FileSpreadsheet className="w-3.5 h-3.5" /> Tümünü İndir
          </Button>
          <Button onClick={() => setSyncModalOpen(true)} size="sm" className="h-8 rounded-lg text-xs font-semibold gap-1.5">
            <Calculator className="w-3.5 h-3.5" /> Dönem Hesapla
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="rounded-lg bg-primary/5 border-primary/20 shadow-xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-semibold text-primary/80 uppercase tracking-wider mb-0.5">TOPLAM BAKİYE</p>
            <p className="text-xl font-bold font-mono tabular-nums text-foreground">₺{filteredItems.reduce((sum, i) => sum + (i.difference || 0), 0).toLocaleString('tr-TR')}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-border shadow-xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">TOPLAM FATURA</p>
            <p className="text-xl font-bold font-mono tabular-nums text-foreground">₺{filteredItems.reduce((sum, i) => sum + (i.invoiceAmount || 0), 0).toLocaleString('tr-TR')}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-border shadow-xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">KAYIT SAYISI</p>
            <p className="text-xl font-bold font-mono tabular-nums text-foreground">{filteredItems.length} Ay / Tesis</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between pt-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <History className="w-4 h-4 text-primary" /> Mutabakat Geçmişi
        </h2>
      </div>

      <div className="space-y-3">
        {groupedByMonth.map(([month, facilityItems]) => {
          const totalCalc = facilityItems.reduce((sum, i) => sum + (i.calculatedAmount || 0), 0);
          const totalInv = facilityItems.reduce((sum, i) => sum + (i.invoiceAmount || 0), 0);
          const totalDiff = totalCalc - totalInv;
          const isMonthExpanded = expandedMonth === month;

          return (
            <Card key={month} className="overflow-hidden rounded-lg border border-border shadow-xs">
              <div
                className={cn(
                  "flex flex-wrap sm:flex-nowrap items-center p-4 gap-4 cursor-pointer hover:bg-muted/30 transition-colors",
                  isMonthExpanded && "bg-muted/20 border-b border-border"
                )}
                onClick={() => setExpandedMonth(isMonthExpanded ? null : month)}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0 tabular-nums">
                    <span className="text-[9px] font-semibold text-primary/70 leading-none mb-0.5">{month.split('-')[0]}</span>
                    <span className="text-xs font-bold text-primary leading-none">{month.split('-')[1]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-tight text-foreground truncate">{format(new Date(month + '-01'), 'MMMM yyyy', { locale: tr })}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">{facilityItems.length} Tesis</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 px-4 border-x border-border/60">
                  <div className="text-right">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">SİSTEM</p>
                    <p className="text-xs font-mono font-semibold tabular-nums">₺{totalCalc.toLocaleString('tr-TR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">FATURA</p>
                    <p className={cn("text-xs font-mono font-semibold tabular-nums", totalInv > 0 && "text-primary")}>₺{totalInv.toLocaleString('tr-TR')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 justify-end shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={(e) => { e.stopPropagation(); handleExport(month); }}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  {totalDiff === 0 && totalInv > 0 ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold">MUTABIK</Badge>
                  ) : totalInv > 0 ? (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-semibold">FARK VAR</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">BEKLEMEDE</Badge>
                  )}
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isMonthExpanded && "rotate-180")} />
                </div>
              </div>

              {isMonthExpanded && (
                <div className="p-4 space-y-4 bg-muted/10">
                  {facilityItems.map((fItem) => (
                    <div key={fItem.id} className="bg-card rounded-lg border border-border shadow-xs overflow-hidden">
                      <div className="bg-muted/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-border">
                        <div className="flex items-center gap-2.5">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-xs text-foreground">{fItem.facility?.name}</span>
                          <Badge variant={statusVariants[fItem.status] ?? 'secondary'} className="h-5 text-[10px] font-semibold">
                            {fItem.status}
                          </Badge>
                        </div>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="ghost" className="h-7 rounded-lg text-[11px] font-semibold text-emerald-600 dark:text-emerald-400" onClick={() => handleStatusChange(fItem, 'Onaylandı')}>
                            <Check className="w-3 h-3 mr-1" /> Onayla
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 rounded-lg text-[11px] font-semibold text-destructive" onClick={() => handleStatusChange(fItem, 'Uyuşmazlık')}>
                            <AlertCircle className="w-3 h-3 mr-1" /> Uyuşmazlık
                          </Button>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5 mb-3.5">
                          {fItem.calculationDetails?.map((detail, dIdx) => (
                            <div key={dIdx} className="bg-muted/20 rounded-lg p-3 border border-border flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold leading-none mb-1 truncate">{detail.professionalName}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{detail.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <p className="text-xs font-mono font-semibold tabular-nums">₺{detail.cost.toLocaleString('tr-TR')}</p>
                                <Input
                                  type="number"
                                  className="h-7 w-20 text-right font-mono text-[11px] px-2 rounded-lg bg-background tabular-nums"
                                  defaultValue={detail.invoiceAmount || ''}
                                  onBlur={(e) => handleUpdateProfessionalInvoice(fItem, detail.professionalId, e.target.value)}
                                  placeholder="Fatura"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                          <div className="flex items-center gap-5">
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">FATURA TUTARI</p>
                              <Input
                                type="number"
                                className="h-8 w-28 text-right font-mono text-xs font-semibold rounded-lg bg-primary/5 border-primary/20 tabular-nums"
                                value={fItem.invoiceAmount || ''}
                                onChange={(e) => handleUpdateFacilityInvoice(fItem, e.target.value)}
                              />
                            </div>
                            <div className="space-y-0.5 pl-5 border-l border-border">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">BAKİYE</p>
                              <p className={cn("text-base font-mono font-bold tabular-nums", (fItem.difference || 0) === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                                ₺{fItem.difference?.toLocaleString('tr-TR') || 0}
                              </p>
                            </div>
                          </div>
                          <Input
                            className="h-8 text-xs rounded-lg bg-muted/30 border-border max-w-xs"
                            placeholder="Not..."
                            defaultValue={fItem.note || ''}
                            onBlur={(e) => updateMutation.mutate({ id: fItem.id, data: { note: e.target.value } })}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={syncModalOpen} onOpenChange={setSyncModalOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-lg border border-border bg-card p-0 overflow-hidden shadow-lg flex flex-col gap-0">
          <DialogHeader className="px-5 py-3.5 bg-muted/30 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold tracking-tight text-foreground">Dönem Hesaplaması</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Aylık OSGB maliyetlerini hesap defterine aktarın
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-5 space-y-4">
            <div className="bg-primary/5 p-3 rounded-lg flex items-start gap-2.5 border border-primary/15">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-foreground/80 leading-relaxed">
                Seçilen aydaki tüm aktif OSGB atamaları taranacak ve maliyetler hesap defterine işlenecektir.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Hesaplanacak Dönem *</label>
              <Input
                type="month"
                className="h-9 rounded-lg text-xs font-medium tabular-nums"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-3.5 bg-muted/30 border-t border-border shrink-0 gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => setSyncModalOpen(false)} className="h-8 rounded-lg text-xs">
              İptal
            </Button>
            <Button
              size="sm"
              onClick={() => syncMutation.mutate(selectedMonth)}
              disabled={syncMutation.isPending}
              className="h-8 px-4 rounded-lg text-xs font-semibold gap-1.5"
            >
              {syncMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Hesapla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
