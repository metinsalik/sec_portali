import React, { useState } from 'react';
import { 
  X, MessageSquarePlus, DollarSign, Calendar, User, 
  CheckCircle2, Clock, Trash2, Tag, Loader2 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  type ImprovementRecord, 
  VALID_STATUSES 
} from '../../types';
import { useImprovementMutations } from '../../hooks/useImprovementsQueries';
import { ImprovementPhotoManager } from '../ImprovementPhotoManager';

interface ActionWorkspaceDialogProps {
  record: ImprovementRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ActionWorkspaceDialog: React.FC<ActionWorkspaceDialogProps> = ({
  record,
  open,
  onOpenChange,
}) => {
  if (!record) return null;

  const { createActionMutation, deleteActionMutation } = useImprovementMutations();

  // Form State
  const [description, setDescription] = useState('');
  const [statusAfterAction, setStatusAfterAction] = useState(record.status || 'Devam Ediyor');
  const [responsiblePerson, setResponsiblePerson] = useState(record.assignedTo || '');
  const [dueDate, setDueDate] = useState(
    record.dueDate ? new Date(record.dueDate).toISOString().split('T')[0] : ''
  );
  const [costAmount, setCostAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    try {
      setIsSubmitting(true);
      await createActionMutation.mutateAsync({
        recordId: record.id,
        payload: {
          actionDescription: description,
          statusAfterAction,
          responsiblePerson,
          dueDate: dueDate || null,
          costAmount: costAmount ? parseFloat(costAmount) : null,
          extraDetails: notes ? { notes } : undefined,
        },
      });

      // Formu temizle
      setDescription('');
      setCostAmount('');
      setNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    if (!confirm('Bu aksiyonu silmek istediğinize emin misiniz?')) return;
    try {
      await deleteActionMutation.mutateAsync(actionId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background border rounded-2xl">
        {/* Üst Başlık */}
        <DialogHeader className="p-4 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-primary" />
                <span>Aksiyon Çalışma Alanı & Tarihçe</span>
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {record.facility?.shortName || record.facility?.name} · {record.sheetType} #{record.rowNo || '-'}
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-semibold">
              Mevcut Durum: {record.status}
            </Badge>
          </div>

          {/* Bulgu Bağlamı */}
          <div className="mt-2.5 p-2.5 rounded-lg bg-card border border-border text-xs text-foreground/90 leading-relaxed">
            <span className="font-semibold text-primary text-[10px] uppercase tracking-wider block mb-0.5">
              Bulgu / Tespit:
            </span>
            <p className="line-clamp-2 overflow-hidden break-words">{record.finding}</p>
          </div>
        </DialogHeader>

        {/* Gövde: 2 Sütunlu Grid (Sol: Yeni Aksiyon Formu + Fotoğraf, Sağ: Aksiyon Kartları Geçmişi) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* SOL SÜTUN: Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Yeni Aksiyon / Müdahale Girişi
            </h4>

            {/* Yapılan İşlem / Açıklama */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">
                Yapılan İşlem / Aksiyon Açıklaması *
              </label>
              <Textarea
                required
                rows={3}
                placeholder="Sahada gerçekleştirilen düzeltici faaliyeti veya güncel durumu açıklayınız..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs resize-y"
              />
            </div>

            {/* Durum ve Sorumlu */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  Aksiyon Sonrası Durum
                </label>
                <select
                  value={statusAfterAction}
                  onChange={(e) => setStatusAfterAction(e.target.value)}
                  className="w-full h-8 px-2 border border-input rounded-md bg-background text-xs"
                >
                  {VALID_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  Sorumlu Kişi / Birim
                </label>
                <Input
                  placeholder="Ahmet Yılmaz, Teknik Servis..."
                  value={responsiblePerson}
                  onChange={(e) => setResponsiblePerson(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Termin ve Maliyet */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  Hedef Termin Tarihi
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  Aksiyon Maliyeti / Bütçe (₺)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={costAmount}
                  onChange={(e) => setCostAmount(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Ekstra Notlar */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Ek Notlar / Fatura No / Tedarikçi Detayı
              </label>
              <Input
                placeholder="Fatura No: FT-1234, Firma: X Teknik..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Fotoğraf Yöneticisi Entegrasyonu */}
            <div className="pt-2 border-t border-border">
              <ImprovementPhotoManager
                recordId={record.id}
                photos={record.photos || []}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="w-full h-8 text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Aksiyon Kaydediliyor...</span>
                </>
              ) : (
                'Aksiyonu Kaydet & Durumu Güncelle'
              )}
            </Button>
          </form>

          {/* SAĞ SÜTUN: Aksiyon Kartları Listesi */}
          <div className="p-4 space-y-3 bg-muted/10 overflow-y-auto">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Geçmiş Aksiyon Kartları</span>
              <Badge variant="secondary" className="text-[10px]">
                {record.actions?.length || 0}
              </Badge>
            </h4>

            {(!record.actions || record.actions.length === 0) ? (
              <p className="text-xs text-muted-foreground p-6 text-center border rounded-xl bg-card">
                Henüz aksiyon kartı oluşturulmamış. Soldaki formdan ilk aksiyonu kaydedebilirsiniz.
              </p>
            ) : (
              <div className="space-y-2.5">
                {record.actions.map((act) => (
                  <Card key={act.id} className="p-3 border-border bg-card space-y-2 shadow-sm">
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

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {act.actionDate ? new Date(act.actionDate).toLocaleDateString('tr-TR') : ''}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAction(act.id)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          title="Aksiyonu Sil"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                      {act.actionDescription}
                    </p>

                    {(act.costAmount || act.dueDate || act.extraDetails?.notes) && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                        {act.costAmount && (
                          <div>
                            <span className="font-semibold text-primary">Maliyet: </span>
                            <span className="font-mono">{Number(act.costAmount).toLocaleString('tr-TR')} {act.currency || 'TRY'}</span>
                          </div>
                        )}
                        {act.dueDate && (
                          <div>
                            <span className="font-semibold">Termin: </span>
                            <span className="font-mono">{new Date(act.dueDate).toLocaleDateString('tr-TR')}</span>
                          </div>
                        )}
                        {act.extraDetails?.notes && (
                          <div className="col-span-2 text-muted-foreground/80 italic">
                            Not: {act.extraDetails.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alt Kapat */}
        <div className="p-3 border-t border-border bg-muted/30 flex justify-end shrink-0">
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
