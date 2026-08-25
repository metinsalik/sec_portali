import React, { useState, useEffect } from 'react';
import { useIRSC } from '../context/IRSCContext';
import { FileText, Clock, CheckCircle2, AlertTriangle, ArrowRight, Trash2 } from 'lucide-react';

export default function LocationConsole({ onNavigate }: { onNavigate: (v: 'TRACKING' | 'WORKSPACE' | 'SETTINGS') => void }) {
  const { setCurrentView, facilities, audits, setAudits, setActiveAuditId } = useIRSC();
  const [alertMsg, setAlertMsg] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ msg: string; onConfirm: () => void } | null>(null);
  const [facId, setFacId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fId = (window as any)._irsc_selectedFacilityId;
    if (fId) setFacId(fId);
  }, []);

  const facility = facilities.find(f => f.id === facId);
  const facilityAudits = audits.filter(a => a.meta.locationId === facId).sort((a, b) => b.id.localeCompare(a.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentView('TRACKING')}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-full dark:text-slate-400 dark:hover:bg-slate-800"
          >
            ←
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {facility ? facility.name : 'Tesis Seçilmedi'}
            </h2>
            <div className="text-sm text-slate-500 dark:text-slate-400">Tesis Detay ve Rapor Geçmişi</div>
          </div>
        </div>
        <button 
          onClick={() => setCurrentView('WORKSPACE')}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          ＋ Yeni Denetim
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Drafts */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-200 bg-amber-50 flex items-center justify-between dark:border-slate-700 dark:bg-amber-900/10">
            <h3 className="font-semibold text-amber-800 dark:text-amber-500 flex items-center gap-2">
              <Clock size={18} /> Devam Eden / Taslak Raporlar
            </h3>
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold dark:bg-amber-900/50 dark:text-amber-400">
              {facilityAudits.filter(a => a.status === 'DRAFT').length}
            </span>
          </div>
          <div className="p-4">
            {facilityAudits.filter(a => a.status === 'DRAFT').length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Bu tesis için taslak rapor bulunmuyor.</p>
            ) : (
              <div className="space-y-3">
                {facilityAudits.filter(a => a.status === 'DRAFT').map(audit => (
                  <div key={audit.id} className="p-4 border border-slate-200 rounded-lg hover:border-amber-300 transition-colors flex items-center justify-between dark:border-slate-700 dark:hover:border-amber-700">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-white">{audit.meta.reportNo || 'İsimsiz Rapor'}</div>
                      <div className="text-xs text-slate-500 mt-1 flex gap-3 dark:text-slate-400">
                        <span>Oluşturulma: {new Date(parseInt(audit.id.split('_')[1])).toLocaleDateString('tr-TR')}</span>
                        <span>•</span>
                        <span>{audit.findings.length} Bulgu</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        className="flex items-center gap-1 text-sm text-amber-600 font-medium hover:text-amber-700 dark:text-amber-500 bg-amber-50 px-3 py-1.5 rounded-lg dark:bg-amber-900/30"
                        onClick={() => {
                          setActiveAuditId(audit.id);
                          setCurrentView('WORKSPACE');
                        }}
                      >
                        Düzenle <ArrowRight size={14} />
                      </button>
                      <button
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/30"
                        onClick={() => {
                          setConfirmDialog({
                            msg: 'Bu taslağı tamamen silmek istediğinize emin misiniz?',
                            onConfirm: async () => {
                              try {
                                if (!audit.id.startsWith('draft_')) {
                                  // Requires actual API call
                                  const { deleteAudit } = await import('../services/auditApi');
                                  await deleteAudit(audit.id);
                                }
                                setAudits(audits.filter(a => a.id !== audit.id));
                              } catch (err) {
                                console.error("Silme hatası", err);
                                alert("Rapor silinemedi.");
                              }
                            }
                          });
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Published */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-200 bg-emerald-50 flex items-center justify-between dark:border-slate-700 dark:bg-emerald-900/10">
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-500 flex items-center gap-2">
              <CheckCircle2 size={18} /> Yayınlanmış Raporlar
            </h3>
            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold dark:bg-emerald-900/50 dark:text-emerald-400">
              {facilityAudits.filter(a => a.status === 'PUBLISHED').length}
            </span>
          </div>
          <div className="p-4">
            {facilityAudits.filter(a => a.status === 'PUBLISHED').length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Bu tesis için yayınlanmış rapor bulunmuyor.</p>
            ) : (
              <div className="space-y-3">
                {facilityAudits.filter(a => a.status === 'PUBLISHED').map(audit => (
                  <div key={audit.id} className="p-4 border border-slate-200 rounded-lg hover:border-emerald-300 transition-colors flex items-center justify-between dark:border-slate-700 dark:hover:border-emerald-700">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-white">{audit.meta.reportNo || 'İsimsiz Rapor'}</div>
                      <div className="text-xs text-slate-500 mt-1 flex gap-3 dark:text-slate-400">
                        <span>Tarih: {new Date(parseInt(audit.id.split('_')[1])).toLocaleDateString('tr-TR')}</span>
                        <span>•</span>
                        <span className="text-red-500 flex items-center gap-1"><AlertTriangle size={12}/> {audit.findings.filter(f => f.status === 'OPEN').length} Açık Bulgu</span>
                      </div>
                    </div>
                    <button 
                      className="flex items-center gap-1 text-sm text-emerald-600 font-medium hover:text-emerald-700 dark:text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-lg dark:bg-emerald-900/30"
                      onClick={() => {
                        setActiveAuditId(audit.id);
                        setCurrentView('WORKSPACE');
                      }}
                    >
                      Raporu Görüntüle / Aksiyon Gir <FileText size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOM MODALS */}
      {alertMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 dark:bg-slate-800 border dark:border-slate-700">
            <h4 className="text-lg font-bold text-slate-800 mb-2 dark:text-white">Bilgi</h4>
            <p className="text-slate-600 dark:text-slate-300 mb-6">{alertMsg}</p>
            <div className="flex justify-end">
              <button onClick={() => setAlertMsg('')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Tamam</button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 dark:bg-slate-800 border dark:border-slate-700">
            <h4 className="text-lg font-bold text-slate-800 mb-2 dark:text-white">Onay</h4>
            <p className="text-slate-600 dark:text-slate-300 mb-6">{confirmDialog.msg}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDialog(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-700">İptal</button>
              <button 
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
