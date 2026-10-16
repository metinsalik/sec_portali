import React, { useState } from 'react';
import { useParams, useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { 
  ClipboardList, Zap, Plus, Wand2, FileSpreadsheet, 
  RefreshCw, Layers, ShieldCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ImprovementSheetType, 
  IMPROVEMENT_SHEET_DEFINITIONS, 
  ELECTRICAL_SHEET_KEYS,
  type FacilityOption, 
  type ImprovementRecord 
} from './types';
import { 
  useReportsOverviewQuery, 
  useRecordsQuery, 
  useCategoriesQuery 
} from './hooks/useImprovementsQueries';

import { CompactReportOverview } from './components/CompactReportOverview';
import { AdvancedSourceTable } from './components/AdvancedSourceTable';

import { CompactInspectDialog } from './components/dialogs/CompactInspectDialog';
import { ActionWorkspaceDialog } from './components/dialogs/ActionWorkspaceDialog';
import { RecordFormDialog } from './components/dialogs/RecordFormDialog';
import { PkReportWizardDialog } from './components/dialogs/PkReportWizardDialog';
import { SeparatedHistoryDialog } from './components/dialogs/SeparatedHistoryDialog';
import { ImprovementExcelImportModal } from './ImprovementExcelImportModal';

interface SourceSheetPageProps {
  sheetType?: ImprovementSheetType;
}

export const SourceSheetPage: React.FC<SourceSheetPageProps> = ({ sheetType: propSheetType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subCategory } = useParams<{ subCategory?: string }>();

  const { selectedFacilityId, facilities } = useOutletContext<{
    selectedFacilityId: string;
    facilities: FacilityOption[];
  }>();

  // Aktif sekmeyi çözümle
  const resolvedSheetType = React.useMemo<ImprovementSheetType>(() => {
    if (propSheetType) return propSheetType;
    if (location.pathname.includes('denetimler')) {
      return ImprovementSheetType.DENETIMLER;
    }
    if (subCategory) {
      const match = Object.values(IMPROVEMENT_SHEET_DEFINITIONS).find(
        (def) => def.path === `electrical/${subCategory}` || def.path === subCategory
      );
      if (match) return match.key;
    }
    return ImprovementSheetType.DENETIMLER;
  }, [propSheetType, location.pathname, subCategory]);

  const sheetDef = IMPROVEMENT_SHEET_DEFINITIONS[resolvedSheetType];
  const isElectrical = sheetDef.moduleGroup === 'ELEKTRIK_BAKIM_KONTROL';

  // React Queries
  const { 
    data: reportsOverview = [], 
    isLoading: isReportsLoading, 
    refetch: refetchReports 
  } = useReportsOverviewQuery(resolvedSheetType, selectedFacilityId);

  const { 
    data: recordsData, 
    isLoading: isRecordsLoading, 
    refetch: refetchRecords 
  } = useRecordsQuery({
    sheetType: resolvedSheetType,
    facilityId: selectedFacilityId === 'ALL' ? undefined : selectedFacilityId,
    limit: 1000,
  });

  const { data: categories = [] } = useCategoriesQuery();

  const records = recordsData?.records || [];

  // Dialog Durumları
  const [inspectRecord, setInspectRecord] = useState<ImprovementRecord | null>(null);
  const [actionRecord, setActionRecord] = useState<ImprovementRecord | null>(null);
  const [editRecord, setEditRecord] = useState<ImprovementRecord | null>(null);
  const [isRecordFormOpen, setIsRecordFormOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardFacilityId, setWizardFacilityId] = useState<string | undefined>(undefined);
  const [historyFacility, setHistoryFacility] = useState<{ id: string; name: string } | null>(null);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);

  const handleRefresh = () => {
    refetchReports();
    refetchRecords();
  };

  const handleOpenWizard = (facilityId?: string) => {
    setWizardFacilityId(facilityId || (selectedFacilityId !== 'ALL' ? selectedFacilityId : undefined));
    setIsWizardOpen(true);
  };

  const handleOpenHistory = (facilityId: string) => {
    const f = facilities.find((item) => item.id === facilityId);
    setHistoryFacility({
      id: facilityId,
      name: f ? f.name : 'Hastane',
    });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* ── ÜST BAŞLIK VE HIZLI EYLEMLER ───────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shadow-sm ${
              isElectrical
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
            }`}
          >
            {isElectrical ? <Zap className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {sheetDef.label}
              </h1>
              <Badge variant="outline" className="text-[11px] font-normal">
                {records.length} Kayıt
              </Badge>
              {sheetDef.operationMode === 'DUAL' && (
                <Badge variant="secondary" className="text-[10px]">
                  Kontrol + Bakım
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isElectrical
                ? 'Elektrik tesisatı, periyodik kontrol ve bakım uygunsuzluk takip tablosu.'
                : 'Genel operasyon, yangın ve İSG saha denetim tespitleri ve aksiyon yönetimi.'}
            </p>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-8 text-xs gap-1.5"
            title="Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecordsLoading || isReportsLoading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExcelImportOpen(true)}
            className="h-8 text-xs gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Excel İçe Aktar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenWizard()}
            className="h-8 text-xs gap-1.5 bg-background shadow-xs hover:bg-muted"
          >
            <Wand2 className="w-3.5 h-3.5 text-blue-600" />
            Rapor Sihirbazı
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditRecord(null);
              setIsRecordFormOpen(true);
            }}
            className="h-8 text-xs gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Yeni Bulgu Ekle
          </Button>
        </div>
      </div>

      {/* ── ELEKTRİK GRUBU İSE: 8 ALT SEKME HIZLI GEÇİŞ ÇUBUĞU ──── */}
      {isElectrical && (
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 border border-border rounded-lg overflow-x-auto">
          {ELECTRICAL_SHEET_KEYS.map((key) => {
            const def = IMPROVEMENT_SHEET_DEFINITIONS[key];
            const isActive = def.key === resolvedSheetType;
            return (
              <button
                key={def.key}
                type="button"
                onClick={() => navigate(`/operations-management/improvements/${def.path}`)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-background text-primary shadow-xs font-semibold border border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                {def.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── ÜST: KOMPAKT RAPOR & OPERASYON ÖZETİ ──────────────── */}
      <CompactReportOverview
        sheetType={resolvedSheetType}
        rows={reportsOverview}
        onOpenWizard={handleOpenWizard}
        onOpenHistory={handleOpenHistory}
      />

      {/* ── ALT: GELİŞMİŞ KAYNAK TABLOSU (EXCEL TARZI) ────────── */}
      <AdvancedSourceTable
        sheetType={resolvedSheetType}
        records={records}
        isLoading={isRecordsLoading}
        onInspect={(record) => setInspectRecord(record)}
        onAction={(record) => setActionRecord(record)}
        onEdit={(record) => {
          setEditRecord(record);
          setIsRecordFormOpen(true);
        }}
      />

      {/* ── DİALOGLAR ─────────────────────────────────────────── */}
      {/* 1. İncele Modalı */}
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

      {/* 2. Aksiyon Çalışma Alanı */}
      <ActionWorkspaceDialog
        record={actionRecord}
        open={!!actionRecord}
        onOpenChange={(open) => !open && setActionRecord(null)}
      />

      {/* 3. Bulgu Ekleme / Düzenleme Modalı */}
      <RecordFormDialog
        record={editRecord}
        defaultSheetType={resolvedSheetType}
        defaultFacilityId={selectedFacilityId !== 'ALL' ? selectedFacilityId : undefined}
        facilities={facilities}
        categories={categories}
        open={isRecordFormOpen}
        onOpenChange={(open) => {
          setIsRecordFormOpen(open);
          if (!open) setEditRecord(null);
        }}
      />

      {/* 4. PK & Denetim Rapor Sihirbazı */}
      <PkReportWizardDialog
        defaultSheetType={resolvedSheetType}
        defaultFacilityId={wizardFacilityId}
        facilities={facilities}
        open={isWizardOpen}
        onOpenChange={(open) => setIsWizardOpen(open)}
      />

      {/* 5. Ayrılmış Rapor Geçmişi (Kontrol & Bakım) */}
      <SeparatedHistoryDialog
        sheetType={resolvedSheetType}
        facilityId={historyFacility?.id || null}
        facilityName={historyFacility?.name}
        open={!!historyFacility}
        onOpenChange={(open) => !open && setHistoryFacility(null)}
      />

      {/* 6. Excel İçe Aktarma Modalı */}
      {isExcelImportOpen && (
        <ImprovementExcelImportModal
          facilities={facilities}
          activeFacilityId={selectedFacilityId}
          onClose={() => setIsExcelImportOpen(false)}
          onSuccess={() => {
            setIsExcelImportOpen(false);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
};
