import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  AlertOctagon, ShieldAlert, RefreshCw, Filter, 
  Building2, Layers, CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  type ImprovementRecord, 
  type FacilityOption, 
  ImprovementSheetType,
  IMPROVEMENT_SHEET_DEFINITIONS,
  VALID_STATUSES 
} from './types';
import { useCriticalRecordsQuery, useCategoriesQuery } from './hooks/useImprovementsQueries';
import { AdvancedSourceTable } from './components/AdvancedSourceTable';
import { CompactInspectDialog } from './components/dialogs/CompactInspectDialog';
import { ActionWorkspaceDialog } from './components/dialogs/ActionWorkspaceDialog';
import { RecordFormDialog } from './components/dialogs/RecordFormDialog';

export const CriticalItemsPage: React.FC = () => {
  const { selectedFacilityId, facilities } = useOutletContext<{
    selectedFacilityId: string;
    facilities: FacilityOption[];
  }>();

  // Filtre State'leri
  const [filterHospital, setFilterHospital] = useState<string>('ALL');
  const [filterSheet, setFilterSheet] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // React Queries
  const { 
    data: allCriticalRecords = [], 
    isLoading, 
    refetch 
  } = useCriticalRecordsQuery({
    facilityId: selectedFacilityId === 'ALL' ? undefined : selectedFacilityId,
  });

  const { data: categories = [] } = useCategoriesQuery();

  // Dialog State'leri
  const [inspectRecord, setInspectRecord] = useState<ImprovementRecord | null>(null);
  const [actionRecord, setActionRecord] = useState<ImprovementRecord | null>(null);
  const [editRecord, setEditRecord] = useState<ImprovementRecord | null>(null);
  const [isRecordFormOpen, setIsRecordFormOpen] = useState(false);

  // İstemci tarafı 4'lü filtreleme
  const filteredRecords = useMemo(() => {
    return allCriticalRecords.filter((rec) => {
      if (filterHospital !== 'ALL' && rec.facilityId !== filterHospital) {
        return false;
      }
      if (filterSheet !== 'ALL' && rec.sheetType !== filterSheet) {
        return false;
      }
      if (filterCategory !== 'ALL' && rec.category !== filterCategory) {
        return false;
      }
      if (filterStatus !== 'ALL' && rec.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [allCriticalRecords, filterHospital, filterSheet, filterCategory, filterStatus]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* ── SAYFA BAŞLIĞI ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shadow-sm">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Merkezi Kritik Maddeler Konsolu
              </h1>
              <Badge variant="destructive" className="text-xs font-mono font-bold px-2">
                {allCriticalRecords.length} Kritik
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              9 takip alanındaki tüm yüksek ve kritik riskli bulguların eskalasyon ve öncelikli müdahale havuzu.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="h-8 text-xs gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* ── 4'LÜ HIZLI FİLTRELEME ÇUBUĞU ─────────────────────────── */}
      <Card className="border-border bg-card p-3 shadow-xs">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-muted-foreground">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtreleme Seçenekleri</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Hastane Filtresi */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
              Hastane
            </label>
            <select
              value={filterHospital}
              onChange={(e) => setFilterHospital(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-md border border-input bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Tümü ({facilities.length} Hastane)</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Kaynak Takip Alanı Filtresi */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
              Takip Alanı
            </label>
            <select
              value={filterSheet}
              onChange={(e) => setFilterSheet(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-md border border-input bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Tüm Alanlar (9 Alan)</option>
              {Object.values(IMPROVEMENT_SHEET_DEFINITIONS).map((def) => (
                <option key={def.key} value={def.key}>
                  {def.label}
                </option>
              ))}
            </select>
          </div>

          {/* Kategori Filtresi */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
              Kategori
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-md border border-input bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Tüm Kategoriler</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Durum Filtresi */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
              Durum
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-md border border-input bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Tüm Durumlar</option>
              {VALID_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* ── TABLO BİLEŞENİ ───────────────────────────────────────── */}
      <AdvancedSourceTable
        sheetType={ImprovementSheetType.DENETIMLER}
        records={filteredRecords}
        isLoading={isLoading}
        onInspect={(record) => setInspectRecord(record)}
        onAction={(record) => setActionRecord(record)}
        onEdit={(record) => {
          setEditRecord(record);
          setIsRecordFormOpen(true);
        }}
      />

      {/* ── DİALOGLAR ─────────────────────────────────────────── */}
      <CompactInspectDialog
        record={inspectRecord}
        open={!!inspectRecord}
        onOpenChange={(open) => !open && setInspectRecord(null)}
        onOpenActionWorkspace={() => {
          const rec = inspectRecord;
          setInspectRecord(null);
          setActionRecord(rec);
        }}
      />

      <ActionWorkspaceDialog
        record={actionRecord}
        open={!!actionRecord}
        onOpenChange={(open) => !open && setActionRecord(null)}
      />

      <RecordFormDialog
        record={editRecord}
        facilities={facilities}
        categories={categories}
        open={isRecordFormOpen}
        onOpenChange={(open) => {
          setIsRecordFormOpen(open);
          if (!open) setEditRecord(null);
        }}
      />
    </div>
  );
};
