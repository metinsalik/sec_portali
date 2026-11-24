import React, { useState, useEffect } from 'react';
import { useIRSC } from '../context/IRSCContext';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';

export default function LocationConsole() {
  const { setCurrentView, facilities, audits, setAudits, setActiveAuditId } = useIRSC();
  const [confirmDialog, setConfirmDialog] = useState<{ msg: string; onConfirm: () => void } | null>(null);
  const [facId, setFacId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fId = (window as any)._irsc_selectedFacilityId;
    if (fId) setFacId(fId);
  }, []);

  const facility = facilities.find((f) => f.id === facId);
  const facilityAudits = audits
    .filter((a) => a.meta.locationId === facId)
    .sort((a, b) => b.id.localeCompare(a.id));

  const draftAudits = facilityAudits.filter((a) => a.status === 'DRAFT');
  const publishedAudits = facilityAudits.filter((a) => a.status === 'PUBLISHED');

  const formatDate = (audit: any) => {
    if (audit.meta?.reportDate) {
      const d = new Date(audit.meta.reportDate);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('tr-TR');
    }
    const ts = parseInt(String(audit.id).split('_')[1], 10);
    return !isNaN(ts) ? new Date(ts).toLocaleDateString('tr-TR') : '—';
  };

  return (
    <div className="space-y-6">
      {/* Üst Kart */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentView('TRACKING')}
              aria-label="Yönetim paneline dön"
              className="h-9 w-9 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {facility ? facility.name : 'Tesis Seçilmedi'}
              </h2>
              <p className="text-xs text-muted-foreground">Tesis Detay ve Rapor Geçmişi</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setActiveAuditId(null);
              setCurrentView('WORKSPACE');
            }}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Yeni Denetim
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Taslak Raporlar */}
        <Card className="overflow-hidden">
          <CardHeader className="py-4 px-5 border-b border-border bg-amber-500/5 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Devam Eden / Taslak Raporlar
            </CardTitle>
            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 tabular-nums">
              {draftAudits.length}
            </Badge>
          </CardHeader>
          <CardContent className="p-4">
            {draftAudits.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">
                Bu tesis için taslak rapor bulunmuyor.
              </p>
            ) : (
              <div className="space-y-3">
                {draftAudits.map((audit) => (
                  <div
                    key={audit.id}
                    className="p-3.5 border border-border rounded-lg hover:border-amber-500/40 transition-colors duration-200 flex items-center justify-between gap-3 bg-card"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">
                        {audit.meta.reportNo || 'İsimsiz Rapor'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 tabular-nums">
                        <span>Oluşturulma: {formatDate(audit)}</span>
                        <span>•</span>
                        <span>{audit.findings.length} Bulgu</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                        onClick={() => {
                          setActiveAuditId(audit.id);
                          setCurrentView('WORKSPACE');
                        }}
                      >
                        Düzenle <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        aria-label="Taslağı sil"
                        onClick={() => {
                          setConfirmDialog({
                            msg: 'Bu taslağı tamamen silmek istediğinize emin misiniz?',
                            onConfirm: async () => {
                              try {
                                if (!audit.id.startsWith('draft_')) {
                                  const { deleteAudit } = await import('../services/auditApi');
                                  await deleteAudit(audit.id);
                                }
                                setAudits(audits.filter((a) => a.id !== audit.id));
                                toast.success('Taslak rapor silindi.');
                              } catch (err) {
                                console.error('Silme hatası', err);
                                toast.error('Rapor silinemedi.');
                              }
                            },
                          });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Yayınlanmış Raporlar */}
        <Card className="overflow-hidden">
          <CardHeader className="py-4 px-5 border-b border-border bg-emerald-500/5 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Yayınlanmış Raporlar
            </CardTitle>
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 tabular-nums">
              {publishedAudits.length}
            </Badge>
          </CardHeader>
          <CardContent className="p-4">
            {publishedAudits.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">
                Bu tesis için yayınlanmış rapor bulunmuyor.
              </p>
            ) : (
              <div className="space-y-3">
                {publishedAudits.map((audit) => {
                  const openCount = audit.findings.filter(
                    (f) => f.status === 'OPEN' || f.status !== 'Tamamlanan'
                  ).length;
                  return (
                    <div
                      key={audit.id}
                      className="p-3.5 border border-border rounded-lg hover:border-emerald-500/40 transition-colors duration-200 flex items-center justify-between gap-3 bg-card"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-foreground truncate">
                          {audit.meta.reportNo || 'İsimsiz Rapor'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 tabular-nums">
                          <span>Tarih: {formatDate(audit)}</span>
                          <span>•</span>
                          <span className="text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                            <AlertTriangle className="w-3 h-3" /> {openCount} Açık Bulgu
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 shrink-0"
                        onClick={() => {
                          setActiveAuditId(audit.id);
                          setCurrentView('WORKSPACE');
                        }}
                      >
                        Görüntüle / Aksiyon <FileText className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Silme Onay Diyaloğu (Shadcn Dialog) */}
      <Dialog open={Boolean(confirmDialog)} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Silme Onayı</DialogTitle>
            <DialogDescription>{confirmDialog?.msg}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDialog(null)}>
              İptal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                confirmDialog?.onConfirm();
                setConfirmDialog(null);
              }}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
