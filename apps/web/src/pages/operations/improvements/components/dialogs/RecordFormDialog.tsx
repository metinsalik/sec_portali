import React, { useState, useEffect } from 'react';
import { 
  FileEdit, Plus, Save, X, Loader2, Building2, 
  MapPin, Wrench, Shield, User, Calendar, DollarSign 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  type ImprovementRecord, 
  ImprovementSheetType,
  IMPROVEMENT_SHEET_DEFINITIONS,
  type FacilityOption,
  VALID_STATUSES,
  VALID_RISKS 
} from '../../types';
import { useImprovementMutations } from '../../hooks/useImprovementsQueries';
import { ImprovementPhotoManager } from '../ImprovementPhotoManager';

interface RecordFormDialogProps {
  record?: ImprovementRecord | null;
  defaultSheetType?: ImprovementSheetType;
  defaultFacilityId?: string;
  facilities: FacilityOption[];
  categories: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RecordFormDialog: React.FC<RecordFormDialogProps> = ({
  record,
  defaultSheetType = ImprovementSheetType.DENETIMLER,
  defaultFacilityId = '',
  facilities,
  categories,
  open,
  onOpenChange,
}) => {
  const { createRecordMutation, updateRecordMutation } = useImprovementMutations();
  const isEditing = !!record;

  const [facilityId, setFacilityId] = useState(defaultFacilityId);
  const [sheetType, setSheetType] = useState<ImprovementSheetType>(defaultSheetType);
  const [finding, setFinding] = useState('');
  const [location, setLocation] = useState('');
  const [equipment, setEquipment] = useState('');
  const [category, setCategory] = useState('');
  const [riskScore, setRiskScore] = useState('Önemli');
  const [status, setStatus] = useState('Başlamadı');
  const [assignedTo, setAssignedTo] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recordDate, setRecordDate] = useState('');
  const [legacyBudget, setLegacyBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setFacilityId(record.facilityId || '');
      setSheetType(record.sheetType || defaultSheetType);
      setFinding(record.finding || '');
      setLocation(record.location || '');
      setEquipment(record.equipment || '');
      setCategory(record.category || '');
      setRiskScore(record.riskScore || 'Önemli');
      setStatus(record.status || 'Başlamadı');
      setAssignedTo(record.assignedTo || '');
      setActionPlan(record.actionPlan || '');
      setDueDate(record.dueDate ? new Date(record.dueDate).toISOString().split('T')[0] : '');
      setRecordDate(record.recordDate ? new Date(record.recordDate).toISOString().split('T')[0] : '');
      setLegacyBudget(record.legacyBudget ? String(record.legacyBudget) : '');
    } else {
      setFacilityId(defaultFacilityId && defaultFacilityId !== 'ALL' ? defaultFacilityId : facilities[0]?.id || '');
      setSheetType(defaultSheetType);
      setFinding('');
      setLocation('');
      setEquipment('');
      setCategory(categories[0] || 'İş Güvenliği / Fiziksel Riskler');
      setRiskScore('Önemli');
      setStatus('Başlamadı');
      setAssignedTo('');
      setActionPlan('');
      setDueDate('');
      setRecordDate(new Date().toISOString().split('T')[0]);
      setLegacyBudget('');
    }
  }, [record, open, defaultFacilityId, defaultSheetType, facilities, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId || !finding.trim()) return;

    try {
      setIsSubmitting(true);
      const payload: any = {
        facilityId,
        sheetType,
        finding,
        location: location || null,
        equipment: equipment || null,
        category: category || null,
        riskScore,
        status,
        assignedTo: assignedTo || null,
        actionPlan: actionPlan || null,
        dueDate: dueDate || null,
        recordDate: recordDate || null,
        legacyBudget: legacyBudget ? parseFloat(legacyBudget) : null,
      };

      if (isEditing && record) {
        await updateRecordMutation.mutateAsync({
          id: record.id,
          payload,
        });
      } else {
        await createRecordMutation.mutateAsync(payload);
      }

      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background border rounded-2xl">
        {/* Üst Başlık */}
        <DialogHeader className="p-4 border-b border-border bg-muted/30 shrink-0">
          <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileEdit className="w-4 h-4 text-primary" />
            <span>{isEditing ? 'Bulguyu Düzenle' : 'Yeni Bulgu / Tespit Ekle'}</span>
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {isEditing
              ? `Kayıt #${record?.rowNo || '-'} düzenleniyor`
              : 'Sisteme yeni bir uygunsuzluk / periyodik kontrol bulgusu kaydedin'}
          </p>
        </DialogHeader>

        {/* Form Alanı */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Hastane ve Takip Alanı */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Hastane *</label>
              <select
                required
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                disabled={isEditing}
                className="w-full h-8 px-2 border border-input rounded-md bg-background text-xs disabled:opacity-75"
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
                disabled={isEditing}
                className="w-full h-8 px-2 border border-input rounded-md bg-background text-xs disabled:opacity-75"
              >
                {Object.values(ImprovementSheetType).map((st) => (
                  <option key={st} value={st}>
                    {IMPROVEMENT_SHEET_DEFINITIONS[st]?.label || st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tespit Metni */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">
              Tespit / Uygunsuzluk Açıklaması *
            </label>
            <Textarea
              required
              rows={3}
              placeholder="Sahada tespit edilen eksiklik veya periyodik kontrol sonucunu giriniz..."
              value={finding}
              onChange={(e) => setFinding(e.target.value)}
              className="text-xs resize-y"
            />
          </div>

          {/* 3 Sütunlu Grid: Mahal, Ekipman, Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Mahal / Konum</label>
              <Input
                placeholder="Örn: B Blok 2. Kat, Trafo Odası..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Ekipman / Cihaz</label>
              <Input
                placeholder="Örn: ADP-1 Panosu, Jeneratör 2..."
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-8 px-2 border border-input rounded-md bg-background text-xs"
              >
                <option value="">Kategori Seçiniz</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3 Sütunlu Grid: Risk, Durum, Sorumlu */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Risk Seviyesi</label>
              <select
                value={riskScore}
                onChange={(e) => setRiskScore(e.target.value)}
                className="w-full h-8 px-2 border border-input rounded-md bg-background text-xs"
              >
                {VALID_RISKS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Durum</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-8 px-2 border border-input rounded-md bg-background text-xs"
              >
                {VALID_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Sorumlu Kişi / Birim</label>
              <Input
                placeholder="Teknik Hizmetler, İSG Uzmanı..."
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Planlanan Aksiyon */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Planlanan Aksiyon</label>
            <Textarea
              rows={2}
              placeholder="Giderilmesi için planlanan düzeltici faaliyet..."
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
              className="text-xs resize-y"
            />
          </div>

          {/* Tarihler ve Başlangıç Bütçesi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Tespit Tarihi</label>
              <Input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-primary">Termin Tarihi</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Başlangıç Bütçesi (₺)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={legacyBudget}
                onChange={(e) => setLegacyBudget(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Düzenleme Esnasında Fotoğraf Yöneticisi */}
          {isEditing && record && (
            <div className="pt-2 border-t border-border">
              <ImprovementPhotoManager
                recordId={record.id}
                photos={record.photos || []}
              />
            </div>
          )}

          {/* Alt Butonlar */}
          <DialogFooter className="pt-4 border-t border-border flex items-center justify-end gap-2">
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
              disabled={isSubmitting || !finding.trim() || !facilityId}
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
                  <span>{isEditing ? 'Güncelle' : 'Kaydet'}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
