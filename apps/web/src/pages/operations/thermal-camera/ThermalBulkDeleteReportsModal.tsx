import React, { useState } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  X, 
  Calendar, 
  CheckSquare, 
  Square, 
  FileText,
  Search,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ThermalInspectionSession } from '@/services/thermal-inspection.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessions: ThermalInspectionSession[];
  facilityName: string;
  onDeleteSelected: (sessionIds: string[]) => Promise<void>;
}

export const ThermalBulkDeleteReportsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  sessions,
  facilityName,
  onDeleteSelected
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter(s => {
    const d = s.reportDate ? new Date(s.reportDate).toLocaleDateString('tr-TR') : '';
    const fac = s.facility?.name || '';
    const notes = s.notes || '';
    const q = searchTerm.toLowerCase();
    return d.includes(q) || fac.toLowerCase().includes(q) || notes.toLowerCase().includes(q);
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredSessions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSessions.map(s => s.id));
    }
  };

  const totalItemsToDelete = sessions
    .filter(s => selectedIds.includes(s.id))
    .reduce((acc, curr) => acc + (curr._count?.items ?? (curr.items?.length || 0)), 0);

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      await onDeleteSelected(selectedIds);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[88vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Toplu Ölçüm Raporu Silme
              </h3>
              <p className="text-xs text-slate-500">
                {facilityName} tesisine ait ölçüm raporlarını ve içindeki verileri toplu temizleyin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Arama ve Toplu Seçim Çubuğu */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tarih veya not ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto gap-3">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white"
              >
                {selectedIds.length > 0 && selectedIds.length === filteredSessions.length ? (
                  <CheckSquare className="w-4 h-4 text-rose-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                Tümünü Seç ({filteredSessions.length})
              </button>
              <Badge variant="outline" className="text-xs font-bold text-rose-600 border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40">
                {selectedIds.length} Rapor Seçili
              </Badge>
            </div>
          </div>

          {/* Rapor Listesi */}
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                Silinebilecek rapor bulunamadı.
              </div>
            ) : (
              filteredSessions.map(session => {
                const isSelected = selectedIds.includes(session.id);
                const dateStr = session.reportDate ? new Date(session.reportDate).toLocaleDateString('tr-TR') : 'Tarihsiz';
                const count = session._count?.items ?? (session.items?.length || 0);

                return (
                  <div
                    key={session.id}
                    onClick={() => toggleSelect(session.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-rose-400 bg-rose-50/60 dark:border-rose-800 dark:bg-rose-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-rose-600 text-white' : 'border border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Rapor Tarihi: {dateStr}
                          {session.notes && (
                            <span className="font-normal text-slate-500 italic max-w-xs truncate">
                              ({session.notes})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Yükleyen: {session.uploadedBy || 'Belirtilmedi'} • Tesis: {session.facility?.name || facilityName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                        <FileText className="w-3 h-3 text-slate-500" />
                        {count} Pano
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Onay Adımı Uyarısı */}
          {selectedIds.length > 0 && confirmStep && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-3 text-rose-800 dark:text-rose-300 text-xs animate-in slide-in-from-top-1">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">DİKKAT: Kalıcı Silme İşlemi!</p>
                <p className="mt-0.5 leading-relaxed text-[11px]">
                  Seçtiğiniz <strong>{selectedIds.length} adet rapor</strong> ve bu raporlara bağlı toplam <strong>{totalItemsToDelete} adet pano ölçüm kaydı</strong>, fotoğrafları ve aksiyon geçmişleri ile birlikte sistemden <strong>tamamen ve geri alınamaz şekilde silinecektir</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirmStep) setConfirmStep(false);
              else onClose();
            }}
            disabled={isDeleting}
            className="text-xs"
          >
            {confirmStep ? 'Geri Dön' : 'Vazgeç'}
          </Button>

          <div className="flex items-center gap-2">
            {!confirmStep ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={selectedIds.length === 0}
                onClick={() => setConfirmStep(true)}
                className="text-xs gap-1.5 font-bold shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Seçilenleri Sil ({selectedIds.length})
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isDeleting}
                onClick={handleDelete}
                className="text-xs gap-1.5 font-bold bg-rose-700 hover:bg-rose-800 shadow-md"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Siliniyor...' : 'Evet, Hepsini Kalıcı Olarak Sil'}
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
