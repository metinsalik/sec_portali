import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  History,
  Search,
  Sparkles,
  ArrowDownToLine,
  Building2,
  Plus,
} from 'lucide-react';
import { fetchFindingPool, incrementPoolTemplateUsage } from '../services/auditApi';
import type { Audit, IRSCFacility, IrscFindingTemplate, RiskLevel } from '../types';
import { getPoolRiskBadgeClass } from './FindingPoolPage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export interface PickedFindingPayload {
  category?: string;
  subcategory?: string;
  findingDesc: string;
  riskDesc: string;
  recommendation: string;
  risk?: RiskLevel;
  departments?: string[];
}

interface FindingPoolPickerProps {
  audits: Audit[];
  facilities: IRSCFacility[];
  onApply: (payload: PickedFindingPayload, sourceLabel: string) => void;
  onPromoteToPool: (initial: Partial<IrscFindingTemplate>) => void;
}

export const FindingPoolPicker: React.FC<FindingPoolPickerProps> = ({
  audits,
  facilities,
  onApply,
  onPromoteToPool,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'POOL' | 'HISTORY'>('POOL');
  const [searchQuery, setSearchQuery] = useState('');
  const [poolTemplates, setPoolTemplates] = useState<IrscFindingTemplate[]>([]);
  const [loadingPool, setLoadingPool] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoadingPool(true);
    fetchFindingPool()
      .then((data) => {
        if (mounted) setPoolTemplates(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (mounted) setPoolTemplates([]);
      })
      .finally(() => {
        if (mounted) setLoadingPool(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const facilityMap = useMemo(() => {
    const map = new Map<string, string>();
    facilities.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [facilities]);

  const matchingPool = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr-TR');
    const list = poolTemplates.filter((t) => {
      if (!q) return true;
      return (
        t.title.toLocaleLowerCase('tr-TR').includes(q) ||
        (t.code || '').toLocaleLowerCase('tr-TR').includes(q) ||
        t.findingDesc.toLocaleLowerCase('tr-TR').includes(q) ||
        (t.recommendation || '').toLocaleLowerCase('tr-TR').includes(q) ||
        (t.category || '').toLocaleLowerCase('tr-TR').includes(q) ||
        (t.tags || []).some((tg) => tg.toLocaleLowerCase('tr-TR').includes(q))
      );
    });
    return list.slice(0, 20);
  }, [poolTemplates, searchQuery]);

  const matchingHistory = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr-TR');
    const results: Array<{
      id: string;
      facilityName: string;
      reportNo: string;
      category: string;
      subcategory?: string;
      risk: RiskLevel;
      findingDesc: string;
      riskDesc: string;
      recommendation: string;
      departments: string[];
    }> = [];

    const seenTexts = new Set<string>();

    audits.forEach((audit) => {
      const facName = facilityMap.get(audit.meta?.locationId || '') || 'Tesis';
      (audit.findings || []).forEach((f) => {
        if (!f.findingDesc?.trim()) return;
        const textKey = f.findingDesc.trim().toLocaleLowerCase('tr-TR').slice(0, 80);
        if (seenTexts.has(textKey)) return;

        if (q) {
          const hay = `${f.findingDesc} ${f.riskDesc || ''} ${f.recommendation || ''} ${f.category || ''} ${facName}`.toLocaleLowerCase('tr-TR');
          if (!hay.includes(q)) return;
        }

        seenTexts.add(textKey);
        results.push({
          id: `${audit.id}_${f.id}`,
          facilityName: facName,
          reportNo: audit.meta?.reportNo || 'Rapor',
          category: f.category || '',
          subcategory: f.subcategory,
          risk: f.risk,
          findingDesc: f.findingDesc,
          riskDesc: f.riskDesc || '',
          recommendation: f.recommendation || '',
          departments: f.departments || [],
        });
      });
    });

    return results.slice(0, 20);
  }, [audits, facilityMap, searchQuery]);

  const handleUseTemplate = (tpl: IrscFindingTemplate) => {
    incrementPoolTemplateUsage(tpl.id).catch(() => { });
    setPoolTemplates((prev) =>
      prev.map((item) =>
        item.id === tpl.id ? { ...item, usageCount: (item.usageCount || 0) + 1 } : item
      )
    );
    onApply(
      {
        category: tpl.category || undefined,
        subcategory: tpl.subcategory || undefined,
        findingDesc: tpl.findingDesc,
        riskDesc: tpl.riskDesc || '',
        recommendation: tpl.recommendation || '',
        risk: tpl.defaultRisk as RiskLevel,
        departments: tpl.defaultDepartments || [],
      },
      `Havuz: ${tpl.title}`
    );
    setDialogOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="h-8 text-xs gap-1.5 border-primary/30 bg-primary/5 hover:bg-primary/10 text-foreground"
      >
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        Havuzdan / Geçmişten Şablon Seç
        {poolTemplates.length > 0 && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-0.5 tabular-nums">
            {poolTemplates.length}
          </Badge>
        )}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Denetim Havuzu &amp; Geçmiş Bulgular
            </DialogTitle>
            <DialogDescription className="text-xs">
              Seçtiğiniz şablon forma kopyalanır; tüm metinleri olaya özel olarak dilediğiniz gibi düzenleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 py-3 border-b border-border bg-muted/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Konu, ekipman veya kategori ara (örn: UPS, pano, yangın kapısı)..."
                className="pl-8 h-9 text-xs bg-background"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0 bg-muted p-1 rounded-md">
              <button
                type="button"
                onClick={() => setActiveTab('POOL')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${activeTab === 'POOL'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Database className="w-3.5 h-3.5" />
                Havuz ({poolTemplates.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('HISTORY')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${activeTab === 'HISTORY'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <History className="w-3.5 h-3.5" />
                Geçmiş ({matchingHistory.length})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {activeTab === 'POOL' ? (
              loadingPool ? (
                <div className="py-12 text-center text-xs text-muted-foreground">Havuz yükleniyor...</div>
              ) : matchingPool.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-border rounded-lg space-y-2 px-4">
                  <p className="text-xs text-muted-foreground">
                    {poolTemplates.length === 0
                      ? 'Standart havuzda henüz şablon yok. "Geçmiş" sekmesinden eski tesis bulgularına bakabilirsiniz.'
                      : `"${searchQuery}" için havuzda eşleşme bulunamadı.`}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('HISTORY')}
                    className="h-7 text-xs"
                  >
                    Geçmiş Bulgularda Ara
                  </Button>
                </div>
              ) : (
                matchingPool.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-3.5 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {tpl.code && (
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {tpl.code}
                          </Badge>
                        )}
                        <span className="text-xs font-semibold text-foreground">{tpl.title}</span>
                        <Badge className={`text-[10px] border ${getPoolRiskBadgeClass(tpl.defaultRisk)}`}>
                          {tpl.defaultRisk}
                        </Badge>
                        {tpl.category && (
                          <Badge variant="secondary" className="text-[10px]">
                            {tpl.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{tpl.findingDesc}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleUseTemplate(tpl)}
                      className="h-8 text-xs gap-1.5 shrink-0"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" /> Kullan
                    </Button>
                  </div>
                ))
              )
            ) : matchingHistory.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-border rounded-lg text-xs text-muted-foreground">
                Eşleşen geçmiş bulgu bulunamadı.
              </div>
            ) : (
              matchingHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Building2 className="w-3 h-3" /> {item.facilityName}
                      </Badge>
                      <Badge className={`text-[10px] border ${getPoolRiskBadgeClass(item.risk)}`}>
                        {item.risk}
                      </Badge>
                      {item.category && (
                        <Badge variant="secondary" className="text-[10px]">
                          {item.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-foreground line-clamp-2">{item.findingDesc}</p>
                    {item.recommendation && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        Öneri: {item.recommendation}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDialogOpen(false);
                        onPromoteToPool({
                          title: item.category ? `${item.category} — Standart Bulgu` : '',
                          category: item.category,
                          findingDesc: item.findingDesc,
                          riskDesc: item.riskDesc,
                          recommendation: item.recommendation,
                          defaultRisk: item.risk,
                          defaultDepartments: item.departments,
                        });
                      }}
                      className="h-8 text-xs gap-1"
                      title="Havuza standart şablon olarak ekle"
                    >
                      <Plus className="w-3.5 h-3.5" /> Havuza Ekle
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        onApply(
                          {
                            category: item.category || undefined,
                            subcategory: item.subcategory || undefined,
                            findingDesc: item.findingDesc,
                            riskDesc: item.riskDesc,
                            recommendation: item.recommendation,
                            risk: item.risk,
                            departments: item.departments,
                          },
                          `Geçmiş: ${item.facilityName}`
                        );
                        setDialogOpen(false);
                      }}
                      className="h-8 text-xs gap-1.5"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" /> Kullan
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
