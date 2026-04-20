import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { UserPlus, Calendar, MapPin, Building2, UserCheck, AlertCircle, LayoutGrid, ArrowRight } from "lucide-react";

interface CertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any[];
}

export function CertificateRenewalDialog({ open, onOpenChange, data }: CertificateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl w-[95vw] h-[85vh] p-0 overflow-hidden border-none shadow-2xl rounded-3xl flex flex-col">
        <DialogHeader className="px-10 py-8 bg-slate-900 text-white shrink-0 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Calendar className="w-32 h-32" />
           </div>
           <div className="flex items-center gap-6 relative">
             <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
               <Calendar className="w-8 h-8 text-white" />
             </div>
             <div>
               <DialogTitle className="text-2xl font-bold tracking-tight">Sertifika Yenileme Takvimi</DialogTitle>
               <DialogDescription className="text-white/40 text-[10px] uppercase tracking-widest mt-1 font-bold">
                 Profesyonel Yetkinlik Takibi • 2026 Q2
               </DialogDescription>
             </div>
           </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 dark:bg-slate-950 custom-scrollbar">
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="py-4 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profesyonel Ad Soyad</TableHead>
                  <TableHead className="py-4 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sertifika Tarihi</TableHead>
                  <TableHead className="py-4 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kalan Süre</TableHead>
                  <TableHead className="py-4 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((p) => (
                  <TableRow key={p.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b last:border-0">
                    <TableCell className="py-5 px-8 font-bold text-slate-700 dark:text-slate-200">{p.fullName}</TableCell>
                    <TableCell className="py-5 px-8 text-sm text-slate-500 font-medium">
                      {p.certificateDate ? format(new Date(p.certificateDate), 'dd MMMM yyyy', { locale: tr }) : '-'}
                    </TableCell>
                    <TableCell className="py-5 px-8">
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-sm font-bold",
                          p.status.isCritical || p.status.isExpired ? 'text-rose-600' : 'text-amber-600'
                        )}>
                          {p.status.daysLeft} Gün Kaldı
                        </span>
                        <div className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className={cn("h-full", p.status.isCritical || p.status.isExpired ? 'bg-rose-500' : 'bg-amber-500')} 
                            style={{ width: `${Math.max(10, Math.min(100, 100 - (p.status.daysLeft / 3.65)))}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8 text-right">
                      <Badge className={cn(
                        "rounded-xl px-4 h-7 text-[10px] font-black uppercase tracking-tighter shadow-sm",
                        p.status.isExpired ? "bg-slate-900 text-white" : 
                        p.status.isCritical ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                      )}>
                        {p.status.isExpired ? "Süresi Dolmuş" : p.status.isCritical ? "Kritik" : "Yenileme Bekliyor"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-32 text-slate-400 font-bold tracking-widest text-xs opacity-40 italic">
                      <div className="flex flex-col items-center gap-4">
                        <UserCheck className="w-12 h-12" />
                        KRİTİK SERTİFİKA YENİLEME BULUNMUYOR
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface GapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: any[];
  type: 'IGU' | 'Hekim' | 'DSP';
  onAssign?: (facility: any, type: 'IGU' | 'Hekim' | 'DSP') => void;
}

export function ResourceGapDialog({ open, onOpenChange, title, data, type, onAssign }: GapDialogProps) {
  const Icon = type === 'IGU' ? UserPlus : type === 'Hekim' ? UserCheck : Building2;
  const color = type === 'IGU' ? 'blue' : type === 'Hekim' ? 'emerald' : 'purple';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl w-[95vw] h-[85vh] p-0 overflow-hidden border-none shadow-2xl rounded-3xl flex flex-col">
        <DialogHeader className={cn(
          "px-10 py-8 text-white shrink-0 relative overflow-hidden",
          color === 'blue' ? 'bg-blue-600' : color === 'emerald' ? 'bg-emerald-600' : 'bg-purple-600'
        )}>
           <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <Icon className="w-48 h-48" />
           </div>
           <div className="flex items-center gap-6 relative">
             <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
               <Icon className="w-8 h-8 text-white" />
             </div>
             <div>
               <DialogTitle className="text-3xl font-black tracking-tight">{title}</DialogTitle>
               <DialogDescription className="text-white/70 text-sm mt-1 max-w-xl font-medium">
                 Yasal mevzuat gereği atama eksiği veya sertifika sınıfı uyumsuzluğu olan tesisler.
               </DialogDescription>
             </div>
           </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 dark:bg-slate-950 custom-scrollbar">
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 border-b">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-4 px-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Tesis Bilgileri</TableHead>
                  <TableHead className="py-4 px-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Durum Analizi</TableHead>
                  <TableHead className="py-4 px-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Uyumluluk Oranı</TableHead>
                  <TableHead className="py-4 px-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((r) => {
                  const metric = type === 'IGU' ? r.igu : type === 'Hekim' ? r.hekim : r.dsp;
                  const deficit = metric.requiredMinutes - metric.assignedMinutes;
                  
                  let statusLabel = "";
                  let subLabel = "";

                  if (type === 'DSP') {
                    statusLabel = "DSP ATAMASI EKSİK";
                    subLabel = "Çok tehlikeli sınıfta DSP zorunludur.";
                  } else {
                    if (deficit > 0) {
                      statusLabel = `${deficit} DK SÜRE EKSİK`;
                      subLabel = `Gerekli: ${metric.requiredMinutes} / Atanan: ${metric.assignedMinutes}`;
                    } else if (type === 'IGU' && !metric.hasValidClass) {
                      statusLabel = "SINIF UYUMSUZLUĞU";
                      subLabel = `${r.dangerClass} için gerekli sınıf atanmamış.`;
                    } else if (metric.isFullTimeRequired && metric.assignedMinutes < 11700) {
                      statusLabel = "TAM ZAMANLI GEREKLİ";
                      subLabel = "Mevzuat gereği tam zamanlı uzman atanmalıdır.";
                    } else {
                      statusLabel = "KRİTER HATASI";
                      subLabel = "Lütfen atama detaylarını kontrol edin.";
                    }
                  }

                  return (
                    <TableRow key={r.facilityId} className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b last:border-0">
                      <TableCell className="py-6 px-10">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-lg group-hover:text-primary transition-colors">{r.facilityName}</span>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className={cn(
                              "rounded-lg px-2.5 py-0 text-[10px] font-black uppercase",
                              r.dangerClass === 'Çok Tehlikeli' ? 'border-rose-200 bg-rose-50 text-rose-700' :
                              r.dangerClass === 'Tehlikeli' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                              'border-emerald-200 bg-emerald-50 text-emerald-700'
                            )}>
                              {r.dangerClass}
                            </Badge>
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">{r.employeeCount} PERSONEL</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-6 px-10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/10 flex items-center justify-center text-rose-500 shadow-inner">
                            <AlertCircle className="w-6 h-6" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-rose-600 text-[11px] tracking-wide uppercase">{statusLabel}</span>
                            <span className="text-xs text-slate-500 font-medium mt-1 leading-tight">{subLabel}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-6 px-10">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kapsama</span>
                             <span className="text-xs font-black text-rose-600">%{Math.round((metric.assignedMinutes / metric.requiredMinutes) * 100) || 0}</span>
                          </div>
                          <div className="w-48 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-rose-500 transition-all duration-700" 
                              style={{ width: `${Math.min(100, (metric.assignedMinutes / metric.requiredMinutes) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-6 px-10 text-right">
                        <Button 
                          onClick={() => onAssign?.(r, type)}
                          className={cn(
                            "rounded-2xl px-8 h-12 font-black text-xs shadow-xl transition-all active:scale-95 text-white",
                            color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' :
                            color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' :
                            'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                          )}
                        >
                          HIZLI ATAMA YAP <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-32 bg-white dark:bg-slate-950">
                      <div className="flex flex-col items-center gap-6 opacity-40">
                        <div className="w-24 h-24 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
                          <UserCheck className="w-12 h-12" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl font-black text-slate-900 dark:text-white tracking-widest uppercase">EKSİK ATAMA BULUNMUYOR</p>
                          <p className="text-sm font-medium text-slate-500">Tüm tesisler mevzuata uygun şekilde atandı.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CityDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cityName: string;
  data: any;
}

export function CityDetailDialog({ open, onOpenChange, cityName, data }: CityDetailDialogProps) {
  if (!data) return null;

  const maxFacilityCount = Math.max(...Object.values(data.districts).map((d: any) => d.count));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl w-[95vw] h-[85vh] p-0 overflow-hidden border-none shadow-2xl rounded-3xl flex flex-col">
        <DialogHeader className="px-10 py-10 bg-slate-900 text-white shrink-0 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <MapPin className="w-32 h-32" />
           </div>
           <div className="flex items-center gap-6 relative">
             <div className="p-4 bg-primary/10 backdrop-blur-md rounded-2xl border border-white/10">
               <MapPin className="w-8 h-8 text-primary" />
             </div>
             <div>
               <DialogTitle className="text-3xl font-black tracking-tight uppercase">
                 <span className="text-primary">{cityName}</span> Portföy Raporu
               </DialogTitle>
               <DialogDescription className="text-white/40 text-xs mt-1 font-bold uppercase tracking-widest">
                 Bölgesel Dağılım ve Operasyonel Yoğunluk Analizi
               </DialogDescription>
             </div>
           </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 dark:bg-slate-950 custom-scrollbar">
          <div className="space-y-16">
            {/* Heatmap Grid */}
            <div className="space-y-8">
               <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                 <div className="flex items-center gap-3">
                    <LayoutGrid className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">İlçe Bazlı Yoğunluk</h3>
                 </div>
                 <Badge className="bg-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-widest px-4 h-7">{Object.keys(data.districts).length} İLÇE ANALİZİ</Badge>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                 {Object.entries(data.districts).map(([district, distData]: any) => {
                    const intensity = (distData.count / maxFacilityCount) * 100;
                    return (
                      <div 
                        key={district} 
                        className="relative group p-6 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-xl cursor-default overflow-hidden bg-white dark:bg-slate-900"
                        style={{ 
                          borderColor: intensity > 50 ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--slate-100))'
                        }}
                      >
                         <div className="absolute inset-0 opacity-[0.03] transition-opacity group-hover:opacity-[0.08]" 
                              style={{ backgroundColor: 'hsl(var(--primary))' }} />
                         
                         <div className="relative z-10">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">{district}</p>
                           <div className="flex items-baseline gap-1 mt-2">
                             <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{distData.count}</span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase">Tesis</span>
                           </div>
                         </div>
                         <div className="absolute -bottom-3 -right-3 opacity-5 group-hover:opacity-10 transition-all group-hover:rotate-12">
                            <Building2 className="w-16 h-16" />
                         </div>
                      </div>
                    );
                 })}
               </div>
            </div>

            {/* List Detail */}
            <div className="space-y-10">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                 <Building2 className="w-5 h-5 text-primary" />
                 <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Operasyonel Tesis Listesi</h3>
               </div>
              {Object.entries(data.districts).map(([district, distData]: any) => (
                <div key={district} className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-900 dark:bg-slate-800 p-3 rounded-2xl px-8 shadow-lg">
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-white flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                      {district}
                    </h3>
                    <Badge className="bg-primary/20 text-primary border-none font-black text-[10px] px-4 h-6 tracking-widest">
                      {distData.count} AKTİF KAYIT
                    </Badge>
                  </div>
                  
                  <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-800 border-b">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="py-4 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tesis Tanımı</TableHead>
                          <TableHead className="py-4 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tehlike Sınıfı</TableHead>
                          <TableHead className="py-4 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Çalışan</TableHead>
                          <TableHead className="py-4 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksiyon</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {distData.facilities.map((f: any) => (
                          <TableRow key={f.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b last:border-0">
                            <TableCell className="py-5 px-8 font-bold text-slate-700 dark:text-slate-200">{f.name}</TableCell>
                            <TableCell className="py-5 px-8">
                              <Badge variant="outline" className="rounded-lg px-3 h-6 text-[10px] bg-slate-50 dark:bg-slate-800 font-bold border-slate-200 dark:border-slate-700 uppercase">
                                {f.dangerClass}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-5 px-8 text-center text-xs font-bold text-primary">{f.employeeCount} PERSONEL</TableCell>
                            <TableCell className="py-5 px-8 text-right">
                              <Button asChild variant="ghost" className="h-9 px-6 hover:bg-primary/10 hover:text-primary rounded-xl transition-all">
                                <Link to={`/panel/facilities/${f.id}`} className="flex items-center gap-2 font-black text-[10px] uppercase tracking-tighter">
                                  LİFE CARD GÖRÜNTÜLE <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
