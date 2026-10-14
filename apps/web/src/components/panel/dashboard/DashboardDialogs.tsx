import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  UserPlus, Calendar, MapPin, Building2, UserCheck, 
  AlertCircle, LayoutGrid, ArrowRight, Search, X, Filter 
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// SERTİFİKA YENİLEME DİYALOĞU
// ─────────────────────────────────────────────────────────────────────────────
interface CertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any[];
}

export function CertificateRenewalDialog({ open, onOpenChange, data = [] }: CertificateDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredData = useMemo(() => {
    return data.filter((p) => {
      const matchesSearch = p.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (statusFilter === "expired") return p.status?.isExpired;
      if (statusFilter === "critical") return p.status?.isCritical;
      if (statusFilter === "warning") return p.status?.isWarning && !p.status?.isCritical && !p.status?.isExpired;

      return true;
    });
  }, [data, searchQuery, statusFilter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-[96vw] max-h-[88vh] p-0 overflow-hidden rounded-xl border border-border bg-card flex flex-col shadow-lg">
        {/* Header */}
        <DialogHeader className="p-6 bg-muted/40 border-b border-border shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  Sertifika Yenileme Takvimi
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Sertifika geçerlilik süresi yaklaşan veya dolmuş İSG profesyonelleri
                </DialogDescription>
              </div>
            </div>

            <Badge variant="outline" className="h-7 px-3 text-xs font-semibold bg-background border-border w-fit">
              {filteredData.length} / {data.length} Profesyonel
            </Badge>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-3 border-t border-border/50">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Profesyonel adı ara..."
                className="pl-8 h-8 text-xs bg-background rounded-lg border-border"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger size="sm" className="h-8 min-w-[140px] text-xs bg-background rounded-lg border-border">
                <SelectValue placeholder="Durum Filtresi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="critical">Kritik Süre (&lt;30 Gün)</SelectItem>
                <SelectItem value="warning">Uyarı (&lt;90 Gün)</SelectItem>
                <SelectItem value="expired">Süresi Dolmuş</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <X className="w-3.5 h-3.5" /> Filtreyi Temizle
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/10">
          <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/70 sticky top-0 z-10 border-b border-border">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-3 px-4 text-xs font-semibold text-muted-foreground">Profesyonel Ad Soyad</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold text-muted-foreground">Sertifika Bitiş Tarihi</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold text-muted-foreground">Kalan Süre</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold text-muted-foreground text-right">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((p) => {
                  const isExpired = p.status?.isExpired;
                  const isCritical = p.status?.isCritical;

                  return (
                    <TableRow key={p.id} className="hover:bg-muted/40 transition-colors border-b border-border/50 last:border-0">
                      <TableCell className="py-3.5 px-4 font-semibold text-sm text-foreground">
                        {p.fullName}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-xs text-muted-foreground font-medium">
                        {p.certificateDate ? format(new Date(p.certificateDate), "dd MMMM yyyy", { locale: tr }) : "-"}
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "text-xs font-bold",
                            isExpired || isCritical ? "text-destructive" : "text-amber-600 dark:text-amber-400"
                          )}>
                            {isExpired ? "Süresi Doldu" : `${p.status?.daysLeft} Gün Kaldı`}
                          </span>
                          {!isExpired && p.status?.daysLeft !== undefined && (
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn("h-full transition-all", isCritical ? "bg-destructive" : "bg-amber-500")}
                                style={{ width: `${Math.max(10, Math.min(100, 100 - (p.status.daysLeft / 3.65)))}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-tight h-6 px-2.5",
                            isExpired
                              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent"
                              : isCritical
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          )}
                        >
                          {isExpired ? "Süresi Dolmuş" : isCritical ? "Kritik" : "Yenileme Bekliyor"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <UserCheck className="w-10 h-10 opacity-30 text-emerald-500" />
                        <p className="text-sm font-semibold text-foreground">Kayıt Bulunamadı</p>
                        <p className="text-xs text-muted-foreground">
                          {searchQuery || statusFilter !== "all"
                            ? "Filtre kriterlerine uyan profesyonel bulunamadı."
                            : "Kritik veya süresi yaklaşan sertifika yenilemesi bulunmuyor."}
                        </p>
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

// ─────────────────────────────────────────────────────────────────────────────
// KAYNAK EKSİKLİĞİ DİYALOĞU
// ─────────────────────────────────────────────────────────────────────────────
interface GapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: any[];
  type: "IGU" | "Hekim" | "DSP";
  onAssign?: (facility: any, type: "IGU" | "Hekim" | "DSP") => void;
}

export function ResourceGapDialog({ open, onOpenChange, title, data = [], type, onAssign }: GapDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dangerFilter, setDangerFilter] = useState<string>("all");

  const filteredData = useMemo(() => {
    return data.filter((r) => {
      const matchesSearch = r.facilityName?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (dangerFilter !== "all" && r.dangerClass !== dangerFilter) return false;

      return true;
    });
  }, [data, searchQuery, dangerFilter]);

  const Icon = type === "IGU" ? UserPlus : type === "Hekim" ? UserCheck : Building2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl w-[96vw] max-h-[88vh] p-0 overflow-hidden rounded-xl border border-border bg-card flex flex-col shadow-lg">
        {/* Header */}
        <DialogHeader className="p-6 bg-muted/40 border-b border-border shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  {title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Yasal mevzuat gereği atama eksiği veya sertifika sınıfı uyumsuzluğu olan tesisler
                </DialogDescription>
              </div>
            </div>

            <Badge variant="outline" className="h-7 px-3 text-xs font-semibold bg-background border-border w-fit">
              {filteredData.length} / {data.length} Eksik Tesis
            </Badge>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-3 border-t border-border/50">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tesis adı ile ara..."
                className="pl-8 h-8 text-xs bg-background rounded-lg border-border"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <Select value={dangerFilter} onValueChange={setDangerFilter}>
              <SelectTrigger size="sm" className="h-8 min-w-[150px] text-xs bg-background rounded-lg border-border">
                <SelectValue placeholder="Tehlike Sınıfı" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tehlike Sınıfları</SelectItem>
                <SelectItem value="Çok Tehlikeli">Çok Tehlikeli</SelectItem>
                <SelectItem value="Tehlikeli">Tehlikeli</SelectItem>
                <SelectItem value="Az Tehlikeli">Az Tehlikeli</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || dangerFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setDangerFilter("all");
                }}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <X className="w-3.5 h-3.5" /> Filtreyi Temizle
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/10">
          <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/70 sticky top-0 z-10 border-b border-border">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-3 px-4 text-xs font-semibold text-muted-foreground">Tesis Tanımı</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold text-muted-foreground">Durum Analizi</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold text-muted-foreground">Uyumluluk Oranı</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold text-muted-foreground text-right">Aksiyon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((r) => {
                  const metric = type === "IGU" ? r.igu : type === "Hekim" ? r.hekim : r.dsp;
                  const deficit = (metric?.requiredMinutes || 0) - (metric?.assignedMinutes || 0);

                  let statusLabel = "";
                  let subLabel = "";

                  if (type === "DSP") {
                    statusLabel = "DSP Ataması Eksik";
                    subLabel = "Çok tehlikeli sınıfta DSP görevlendirilmesi yasal zorunluluktur.";
                  } else {
                    if (deficit > 0) {
                      statusLabel = `${deficit} Dakika Eksik`;
                      subLabel = `Gerekli: ${metric?.requiredMinutes} dk / Atanan: ${metric?.assignedMinutes || 0} dk`;
                    } else if (type === "IGU" && !metric?.hasValidClass) {
                      statusLabel = "Sertifika Sınıf Uyumsuzluğu";
                      subLabel = `${r.dangerClass} sınıf için uygun İSG uzmanı atanmamış.`;
                    } else if (metric?.isFullTimeRequired && (metric?.assignedMinutes || 0) < 11700) {
                      statusLabel = "Tam Zamanlı Zorunluluğu";
                      subLabel = "Mevzuat gereği tam zamanlı sözleşme yapılmalıdır.";
                    } else {
                      statusLabel = "Eksik / Hatalı Atama";
                      subLabel = "Atama detaylarını ve sözleşme saatlerini kontrol ediniz.";
                    }
                  }

                  const coveragePercent = metric?.requiredMinutes > 0
                    ? Math.round(((metric.assignedMinutes || 0) / metric.requiredMinutes) * 100)
                    : 0;

                  return (
                    <TableRow key={r.facilityId} className="hover:bg-muted/40 transition-colors border-b border-border/50 last:border-0">
                      <TableCell className="py-4 px-4">
                        <div className="flex flex-col">
                          <Link 
                            to={`/panel/facilities/${r.facilityId}`}
                            className="font-semibold text-sm text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
                          >
                            {r.facilityName}
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] h-5 px-1.5 font-bold uppercase",
                                r.dangerClass === "Çok Tehlikeli"
                                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                                  : r.dangerClass === "Tehlikeli"
                                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              )}
                            >
                              {r.dangerClass}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground font-medium">
                              {r.employeeCount} Personel
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-4">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-semibold text-destructive text-xs">
                              {statusLabel}
                            </span>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              {subLabel}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-4">
                        <div className="space-y-1.5 min-w-[140px]">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground text-[11px]">Kapsama:</span>
                            <span className="font-bold text-destructive">%{coveragePercent}</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-destructive transition-all duration-300"
                              style={{ width: `${Math.min(100, coveragePercent)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => onAssign?.(r, type)}
                          className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 shadow-xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Atama Yap
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <UserCheck className="w-10 h-10 opacity-30 text-emerald-500" />
                        <p className="text-sm font-semibold text-foreground">Eksik Atama Bulunmuyor</p>
                        <p className="text-xs text-muted-foreground">
                          {searchQuery || dangerFilter !== "all"
                            ? "Filtre kriterlerine uyan tesis bulunamadı."
                            : "Tüm tesislerde ilgili atama şartları mevzuata uygun şekilde karşılanmıştır."}
                        </p>
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

// ─────────────────────────────────────────────────────────────────────────────
// ŞEHİR DETAY RAPORU DİYALOĞU
// ─────────────────────────────────────────────────────────────────────────────
interface CityDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cityName: string;
  data: any;
}

export function CityDetailDialog({ open, onOpenChange, cityName, data }: CityDetailDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dangerFilter, setDangerFilter] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");

  if (!data) return null;

  const districts = data.districts || {};
  const districtNames = Object.keys(districts);
  const maxFacilityCount = Math.max(...Object.values(districts).map((d: any) => d.count), 1);

  // Collect all facilities with their district name
  const allFacilities = useMemo(() => {
    const list: any[] = [];
    Object.entries(districts).forEach(([district, distData]: any) => {
      (distData.facilities || []).forEach((f: any) => {
        list.push({ ...f, district });
      });
    });
    return list;
  }, [districts]);

  const filteredFacilities = useMemo(() => {
    return allFacilities.filter((f) => {
      const matchesSearch = f.name?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (dangerFilter !== "all" && f.dangerClass !== dangerFilter) return false;
      if (selectedDistrict !== "all" && f.district !== selectedDistrict) return false;

      return true;
    });
  }, [allFacilities, searchQuery, dangerFilter, selectedDistrict]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl w-[96vw] max-h-[88vh] p-0 overflow-hidden rounded-xl border border-border bg-card flex flex-col shadow-lg">
        {/* Header */}
        <DialogHeader className="p-6 bg-muted/40 border-b border-border shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground uppercase">
                  <span className="text-primary">{cityName}</span> Portföy Raporu
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  İlçe bazlı tesis yoğunluğu ve operasyonel tesis detayları
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-7 px-3 text-xs font-semibold bg-background border-border">
                {data.count || 0} Aktif Tesis
              </Badge>
              <Badge variant="secondary" className="h-7 px-3 text-xs font-semibold">
                {districtNames.length} İlçe
              </Badge>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-3 border-t border-border/50">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tesis adı ile ara..."
                className="pl-8 h-8 text-xs bg-background rounded-lg border-border"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
              <SelectTrigger size="sm" className="h-8 min-w-[140px] text-xs bg-background rounded-lg border-border">
                <SelectValue placeholder="İlçe Seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm İlçeler ({districtNames.length})</SelectItem>
                {districtNames.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d} ({districts[d]?.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dangerFilter} onValueChange={setDangerFilter}>
              <SelectTrigger size="sm" className="h-8 min-w-[150px] text-xs bg-background rounded-lg border-border">
                <SelectValue placeholder="Tehlike Sınıfı" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tehlike Sınıfları</SelectItem>
                <SelectItem value="Çok Tehlikeli">Çok Tehlikeli</SelectItem>
                <SelectItem value="Tehlikeli">Tehlikeli</SelectItem>
                <SelectItem value="Az Tehlikeli">Az Tehlikeli</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || dangerFilter !== "all" || selectedDistrict !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setDangerFilter("all");
                  setSelectedDistrict("all");
                }}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <X className="w-3.5 h-3.5" /> Filtreyi Temizle
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/10 space-y-6">
          {/* District Density Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                İlçe Yoğunluk Haritası
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {Object.entries(districts).map(([district, distData]: any) => {
                const isSelected = selectedDistrict === district;
                return (
                  <button
                    key={district}
                    type="button"
                    onClick={() => setSelectedDistrict(isSelected ? "all" : district)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer relative overflow-hidden",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                        : "border-border/70 bg-card hover:border-primary/50 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase truncate">
                        {district}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {distData.count}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-muted rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.round((distData.count / maxFacilityCount) * 100)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Facility List Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Tesis Listesi ({filteredFacilities.length})
              </h3>
            </div>

            <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/70 sticky top-0 z-10 border-b border-border">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-3 px-4 text-xs font-semibold text-muted-foreground">Tesis Adı</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold text-muted-foreground">İlçe</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold text-muted-foreground">Tehlike Sınıfı</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold text-muted-foreground text-center">Çalışan</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold text-muted-foreground text-right">Aksiyon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFacilities.map((f: any) => (
                    <TableRow key={f.id} className="hover:bg-muted/40 transition-colors border-b border-border/50 last:border-0">
                      <TableCell className="py-3.5 px-4 font-semibold text-sm text-foreground">
                        {f.name}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-xs text-muted-foreground font-medium">
                        {f.district}
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] h-5 px-1.5 font-bold uppercase",
                            f.dangerClass === "Çok Tehlikeli"
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                              : f.dangerClass === "Tehlikeli"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          )}
                        >
                          {f.dangerClass}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center text-xs font-semibold text-foreground">
                        {f.employeeCount} Personel
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-right">
                        <Button asChild variant="outline" size="sm" className="h-7 px-2.5 text-xs rounded-lg gap-1">
                          <Link to={`/panel/facilities/${f.id}`}>
                            Life Card <ArrowRight className="w-3 h-3" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredFacilities.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Building2 className="w-10 h-10 opacity-30 text-muted-foreground" />
                          <p className="text-sm font-semibold text-foreground">Tesis Bulunamadı</p>
                          <p className="text-xs text-muted-foreground">
                            Arama kriterlerine uygun tesis kaydı bulunamadı.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
