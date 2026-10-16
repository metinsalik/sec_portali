import React, { useState } from 'react';
import { 
  Wand2, ArrowRight, ArrowLeft, Plus, Trash2, CheckCircle2, 
  AlertTriangle, Shield, Calendar, Building2, Loader2, Save 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ImprovementSheetType,
  ImprovementOperationType,
  ImprovementReportResult,
  IMPROVEMENT_SHEET_DEFINITIONS,
  type FacilityOption,
  VALID_STATUSES,
  VALID_RISKS 
} from '../../types';
import { useImprovementMutations } from '../../hooks/useImprovementsQueries';

interface FindingDraftRow {
  id: string;
  finding: string;
  location: string;
  equipment: string;
  riskScore: string;
  assignedTo: string;
  status: string;
  actionPlan: string;
  dueDate: string;
  legacyBudget: string;
}

interface PkReportWizardDialogProps {
  defaultSheetType?: ImprovementSheetType;
  defaultFacilityId?: string;
  facilities: FacilityOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PkReportWizardDialog: React.FC<PkReportWizardDialogProps> = ({
  defaultSheetType = ImprovementSheetType.ELEKTRIK_PK,
  defaultFacilityId = '',
  facilities,
  open,
  onOpenChange,
}) => {
  const { createWizardReportMutation } = useImprovementMutations();

  // Step state: 1 (Rapor Bilgileri) -> 2 (Bulgular Tablosu)
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Rapor Üst Verisi
  const [facilityId, setFacilityId] = useState(defaultFacilityId);
  const [sheetType, setSheetType] = useState<ImprovementSheetType>(defaultSheetType);
  const [operationType, setOperationType] = useState<ImprovementOperationType>(
    ImprovementOperationType.INSPECTION
  );
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextScheduledDate, setNextScheduledDate] = useState('');
  const [resultStatus, setResultStatus] = useState<ImprovementReportResult>(
    ImprovementReportResult.FINDINGS
  );
  const [companyName, setCompanyName] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [reportNo, setReportNo] = useState('');
  const [summaryNotes, setSummaryNotes] = useState('');

