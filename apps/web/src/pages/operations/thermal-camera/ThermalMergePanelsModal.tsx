import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  GitMerge, 
  Search, 
  Check, 
  AlertCircle, 
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { thermalInspectionService } from '@/services/thermal-inspection.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  allPanelNames: string[];
  facilityId?: string;
  onMerged: () => void;
}

export const ThermalMergePanelsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  allPanelNames,
  facilityId,
  onMerged
}) => {
  const [targetPanelName, setTargetPanelName] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtrelenmiş kaynak pano listesi
  const filteredPanels = allPanelNames.filter(name => {
    if (!name) return false;
    if (searchTerm.trim() && !name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const toggleSource = (name: string) => {
    if (name === targetPanelName) {
      toast.info('Hedef pano olarak seçtiğiniz panoyu kaynak olarak işaretlemenize gerek yoktur.');
      return;
    }
    setSelectedSources(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleSelectAsTarget = (name: string) => {
    setTargetPanelName(name);
    // Kaynaklar arasından hedef panoyu çıkar
    setSelectedSources(prev => prev.filter(n => n !== name));
  };

  const handleMerge = async () => {
    const finalTarget = targetPanelName.trim();
    if (!finalTarget) {
      toast.error('Lütfen birleştirilecek hedef pano adını girin veya seçin.');
      return;
    }

    const finalSources = selectedSources.filter(s => s !== finalTarget);
    if (finalSources.length === 0) {
      toast.error('Lütfen hedef panoya birleştirilecek en az bir kaynak pano seçin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await thermalInspectionService.mergePanels({
        targetPanelName: finalTarget,
        sourcePanelNames: finalSources,
        facilityId
      });

      toast.success(res.message || 'Panolar başarıyla birleştirildi.');
      onMerged();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Panolar birleştirilirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-5 bg-gradient-to-r from-orange-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <GitMerge className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white">
                Pano İsimlerini Eşleştir &amp; Birleştir
              </DialogTitle>
              <p className="text-xs text-orange-100 mt-0.5">
                Farklı raporlarda yanlış/farklı yazılmış panoları tek bir standart pano altında toplayın
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Nasıl Çalışır?</p>
              <p>
                Excel aktarımlarında veya manuel girişlerde &quot;P-01-04&quot;, &quot;P 01 04&quot;, &quot;Pano 01-04&quot; gibi aynı panonun farklı varyasyonları oluşabilir.
                Aşağıdan bir <strong>Hedef Standart Ad</strong> belirleyin ve ona dahil edilecek eski panoları seçin. Tüm ölçüm geçmişleri ve fotoğraflar tek panoda birleşecektir.
              </p>
            </div>
          </div>

          {/* 1. Hedef Pano Adı */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>1. Standart Hedef Pano Adı *</span>
              <span className="text-[11px] font-normal text-slate-400">(Tüm ölçümler bu ad altında birleşecek)</span>
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Örn: P-01-04 veya Ana Dağıtım Panosu"
                value={targetPanelName}
                onChange={(e) => setTargetPanelName(e.target.value)}
                className="text-xs h-9 font-semibold"
              />
            </div>
          </div>

          {/* 2. Birleştirilecek Kaynak Panolar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                2. Hedefe Aktarılacak Panoları Seçin ({selectedSources.length} Seçili)
              </label>
              <div className="relative w-44">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <Input
                  placeholder="Listede ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-2 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPanels.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Eşleşen pano bulunamadı.
                </div>
              ) : (
                filteredPanels.map((name) => {
                  const isTarget = targetPanelName === name;
                  const isSelected = selectedSources.includes(name);

                  return (
                    <div
                      key={name}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                        isTarget 
                          ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-900 font-bold border border-orange-200 dark:border-orange-900/60'
                          : isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          disabled={isTarget}
                          checked={isSelected}
                          onChange={() => toggleSource(name)}
                          className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="truncate">{name}</span>
                        {isTarget && (
                          <Badge className="bg-orange-600 text-white text-[9px] px-1.5 py-0">
                            HEDEF
                          </Badge>
                        )}
                      </label>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {!isTarget && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSelectAsTarget(name)}
                            className="h-6 text-[10px] px-2 text-slate-500 hover:text-orange-600"
                          >
                            Hedef Yap
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Özet ve Onay */}
          {targetPanelName && selectedSources.length > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-slate-500 block text-[11px]">Birleştirme Özeti:</span>
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                  <span className="text-rose-600 line-through">
                    {selectedSources.slice(0, 3).join(', ')}{selectedSources.length > 3 ? ` ve ${selectedSources.length - 3} diğer` : ''}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200">
                    {targetPanelName}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!targetPanelName.trim() || selectedSources.length === 0 || isSubmitting}
            onClick={handleMerge}
            className="bg-orange-600 hover:bg-orange-700 text-white text-xs gap-1.5 font-semibold"
          >
            <GitMerge className="w-3.5 h-3.5" />
            {isSubmitting ? 'Birleştiriliyor...' : `${selectedSources.length} Panoyu Birleştir`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
