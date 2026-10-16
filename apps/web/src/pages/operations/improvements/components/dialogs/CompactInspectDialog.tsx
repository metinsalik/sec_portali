import React from 'react';
import { 
  X, Eye, Calendar, Building2, MapPin, Wrench, 
  ShieldAlert, User, DollarSign, Clock, Tag, MessageSquare 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { type ImprovementRecord } from '../../types';
import { ImprovementPhotoManager } from '../ImprovementPhotoManager';

interface CompactInspectDialogProps {
  record: ImprovementRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenActionWorkspace?: () => void;
}

export const CompactInspectDialog: React.FC<CompactInspectDialogProps> = ({
  record,
  open,
  onOpenChange,
  onOpenActionWorkspace,
}) => {
  if (!record) return null;

  // Bütçe Konsolidasyonu
  const legacyBudget = Number(record.legacyBudget || 0);
  const actionsBudget = (record.actions || []).reduce(
    (sum, a) => sum + Number(a.costAmount || 0),
    0
  );
  const totalBudget = legacyBudget + actionsBudget;

  const currencySymbol = record.currency === 'USD' ? '$' : record.currency === 'EUR' ? '€' : '₺';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[88vh] flex flex-col p-0 overflow-hidden bg-background border rounded-2xl">
        {/* Üst Başlık */}
        <DialogHeader className="p-4 border-b border-border bg-muted/30 flex flex-row items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-semibold">
                {record.sheetType} #{record.rowNo || '-'}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {record.category || 'Kategorisiz'}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs font-semibold ${
                  record.riskScore === 'Kritik' || record.riskScore === 'Çok Yüksek'
                    ? 'bg-red-500/10 text-red-600 border-red-300'
                    : record.riskScore === 'Yüksek'
                    ? 'bg-orange-500/10 text-orange-600 border-orange-300'
                    : record.riskScore === 'Önemli'
                    ? 'bg-amber-500/10 text-amber-600 border-amber-300'
                    : 'bg-slate-500/10 text-slate-600 border-slate-300'
                }`}
              >
                {record.riskScore || 'Risk Belirtilmedi'}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs font-semibold ${
                  record.status === 'Tamamlandı'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-300'
                    : record.status === 'Devam Ediyor'
                    ? 'bg-blue-500/10 text-blue-600 border-blue-300'
                    : record.status === 'İptal Edildi'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-amber-500/10 text-amber-600 border-amber-300'
                }`}
              >
                {record.status}
              </Badge>
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              {record.facility?.name || 'Hastane Belirtilmedi'}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Kaydırılabilir İçerik */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* 3'lü Bütçe Konsolidasyon Özeti */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                Kayıt Başlangıç Bütçesi
              </span>
              <strong className="text-sm font-bold font-mono text-foreground mt-0.5">
                {legacyBudget.toLocaleString('tr-TR')} {currencySymbol}
              </strong>
            </div>
            <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-border/60 sm:pl-3 pt-2 sm:pt-0">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                Aksiyonlar Bütçesi ({record.actions?.length || 0} Aksiyon)
              </span>
              <strong className="text-sm font-bold font-mono text-foreground mt-0.5">
                {actionsBudget.toLocaleString('tr-TR')} {currencySymbol}
              </strong>
            </div>
            <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-border/60 sm:pl-3 pt-2 sm:pt-0">
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                Konsolide Toplam Bütçe
              </span>
              <strong className="text-base font-extrabold font-mono text-primary mt-0.5">
                {totalBudget.toLocaleString('tr-TR')} {currencySymbol}
              </strong>
            </div>
          </div>

          {/* Tespit / Uygunsuzluk Metni */}
          <div className="space-y-1.5 p-3.5 rounded-xl border border-border bg-card">
            <h4 className="text-xs font-semibold text-foreground">Tespit / Uygunsuzluk Detayı</h4>
            <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
              {record.finding}
            </p>
          </div>

          {/* 3 Sütunlu Detay Bilgileri Grid'i */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-border bg-muted/20">
            <div>
              <span className="text-muted-foreground text-[10px] block">Tespit Tarihi</span>
              <span className="font-mono font-medium text-foreground">
                {record.recordDate ? new Date(record.recordDate).toLocaleDateString('tr-TR') : '-'}
              </span>
            </div>
            <div>
              <span className="text-primary text-[10px] block font-semibold">Termin Tarihi</span>
              <span className="font-mono font-bold text-foreground">
                {record.dueDate ? new Date(record.dueDate).toLocaleDateString('tr-TR') : '-'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px] block">Mahal / Bölüm</span>
              <span className="font-medium text-foreground">{record.location || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px] block">Ekipman / Cihaz</span>
              <span className="font-medium text-foreground">{record.equipment || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px] block">Sorumlu Kişi / Birim</span>
              <span className="font-medium text-foreground">{record.assignedTo || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px] block">Uygulama / Tip</span>
              <span className="font-medium text-foreground">{record.applicationType || '-'}</span>
            </div>
          </div>

          {/* Planlanan Aksiyon / Yapılan İşlem */}
          {record.actionPlan && (
            <div className="space-y-1.5 p-3.5 rounded-xl border border-border bg-card">
              <h4 className="text-xs font-semibold text-foreground">Planlanan Aksiyon Planı</h4>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
                {record.actionPlan}
              </p>
            </div>
          )}

          {/* FOTOĞRAF YÖNETİCİSİ (SÜRÜKLE-BIRAK, MOBİL, 5 FOTOĞRAF, SIKIŞTIRMA) */}
          <div className="p-3.5 rounded-xl border border-border bg-card">
            <ImprovementPhotoManager
              recordId={record.id}
              photos={record.photos || []}
              readOnly={false}
            />
          </div>

          {/* Aksiyon Kartları Geçmişi */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-semibold text-foreground">
                  Aksiyon Geçmişi ({record.actions?.length || 0})
                </h4>
              </div>
              {onOpenActionWorkspace && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onOpenActionWorkspace}
                  className="h-7 text-xs"
                >
                  Yeni Aksiyon Ekle
                </Button>
              )}
            </div>

            {(!record.actions || record.actions.length === 0) ? (
              <p className="text-[11px] text-muted-foreground p-3 border rounded-xl bg-muted/10 text-center">
                Henüz aksiyon kartı eklenmemiş.
              </p>
            ) : (
              <div className="space-y-2">
                {record.actions.map((act) => (
                  <Card key={act.id} className="p-3 border-border bg-card space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">
                          {act.responsiblePerson || 'Sorumlu Belirtilmedi'}
                        </span>
                        {act.statusAfterAction && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            {act.statusAfterAction}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {act.actionDate ? new Date(act.actionDate).toLocaleDateString('tr-TR') : ''}
                      </span>
                    </div>

                    <p className="text-xs text-foreground/80 whitespace-pre-wrap break-words leading-relaxed">
                      {act.actionDescription}
                    </p>

                    {act.costAmount && (
                      <div className="text-[10px] font-mono text-primary font-semibold pt-1 border-t border-border/50">
                        Maliyet: {Number(act.costAmount).toLocaleString('tr-TR')} {act.currency || 'TRY'}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alt Butonlar */}
        <div className="p-3 border-t border-border bg-muted/30 flex items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
