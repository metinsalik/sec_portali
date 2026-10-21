import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, ChevronDown, ChevronUp, Plus, History, AlertTriangle, 
  CheckCircle2, Clock, Calendar, RefreshCw, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import type { FacilityOption, PeriodicControlSummaryItem, ImprovementPeriodicReport } from './types';
import { PeriodicReportModal } from './PeriodicReportModal';
import { PeriodicReportHistoryModal } from './PeriodicReportHistoryModal';

const API = import.meta.env.VITE_API_URL || '';

interface PeriodicControlPanelProps {
  sheetType: string;
  sheetTitle: string;
  facilities: FacilityOption[];
  selectedFacilityId: string;
  onFacilityChange?: (facilityId: string) => void;
  onOpenAddFinding: (facilityId?: string, reportId?: string) => void;
  refreshTrigger?: number;
}

export const PeriodicControlPanel: React.FC<PeriodicControlPanelProps> = ({
  sheetType,
  sheetTitle,
  facilities,
  selectedFacilityId,
  onFacilityChange,
  onOpenAddFinding,
  refreshTrigger,
}) => {
  // Akordiyon varsayılan olarak kapalı gelsin
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<PeriodicControlSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modallar
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [reportToEdit, setReportToEdit] = useState<ImprovementPeriodicReport | null>(null);
  const [historyFacility, setHistoryFacility] = useState<{ id: string; name: string } | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `${API}/api/operations/improvements/periodic-reports?sheetType=${sheetType}&facilityId=${selectedFacilityId}`;
      const res = await fetch(url, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const d = await res.json();
      if (d.success && Array.isArray(d.data)) {
        setItems(d.data);
      }
    } catch (err) {
      console.error('Error fetching periodic reports summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [sheetType, selectedFacilityId, refreshTrigger]);

  // 0 olan hastaneleri gösterme: Yalnızca raporu olan veya açık bulgusu olan hastaneleri filtrele
  const visibleItems = useMemo(() => {
    return items.filter(item => {
      if (selectedFacilityId !== 'ALL') return true;
      return item.report !== null || item.openCount > 0;
    });
  }, [items, selectedFacilityId]);

  // Akordeon başlığında doğrudan gösterilecek özet etiketleri (Badges)
  const stats = useMemo(() => {
    let uygun = 0;
    let uygunDegil = 0;
    let totalOpen = 0;
    let totalCritical = 0;
    let overdue = 0;

    visibleItems.forEach(item => {
      if (item.report?.result === 'Uygun') uygun++;
      if (item.report?.result === 'Uygun Değil') uygunDegil++;
      totalOpen += item.openCount;
      totalCritical += item.openCriticalCount;
      if (item.isOverdue) overdue++;
    });

    return { uygun, uygunDegil, totalOpen, totalCritical, overdue };
  }, [visibleItems]);

  return (
    <div className="bg-card text-card-foreground border rounded-2xl shadow-xs overflow-hidden transition-all font-sans">
      
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* BAŞLIK & FİLTRE VE YENİ RAPOR EKLE BARI (Görsel 3 Üst Kısmı)          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="px-5 py-3.5 bg-muted/30 border-b flex flex-wrap items-center justify-between gap-3">
        
        {/* Sol: Akordeon Başlığı & Üzerindeki Doğrudan Etiketler */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>Periyodik Kontrol Bilgileri</span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Akordeon Üzerine Doğrudan Gelen Etiketler (Badges) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {stats.uygun > 0 && (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold px-2.5 py-0.5 shadow-2xs flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {stats.uygun} Uygun
              </Badge>
            )}

            {stats.uygunDegil > 0 && (
              <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800 text-[11px] font-bold px-2.5 py-0.5 shadow-2xs flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-600" />
                {stats.uygunDegil} Uygun Değil
              </Badge>
            )}

            {stats.totalOpen > 0 && (
              <Badge variant="outline" className="text-[11px] font-semibold text-foreground px-2.5 py-0.5 shadow-2xs bg-background">
                {stats.totalOpen} Açık Bulgu
              </Badge>
            )}

            {stats.totalCritical > 0 && (
              <Badge className="bg-red-600 text-white text-[11px] font-bold px-2.5 py-0.5 shadow-2xs">
                {stats.totalCritical} Kritik
              </Badge>
            )}

            {stats.overdue > 0 && (
              <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300 text-[11px] font-bold px-2.5 py-0.5 shadow-2xs animate-pulse">
                {stats.overdue} Süresi Geçen
              </Badge>
            )}

            {visibleItems.length === 0 && !loading && (
              <Badge variant="outline" className="text-[11px] text-muted-foreground bg-background">
                Aktif Takip Yok
              </Badge>
            )}
          </div>
        </div>

        {/* Sağ: Hastane Filtresi & Yeni İşlem/Rapor Ekle Butonu */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Hastane Filtresi */}
          {onFacilityChange && (
            <div className="flex items-center gap-1.5 bg-background border rounded-lg px-2.5 py-1 text-xs shadow-2xs">
              <span className="text-muted-foreground text-[11px] font-medium hidden sm:inline">Hastane:</span>
              <select
                value={selectedFacilityId}
                onChange={(e) => onFacilityChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-foreground outline-none cursor-pointer pr-1"
              >
                <option value="ALL">Tüm Hastaneler</option>
                {facilities.map(fac => (
                  <option key={fac.id} value={fac.id}>
                    {fac.shortName || fac.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Yenile */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSummary}
            className="h-8 w-8 p-0"
            title="Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Yeni İşlem / Rapor Ekle Butonu (Görsel 2'yi tetikler) */}
          <Button
            size="sm"
            onClick={() => {
              setReportToEdit(null);
              setShowAddReportModal(true);
            }}
            className="h-8 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            İşlem / Rapor Ekle
          </Button>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* AKORDEON İÇERİĞİ: HASTANE BAZLI PK BİLGİLERİ LİSTESİ (Görsel 3 Tablosu) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="overflow-x-auto">
          {loading && visibleItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Periyodik kontrol bilgileri yükleniyor...
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Kayıtlı periyodik kontrol veya açık bulgusu bulunan hastane bulunamadı.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/20 text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-44">Hastane</th>
                  <th className="py-2.5 px-4">Periyodik Kontrol</th>
                  <th className="py-2.5 px-4 w-36">Açık Bulgu</th>
                  <th className="py-2.5 px-4 w-44 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {visibleItems.map((item) => {
                  const rep = item.report;
                  const isUygun = rep?.result === 'Uygun';
                  const isUygunDegil = rep?.result === 'Uygun Değil';
                  const sDateStr = rep?.inspectionDate 
                    ? new Date(rep.inspectionDate).toLocaleDateString('tr-TR')
                    : (rep?.startDate ? new Date(rep.startDate).toLocaleDateString('tr-TR') : null);
                  const nextDateStr = rep?.nextInspectionDate 
                    ? new Date(rep.nextInspectionDate).toLocaleDateString('tr-TR')
                    : '—';

                  return (
                    <tr key={item.facility.id} className="hover:bg-muted/30 transition-colors">
                      
                      {/* 1. Hastane Adı */}
                      <td className="py-3 px-4 font-bold text-foreground">
                        {item.facility.shortName || item.facility.name}
                      </td>

                      {/* 2. Periyodik Kontrol Durumu ve Tarihleri (Görsel 3'teki tasarım) */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex items-center gap-2">
                            {sDateStr ? (
                              <span className="font-mono font-bold text-xs text-foreground">
                                {sDateStr}
                              </span>
                            ) : null}

                            {/* Sonuç Rozeti (Uygun Yeşil, Uygun Değil Kırmızı, Sonuç Yok Gri) */}
                            {rep ? (
                              <Badge 
                                className={`text-[10px] font-bold px-2 py-0.5 shadow-2xs flex items-center gap-1 ${
                                  isUygun 
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                                    : 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800'
                                }`}
                              >
                                {isUygun ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <AlertTriangle className="w-3 h-3 text-red-600" />
                                )}
                                {rep.result}
                              </Badge>
                            ) : (
                              <Badge 
                                variant="outline" 
                                className="text-[10px] font-normal text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200"
                              >
                                Sonuç bilgisi yok
                              </Badge>
                            )}

                            {rep?.reportNo && (
                              <span className="text-[11px] font-mono text-muted-foreground hidden md:inline">
                                (#{rep.reportNo})
                              </span>
                            )}
                          </div>

                          {/* Sonraki Kontrol Tarihi */}
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <span>Sonraki:</span>
                            <span className={`font-mono font-semibold ${item.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                              {nextDateStr}
                            </span>
                            {item.isOverdue && (
                              <span className="text-[10px] text-red-600 font-bold ml-1">
                                (Süresi Geçti)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Açık Bulgu Sayısı */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">
                            {item.openCount > 0 ? `${item.openCount} açık` : '0 açık'}
                          </span>
                          {item.openCriticalCount > 0 && (
                            <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                              {item.openCriticalCount} kritik
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Aksiyon Butonları: Geçmiş & + Bulgu */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Geçmiş Butonu */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHistoryFacility({ id: item.facility.id, name: item.facility.shortName || item.facility.name })}
                            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <History className="w-3 h-3 mr-1" />
                            Geçmiş
                          </Button>

                          {/* + Bulgu Butonu */}
                          <Button
                            size="sm"
                            onClick={() => onOpenAddFinding(item.facility.id, rep?.id)}
                            className="h-7 px-2.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 transition-all"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Bulgu
                          </Button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Rapor Ekle / Düzenle Modalı */}
      {showAddReportModal && (
        <PeriodicReportModal
          sheetType={sheetType}
          sheetTitle={sheetTitle}
          facilities={facilities}
          defaultFacilityId={selectedFacilityId !== 'ALL' ? selectedFacilityId : undefined}
          reportToEdit={reportToEdit}
          onClose={() => {
            setShowAddReportModal(false);
            setReportToEdit(null);
          }}
          onSuccess={() => {
            fetchSummary();
          }}
          onRequestAddFinding={(facId, repId) => {
            onOpenAddFinding(facId, repId);
          }}
        />
      )}

      {/* Rapor Geçmişi Modalı */}
      {historyFacility && (
        <PeriodicReportHistoryModal
          facilityId={historyFacility.id}
          facilityName={historyFacility.name}
          sheetType={sheetType}
          sheetTitle={sheetTitle}
          onClose={() => setHistoryFacility(null)}
          onEditReport={(rep) => {
            setReportToEdit(rep);
            setShowAddReportModal(true);
          }}
          onRefresh={fetchSummary}
        />
      )}

    </div>
  );
};