  // Step 2: Çoklu Bulgu Satırları
  const [findings, setFindings] = useState<FindingDraftRow[]>([
    {
      id: 'row-1',
      finding: '',
      location: '',
      equipment: '',
      riskScore: 'Önemli',
      assignedTo: '',
      status: 'Başlamadı',
      actionPlan: '',
      dueDate: '',
      legacyBudget: '',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const addFindingRow = () => {
    setFindings((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        finding: '',
        location: '',
        equipment: '',
        riskScore: 'Önemli',
        assignedTo: '',
        status: 'Başlamadı',
        actionPlan: '',
        dueDate: '',
        legacyBudget: '',
      },
    ]);
  };

  const removeFindingRow = (id: string) => {
    if (findings.length <= 1) return;
    setFindings((prev) => prev.filter((r) => r.id !== id));
  };

  const updateFindingRow = (id: string, field: keyof FindingDraftRow, val: string) => {
    setFindings((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId || !reportDate) return;

    // Eğer Uygunsuzluk Yok (CLEAR) seçildiyse doğrudan kaydet
    if (resultStatus === ImprovementReportResult.CLEAR) {
      handleFinalSubmit([]);
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = async (customFindings?: FindingDraftRow[]) => {
    const listToSubmit = customFindings !== undefined ? customFindings : findings;

    try {
      setIsSubmitting(true);
      await createWizardReportMutation.mutateAsync({
        facilityId,
        sheetType,
        operationType,
        reportDate,
        nextScheduledDate: nextScheduledDate || null,
        resultStatus,
        companyName: companyName || null,
        inspectorName: inspectorName || null,
        reportNo: reportNo || null,
        summaryNotes: summaryNotes || null,
        newFindings: listToSubmit
          .filter((f) => f.finding.trim())
          .map((f) => ({
            finding: f.finding,
            location: f.location || undefined,
            equipment: f.equipment || undefined,
            riskScore: f.riskScore,
            assignedTo: f.assignedTo || undefined,
            status: f.status,
            actionPlan: f.actionPlan || undefined,
            dueDate: f.dueDate || undefined,
            legacyBudget: f.legacyBudget ? parseFloat(f.legacyBudget) : undefined,
          })),
      });

      onOpenChange(false);
      setStep(1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${
          step === 2 ? 'max-w-6xl' : 'max-w-2xl'
        } max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background border rounded-2xl transition-all duration-300`}
      >
        {/* Üst Başlık & Adım Göstergesi */}
        <DialogHeader className="p-4 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" />
                <span>Periyodik Kontrol & Bakım Rapor Sihirbazı</span>
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {step === 1 ? 'Adım 1/2: Rapor ve Kontrol Üst Verileri' : 'Adım 2/2: Çoklu Bulgu Satırları Girişi'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={step === 1 ? 'default' : 'outline'} className="text-[10px]">
                1. Rapor Bilgisi
              </Badge>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <Badge variant={step === 2 ? 'default' : 'outline'} className="text-[10px]">
                2. Bulgular ({resultStatus === ImprovementReportResult.CLEAR ? '0 - Temiz' : findings.length})
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ADIM 1: Rapor Bilgileri Formu                                       */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleNext} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Hastane *</label>
                <select
                  required
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value)}
                  className="w-full h-8 px-2 border border-input rounded-md bg-background text-xs"
                >
                  <option value="">Hastane Seçiniz</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Takip Alanı *</label>
                <select
                  required
                  value={sheetType}
                  onChange={(e) => setSheetType(e.target.value as ImprovementSheetType)}
                  className="w-full h-8 px-2 border border-input rounded-md bg-background text-xs"
                >
                  {Object.values(ImprovementSheetType).map((st) => (
                    <option key={st} value={st}>
                      {IMPROVEMENT_SHEET_DEFINITIONS[st]?.label || st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">İşlem Türü</label>
                <select
                  value={operationType}
                  onChange={(e) => setOperationType(e.target.value as ImprovementOperationType)}
                  className="w-full h-8 px-2 border border-input rounded-md bg-background text-xs"
                >
                  <option value={ImprovementOperationType.INSPECTION}>Periyodik Kontrol / Denetim</option>
                  <option value={ImprovementOperationType.MAINTENANCE}>Bakım İşlemi</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Kontrol Tarihi *</label>
                <Input
                  required
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-primary">Sonraki Planlanan Tarih</label>
                <Input
                  type="date"
                  value={nextScheduledDate}
                  onChange={(e) => setNextScheduledDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Kontrol Sonucu *</label>
                <select
                  value={resultStatus}
                  onChange={(e) => setResultStatus(e.target.value as ImprovementReportResult)}
                  className="w-full h-8 px-2 border border-input rounded-md bg-background text-xs font-semibold"
                >
                  <option value={ImprovementReportResult.FINDINGS}>Tespit / Uygunsuzluk Var</option>
                  <option value={ImprovementReportResult.CLEAR}>Uygunsuzluk Yok (Temiz Rapor)</option>
                  <option value={ImprovementReportResult.UNCONFIRMED}>Taslak / Henüz Değerlendirilmedi</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Kontrolü Yapan Kurum / Firma</label>
                <Input
                  placeholder="Örn: TMMOB, Akredite Muayene..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Rapor No</label>
                <Input
                  placeholder="Örn: PK-2026-0891"
                  value={reportNo}
                  onChange={(e) => setReportNo(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Rapor Sonuç Özeti / Notlar</label>
              <Textarea
                rows={2}
                placeholder="Raporun genel sonucu ve uzman değerlendirmesi..."
                value={summaryNotes}
                onChange={(e) => setSummaryNotes(e.target.value)}
                className="text-xs resize-y"
              />
            </div>

            {resultStatus === ImprovementReportResult.CLEAR && (
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Uygunsuzluk Yok:</strong> Bu rapor için bulgu satırı oluşturulmayacaktır. 'Kaydet' butonuna bastığınızda temiz periyodik kontrol kaydı sisteme işlenecektir.
                </span>
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-border flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 text-xs"
              >
                Vazgeç
              </Button>
              <Button
                type="submit"
                disabled={!facilityId || !reportDate || isSubmitting}
                className="h-8 text-xs gap-1.5"
              >
                {resultStatus === ImprovementReportResult.CLEAR ? (
                  isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 mr-1" />
                      <span>Temiz Raporu Kaydet</span>
                    </>
                  )
                ) : (
                  <>
                    <span>2. Adıma Geç (Bulgular)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ADIM 2: Çoklu Bulgu Satırları Tablosu                               */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-3 bg-muted/20 border-b border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Bu rapora ait tespitleri satır satır ekleyiniz. İlgili bulgular rapora otomatik bağlanacaktır.
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFindingRow}
                className="h-7 text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Satır Ekle</span>
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-xs text-left border-collapse min-w-[900px]">
                <thead className="bg-muted/40 sticky top-0 z-10 text-[10px] font-semibold text-muted-foreground uppercase border-b border-border">
                  <tr>
                    <th className="py-2 px-2 w-10 text-center">#</th>
                    <th className="py-2 px-2 min-w-[240px]">Tespit / Uygunsuzluk *</th>
                    <th className="py-2 px-2 w-32">Mahal</th>
                    <th className="py-2 px-2 w-32">Ekipman</th>
                    <th className="py-2 px-2 w-28">Risk</th>
                    <th className="py-2 px-2 w-28">Sorumlu</th>
                    <th className="py-2 px-2 w-28">Termin</th>
                    <th className="py-2 px-2 w-12 text-center">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {findings.map((f, idx) => (
                    <tr key={f.id} className="hover:bg-muted/10">
                      <td className="py-2 px-2 text-center font-mono text-[11px] text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          required
                          placeholder="Tespit açıklaması..."
                          value={f.finding}
                          onChange={(e) => updateFindingRow(f.id, 'finding', e.target.value)}
                          className="h-7 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          placeholder="Mahal..."
                          value={f.location}
                          onChange={(e) => updateFindingRow(f.id, 'location', e.target.value)}
                          className="h-7 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          placeholder="Ekipman..."
                          value={f.equipment}
                          onChange={(e) => updateFindingRow(f.id, 'equipment', e.target.value)}
                          className="h-7 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={f.riskScore}
                          onChange={(e) => updateFindingRow(f.id, 'riskScore', e.target.value)}
                          className="w-full h-7 px-1.5 border border-input rounded bg-background text-[11px]"
                        >
                          {VALID_RISKS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          placeholder="Sorumlu..."
                          value={f.assignedTo}
                          onChange={(e) => updateFindingRow(f.id, 'assignedTo', e.target.value)}
                          className="h-7 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="date"
                          value={f.dueDate}
                          onChange={(e) => updateFindingRow(f.id, 'dueDate', e.target.value)}
                          className="h-7 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={findings.length <= 1}
                          onClick={() => removeFindingRow(f.id)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter className="p-3 border-t border-border bg-muted/30 flex justify-between shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                className="h-8 text-xs gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>1. Adıma Dön</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-8 text-xs"
                >
                  Vazgeç
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmitting || findings.every((f) => !f.finding.trim())}
                  onClick={() => handleFinalSubmit()}
                  className="h-8 text-xs gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Rapor ve {findings.filter((f) => f.finding.trim()).length} Bulguyu Kaydet</span>
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
