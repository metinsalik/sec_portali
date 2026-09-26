import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Building2, CheckCircle2, Clock, XCircle, AlertTriangle,
  Search, ShieldAlert, ChevronRight, Eye, Thermometer
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { ThermalDashboardResponse, ThermalDashboardFacility } from '@/services/thermal-inspection.service';

interface Props {
  data: ThermalDashboardResponse | null;
  loading: boolean;
  onSelectFacility: (facilityId: string) => void;
  onRefresh: () => void;
}

export const ThermalExecutiveDashboard: React.FC<Props> = ({
  data,
  loading,
  onSelectFacility,
  onRefresh
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'NOT_ENTERED'>('ALL');
  const [search, setSearch] = useState('');

  if (loading && !data) {
    return (
      <div className="py-12 text-center text-slate-500">
        Yönetici gösterge paneli yükleniyor...
      </div>
    );
  }

  if (!data) return null;

  const { summary, facilities } = data;

  const filteredFacilities = facilities.filter(f => {
    // Status filter
    if (filterStatus === 'COMPLETED' && !f.isCompleted) return false;
    if (filterStatus === 'IN_PROGRESS' && (!f.hasEntered || f.isCompleted)) return false;
    if (filterStatus === 'NOT_ENTERED' && f.hasEntered) return false;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        (f.shortName && f.shortName.toLowerCase().includes(q)) ||
        (f.city && f.city.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Facilities */}
        <Card
          onClick={() => setFilterStatus('ALL')}
          className={`cursor-pointer transition-all border-slate-200 dark:border-slate-800 ${
            filterStatus === 'ALL' ? 'ring-2 ring-indigo-500 shadow-md' : 'hover:border-slate-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Toplam Tesis</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {summary.totalFacilities}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Katılım: <span className="font-semibold text-indigo-600 dark:text-indigo-400">%{summary.entryRate}</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card
          onClick={() => setFilterStatus('COMPLETED')}
          className={`cursor-pointer transition-all border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10 ${
            filterStatus === 'COMPLETED' ? 'ring-2 ring-emerald-500 shadow-md' : 'hover:border-emerald-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Tamamlanan Tesisler</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {summary.completedCount}
              </h3>
              <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
                Ölçümler Onaylandı (%{summary.completionRate})
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card
          onClick={() => setFilterStatus('IN_PROGRESS')}
          className={`cursor-pointer transition-all border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 ${
            filterStatus === 'IN_PROGRESS' ? 'ring-2 ring-amber-500 shadow-md' : 'hover:border-amber-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Devam Eden Tesisler</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {summary.inProgressCount}
              </h3>
              <p className="text-[11px] text-amber-600 mt-0.5">
                Excel Yüklendi / Ölçüm Sürüyor
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Not Entered */}
        <Card
          onClick={() => setFilterStatus('NOT_ENTERED')}
          className={`cursor-pointer transition-all border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10 ${
            filterStatus === 'NOT_ENTERED' ? 'ring-2 ring-rose-500 shadow-md' : 'hover:border-rose-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-rose-700 dark:text-rose-400">Girmeyen Tesisler</p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {summary.notEnteredCount}
              </h3>
              <p className="text-[11px] text-rose-600 mt-0.5">
                Henüz Form Açılmadı
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Facilities Status Table */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-4 border-b dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-indigo-600" />
              Tesis Bazlı Termal Pano Denetim Durumu
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Tüm hastane ve tesislerin form giriş ve onay durumlarını anlık takip edebilirsiniz.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <Input
                placeholder="Tesis adı veya şehir ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold text-[11px] border-b dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Tesis / Hastane</th>
                <th className="px-4 py-3">Şehir</th>
                <th className="px-4 py-3 text-center">Durum</th>
                <th className="px-4 py-3 text-center">Ölçülen Pano</th>
                <th className="px-4 py-3 text-center">Kritik / Isınma</th>
                <th className="px-4 py-3">Rapor / Yüklenme Tarihi</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {filteredFacilities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Filtreye uygun tesis bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredFacilities.map((fac) => (
                  <tr
                    key={fac.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => onSelectFacility(fac.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {fac.name}
                      </div>
                      {fac.shortName && fac.shortName !== fac.name && (
                        <div className="text-[11px] text-slate-400">{fac.shortName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{fac.city || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {!fac.hasEntered ? (
                        <Badge variant="outline" className="border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/20">
                          Girilmedi
                        </Badge>
                      ) : fac.isCompleted ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Tamamlandı
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 gap-1">
                          <Clock className="w-3 h-3" />
                          Devam Ediyor
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-medium">
                      {fac.itemCount > 0 ? fac.itemCount : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {fac.criticalCount > 0 ? (
                        <Badge variant="destructive" className="font-mono text-[10px] px-1.5 py-0.5">
                          {fac.criticalCount} Kritik
                        </Badge>
                      ) : fac.itemCount > 0 ? (
                        <span className="text-emerald-600 text-[11px] font-medium">Sorunsuz</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {fac.reportDate ? (
                        <span>{format(new Date(fac.reportDate), 'dd MMMM yyyy', { locale: tr })}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFacility(fac.id);
                        }}
                      >
                        Forma Git
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
