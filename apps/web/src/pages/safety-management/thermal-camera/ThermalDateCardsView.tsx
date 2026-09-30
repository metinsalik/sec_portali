import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  ChevronRight, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  Thermometer, 
  AlertTriangle, 
  Plus, 
  Upload,
  ArrowRight,
  ShieldCheck,
  Building2,
  Search,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
  Trash2
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import type { ThermalInspectionSession } from '@/services/thermal-inspection.service';

interface Props {
  sessions: ThermalInspectionSession[];
  activeFacilityName: string;
  onSelectSession: (sessionId: string) => void;
  onUploadExcelClick: () => void;
  onNewSessionClick: () => void;
  onCleanupEmptyClick?: () => void;
  onViewExecutiveDashboard?: () => void;
  onViewWatchlist?: () => void;
  onDeleteSession?: (sessionId: string) => Promise<void> | void;
  isLoading?: boolean;
}

export const ThermalDateCardsView: React.FC<Props> = ({
  sessions,
  activeFacilityName,
  onSelectSession,
  onUploadExcelClick,
  onNewSessionClick,
  onCleanupEmptyClick,
  onViewExecutiveDashboard,
  onViewWatchlist,
  onDeleteSession,
  isLoading
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS'>('ALL');
  const [deletingSession, setDeletingSession] = useState<{ id: string; label: string; panelCount: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deletingSession || !onDeleteSession) return;
    setIsDeleting(true);
    try {
      await onDeleteSession(deletingSession.id);
      setDeletingSession(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Sort sessions descending by reportDate / createdAt
  const sortedSessions = [...sessions].sort((a, b) => {
    const da = new Date(a.reportDate || a.createdAt).getTime();
    const db = new Date(b.reportDate || b.createdAt).getTime();
    return db - da;
  });

  // Calculate KPIs
  const totalSessions = sortedSessions.length;
  const totalPanels = sortedSessions.reduce((acc, s) => acc + (s._count?.items || s.items?.length || 0), 0);
  const completedSessions = sortedSessions.filter(s => s.status === 'TAMAMLANDI').length;
  const inProgressSessions = totalSessions - completedSessions;

  // Group and name sessions by date: e.g. "26.09.2026", and if multiple, "26.09.2026 - Kontrol 1", "26.09.2026 - Kontrol 2"
  const dateCounts: Record<string, number> = {};
  sortedSessions.forEach(s => {
    const dStr = new Date(s.reportDate || s.createdAt).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    dateCounts[dStr] = (dateCounts[dStr] || 0) + 1;
  });

  // Chronological order for numbering Kontrol 1, Kontrol 2
  const chronological = [...sortedSessions].reverse();
  const dateSeenIndex: Record<string, number> = {};
  const sessionLabels: Record<string, string> = {};

  chronological.forEach(s => {
    const dStr = new Date(s.reportDate || s.createdAt).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    dateSeenIndex[dStr] = (dateSeenIndex[dStr] || 0) + 1;
    if (dateCounts[dStr] > 1) {
      sessionLabels[s.id] = `${dStr} - Kontrol ${dateSeenIndex[dStr]}`;
    } else {
      sessionLabels[s.id] = dStr;
    }
  });

  // Filter sessions
  const filteredSessions = sortedSessions.filter(s => {
    const label = sessionLabels[s.id] || '';
    const facility = s.facility?.name || activeFacilityName;
    const isCompleted = s.status === 'TAMAMLANDI';
    
    if (statusFilter === 'COMPLETED' && !isCompleted) return false;
    if (statusFilter === 'IN_PROGRESS' && isCompleted) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        label.toLowerCase().includes(q) ||
        facility.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-indigo-900/40 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {activeFacilityName}
            </span>
            <span className="text-xs text-slate-400">Termal Kamera Kontrol Geçmişi</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Elektrik Pano Kontrol Tarihleri
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Tesisinize ait yapılmış tüm kontrol tarihleri ve formları aşağıda listelenmiştir. Detaylı pano sıcaklıkları ve fotoğrafları görmek için ilgili satırı seçiniz.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onViewWatchlist && (
            <Button
              onClick={onViewWatchlist}
              className="bg-rose-600 hover:bg-rose-500 text-white gap-2 text-xs h-10 px-4 font-semibold shadow-md shadow-rose-600/30"
            >
              <AlertTriangle className="w-4 h-4" />
              Sıkı Takipteki Panolar
            </Button>
          )}
          {onViewExecutiveDashboard && (
            <Button
              onClick={onViewExecutiveDashboard}
              variant="outline"
              className="bg-white/5 hover:bg-white/15 text-slate-200 border-white/20 backdrop-blur-sm gap-2 text-xs h-10 px-3.5 font-medium"
            >
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Yönetici Takip Ekranı
            </Button>
          )}
          <Button
            onClick={onUploadExcelClick}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm gap-2 text-xs h-10 px-4 font-semibold"
          >
            <Upload className="w-4 h-4" />
            Excelden Aktar
          </Button>
          {onCleanupEmptyClick && (
            <Button
              onClick={onCleanupEmptyClick}
              variant="outline"
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 border-rose-400/30 backdrop-blur-sm gap-2 text-xs h-10 px-3.5 font-semibold transition-colors"
              title="Excel aktarımından veya boş satırlardan kalan verisiz hayalet kayıtları temizler"
            >
              <Sparkles className="w-4 h-4 text-rose-400" />
              Boş Satırları Temizle
            </Button>
          )}
          <Button
            onClick={onNewSessionClick}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 text-xs h-10 px-4 font-semibold shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            Yeni Kontrol Başlat
          </Button>
        </div>
      </div>

      {/* 2. Concise KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer transition-all border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm ${
            statusFilter === 'ALL' ? 'ring-2 ring-indigo-500 shadow-md' : 'hover:border-slate-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Toplam Kontrol Formu</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {totalSessions}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Kayıtlı denetim oturumu</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Toplam Ölçülen Pano</p>
              <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {totalPanels}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Tüm tarihler toplamı</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
              <Thermometer className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          className={`cursor-pointer transition-all border-emerald-200/80 dark:border-emerald-900/40 bg-white dark:bg-slate-900 shadow-sm ${
            statusFilter === 'COMPLETED' ? 'ring-2 ring-emerald-500 shadow-md' : 'hover:border-emerald-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600">Onaylanan Kontroller</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {completedSessions}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Tamamlandı olarak kapatıldı</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          className={`cursor-pointer transition-all border-amber-200/80 dark:border-amber-900/40 bg-white dark:bg-slate-900 shadow-sm ${
            statusFilter === 'IN_PROGRESS' ? 'ring-2 ring-amber-500 shadow-md' : 'hover:border-amber-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-600">Açık / Devam Eden</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {inProgressSessions}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Ölçüm girişi sürüyor</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. List Container (Table Layout Instead of Big Cards) */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Kontrol Tarihleri Listesi
            </h3>
            <Badge variant="outline" className="text-[11px] px-2 py-0 border-slate-300">
              {filteredSessions.length} Oturum
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Tabs */}
            <div className="inline-flex rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === 'COMPLETED' ? 'bg-emerald-600 text-white shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Tamamlandı
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('IN_PROGRESS')}
                className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === 'IN_PROGRESS' ? 'bg-amber-500 text-white shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Devam Eden
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <Input
                placeholder="Tarih veya açıklama ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
        </div>

        {/* List View */}
        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
              Eşleşen Kontrol Tarihi Bulunamadı
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Filtrelerinizi temizleyebilir veya yeni bir kontrol başlatabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100/70 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Kontrol Tarihi</th>
                  <th className="px-4 py-3">Tesis / Hastane</th>
                  <th className="px-4 py-3 text-center">Ölçülen Pano Adedi</th>
                  <th className="px-4 py-3 text-center">Form Durumu</th>
                  <th className="px-4 py-3">Kayıt / Güncelleme Saati</th>
                  <th className="px-4 py-3">Açıklama / Not</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSessions.map((session) => {
                  const isCompleted = session.status === 'TAMAMLANDI';
                  const panelCount = session._count?.items || session.items?.length || 0;
                  const label = sessionLabels[session.id] || 'Bilinmeyen Tarih';
                  const dateObj = new Date(session.reportDate || session.createdAt);
                  const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg ${isCompleted ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'}`}>
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {label}
                            </span>
                            <span className="block text-[11px] text-slate-400">
                              {session.reportDate ? new Date(session.reportDate).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Tarih belirtilmedi'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {session.facility?.name || activeFacilityName}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {panelCount} Pano
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <Badge
                          className={`text-[11px] px-2.5 py-0.5 font-semibold gap-1 inline-flex items-center ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Ölçümler Tamamlandı
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Devam Ediyor
                            </>
                          )}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {timeStr}
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate">
                        {session.notes || '-'}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all gap-1 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSession(session.id);
                            }}
                          >
                            Pano Sıcaklıklarını Gör
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                          {onDeleteSession && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="Bu Kontrol Oturumunu Sil"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingSession({
                                  id: session.id,
                                  label,
                                  panelCount
                                });
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingSession} onOpenChange={(open) => !open && !isDeleting && setDeletingSession(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border dark:border-slate-800 p-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mb-2 mx-auto sm:mx-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              Kontrol Oturumunu Sil
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              <strong className="text-slate-900 dark:text-white">{deletingSession?.label}</strong> tarihli kontrol oturumunu silmek istediğinize emin misiniz?
              {deletingSession && deletingSession.panelCount > 0 ? (
                <span className="block mt-2 font-medium text-rose-600 dark:text-rose-400">
                  Bu oturuma ait {deletingSession.panelCount} adet pano ölçüm kaydı ve fotoğrafları da kalıcı olarak silinecektir.
                </span>
              ) : (
                <span className="block mt-1 text-slate-500">
                  Bu oturumda kayıtlı pano bulunmamaktadır.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex flex-row justify-end gap-2 border-t pt-4 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingSession(null)}
              disabled={isDeleting}
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Siliniyor...' : 'Evet, Oturumu Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
