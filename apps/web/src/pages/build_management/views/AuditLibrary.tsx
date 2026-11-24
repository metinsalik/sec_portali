import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Building2,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useIRSC } from '../context/IRSCContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface AuditLibraryProps {
  mode?: 'PUBLISHED' | 'DRAFT' | 'ALL';
}

export default function AuditLibrary({ mode = 'PUBLISHED' }: AuditLibraryProps) {
  const { audits = [], setAudits, facilities = [] } = useIRSC();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [deletingAuditId, setDeletingAuditId] = useState<string | null>(null);
  const [sidebarFacilityId, setSidebarFacilityId] = useState<string>(
    () => localStorage.getItem('activeFacilityId') || 'all'
  );

  const isManager = !!(
    user?.isAdmin ||
    user?.isManagement ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('management') ||
    user?.roles?.includes('safety')
  );

  useEffect(() => {
    const syncFacility = () => {
      setSidebarFacilityId(localStorage.getItem('activeFacilityId') || 'all');
    };
    window.addEventListener('facilityChanged', syncFacility);
    window.addEventListener('storage', syncFacility);
    return () => {
      window.removeEventListener('facilityChanged', syncFacility);
      window.removeEventListener('storage', syncFacility);
    };
  }, []);

  const facilityNameMap = useMemo(() => {
    const map = new Map<string, string>();
    facilities.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [facilities]);

  const activeFacilityName =
    sidebarFacilityId && sidebarFacilityId !== 'all'
      ? facilityNameMap.get(sidebarFacilityId) || 'Seçili Tesis'
      : 'Tüm Tesisler';

  const effectiveMode = !isManager ? 'PUBLISHED' : mode;

  // Rol, mod ve sol menüdeki aktif tesise göre raporları süz
  const visibleAudits = useMemo(() => {
    const userFacs = user?.facilities || [];
    return audits.filter((a) => {
      const locId = a.meta?.locationId || '';
      if (effectiveMode === 'PUBLISHED' && a.status !== 'PUBLISHED') return false;
      if (effectiveMode === 'DRAFT' && a.status !== 'DRAFT') return false;
      if (!isManager && userFacs.length > 0 && !userFacs.includes(locId)) return false;
      if (sidebarFacilityId && sidebarFacilityId !== 'all') {
        return locId === sidebarFacilityId;
      }
      return true;
    });
  }, [audits, effectiveMode, isManager, user?.facilities, sidebarFacilityId]);

  const filteredAudits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...visibleAudits]
      .sort((a, b) => b.id.localeCompare(a.id))
      .filter((a) => {
        if (!q) return true;
        const facName = facilityNameMap.get(a.meta.locationId || '') || '';
        return (
          (a.meta.reportNo || '').toLowerCase().includes(q) ||
          facName.toLowerCase().includes(q) ||
          (a.meta.purpose || '').toLowerCase().includes(q)
        );
      });
  }, [visibleAudits, searchQuery, facilityNameMap]);

  const formatDate = (audit: any) => {
    if (audit.meta?.reportDate) {
      const d = new Date(audit.meta.reportDate);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('tr-TR');
    }
    const ts = parseInt(String(audit.id).split('_')[1], 10);
    return !isNaN(ts) ? new Date(ts).toLocaleDateString('tr-TR') : '—';
  };

  const handleConfirmDeleteDraft = async () => {
    if (!deletingAuditId) return;
    try {
      if (!deletingAuditId.startsWith('draft_')) {
        const { deleteAudit } = await import('../services/auditApi');
        await deleteAudit(deletingAuditId);
      }
      setAudits(audits.filter((a) => a.id !== deletingAuditId));
      toast.success('Taslak rapor silindi.');
    } catch (err) {
      console.error('Silme hatası:', err);
      toast.error('Taslak rapor silinemedi.');
    } finally {
      setDeletingAuditId(null);
    }
  };

  const isDraftMode = effectiveMode === 'DRAFT';

  return (
    <div className="space-y-6">
      {/* Tek ve Temiz Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {isDraftMode ? 'Taslak Denetimler' : 'Yayınlanan Raporlar'}
            </h2>
            <Badge variant="outline" className="text-xs font-semibold gap-1">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              {activeFacilityName}
            </Badge>
            <Badge variant="secondary" className="text-xs tabular-nums">
              {visibleAudits.length} Rapor
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {isDraftMode
              ? 'Henüz yayınlanmamış, düzenlemeye devam edilebilen merkezi denetim taslakları.'
              : 'Yayınlanmış merkezi denetim raporları — detaylarını, bulgularını ve PDF çıktısını görmek için bir rapor seçin.'}
          </p>
        </div>

        {isManager && (
          <Button
            size="sm"
            onClick={() => navigate('/renovation-report/new')}
            className="gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Yeni Denetim
          </Button>
        )}
      </div>

      {/* Arama Çubuğu */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rapor no, tesis adı veya kapsam ara..."
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Rapor Kartları */}
      {filteredAudits.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center text-center py-16 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              {isDraftMode ? <Clock className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                {visibleAudits.length === 0
                  ? isDraftMode
                    ? 'Taslak Denetim Bulunmuyor'
                    : 'Yayınlanmış Rapor Bulunmuyor'
                  : 'Eşleşen Rapor Bulunamadı'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {visibleAudits.length === 0
                  ? isDraftMode
                    ? 'Yeni bir denetim başlattığınızda taslak kayıtları burada listelenecektir.'
                    : `${activeFacilityName} kapsamında henüz yayınlanmış bir merkezi denetim raporu bulunmuyor.`
                  : 'Farklı bir arama terimi deneyebilirsiniz.'}
              </p>
            </div>
            {isManager && visibleAudits.length === 0 && (
              <Button size="sm" onClick={() => navigate('/renovation-report/new')} className="mt-2 gap-1.5">
                <Plus className="w-4 h-4" />
                Yeni Denetim Başlat
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAudits.map((audit) => {
            const facName = facilityNameMap.get(audit.meta.locationId || '') || 'Tesis Belirtilmedi';
            const totalCount = audit.findings?.length || 0;
            const closedCount = (audit.findings || []).filter((f) => f.status === 'Tamamlanan').length;
            const openCount = totalCount - closedCount;
            const progressPct = totalCount > 0 ? Math.round((closedCount / totalCount) * 100) : 0;

            return (
              <Card
                key={audit.id}
                className="flex flex-col transition-all duration-200 hover:border-primary/50 hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <CardTitle className="text-sm truncate">
                        {audit.meta.reportNo || 'İsimsiz Rapor'}
                      </CardTitle>
                    </div>
                    {audit.status === 'PUBLISHED' ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0 gap-1 text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> Yayınlandı
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0 gap-1 text-[10px]">
                        <Clock className="w-3 h-3" /> Taslak
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-1.5 text-xs pt-1">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate font-medium text-foreground/80">{facName}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="mt-auto pt-0 space-y-3">
                  {audit.meta?.purpose && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {audit.meta.purpose}
                    </p>
                  )}

                  {/* Kapanış İlerleme Çubuğu */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] tabular-nums">
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">{totalCount}</strong> Bulgu ({openCount} açık)
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        %{progressPct}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                    <span className="flex items-center gap-1 tabular-nums">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(audit)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isDraftMode && isManager && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          aria-label="Taslağı sil"
                          onClick={() => setDeletingAuditId(audit.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        variant={audit.status === 'PUBLISHED' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          navigate(
                            audit.status === 'PUBLISHED'
                              ? `/renovation-report/reports/${audit.id}`
                              : `/renovation-report/workspace/${audit.id}`
                          )
                        }
                        className="h-8 text-xs gap-1.5 transition-colors duration-200"
                      >
                        <span>{audit.status === 'PUBLISHED' ? 'Rapor Detayı' : 'Devam Et'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Taslak Silme Onayı */}
      <Dialog open={Boolean(deletingAuditId)} onOpenChange={(open) => !open && setDeletingAuditId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Taslağı Sil</DialogTitle>
            <DialogDescription>
              Bu taslak denetim raporunu kalıcı olarak silmek istediğinize emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeletingAuditId(null)}>
              İptal
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmDeleteDraft}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
