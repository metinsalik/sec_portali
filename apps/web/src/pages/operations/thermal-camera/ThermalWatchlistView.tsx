import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Flame,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Building2,
  RefreshCw,
  Eye,
  Edit2,
  ShieldAlert
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  thermalInspectionService,
  type ThermalInspectionItem
} from '@/services/thermal-inspection.service';
import { ThermalActionModal } from './ThermalActionModal';
import { ThermalItemDetailModal } from './ThermalItemDetailModal';

interface Props {
  facilityId?: string;
  facilityName?: string;
  onSelectSession?: (sessionId: string) => void;
  onInspectItem?: (item: ThermalInspectionItem) => void;
  onOpenPanelDetail?: (panelName: string) => void;
}

export const ThermalWatchlistView: React.FC<Props> = ({
  facilityId,
  facilityName = 'Tesis',
  onSelectSession,
  onInspectItem,
  onOpenPanelDetail
}) => {
  const [watchlist, setWatchlist] = useState<ThermalInspectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | 'URGENT' | 'OPEN' | 'COMPLETED'>('ALL');

  // Modal states
  const [selectedActionItem, setSelectedActionItem] = useState<ThermalInspectionItem | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<ThermalInspectionItem | null>(null);

  // History / Trend modal state
  const [historyPanelName, setHistoryPanelName] = useState<string | null>(null);
  const [panelHistory, setPanelHistory] = useState<ThermalInspectionItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const data = await thermalInspectionService.getWatchlist(facilityId);
      setWatchlist(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, [facilityId]);

  // Load Panel History (Zaman İçinde Çoklu Ölçüm Takibi)
  const handleOpenPanelHistory = async (panelName: string) => {
    setHistoryPanelName(panelName);
    setHistoryLoading(true);
    try {
      const history = await thermalInspectionService.getPanelHistory(panelName, facilityId);
      setPanelHistory(Array.isArray(history) ? history : []);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleActionSaved = (updated: ThermalInspectionItem) => {
    setWatchlist(prev => prev.map(it => it.id === updated.id ? { ...it, ...updated } : it));
  };

  // Metrics
  const now = new Date();
  const overdueCount = watchlist.filter(it => it.actionDueDate && new Date(it.actionDueDate) < now && it.actionStatus !== 'TAMAMLANDI').length;
  const urgentCount = watchlist.filter(it => it.priority === 'Acil' || (it.measuredTemp && it.measuredTemp >= 60)).length;
  const openCount = watchlist.filter(it => it.actionStatus !== 'TAMAMLANDI').length;
  const completedCount = watchlist.filter(it => it.actionStatus === 'TAMAMLANDI').length;

  const filtered = watchlist.filter(it => {
    if (statusFilter === 'OVERDUE') {
      const isOverdue = it.actionDueDate && new Date(it.actionDueDate) < now && it.actionStatus !== 'TAMAMLANDI';
      if (!isOverdue) return false;
    } else if (statusFilter === 'URGENT') {
      const isUrgent = it.priority === 'Acil' || (it.measuredTemp && it.measuredTemp >= 60);
      if (!isUrgent) return false;
    } else if (statusFilter === 'OPEN') {
      if (it.actionStatus === 'TAMAMLANDI') return false;
    } else if (statusFilter === 'COMPLETED') {
      if (it.actionStatus !== 'TAMAMLANDI') return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (it.panelName && it.panelName.toLowerCase().includes(q)) ||
        (it.buildingLocation && it.buildingLocation.toLowerCase().includes(q)) ||
        (it.detectedRisk && it.detectedRisk.toLowerCase().includes(q)) ||
        (it.actionPlan && it.actionPlan.toLowerCase().includes(q)) ||
        (it.actionAssignee && it.actionAssignee.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white shadow-lg border border-rose-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {facilityName}
            </span>
            <span className="text-xs text-slate-300">Merkezi Aksiyon Takibi</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Flame className="w-6 h-6 text-rose-400" />
            Sıkı Takipteki Panolar ve Termin Takip Merkezi
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Sıcaklık uygunsuzluğu (Acil, Uygunsuz, Takip) tespit edilmiş elektrik panoları için tanımlanan aksiyonlar, atanan sorumlular ve hedeflenen termin tarihleri burada canlı olarak izlenir.
          </p>
        </div>

        <Button
          onClick={fetchWatchlist}
          variant="outline"
          disabled={loading}
          className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm gap-2 text-xs font-semibold h-10 px-4 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card
          onClick={() => setStatusFilter(statusFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
          className={`cursor-pointer transition-all ${
            overdueCount > 0 ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20' : 'border-slate-200'
          } ${statusFilter === 'OVERDUE' ? 'ring-2 ring-rose-500 shadow-md' : 'hover:border-rose-300'}`}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-rose-600 block uppercase">Geciken Aksiyonlar</span>
              <span className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-0.5 block">{overdueCount}</span>
              <span className="text-[10px] text-rose-500">termini geçmiş</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setStatusFilter(statusFilter === 'URGENT' ? 'ALL' : 'URGENT')}
          className={`cursor-pointer transition-all border-slate-200 ${statusFilter === 'URGENT' ? 'ring-2 ring-red-500 shadow-md' : 'hover:border-red-300'}`}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-red-600 block uppercase">Acil Riskli Panolar</span>
              <span className="text-2xl font-black text-red-600 dark:text-red-400 mt-0.5 block">{urgentCount}</span>
              <span className="text-[10px] text-slate-500">yüksek sıcaklık</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setStatusFilter(statusFilter === 'OPEN' ? 'ALL' : 'OPEN')}
          className={`cursor-pointer transition-all border-slate-200 ${statusFilter === 'OPEN' ? 'ring-2 ring-amber-500 shadow-md' : 'hover:border-amber-300'}`}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-amber-600 block uppercase">Açık / İşlemde</span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">{openCount}</span>
              <span className="text-[10px] text-slate-500">çözüm bekleyen</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          className={`cursor-pointer transition-all border-slate-200 ${statusFilter === 'COMPLETED' ? 'ring-2 ring-emerald-500 shadow-md' : 'hover:border-emerald-300'}`}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-600 block uppercase">Tamamlanan</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{completedCount}</span>
              <span className="text-[10px] text-slate-500">aksiyonu alınan</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Takip Listesindeki Panolar ({filtered.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <Input
                placeholder="Pano adı, sorumlu veya aksiyon ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <Button
              type="button"
              variant={statusFilter === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('ALL')}
              className="text-xs h-8"
            >
              Tümü
            </Button>
          </div>
        </div>

        {/* Watchlist Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-3.5 py-3">Pano Adı / Lokasyon</th>
                <th className="px-3.5 py-3 text-right">Ölçülen Sıcaklık</th>
                <th className="px-3.5 py-3 text-center">Öncelik / Durum</th>
                <th className="px-3.5 py-3">Planlanan Aksiyon</th>
                <th className="px-3.5 py-3">Termin Tarihi</th>
                <th className="px-3.5 py-3">Sorumlu</th>
                <th className="px-3.5 py-3 text-center">Aksiyon Durumu</th>
                <th className="px-3.5 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((item) => {
                const isOverdue = item.actionDueDate && new Date(item.actionDueDate) < now && item.actionStatus !== 'TAMAMLANDI';
                const isUrgent = item.priority === 'Acil' || (item.measuredTemp && item.measuredTemp >= 60);

                return (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-3.5 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {item.panelName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {item.session?.facility?.name || item.buildingLocation || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="px-3.5 py-3.5 text-right font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded ${
                        isUrgent ? 'bg-rose-100 text-rose-700 font-extrabold' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.measuredTemp} °C
                      </span>
                    </td>

                    <td className="px-3.5 py-3.5 text-center">
                      <Badge className={isUrgent ? 'bg-rose-600 text-white text-[10px]' : 'bg-amber-500 text-white text-[10px]'}>
                        {item.priority || item.status || 'Takip'}
                      </Badge>
                    </td>

                    <td className="px-3.5 py-3.5 max-w-[240px]">
                      {item.actionPlan ? (
                        <p className="text-slate-800 dark:text-slate-200 line-clamp-2" title={item.actionPlan}>
                          {item.actionPlan}
                        </p>
                      ) : (
                        <span className="text-rose-500 italic text-[11px] font-medium">
                          Henüz aksiyon girilmedi!
                        </span>
                      )}
                    </td>

                    <td className="px-3.5 py-3.5 whitespace-nowrap">
                      {item.actionDueDate ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-600' : 'text-slate-400'}`} />
                          <span className={`font-mono ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                            {format(new Date(item.actionDueDate), 'dd.MM.yyyy')}
                          </span>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-[9px] px-1 py-0 uppercase">Gecikti</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-3.5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {item.actionAssignee || <span className="text-slate-400">—</span>}
                    </td>

                    <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                      {item.actionStatus === 'TAMAMLANDI' ? (
                        <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Tamamlandı
                        </Badge>
                      ) : item.actionStatus === 'DEVAM_EDIYOR' ? (
                        <Badge className="bg-blue-600 text-white text-[10px] gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          İşlemde
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[10px] gap-1">
                          <Clock className="w-3 h-3" />
                          Bekliyor
                        </Badge>
                      )}
                    </td>

                    <td className="px-3.5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Aksiyon Al / Güncelle Butonu */}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setSelectedActionItem(item)}
                          className="h-7 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1 shadow-sm"
                        >
                          <Edit2 className="w-3 h-3" />
                          Aksiyon Al
                        </Button>

                        {/* Çoklu Ölçüm / Tarihçe Trend Butonu */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (onOpenPanelDetail) {
                              onOpenPanelDetail(item.panelName);
                            } else {
                              handleOpenPanelHistory(item.panelName);
                            }
                          }}
                          className="h-7 px-2 text-xs text-slate-700 hover:text-indigo-600 gap-1 font-semibold"
                          title="Bu panonun geçmiş ölçüm ve sıcaklık trend sayfasına git"
                        >
                          <TrendingUp className="w-3 h-3 text-indigo-500" />
                          Pano Sayfası
                        </Button>

                        {/* Detay & Fotoğraf */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDetailItem(item)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                          title="Detay ve Fotoğraflar"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Kriterlere uygun takip kaydı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Aksiyon Planlama Modalı */}
      {selectedActionItem && (
        <ThermalActionModal
          isOpen={Boolean(selectedActionItem)}
          onClose={() => setSelectedActionItem(null)}
          item={selectedActionItem}
          onActionSaved={handleActionSaved}
        />
      )}

      {/* Pano Detay Modalı */}
      {selectedDetailItem && (
        <ThermalItemDetailModal
          isOpen={Boolean(selectedDetailItem)}
          onClose={() => setSelectedDetailItem(null)}
          item={selectedDetailItem}
        />
      )}

      {/* Pano Geçmiş Ölçüm Tarihçesi (Trend / Çoklu Ölçüm Modalı) */}
      {historyPanelName && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-sm">
                  {historyPanelName} — Çoklu Ölçüm ve Sıcaklık Tarihçesi
                </h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHistoryPanelName(null)}
                className="text-white hover:bg-white/10 h-7 px-2"
              >
                Kapat
              </Button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
              <p className="text-xs text-slate-500">
                Bu panonun farklı tarihlerde yapılan kontrollerdeki ölçüm geçmişi ve alınan aksiyon sonuçları listelenmektedir.
              </p>

              {historyLoading ? (
                <div className="py-8 text-center text-slate-400 text-xs">Yükleniyor...</div>
              ) : panelHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">Geçmiş ölçüm kaydı bulunamadı.</div>
              ) : (
                <div className="space-y-2">
                  {panelHistory.map((hist, i) => (
                    <div
                      key={hist.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {hist.session?.reportDate ? format(new Date(hist.session.reportDate), 'dd.MM.yyyy') : 'Tarih Belirtilmemiş'}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {hist.status || 'Normal'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {hist.actionPlan || hist.actionTaken || hist.detectedRisk || 'Kayıtlı aksiyon yok'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-extrabold font-mono text-indigo-600 block">
                          {hist.measuredTemp} °C
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Ortam: {hist.ambientTemp ?? '—'} °C
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
