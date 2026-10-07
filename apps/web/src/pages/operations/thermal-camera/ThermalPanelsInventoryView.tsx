import React, { useMemo, useState } from 'react';
import type { ThermalInspectionItem } from '@/services/thermal-inspection.service';
import { 
  Building2, Layers, Search, ChevronRight, 
  Calendar, Thermometer, TrendingUp, AlertTriangle, 
  CheckCircle2, Flame, Eye, ArrowUpDown, Filter, GitMerge
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  items: ThermalInspectionItem[];
  onOpenPanelDetail: (panelName: string) => void;
  onOpenMergeModal?: () => void;
}

export const ThermalPanelsInventoryView: React.FC<Props> = ({
  items,
  onOpenPanelDetail,
  onOpenMergeModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'MULTI_MEASURE' | 'CRITICAL' | 'NORMAL'>('ALL');

  // Group items by panelName
  const groupedPanels = useMemo(() => {
    const map = new Map<string, {
      panelName: string;
      buildingLocation?: string;
      floorSection?: string;
      equipmentConnection?: string;
      measurements: ThermalInspectionItem[];
      latestTemp: number | null;
      maxTemp: number | null;
      latestDelta: number | null;
      isCritical: boolean;
      measurementCount: number;
    }>();

    items.forEach(item => {
      const name = item.panelName ? item.panelName.trim() : 'İsimsiz Pano';
      if (!map.has(name)) {
        map.set(name, {
          panelName: name,
          buildingLocation: item.buildingLocation || undefined,
          floorSection: item.floorSection || undefined,
          equipmentConnection: item.equipmentConnection || undefined,
          measurements: [],
          latestTemp: null,
          maxTemp: null,
          latestDelta: null,
          isCritical: false,
          measurementCount: 0
        });
      }
      const entry = map.get(name)!;
      entry.measurements.push(item);
    });

    // Process statistics
    const result = Array.from(map.values()).map(entry => {
      // Sort measurements chronological
      entry.measurements.sort((a, b) => {
        const da = a.measurementDate ? new Date(a.measurementDate).getTime() : 0;
        const db = b.measurementDate ? new Date(b.measurementDate).getTime() : 0;
        return da - db;
      });

      const count = entry.measurements.length;
      const latest = entry.measurements[count - 1];
      const maxT = Math.max(...entry.measurements.map(m => m.measuredTemp ?? -999));

      const isCrit = entry.measurements.some(m => (m.measuredTemp ?? 0) >= 40 || (m.deltaTemp ?? 0) >= 15);

      return {
        ...entry,
        measurementCount: count,
        latestTemp: latest?.measuredTemp ?? null,
        latestDelta: latest?.deltaTemp ?? null,
        maxTemp: maxT !== -999 ? maxT : null,
        isCritical: isCrit,
        buildingLocation: entry.buildingLocation || latest?.buildingLocation,
        floorSection: entry.floorSection || latest?.floorSection,
        equipmentConnection: entry.equipmentConnection || latest?.equipmentConnection
      };
    });

    return result;
  }, [items]);

  // Filter & Search
  const filteredPanels = useMemo(() => {
    let list = [...groupedPanels];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p => 
        p.panelName.toLowerCase().includes(q) ||
        (p.floorSection && p.floorSection.toLowerCase().includes(q)) ||
        (p.equipmentConnection && p.equipmentConnection.toLowerCase().includes(q))
      );
    }

    if (filterType === 'MULTI_MEASURE') {
      list = list.filter(p => p.measurementCount > 1);
    } else if (filterType === 'CRITICAL') {
      list = list.filter(p => p.isCritical);
    } else if (filterType === 'NORMAL') {
      list = list.filter(p => !p.isCritical);
    }

    // Sort: Criticals first, then by measurement count
    list.sort((a, b) => {
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      return b.measurementCount - a.measurementCount;
    });

    return list;
  }, [groupedPanels, searchTerm, filterType]);

  return (
    <div className="space-y-4">
      {/* Header & Filter */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-orange-600" />
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Pano Envanteri & Ölçüm Döngüleri
            </h3>
            <p className="text-xs text-slate-500">
              Toplam {groupedPanels.length} kayıtlı pano | {groupedPanels.filter(p => p.measurementCount > 1).length} panoda çoklu ölçüm döngüsü
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${filterType === 'ALL' ? 'bg-white dark:bg-slate-700 shadow-sm font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Tüm Panolar ({groupedPanels.length})
            </button>
            <button
              onClick={() => setFilterType('MULTI_MEASURE')}
              className={`px-2.5 py-1 rounded-md transition-colors ${filterType === 'MULTI_MEASURE' ? 'bg-orange-600 text-white shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Döngülü ({groupedPanels.filter(p => p.measurementCount > 1).length})
            </button>
            <button
              onClick={() => setFilterType('CRITICAL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${filterType === 'CRITICAL' ? 'bg-rose-600 text-white shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Kritik / Takip ({groupedPanels.filter(p => p.isCritical).length})
            </button>
          </div>

          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
            <Input
              placeholder="Pano adı veya kat ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>

          {onOpenMergeModal && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenMergeModal}
              className="text-xs h-9 gap-1.5 font-semibold border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 hover:bg-orange-100"
              title="Aynı panonun farklı yazılmış isimlerini tek bir standart isim altında birleştirir"
            >
              <GitMerge className="w-3.5 h-3.5 text-orange-600" />
              Panoları Birleştir
            </Button>
          )}
        </div>
      </div>

      {/* Grid Cards of Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredPanels.map((panel) => {
          return (
            <Card 
              key={panel.panelName}
              onClick={() => onOpenPanelDetail(panel.panelName)}
              className={`border transition-all duration-200 hover:shadow-md cursor-pointer hover:-translate-y-0.5 ${
                panel.isCritical 
                  ? 'border-orange-300 dark:border-orange-900/60 bg-orange-50/20 dark:bg-orange-950/10' 
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate hover:text-orange-600">
                      {panel.panelName}
                    </h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {panel.floorSection || panel.buildingLocation || 'Hastane Geneli'}
                    </p>
                  </div>
                  <Badge 
                    variant={panel.isCritical ? 'destructive' : 'outline'}
                    className="text-[10px] px-2 py-0.5 shrink-0"
                  >
                    {panel.measurementCount} Ölçüm
                  </Badge>
                </div>

                {/* Ekipman Detayı */}
                {panel.equipmentConnection && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg truncate">
                    <span className="text-slate-400 font-medium">Ekipman:</span> {panel.equipmentConnection}
                  </div>
                )}

                {/* Sıcaklık & Delta T Göstergeleri */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Son Ölçülen:</span>
                    <span className={`font-bold font-mono text-sm ${
                      panel.latestTemp && panel.latestTemp >= 40 ? 'text-rose-600' :
                      panel.latestTemp && panel.latestTemp >= 35 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {panel.latestTemp !== null ? `${panel.latestTemp} °C` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Maksimum Sıcaklık:</span>
                    <span className="font-bold font-mono text-sm text-slate-800 dark:text-slate-200">
                      {panel.maxTemp !== null ? `${panel.maxTemp} °C` : '—'}
                    </span>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-orange-600 font-medium">
                  <span>Ölçüm grafiğini ve geçmişini gör</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
