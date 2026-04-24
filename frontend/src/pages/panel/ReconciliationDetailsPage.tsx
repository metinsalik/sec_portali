import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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

  const { data: allItems = [], isLoading } = useQuery<Reconciliation[]>({
    queryKey: ['reconciliation'],
    queryFn: async () => {
      const res = await api.get('/panel/reconciliation');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

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
    },
  });

  const handleExport = async (month?: string) => {
    try {
      const url = month 
        ? `${import.meta.env.VITE_API_URL || '/api'}/panel/reconciliation/export?osgbId=${osgbId}&month=${month}`
        : `${import.meta.env.VITE_API_URL || '/api'}/panel/reconciliation/export?osgbId=${osgbId}`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `mutabakat_${osgbInfo?.name || 'export'}_${month || 'tum'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error(error);
      alert('Dışa aktarma başarısız oldu.');
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
    },
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
    return <div className="space-y-6 animate-pulse"><div className="h-40 bg-muted rounded-2xl" /><div className="h-64 bg-muted rounded-2xl" /></div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/panel/reconciliation')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{osgbInfo?.name || 'OSGB Detayları'}</h1>
          <p className="text-sm text-muted-foreground">Hesap Defteri & Aylık Mutabakat Geçmişi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">TOPLAM BAKİYE</p>
            <p className="text-2xl font-black font-mono">₺{filteredItems.reduce((sum, i) => sum + (i.difference || 0), 0).toLocaleString('tr-TR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">TOPLAM FATURA</p>
            <p className="text-2xl font-black font-mono">₺{filteredItems.reduce((sum, i) => sum + (i.invoiceAmount || 0), 0).toLocaleString('tr-TR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">KAYIT SAYISI</p>
            <p className="text-2xl font-black font-mono">{filteredItems.length} Ay / Tesis</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mt-8">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <History className="w-5 h-5 text-primary" /> Mutabakat Geçmişi
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport()}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Tümünü İndir
          </Button>
          <Button onClick={() => setSyncModalOpen(true)} size="sm">
            <Calculator className="w-4 h-4 mr-2" /> Dönem Hesapla
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {groupedByMonth.map(([month, facilityItems]) => {
          const totalCalc = facilityItems.reduce((sum, i) => sum + (i.calculatedAmount || 0), 0);
          const totalInv = facilityItems.reduce((sum, i) => sum + (i.invoiceAmount || 0), 0);
          const totalDiff = totalCalc - totalInv;
          const isMonthExpanded = expandedMonth === month;

          return (
            <Card key={month} className="overflow-hidden border-none shadow-sm ring-1 ring-border">
              <div 
                className={cn(
                  "flex items-center p-5 gap-6 cursor-pointer hover:bg-muted/30 transition-all",
                  isMonthExpanded && "bg-muted/20 border-b"
                )}
                onClick={() => setExpandedMonth(isMonthExpanded ? null : month)}
              >
                <div className="flex items-center gap-5 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-background border-2 border-primary/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] font-black text-primary/40 uppercase leading-none mb-1">{month.split('-')[0]}</span>
                    <span className="text-sm font-black text-primary leading-none">{month.split('-')[1]}</span>
                  </div>
                  <div>
                    <p className="text-base font-bold tracking-tight">{format(new Date(month + '-01'), 'MMMM yyyy', { locale: tr })}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{facilityItems.length} Tesis</p>
                  </div>
                </div>

                <div className="flex items-center gap-12 px-8 border-x border-dashed mx-4">
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase mb-0.5">SİSTEM</p>
                    <p className="text-sm font-mono font-bold tracking-tighter">₺{totalCalc.toLocaleString('tr-TR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase mb-0.5">FATURA</p>
                    <p className={cn("text-sm font-mono font-bold tracking-tighter", totalInv > 0 && "text-primary")}>₺{totalInv.toLocaleString('tr-TR')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-32 justify-end">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleExport(month); }}>
                    <Download className="w-4 h-4" />
                  </Button>
                  {totalDiff === 0 && totalInv > 0 ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold">MUTABIK</Badge>
                  ) : totalInv > 0 ? (
                    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 font-bold">FARK VAR</Badge>
                  ) : (
                    <Badge variant="secondary" className="opacity-50">BEKLEMEDE</Badge>
                  )}
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isMonthExpanded && "rotate-180")} />
                </div>
              </div>

              {isMonthExpanded && (
                <div className="p-4 space-y-6 bg-muted/5 animate-in slide-in-from-top-2">
                  {facilityItems.map((fItem) => (
                    <div key={fItem.id} className="bg-background rounded-2xl border shadow-sm overflow-hidden border-primary/5">
                      <div className="bg-muted/20 px-5 py-3 flex items-center justify-between border-b">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span className="font-bold text-sm">{fItem.facility?.name}</span>
                          <Badge variant={statusVariants[fItem.status] ?? 'secondary'} className="h-5 text-[10px] font-bold">
                            {fItem.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-emerald-600" onClick={() => handleStatusChange(fItem, 'Onaylandı')}>
                            <Check className="w-3 h-3 mr-1" /> Onayla
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-red-600" onClick={() => handleStatusChange(fItem, 'Uyuşmazlık')}>
                            <AlertCircle className="w-3 h-3 mr-1" /> Uyuşmazlık
                          </Button>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-4">
                          {fItem.calculationDetails?.map((detail, dIdx) => (
                            <div key={dIdx} className="bg-muted/5 rounded-xl p-3 border border-dashed flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold leading-none mb-1">{detail.professionalName}</p>
                                  <p className="text-[9px] text-muted-foreground uppercase">{detail.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <p className="text-xs font-mono font-bold">₺{detail.cost.toLocaleString('tr-TR')}</p>
                                <Input 
                                  type="number" 
                                  className="h-7 w-20 text-right font-mono text-[10px] p-1 bg-background"
                                  defaultValue={detail.invoiceAmount || ''}
                                  onBlur={(e) => handleUpdateProfessionalInvoice(fItem, detail.professionalId, e.target.value)}
                                  placeholder="Fatura"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-dashed">
                          <div className="flex items-center gap-6">
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-bold text-muted-foreground uppercase">FATURA TUTARI</p>
                              <Input 
                                type="number" 
                                className="h-8 w-28 text-right font-mono text-sm font-bold bg-primary/5 border-primary/20"
                                value={fItem.invoiceAmount || ''}
                                onChange={(e) => handleUpdateFacilityInvoice(fItem, e.target.value)}
                              />
                            </div>
                            <div className="space-y-0.5 px-6 border-l border-muted">
                              <p className="text-[9px] font-bold text-muted-foreground uppercase">BAKİYE</p>
                              <p className={cn("text-lg font-mono font-black", (fItem.difference || 0) === 0 ? "text-emerald-600" : "text-red-600")}>
                                ₺{fItem.difference?.toLocaleString('tr-TR') || 0}
                              </p>
                            </div>
                          </div>
                          <Input 
                            className="h-8 text-[10px] italic bg-muted/20 border-none max-w-xs"
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
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Dönem Hesaplaması</DialogTitle></DialogHeader>
          <div className="py-6 space-y-4">
            <div className="bg-primary/5 p-4 rounded-xl flex gap-3 border border-primary/10">
              <Info className="w-5 h-5 text-primary shrink-0" />
              <p className="text-xs text-primary/80 leading-relaxed">
                Seçilen aydaki tüm aktif OSGB atamaları taranacak ve maliyetler hesap defterine işlenecektir.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">Hesaplanacak Dönem</label>
              <Input type="month" className="h-12 font-bold text-lg" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSyncModalOpen(false)}>İptal</Button>
            <Button onClick={() => syncMutation.mutate(selectedMonth)} disabled={syncMutation.isPending}>
              {syncMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Hesapla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
