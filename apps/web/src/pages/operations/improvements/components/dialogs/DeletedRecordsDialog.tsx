import React from 'react';
import { Trash2, RotateCcw, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useTrashQuery, useImprovementMutations } from '../../hooks/useImprovementsQueries';

interface DeletedRecordsDialogProps {
  facilityId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeletedRecordsDialog: React.FC<DeletedRecordsDialogProps> = ({
  facilityId,
  open,
  onOpenChange,
}) => {
  const { data: trashItems = [], isLoading } = useTrashQuery(facilityId);
  const { restoreTrashMutation } = useImprovementMutations();

  const handleRestore = async (id: string, type: 'RECORD' | 'REPORT' | 'ACTION') => {
    try {
      await restoreTrashMutation.mutateAsync({ id, type });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-background border rounded-2xl">
        {/* Üst Başlık */}
        <DialogHeader className="p-4 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-destructive" />
              <span>Silinen Kayıtlar & Geri Yükleme (Çöp Kutusu)</span>
            </DialogTitle>
            <Badge variant="secondary" className="text-xs">
              {trashItems.length} Silinmiş Öğe
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Yanlışlıkla silinen bulguları, raporları veya aksiyonları buradan tek tıkla geri yükleyebilirsiniz.
          </p>
        </DialogHeader>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {isLoading ? (
            <p className="text-xs text-muted-foreground p-6 text-center">Yükleniyor...</p>
          ) : trashItems.length === 0 ? (
            <p className="text-xs text-muted-foreground p-8 text-center border rounded-xl bg-muted/10">
              Silinmiş kayıt bulunmamaktadır.
            </p>
          ) : (
            trashItems.map((item) => (
              <Card
                key={item.id}
                className="p-3 border-border bg-card flex items-center justify-between gap-3 text-xs hover:border-primary/50 transition-colors shadow-sm"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 ${
                        item.type === 'RECORD'
                          ? 'border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950/30'
                          : item.type === 'REPORT'
                          ? 'border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
                          : 'border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/30'
                      }`}
                    >
                      {item.type === 'RECORD' ? 'Bulgu' : item.type === 'REPORT' ? 'Rapor' : 'Aksiyon'}
                    </Badge>
                    <span className="font-semibold text-foreground truncate">{item.title}</span>
                  </div>

                  {item.detail && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1 truncate">
                      {item.detail}
                    </p>
                  )}

                  {item.deletedAt && (
                    <div className="text-[9px] text-muted-foreground font-mono">
                      Silinme Tarihi: {new Date(item.deletedAt).toLocaleString('tr-TR')}
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(item.id, item.type)}
                  className="h-7 text-xs gap-1.5 shrink-0 hover:bg-primary hover:text-primary-foreground"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Geri Al</span>
                </Button>
              </Card>
            ))
          )}
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
