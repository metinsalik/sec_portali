import React, { useState, useEffect, useRef } from 'react';
import { useIRSC } from '../context/IRSCContext';
import { useAuth } from '../../../context/AuthContext';
import { useReactToPrint } from 'react-to-print';
import { Save, ChevronRight, AlertTriangle, Plus, X, Upload, Edit2, Trash2, Mic, Calendar, FileText, CheckCircle, Search, Filter, Eye, MessageSquare } from 'lucide-react';
import type { RiskLevel, ActionStep, Finding } from '../types';
import AnalysisTab from './AnalysisTab';
import ReportTemplate from './ReportTemplate';
import { saveAudit, uploadAuditFiles } from '../services/auditApi';
import toast from 'react-hot-toast';

export default function AuditWorkspace() {
  const { setCurrentView, facilities, categories, departments, audits, setAudits, activeAuditId, setActiveAuditId, globalAreas, setGlobalAreas, globalCriteria, setGlobalCriteria } = useIRSC();
  const { user } = useAuth();
  const isManager = user?.isAdmin || user?.roles.includes('admin') || user?.roles.includes('management') || user?.roles.includes('safety');

  const [activeTab, setActiveTab] = useState<'INFO' | 'FINDINGS' | 'ANALYSIS' | 'REPORT'>('INFO');
  const [activeAreaView, setActiveAreaView] = useState<string | null>(null);
  const [activeSubareaView, setActiveSubareaView] = useState<string | null>(null);
  const [activeFindingForm, setActiveFindingForm] = useState<'CREATE' | 'EDIT' | 'VIEW' | null>(null);
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);

  const currentAudit = audits.find(a => a.id === activeAuditId);
  const isPublished = currentAudit?.status === 'PUBLISHED';

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Tesis_Saha_Denetim_Raporu'
  });

  // Local state for the new audit being created
  const [auditMeta, setAuditMeta] = useState<any>({
    locationId: '',
    purpose: '',
    reportNo: '',
    start: '',
    end: '',
    reportDate: '',
    team: [],
    participants: [],
    criteria: []
  });
  
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);

  // Load existing draft if activeAuditId is provided
  useEffect(() => {
    if (activeAuditId) {
      const existing = audits.find(a => a.id === activeAuditId);
      if (existing) {
        setAuditMeta(existing.meta as any);
        setFindings(existing.findings);
        setSelectedFacility(existing.meta.locationId?.toString() || null);
        setActiveTab('FINDINGS');
      }
    } else {
      // Clear if creating a new one
      setAuditMeta({
        locationId: '',
        purpose: '',
        reportNo: '',
        start: '',
        end: '',
        reportDate: '',
        team: [],
        participants: []
      });
      setFindings([]);
      setSelectedFacility(null);
    }
  }, [activeAuditId, audits]);

  // Auto-fill logic when facility is selected (ONLY if no activeAuditId and no existing reportNo)
  useEffect(() => {
    if (selectedFacility && !activeAuditId) {
      const facility = facilities.find(f => f.id === selectedFacility);
      if (facility) {
        const facIndex = facilities.findIndex(f => f.id === selectedFacility) + 1;
        const locCode = facIndex.toString().padStart(2, '0');
          
        const facAuditsCount = audits.filter(a => a.meta.locationId === selectedFacility).length + 1;
        const sequence = facAuditsCount.toString().padStart(2, '0');
        
        setAuditMeta(prev => ({
          ...prev,
          reportNo: prev.reportNo || `H-IRSC-${locCode}.${sequence}`,
          locationId: selectedFacility
        }));
      }
    }
  }, [selectedFacility, activeAuditId, facilities, audits]);

  // Finding Modal State
  const [newFinding, setNewFinding] = useState<Partial<Finding>>({
    category: '',
    subcategory: '',
    findingDesc: '',
    riskDesc: '',
    recommendation: '',
    area: '',
    subarea: '',
    files: []
  });
  
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  
  const [activeActionFormId, setActiveActionFormId] = useState<string | null>(null);
  const [newAction, setNewAction] = useState<Partial<ActionStep>>({
    department: '',
    title: '',
    explanation: '',
    status: 'Başlamadı',
    actionDate: '',
    files: []
  });
  const riskLevels: RiskLevel[] = ['Tolere Edilemez Risk', 'Yüksek Risk', 'Önemli Risk', 'Olası Risk', 'Önemsiz'];
  
  const getRiskColor = (risk: RiskLevel) => {
    switch(risk) {
      case 'Tolere Edilemez Risk': return 'bg-red-800 text-white';
      case 'Yüksek Risk': return 'bg-red-500 text-white';
      case 'Önemli Risk': return 'bg-orange-500 text-white';
      case 'Olası Risk': return 'bg-yellow-500 text-white';
      case 'Önemsiz': return 'bg-green-500 text-white';
      default: return 'bg-slate-200 text-slate-800';
    }
  };

  const getRiskTermin = (risk: RiskLevel) => {
    switch(risk) {
      case 'Tolere Edilemez Risk': return '+3 Gün';
      case 'Yüksek Risk': return '+1 Ay';
      case 'Önemli Risk': return '+3 Ay';
      case 'Olası Risk': return '+9 Ay';
      case 'Önemsiz': return '+12 Ay';
      default: return '';
    }
  };

  const calculateTargetDate = (risk: RiskLevel, reportDateStr: string) => {
    if (!reportDateStr) return '';
    const date = new Date(reportDateStr);
    if (isNaN(date.getTime())) return '';
    
    switch(risk) {
      case 'Tolere Edilemez Risk': date.setDate(date.getDate() + 3); break;
      case 'Yüksek Risk': date.setMonth(date.getMonth() + 1); break;
      case 'Önemli Risk': date.setMonth(date.getMonth() + 3); break;
      case 'Olası Risk': date.setMonth(date.getMonth() + 9); break;
      case 'Önemsiz': date.setMonth(date.getMonth() + 12); break;
    }
    return date.toISOString().split('T')[0];
  };

  const tabs = [
    { id: 'INFO', title: 'Hazırlık', sub: 'Bilgiler, ekip ve kapsam' },
    { id: 'FINDINGS', title: 'Saha Denetimi', sub: `${findings.length} bulgu` },
    { id: 'ANALYSIS', title: 'Analiz ve Özet', sub: 'Dağılımlar ve anlatı' },
    { id: 'REPORT', title: 'Rapor', sub: 'Önizleme ve PDF' }
  ] as const;

  // Handle Facility Selection & Carry-over
  useEffect(() => {
    if (auditMeta.locationId) {
      const facId = auditMeta.locationId;
      setSelectedFacility(facId);
      
      // Simulate Carry-over logic: Find open findings from previous audits of this facility
      const previousAudits = audits.filter(a => a.meta.locationId === facId);
      const openFindings: Finding[] = [];
      previousAudits.forEach(a => {
        a.findings.forEach(f => {
          if (f.status !== 'Tamamlanan') {
            openFindings.push({...f, history: `${f.history}\nDevreden Bulgu (Önceki Rapor: ${a.meta.reportNo})`});
          }
        });
      });
      // In a real app, we would merge these or prompt the user. For mock, we just set them.
      if (openFindings.length > 0 && findings.length === 0) {
        setFindings(openFindings);
      }
    }
  }, [auditMeta.locationId, audits]);

  const [alertMsg, setAlertMsg] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ msg: string; onConfirm: () => void } | null>(null);
  const [promptDialog, setPromptDialog] = useState<{ title: string; onSubmit: (val: string) => void } | null>(null);
  const [promptVal, setPromptVal] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleSaveFinding = (keepFormOpen = false) => {
    if (activeFindingId && activeFindingForm === 'EDIT') {
      setFindings(findings.map(f => {
        if (f.id === activeFindingId) {
          return {
            ...f,
            risk: newFinding.risk as RiskLevel,
            category: newFinding.category || '',
            subcategory: newFinding.subcategory || '',
            findingDesc: newFinding.findingDesc || '',
            recommendation: newFinding.recommendation || '',
            area: newFinding.area || '',
            subarea: newFinding.subarea || '',
            targetDate: newFinding.targetDate || '',
            files: newFinding.files || [],
            departments: selectedDepartments
          };
        }
        return f;
      }));
    } else {
      const fCount = findings.length + 1;
      const fNo = auditMeta.reportNo ? `${auditMeta.reportNo}-${String(fCount).padStart(3, '0')}` : `BULGU-${fCount}`;
      
      const completeFinding: Finding = {
        id: `f_${Date.now()}`,
        no: fNo,
        area: newFinding.area || '',
        subarea: newFinding.subarea || '',
        category: newFinding.category || '',
        subcategory: newFinding.subcategory || '',
        risk: newFinding.risk as RiskLevel,
        targetDate: newFinding.targetDate || '',
        isStarted: false,
        files: newFinding.files || [],
        findingDesc: newFinding.findingDesc || '',
        riskDesc: newFinding.riskDesc || '',
        recommendation: newFinding.recommendation || '',
        status: 'Yeni Tespit Edilen',
        steps: [],
        departments: selectedDepartments,
        history: 'Yeni kayıt oluşturuldu.'
      };
      setFindings([...findings, completeFinding]);
    }
    
    if (!keepFormOpen) {
      setActiveFindingForm(null);
      setActiveFindingId(null);
    } else {
      toast.success('Bulgu eklendi, aynı mahal için yeni bulgu girebilirsiniz.');
    }
    
    setNewFinding(prev => ({
      category: '',
      subcategory: '',
      findingDesc: '',
      riskDesc: '',
      recommendation: '',
      area: keepFormOpen ? prev.area : '',
      subarea: keepFormOpen ? prev.subarea : '',
      risk: undefined,
      targetDate: '',
      files: [],
      steps: []
    }));
    setSelectedDepartments([]);
  };

  const toggleDepartment = (depName: string) => {
    if (selectedDepartments.includes(depName)) {
      setSelectedDepartments(selectedDepartments.filter(d => d !== depName));
    } else {
      setSelectedDepartments([...selectedDepartments, depName]);
    }
  };

  const handleAddAction = (findingId: string) => {
    if (!newAction.department || !newAction.explanation) {
      setAlertMsg("Lütfen zorunlu alanları (Sorumlu ve Açıklama) doldurun.");
      return;
    }
    
    setFindings(findings.map(f => {
      if (f.id === findingId) {
        const step: ActionStep = {
          id: `step_${Date.now()}`,
          department: newAction.department!,
          title: newAction.title || '',
          order: (f.steps?.length || 0) + 1,
          status: (newAction.status as StepStatus) || 'Başlamadı',
          actionDate: newAction.actionDate || '',
          files: newAction.files || [],
          explanation: newAction.explanation || ''
        };

        const newFStatus = newAction.status === 'Tamamlandı' ? 'Tamamlanan' : 
                           newAction.status === 'Devam Ediyor' ? 'Kısmen İyileştirilen' : 
                           f.status;
        
        return {
          ...f,
          status: newFStatus as ImprovementStatus,
          steps: [...(f.steps || []), step]
        };
      }
      return f;
    }));
    
    setActiveActionFormId(null);
    setNewAction({
      department: '',
      title: '',
      explanation: '',
      status: 'Başlamadı',
      actionDate: '',
      files: []
    });
  };

  const handleSave = async (publish = false) => {
    if (activeFindingForm) {
      toast.error('Lütfen önce açık olan bulgu formunu kaydedin veya iptal edin.');
      return;
    }

    if (!auditMeta.locationId) {
      setAlertMsg("Lütfen önce tesis seçin.");
      return;
    }
    
    let newAuditStatus = auditMeta.auditStatus;
    if (publish) {
      const allFindingsCompleted = findings.length > 0 && findings.every(f => f.status === 'Tamamlanan' || f.status === 'İyileştirilmeyen');
      newAuditStatus = allFindingsCompleted ? 'Tamamlandı' : 'Takipte';
    }

    const audit = {
      id: activeAuditId || undefined,
      status: publish ? 'PUBLISHED' : (currentAudit?.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'),
      saved: true,
      meta: { ...auditMeta, auditStatus: newAuditStatus },
      findings
    };

    try {
      const savedAudit = await saveAudit(audit as any, auditMeta.locationId);
      
      let updatedAudits = audits.filter(a => a.id !== activeAuditId);
      
      // If we are publishing, check if we need to close previous ones
      if (publish && auditMeta.locationId) {
        updatedAudits = updatedAudits.map(a => {
          if (a.meta?.locationId === auditMeta.locationId && a.status === 'PUBLISHED') {
            return { ...a, meta: { ...a.meta, auditStatus: 'Tamamlandı' } };
          }
          return a;
        });
      }
      
      setAudits([...updatedAudits, savedAudit]);
      setActiveAuditId(null);
      
      if ((window as any)._irsc_selectedFacilityId) {
        setCurrentView('CONSOLE');
      } else {
        setCurrentView('TRACKING');
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Rapor kaydedilirken hata oluştu!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setActiveAuditId(null);
              if ((window as any)._irsc_selectedFacilityId) {
                setCurrentView('CONSOLE');
              } else {
                setCurrentView('TRACKING');
              }
            }}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-full dark:text-slate-400 dark:hover:bg-slate-800"
          >
            ←
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Yeni Denetim</h2>
            <div className="text-sm text-slate-500 flex gap-2 items-center dark:text-slate-400">
              <span>{selectedFacility ? facilities.find(f => f.id === selectedFacility)?.name : 'Lokasyon seçilmedi'}</span>
              <span>•</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold dark:bg-blue-900/50 dark:text-blue-400">Taslak</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleSave(false)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Save size={16} /> Kaydet
          </button>
          {isManager && (
            <button 
              onClick={() => handleSave(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              ✓ Yayınla
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 dark:bg-slate-800 dark:border-slate-700">
        {tabs.map((t, idx) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            disabled={idx > 0 && !selectedFacility}
            className={`flex-1 flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
              activeTab === t.id 
                ? 'bg-slate-100 dark:bg-slate-700' 
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
            } ${idx > 0 && !selectedFacility ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              activeTab === t.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
            }`}>
              {idx + 1}
            </div>
            <div>
              <div className={`font-semibold text-sm ${activeTab === t.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                {t.title}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-500">{t.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px] dark:bg-slate-800 dark:border-slate-700">
        
        {/* INFO TAB */}
        {activeTab === 'INFO' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b border-slate-200 pb-4 mb-6 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Hazırlık</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Denetim başlamadan önce lokasyon ve kapsamı belirleyin.</p>
            </div>
            
            <fieldset disabled={isPublished} className="space-y-6">
              {isPublished && (
                <div className="bg-amber-50 text-amber-800 p-4 rounded-lg flex items-center gap-3">
                  <AlertTriangle size={20} />
                  <p><strong>Bu rapor yayınlanmıştır.</strong> Temel bilgiler ve analiz verileri değiştirilemez.</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Tesis / Lokasyon Seçimi *</label>
                <select 
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                  value={auditMeta.locationId}
                  onChange={e => {
                    setSelectedFacility(e.target.value);
                    setAuditMeta({...auditMeta, locationId: e.target.value});
                  }}
                >
                  <option value="">-- Tesis Seçin --</option>
                  {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                {auditMeta.locationId && (
                  <p className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-2">
                    <AlertTriangle size={16} /> Önceki denetimden kalan açık bulgular varsa "Saha Denetimi" adımına devredilecektir.
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Planlanan / Gerçek Başlangıç *</label>
                  <input 
                    type="date" 
                    value={auditMeta.start || ''} 
                    onChange={e => setAuditMeta({...auditMeta, start: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Denetim Bitişi</label>
                  <input 
                    type="date" 
                    value={auditMeta.end || ''} 
                    onChange={e => setAuditMeta({...auditMeta, end: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Rapor Tarihi</label>
                  <input 
                    type="date" 
                    value={auditMeta.reportDate || ''} 
                    onChange={e => setAuditMeta({...auditMeta, reportDate: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Rapor No</label>
                  <input 
                    type="text" 
                    value={auditMeta.reportNo || ''}
                    onChange={e => setAuditMeta({...auditMeta, reportNo: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white" 
                  />
                  <p className="text-xs text-slate-500 mt-1">Biçim: H-IRSC-LokasyonNo.DenetimNo</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Raporlayan</label>
                  <input type="text" defaultValue="MLPCARE HSE" className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Denetim Durumu</label>
                  <select className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white">
                    <option>Planlandı</option>
                    <option>Devam Ediyor</option>
                    <option>Tamamlandı</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Denetimin Amacı</label>
                <textarea 
                  rows={3} 
                  value={auditMeta.purpose || ''}
                  onChange={e => setAuditMeta({...auditMeta, purpose: e.target.value})}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Değerlendirme Kriterleri</label>
                {(auditMeta.criteria || []).map((c: string, i: number) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      value={c} 
                      onChange={e => {
                        const newCriteria = [...auditMeta.criteria];
                        newCriteria[i] = e.target.value;
                        setAuditMeta({...auditMeta, criteria: newCriteria});
                      }}
                      className="flex-1 p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                      placeholder="Örn: ISO 45001, JCI Standartları"
                    />
                    <button onClick={() => {
                      const newCriteria = auditMeta.criteria.filter((_: any, idx: number) => idx !== i);
                      setAuditMeta({...auditMeta, criteria: newCriteria});
                    }} className="p-2.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
                      <X size={20} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => setAuditMeta({...auditMeta, criteria: [...(auditMeta.criteria || []), '']})}
                  className="mt-1 flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700 dark:text-blue-400"
                >
                  <Plus size={16} /> Kriter Ekle
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Değerlendirme Ekibi</label>
                {(auditMeta.team || []).map((t: string, i: number) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      value={t} 
                      onChange={e => {
                        const newTeam = [...auditMeta.team];
                        newTeam[i] = e.target.value;
                        setAuditMeta({...auditMeta, team: newTeam});
                      }}
                      className="flex-1 p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                      placeholder="Ad Soyad | Departman | Unvan"
                    />
                    <button onClick={() => {
                      const newTeam = auditMeta.team.filter((_: any, idx: number) => idx !== i);
                      setAuditMeta({...auditMeta, team: newTeam});
                    }} className="p-2.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
                      <X size={20} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => setAuditMeta({...auditMeta, team: [...(auditMeta.team || []), '']})}
                  className="mt-1 flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700 dark:text-blue-400"
                >
                  <Plus size={16} /> Ekip Üyesi Ekle
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Katılımcılar</label>
                {(auditMeta.participants || []).map((p: string, i: number) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      value={p} 
                      onChange={e => {
                        const newP = [...auditMeta.participants];
                        newP[i] = e.target.value;
                        setAuditMeta({...auditMeta, participants: newP});
                      }}
                      className="flex-1 p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                      placeholder="Ad Soyad | Departman | Unvan"
                    />
                    <button onClick={() => {
                      const newP = auditMeta.participants.filter((_: any, idx: number) => idx !== i);
                      setAuditMeta({...auditMeta, participants: newP});
                    }} className="p-2.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
                      <X size={20} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => setAuditMeta({...auditMeta, participants: [...(auditMeta.participants || []), '']})}
                  className="mt-1 flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700 dark:text-blue-400"
                >
                  <Plus size={16} /> Katılımcı Ekle
                </button>
              </div>
            </fieldset>
            
            <div className="pt-6 flex justify-end">
              <button 
                onClick={() => setActiveTab('FINDINGS')}
                disabled={!auditMeta.locationId}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 flex items-center gap-2 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Saha Denetimine Geç <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* FINDINGS TAB */}
        {activeTab === 'FINDINGS' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-6 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Saha Denetimi</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Bulguları, riskleri ve aksiyon adımlarını girin.</p>
              </div>
              {!isPublished && (
                <button 
                  onClick={() => {
                    setNewFinding({
                      category: '',
                      subcategory: '',
                      findingDesc: '',
                      riskDesc: '',
                      recommendation: '',
                      area: activeAreaView || '',
                      subarea: activeSubareaView || '',
                      files: []
                    });
                    setActiveFindingId(null);
                    setActiveFindingForm('CREATE');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={16} /> Yeni Bulgu Ekle
                </button>
              )}
            </div>

            {findings.length === 0 && !activeFindingForm ? (
              <div className="text-center py-20 text-slate-500 dark:text-slate-400">
                <div className="text-4xl mb-4">🔍</div>
                <p>Henüz bulgu eklenmemiş.</p>
              </div>
            ) : (
              <>
                {!activeFindingForm ? (
                  <>
                    {!activeAreaView ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(
                      findings.reduce((acc, f) => {
                        const groupKey = f.area || 'Mahal Belirtilmemiş';
                        if (!acc[groupKey]) acc[groupKey] = [];
                        acc[groupKey].push(f);
                        return acc;
                      }, {} as Record<string, Finding[]>)
                    ).map(([areaName, areaFindings], idx) => {
                      const total = areaFindings.length;
                      const totalDepts = new Set([...areaFindings.flatMap(f => f.steps?.map(s => s.department) || []), ...areaFindings.flatMap(f => f.departments || [])]).size;
                      const completed = areaFindings.filter(f => f.status === 'Tamamlanan').length;
                      const openCritical = areaFindings.filter(f => f.status !== 'Tamamlanan' && ['Tolere Edilemez Risk', 'Yüksek Risk'].includes(f.risk)).length;
                      const openAll = areaFindings.filter(f => f.status !== 'Tamamlanan').length;
                      
                      return (
                        <div key={areaName} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden dark:bg-slate-800 dark:border-slate-700 flex flex-col hover:border-slate-300 transition-colors">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${openCritical > 0 ? 'bg-red-500' : openAll > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                          <div className="flex justify-between items-start mb-4">
                            <span className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-lg dark:bg-blue-900/30 dark:text-blue-400">
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                            {openCritical > 0 ? (
                              <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold dark:bg-red-900/30 dark:text-red-400">{openCritical} kritik açık</span>
                            ) : openAll > 0 ? (
                              <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold dark:bg-amber-900/30 dark:text-amber-400">{openAll} açık işlem</span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold dark:bg-emerald-900/30 dark:text-emerald-400">Tamamlandı</span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-800 text-lg mb-4 dark:text-white line-clamp-2">{areaName}</h4>
                          <div className="grid grid-cols-3 gap-2 mb-6">
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center dark:bg-slate-900/50 dark:border-slate-700">
                              <div className="font-bold text-lg text-slate-800 dark:text-white">{total}</div>
                              <div className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Tespit</div>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center dark:bg-slate-900/50 dark:border-slate-700">
                              <div className="font-bold text-lg text-slate-800 dark:text-white">{totalDepts}</div>
                              <div className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Birim</div>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center dark:bg-slate-900/50 dark:border-slate-700">
                              <div className="font-bold text-lg text-slate-800 dark:text-white">{completed}</div>
                              <div className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Tamamlanan</div>
                            </div>
                          </div>
                          <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
                            <span className="text-xs text-slate-500 dark:text-slate-400">{total - completed} açık tespit izleniyor</span>
                            <button 
                              onClick={() => setActiveAreaView(areaName)}
                              className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:hover:bg-slate-600"
                            >
                              Alanı Aç <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-3 mb-6">
                      <button 
                        onClick={() => {
                          if (activeSubareaView) {
                            setActiveSubareaView(null);
                          } else {
                            setActiveAreaView(null);
                          }
                        }}
                        className="w-fit flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                      >
                        <ChevronRight className="rotate-180" size={16} /> 
                        {activeSubareaView ? 'Alana Dön' : 'Tüm Mahallere Dön'}
                      </button>
                      
                      <div className="bg-gradient-to-r from-slate-100 to-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm dark:from-slate-800 dark:to-slate-900 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center dark:bg-blue-900/50 dark:text-blue-400">
                            <span className="font-bold text-lg">{activeAreaView?.charAt(0)}</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">
                              {activeAreaView} {activeSubareaView && <span className="text-slate-400 font-medium">/ {activeSubareaView}</span>}
                            </h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider dark:text-slate-400">Toplam</span>
                            <span className="font-bold text-slate-800 dark:text-white leading-none">
                              {findings.filter(f => (f.area || 'Mahal Belirtilmemiş') === activeAreaView && (!activeSubareaView || f.subarea === activeSubareaView)).length} Tespit
                            </span>
                          </div>
                          <div className="h-8 w-px bg-slate-200 mx-2 dark:bg-slate-700"></div>
                          <div className="flex flex-col items-start">
                            <span className="text-xs text-amber-500 font-medium uppercase tracking-wider">Açık</span>
                            <span className="font-bold text-amber-600 leading-none">
                              {findings.filter(f => (f.area || 'Mahal Belirtilmemiş') === activeAreaView && (!activeSubareaView || f.subarea === activeSubareaView) && f.status !== 'Tamamlanan').length} İşlem
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!activeSubareaView && (() => {
                      const areaFindings = findings.filter(f => (f.area || 'Mahal Belirtilmemiş') === activeAreaView);
                      const subareas = areaFindings.reduce((acc, f) => {
                        if (f.subarea) {
                          if (!acc[f.subarea]) acc[f.subarea] = [];
                          acc[f.subarea].push(f);
                        }
                        return acc;
                      }, {} as Record<string, Finding[]>);
                      
                      return Object.keys(subareas).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                          {Object.entries(subareas).map(([subareaName, saFindings], idx) => {
                            const total = saFindings.length;
                            const completed = saFindings.filter(f => f.status === 'Tamamlanan').length;
                            const openCritical = saFindings.filter(f => f.status !== 'Tamamlanan' && ['Tolere Edilemez Risk', 'Yüksek Risk'].includes(f.risk)).length;
                            const openAll = saFindings.filter(f => f.status !== 'Tamamlanan').length;
                            return (
                              <div key={subareaName} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden dark:bg-slate-800 dark:border-slate-700 flex flex-col hover:border-slate-300 transition-colors">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${openCritical > 0 ? 'bg-red-500' : openAll > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                <div className="flex justify-between items-start mb-4">
                                  <h4 className="font-bold text-slate-800 text-lg dark:text-white line-clamp-1">{subareaName}</h4>
                                  {openCritical > 0 ? (
                                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-bold dark:bg-red-900/30 dark:text-red-400">{openCritical} kritik açık</span>
                                  ) : openAll > 0 ? (
                                    <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded text-xs font-bold dark:bg-amber-900/30 dark:text-amber-400">{openAll} açık işlem</span>
                                  ) : (
                                    <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-xs font-bold dark:bg-emerald-900/30 dark:text-emerald-400">Tamamlandı</span>
                                  )}
                                </div>
                                <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                                  <span className="text-xs text-slate-500 dark:text-slate-400">{total} Toplam / {total - completed} Açık</span>
                                  <button 
                                    onClick={() => setActiveSubareaView(subareaName)}
                                    className="flex items-center gap-1 text-sm font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                                  >
                                    Bulguları Gör <ChevronRight size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null;
                    })()}

                    <div className="space-y-4">
                      {findings
                        .filter(f => (f.area || 'Mahal Belirtilmemiş') === activeAreaView)
                        .filter(f => activeSubareaView ? f.subarea === activeSubareaView : !f.subarea)
                        .map(f => {
                          const isHighRisk = f.risk === 'Tolere Edilemez Risk' || f.risk === 'Yüksek Risk';
                          const isMediumRisk = f.risk === 'Önemli Risk';
                          const borderLeft = isHighRisk ? 'border-l-red-500' : isMediumRisk ? 'border-l-orange-500' : 'border-l-yellow-500';
                          
                          return (
                            <div key={f.id} className={`bg-white border border-slate-200 rounded-xl p-6 shadow-sm border-l-4 ${borderLeft} dark:bg-slate-800 dark:border-slate-700 flex flex-col lg:flex-row gap-6 hover:shadow-md transition-shadow group`}>
                              {/* Left Content Area */}
                              <div className="flex-1 space-y-4">
                                <div className="flex flex-wrap gap-2 items-center text-xs font-bold">
                                  <span className="text-slate-800 text-lg mr-2 dark:text-white font-black tracking-tight">{f.no}</span>
                                  <span className={`px-2.5 py-1 rounded-md ${isHighRisk ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:border-red-800' : isMediumRisk ? 'bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-900/30 dark:border-orange-800' : 'bg-yellow-50 text-yellow-600 border border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800'}`}>{f.risk}</span>
                                  <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">{f.category}</span>
                                  
                                  {f.history && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 flex items-center gap-1">
                                      <AlertTriangle size={12}/> Devreden
                                    </span>
                                  )}
                                </div>
                                
                                <div className="space-y-4">
                                  <div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1 dark:text-slate-500">Tespit</span>
                                    <p className="text-slate-800 font-medium text-sm dark:text-slate-200 leading-relaxed max-w-4xl">{f.findingDesc || 'Belirtilmemiş'}</p>
                                  </div>
                                  {f.riskDesc && (
                                    <div>
                                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1 dark:text-slate-500">Risk</span>
                                      <p className="text-slate-800 font-medium text-sm dark:text-slate-200 leading-relaxed max-w-4xl">{f.riskDesc}</p>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1 dark:text-slate-500">Öneri</span>
                                    <p className="text-slate-800 font-medium text-sm dark:text-slate-200 leading-relaxed max-w-4xl">{f.recommendation || 'Belirtilmemiş'}</p>
                                  </div>
                                  
                                  {/* Thumbnail Preview Area */}
                                  {f.files && f.files.length > 0 && (
                                    <div className="pt-2 flex flex-wrap gap-2">
                                      {f.files.map((file, idx) => (
                                        <div key={idx} className="w-16 h-16 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 group-hover:border-slate-300 transition-colors shadow-sm">
                                          {file.type.startsWith('image/') ? (
                                            <img src={file.url} alt="Kanıt" className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); setPreviewImage(file.url); }} />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400"><FileText size={20}/></div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-2">
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5"></div>
                                    <span className="text-slate-600 dark:text-slate-300">
                                      {Array.from(new Set([...(f.departments || []), ...(f.steps?.map(s => s.department) || [])])).join(', ') || 'Atanmadı'}
                                    </span>
                                  </div>
                                  
                                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${f.status !== 'Tamamlanan' && new Date(f.targetDate || '') < new Date() ? 'bg-red-50 border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-900/50' : 'bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800'}`}>
                                    <Calendar size={14}/>
                                    {f.targetDate ? new Date(f.targetDate).toLocaleDateString('tr-TR') : 'Tarih Yok'} 
                                    {f.status !== 'Tamamlanan' && new Date(f.targetDate || '') < new Date() && ' (GECİKTİ)'}
                                  </div>

                                  {f.files && f.files.length > 0 && (
                                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
                                      <FileText size={14}/> {f.files.length} kanıt
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Right Action Area */}
                              <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3 min-w-[140px] border-t border-slate-100 lg:border-t-0 lg:border-l lg:pl-6 pt-4 lg:pt-0 dark:border-slate-700">
                                <span className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border ${
                                  f.status === 'Tamamlanan' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 
                                  f.status === 'Kısmen İyileştirilen' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                                  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'}`}>
                                  {f.status === 'Tamamlanan' ? <CheckCircle size={14}/> : f.status === 'Kısmen İyileştirilen' ? <Edit2 size={14}/> : <AlertTriangle size={14}/>}
                                  {f.status || 'Yeni Tespit Edilen'}
                                </span>
                                
                                <div className="flex lg:flex-col w-full gap-2">
                                  <div className="flex gap-2">
                                    <button onClick={() => { setActiveFindingId(f.id); setActiveFindingForm('VIEW'); }} className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold py-2 px-3 rounded-lg text-xs hover:bg-slate-50 hover:border-slate-300 shadow-sm dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 transition-all">
                                      <Eye size={14}/> İncele
                                    </button>
                                    {(!isPublished) && (
                                      <button 
                                        onClick={() => {
                                          toast(
                                            (t) => (
                                              <div className="flex flex-col gap-3 p-2">
                                                <div className="font-semibold text-slate-800 dark:text-white">Bulguyu tamamen silmek istediğinize emin misiniz?</div>
                                                <div className="text-sm text-slate-500">Bu işlem geri alınamaz.</div>
                                                <div className="flex gap-2 justify-end mt-2">
                                                  <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium transition-colors">İptal</button>
                                                  <button onClick={() => {
                                                    setFindings(findings.filter(fi => fi.id !== f.id));
                                                    toast.dismiss(t.id);
                                                    toast.success('Bulgu silindi');
                                                  }} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors">Sil</button>
                                                </div>
                                              </div>
                                            ),
                                            { duration: 5000 }
                                          );
                                        }}
                                        className="flex items-center justify-center bg-white border border-red-200 text-red-500 py-2 px-3 rounded-lg hover:bg-red-50 hover:border-red-300 shadow-sm dark:bg-slate-800 dark:border-red-900/50 dark:hover:bg-red-900/20 transition-all"
                                        title="Bulguyu Sil"
                                      >
                                        <Trash2 size={16}/>
                                      </button>
                                    )}
                                  </div>
                                  {(!isPublished) && (
                                    <button 
                                      onClick={() => {
                                        setNewFinding(f);
                                        setActiveFindingId(f.id);
                                        setActiveFindingForm('EDIT');
                                      }}
                                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2 px-3 rounded-lg text-xs hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all"
                                    >
                                      <Edit2 size={14}/> Aksiyon
                                    </button>
                                  )}
                                  {(!isPublished) && (
                                    <button 
                                      onClick={() => {
                                        const newFindings = findings.map(fi => fi.id === f.id ? {...fi, status: f.status === 'Tamamlanan' ? 'Yeni Tespit Edilen' : 'Tamamlanan'} : fi);
                                        setFindings(newFindings as any);
                                      }}
                                      className={`flex-1 flex items-center justify-center gap-2 font-bold py-2 px-3 rounded-lg text-xs shadow-sm transition-all ${f.status === 'Tamamlanan' ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700' : 'bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600'}`}
                                    >
                                      {f.status === 'Tamamlanan' ? <X size={14}/> : <CheckCircle size={14}/>}
                                      {f.status === 'Tamamlanan' ? 'Geri Al' : 'Kapat'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
                  </>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm dark:bg-slate-800 dark:border-slate-700 p-6">
                    <button 
                      onClick={() => setActiveFindingForm(null)}
                      className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-6"
                    >
                      <span>←</span> Listeye Dön
                    </button>
                    {activeFindingForm === 'VIEW' ? (() => {
                      const f = findings.find(fi => fi.id === activeFindingId);
                      if (!f) return null;
                      return (
                        <div className="space-y-6">
                          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <span>Bulgu Görüntüleme: {f.no}</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${getRiskColor(f.risk)}`}>{f.risk}</span>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl dark:bg-slate-900/50">
                            <div>
                              <div className="text-xs font-semibold text-slate-500 mb-1 uppercase">Kategori & Süreç</div>
                              <div className="font-medium text-slate-800 dark:text-slate-200">
                                {f.category} {f.subcategory && `> ${f.subcategory}`}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-500 mb-1 uppercase">Değerlendirilen Mahal</div>
                              <div className="font-medium text-slate-800 dark:text-slate-200">
                                {f.area} {f.subarea && `> ${f.subarea}`}
                              </div>
                            </div>
                            <div className="md:col-span-2 border-t border-slate-200 pt-4 mt-2 dark:border-slate-700">
                              <div className="text-xs font-semibold text-slate-500 mb-1 uppercase">Sorumlu Departman(lar)</div>
                              <div className="font-medium text-blue-700 dark:text-blue-400">
                                {Array.from(new Set([...(f.departments || []), ...(f.steps?.map(s => s.department) || [])])).join(', ') || 'Atanmadı'}
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">Tespit (Mevcut Durum)</div>
                            <div className="bg-white border border-slate-200 p-4 rounded-xl text-slate-800 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                              {f.findingDesc || 'Girilmemiş'}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">Risk (Olası Sonuçlar)</div>
                            <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-900 text-sm dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300 whitespace-pre-wrap">
                              {f.riskDesc || 'Girilmemiş'}
                            </div>
                          </div>
                          {f.files && f.files.length > 0 && (
                            <div>
                              <div className="text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">Kanıt / Dokümanlar</div>
                              <div className="flex flex-wrap gap-4">
                                {f.files.map((file, idx) => (
                                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                    {file.type.startsWith('image/') ? (
                                      <img src={file.url} alt={file.name} className="w-32 h-32 object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(file.url)} />
                                    ) : (
                                      <div className="w-32 h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 text-slate-500 p-2 text-center">
                                        <FileText size={32} className="mb-2" />
                                        <span className="text-xs truncate w-full">{file.name}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">Öneri / Aksiyon Planı</div>
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-900 text-sm dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-300 whitespace-pre-wrap">
                              {f.recommendation || 'Girilmemiş'}
                            </div>
                          </div>
                          {/* AKSİYON GEÇMİŞİ VE EKLENTİ FORMU */}
                          <div className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <MessageSquare size={20} className="text-blue-500" />
                                Aksiyon Geçmişi ve Yorumlar
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-2 dark:bg-slate-800 dark:text-slate-400">{f.steps.length}</span>
                              </h3>
                              <button
                                onClick={() => setActiveActionFormId(activeActionFormId === f.id ? null : f.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                {activeActionFormId === f.id ? <X size={16} /> : <Plus size={16} />}
                                {activeActionFormId === f.id ? 'Vazgeç' : 'Aksiyon / Güncelleme Ekle'}
                              </button>
                            </div>

                            {activeActionFormId === f.id && (
                              <div className="bg-slate-50 border border-blue-100 p-5 rounded-xl mb-8 dark:bg-slate-900/50 dark:border-blue-900/30">
                                <h4 className="font-semibold text-slate-800 mb-4 dark:text-white">Yeni Aksiyon Ekle</h4>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs font-semibold text-slate-500 mb-1">Sorumlu Departman *</label>
                                      <select 
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm dark:bg-slate-800 dark:border-slate-700"
                                        value={newAction.department}
                                        onChange={e => setNewAction({...newAction, department: e.target.value})}
                                      >
                                        <option value="">Seçiniz</option>
                                        {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-slate-500 mb-1">Durum</label>
                                      <select 
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm dark:bg-slate-800 dark:border-slate-700"
                                        value={newAction.status}
                                        onChange={e => setNewAction({...newAction, status: e.target.value as StepStatus})}
                                      >
                                        <option value="Başlamadı">Başlamadı</option>
                                        <option value="Devam Ediyor">Devam Ediyor</option>
                                        <option value="Tamamlandı">Tamamlandı</option>
                                        <option value="İptal Edildi">İptal Edildi</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-slate-500 mb-1">İşlem Tarihi</label>
                                      <input 
                                        type="date"
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm dark:bg-slate-800 dark:border-slate-700"
                                        value={newAction.actionDate}
                                        onChange={e => setNewAction({...newAction, actionDate: e.target.value})}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-slate-500 mb-1">Kanıt Dosyası</label>
                                      <label className="w-full px-3 py-2 flex items-center justify-center bg-white border border-slate-200 border-dashed rounded-lg text-sm cursor-pointer hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700/50">
                                        <Upload size={16} className="text-slate-400 mr-2" />
                                        <span className="text-slate-500">{newAction.files?.length ? `${newAction.files.length} dosya seçildi` : 'Dosya Seç (Foto, PDF, Excel)'}</span>
                                        <input 
                                          type="file"
                                          multiple
                                          accept="image/*,application/pdf"
                                          capture="environment"
                                          className="hidden"
                                          onChange={async e => {
                                            if (e.target.files) {
                                              try {
                                                const uploaded = await uploadAuditFiles(Array.from(e.target.files));
                                                setNewAction({...newAction, files: [...(newAction.files || []), ...uploaded]});
                                              } catch (err) {
                                                console.error("Upload failed", err);
                                                alert("Dosya yüklenemedi!");
                                              }
                                            }
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Aksiyon Açıklaması *</label>
                                    <textarea 
                                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm min-h-[80px] dark:bg-slate-800 dark:border-slate-700"
                                      placeholder="Yapılan veya yapılacak işlemleri açıklayın..."
                                      value={newAction.explanation}
                                      onChange={e => setNewAction({...newAction, explanation: e.target.value})}
                                    ></textarea>
                                  </div>
                                  <div className="flex justify-end pt-2">
                                    <button 
                                      onClick={() => handleAddAction(f.id)}
                                      disabled={!newAction.department || !newAction.explanation}
                                      className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                                    >
                                      Aksiyonu Ekle
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {f.steps.length > 0 ? (
                              <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pb-4 dark:border-slate-700 mt-4">
                                {f.steps.map((step, idx) => (
                                  <div key={step.id} className="relative pl-6">
                                    {/* Timeline Node */}
                                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${
                                      step.status === 'Tamamlandı' ? 'bg-emerald-500' :
                                      step.status === 'İptal Edildi' ? 'bg-red-500' :
                                      step.status === 'Devam Ediyor' ? 'bg-blue-500' : 'bg-amber-500'
                                    }`}></div>
                                    
                                    <div className={`bg-white border p-4 rounded-xl shadow-sm dark:bg-slate-800 ${
                                      step.status === 'Tamamlandı' ? 'border-emerald-200 dark:border-emerald-900/50' :
                                      step.status === 'İptal Edildi' ? 'border-red-200 dark:border-red-900/50' :
                                      step.status === 'Devam Ediyor' ? 'border-blue-200 dark:border-blue-900/50' : 'border-amber-200 dark:border-amber-900/50'
                                    }`}>
                                      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                                        <div>
                                          <h4 className="font-bold text-slate-800 dark:text-slate-200">Adım {idx + 1}: {step.title || 'Aksiyon Güncellemesi'}</h4>
                                          <div className="text-sm text-slate-500 mt-1 dark:text-slate-400">
                                            Sorumlu: <span className="font-semibold text-slate-700 dark:text-slate-300">{step.department}</span>
                                          </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          {step.files && step.files.length > 0 && (
                                            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold border border-blue-100 flex items-center gap-1 dark:bg-blue-900/30 dark:border-blue-900/50 dark:text-blue-400">
                                              {step.files.length} Kanıt Yüklendi
                                            </span>
                                          )}
                                          {step.actionDate && (
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200 flex items-center gap-1 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300">
                                              <Calendar size={12} />
                                              İşlem: {new Date(step.actionDate).toLocaleDateString('tr-TR')}
                                            </span>
                                          )}
                                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                                            step.status === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            step.status === 'İptal Edildi' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                            step.status === 'Devam Ediyor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                          }`}>
                                            {step.status}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700 dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-slate-300 whitespace-pre-wrap">
                                        <span className="font-semibold mr-1">Açıklama:</span>
                                        {step.explanation || 'Açıklama girilmemiş.'}
                                      </div>
                                      
                                      {step.files && step.files.length > 0 && (
                                        <div className="mt-3 text-sm">
                                          <span className="font-semibold text-slate-600 dark:text-slate-400 mr-2">Ekli Kanıtlar:</span>
                                          <div className="flex flex-wrap gap-2 mt-2">
                                            {step.files.map((file, fIdx) => (
                                              <div key={fIdx} className="relative group rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                                                {file.type.startsWith('image/') ? (
                                                  <img src={file.url} alt={file.name} className="w-16 h-16 object-cover cursor-pointer hover:opacity-80" onClick={() => setPreviewImage(file.url)} />
                                                ) : (
                                                  <a href={file.url} target="_blank" rel="noreferrer" className="w-16 h-16 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 text-slate-500 hover:bg-slate-100">
                                                    <FileText size={20} />
                                                  </a>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl dark:border-slate-700">
                                <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
                                <p>Bu karar için henüz aksiyon veya açıklama girilmemiş.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })() : (
                      <>
                        <fieldset disabled={isPublished} className="space-y-6">
                        {isPublished && (
                          <div className="bg-amber-50 text-amber-800 p-4 rounded-lg flex items-center gap-3 mb-6">
                            <AlertTriangle size={20} />
                            <p><strong>Bu rapor yayınlanmıştır.</strong> Bulgular üzerinde değişiklik yapılamaz.</p>
                          </div>
                        )}
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{activeFindingId ? 'Bulguyu Düzenle' : 'Yeni Bulgu Girişi'}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Kategori *</label>
                            <select 
                              className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                              value={newFinding.category || ''}
                              onChange={e => setNewFinding({...newFinding, category: e.target.value, subcategory: ''})}
                            >
                              <option value="">Seçiniz...</option>
                              {categories.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Alt Kategori</label>
                            <select 
                              className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white disabled:opacity-50"
                              value={newFinding.subcategory || ''}
                              onChange={e => setNewFinding({...newFinding, subcategory: e.target.value})}
                              disabled={!newFinding.category}
                            >
                              <option value="">Seçiniz...</option>
                              {newFinding.category && categories.find(c => c.name === newFinding.category)?.subcategories.map((s,i) => (
                                <option key={i} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Mahal *</label>
                            <select 
                              className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                              value={newFinding.area || ''}
                              onChange={e => setNewFinding({...newFinding, area: e.target.value, subarea: ''})}
                            >
                              <option value="">Seçiniz...</option>
                              {globalAreas.map(a => (
                                <option key={a.id} value={a.name}>{a.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Alan / Alt Mahal</label>
                            <select 
                              className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white disabled:opacity-50"
                              value={newFinding.subarea || ''}
                              onChange={e => setNewFinding({...newFinding, subarea: e.target.value})}
                              disabled={!newFinding.area}
                            >
                              <option value="">Seçiniz...</option>
                              {newFinding.area && globalAreas.find(a => a.name === newFinding.area)?.subareas?.map((s,i) => (
                                <option key={i} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300 flex justify-between items-center">
                            <span>Tespit (Mevcut Durum) *</span>
                            <button className="text-slate-400 hover:text-blue-500 transition-colors flex items-center gap-1 text-xs" title="Mikrofon ile dikte et (Prototip)">
                              <Mic size={14} /> Dikte
                            </button>
                          </label>
                          <textarea 
                            rows={3} 
                            className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                            placeholder="Sahada tespit edilen problemi detaylıca açıklayın..."
                            value={newFinding.findingDesc || ''}
                            onChange={e => setNewFinding({...newFinding, findingDesc: e.target.value})}
                          ></textarea>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Risk (Etki ve Sonuçları) *</label>
                          <textarea 
                            rows={2} 
                            className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                            placeholder="Bu durumun yaratacağı riskleri, kazaları veya uygunsuzlukları yazın..."
                            value={newFinding.riskDesc || ''}
                            onChange={e => setNewFinding({...newFinding, riskDesc: e.target.value})}
                          ></textarea>
                        </div>

                        {/* Multiple File Upload */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Kanıt / Dokümanlar</label>
                          <label className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <Upload className="text-slate-400 mb-2" size={24} />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Fotoğraf veya doküman yüklemek için tıklayın (Mobilden doğrudan çekebilirsiniz)</p>
                            <p className="text-xs text-slate-400 mt-1">JPEG, PNG, PDF, Excel (Max 10MB)</p>
                            <input 
                              type="file" 
                              multiple 
                              accept="image/*,application/pdf"
                              capture="environment"
                              className="hidden" 
                              onChange={async e => {
                                if (e.target.files) {
                                  try {
                                    const uploaded = await uploadAuditFiles(Array.from(e.target.files));
                                    setNewFinding({...newFinding, files: [...(newFinding.files || []), ...uploaded]});
                                  } catch (err) {
                                    console.error("Upload failed", err);
                                    alert("Dosya yüklenemedi!");
                                  }
                                }
                              }}
                            />
                          </label>
                          {newFinding.files && newFinding.files.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-3">
                              {newFinding.files.map((file, idx) => (
                                <div key={idx} className="relative group">
                                  {file.type.startsWith('image/') ? (
                                    <img src={file.url} alt={file.name} className="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(file.url)} />
                                  ) : (
                                    <div className="w-20 h-20 flex items-center justify-center bg-slate-100 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-400">
                                      <FileText size={24} />
                                    </div>
                                  )}
                                  <button 
                                    onClick={() => setNewFinding({...newFinding, files: newFinding.files?.filter((_, i) => i !== idx)})}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        
                        {/* İlgili Birim / Departmanlar */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">İlgili Birim / Departmanlar (Çoklu Seçim)</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {departments.map(d => (
                              <label key={d.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${selectedDepartments.includes(d.name) ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700'}`}>
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                                  checked={selectedDepartments.includes(d.name)}
                                  onChange={() => toggleDepartment(d.name)}
                                />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{d.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Finne Kinney Risk Seviyesi */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 dark:bg-slate-900/50 dark:border-slate-700">
                          <h4 className="font-semibold text-slate-800 mb-3 dark:text-white">Risk Seviyesi</h4>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {riskLevels.map(r => (
                              <button
                                key={r}
                                onClick={() => {
                                  const targetD = calculateTargetDate(r as RiskLevel, auditMeta.reportDate);
                                  setNewFinding({...newFinding, risk: r, targetDate: targetD});
                                }}
                                className={`p-3 rounded-lg text-sm font-bold text-center transition-all ${newFinding.risk === r ? getRiskColor(r) + ' ring-2 ring-offset-2 ring-blue-500' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300'}`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                          {newFinding.risk && (
                            <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-white border border-blue-200 rounded-lg dark:bg-slate-800 dark:border-blue-900">
                              <div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Önerilen Aksiyon Süresi: </span>
                                <span className="font-bold text-blue-700 dark:text-blue-400">{getRiskTermin(newFinding.risk as RiskLevel)}</span>
                              </div>
                              <div className="flex-1 md:max-w-xs">
                                <label className="text-xs text-slate-500 mb-1 block">Termin Tarihi (Otomatik Hesaplanan)</label>
                                <input 
                                  type="date" 
                                  className="w-full p-2 border border-slate-300 rounded bg-slate-50 text-sm outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                                  value={newFinding.targetDate || ''}
                                  onChange={e => setNewFinding({...newFinding, targetDate: e.target.value})}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Öneri / Aksiyon Planı</label>
                          <textarea 
                            rows={2} 
                            className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                            placeholder="Önerilen düzeltici faaliyet..."
                            value={newFinding.recommendation}
                            onChange={e => setNewFinding({...newFinding, recommendation: e.target.value})}
                          ></textarea>
                        </div>
                      </fieldset>

                      {/* Çoklu Departman Atama (Kaldırıldı, yeni Aksiyon Geçmişi modülü kullanılıyor) */}
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/50">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="text-blue-500 mt-0.5" size={20} />
                          <div>
                            <h4 className="font-semibold text-blue-900 mb-1 dark:text-blue-300">Aksiyon Atama</h4>
                            <p className="text-sm text-blue-800 dark:text-blue-400">Bulguyu kaydettikten sonra üzerine tıklayarak (Görüntüle modunda) ilgili departmanlara aksiyon ve güncelleme ekleyebilirsiniz.</p>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 dark:border-slate-700 shrink-0 mt-8">
                        <button onClick={() => { setActiveFindingForm(null); setActiveFindingId(null); }} className="px-5 py-2.5 text-slate-700 font-medium hover:bg-slate-200 rounded-lg dark:text-slate-300 dark:hover:bg-slate-700">İptal</button>
                        
                        {!activeFindingId && (
                          <button 
                            onClick={() => handleSaveFinding(true)}
                            disabled={!newFinding.findingDesc || !newFinding.risk || !newFinding.area}
                            className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Kaydet ve Aynı Mahal İçin Yeni Ekle
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleSaveFinding(false)}
                          disabled={!newFinding.findingDesc || !newFinding.risk || !newFinding.area}
                          className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {activeFindingId ? 'Değişiklikleri Kaydet' : 'Bulguyu Kaydet (Bitir)'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        )}

        {/* ANALYSIS & REPORT TABS MOCK */}
        {activeTab === 'ANALYSIS' && (
          <fieldset disabled={isPublished}>
            {isPublished && (
              <div className="bg-amber-50 text-amber-800 p-4 rounded-lg flex items-center gap-3 mb-6">
                <AlertTriangle size={20} />
                <p><strong>Bu rapor yayınlanmıştır.</strong> Analiz verileri değiştirilemez.</p>
              </div>
            )}
            <AnalysisTab findings={findings} auditMeta={auditMeta} setAuditMeta={setAuditMeta} />
          </fieldset>
        )}

        {activeTab === 'REPORT' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 no-print">
               <div>
                 <h2 className="text-lg font-bold text-slate-800 dark:text-white">Rapor Önizleme</h2>
                 <p className="text-sm text-slate-500">PDF çıktısı almak veya yazdırmak için aşağıdaki butonu kullanın.</p>
               </div>
               <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-md">
                 <FileText size={20} /> PDF / Yazdır
               </button>
            </div>
            
            <div className="bg-slate-200/50 p-4 rounded-xl border border-slate-200 overflow-x-auto dark:bg-slate-900/50 dark:border-slate-800 flex justify-center no-print">
               <div className="w-[1000px] shadow-2xl bg-white border border-slate-300">
                 <ReportTemplate 
                    ref={printRef} 
                    findings={findings} 
                    auditMeta={auditMeta} 
                    facility={facilities.find(f => f.id === auditMeta.locationId)} 
                    logoUrl="https://raw.githubusercontent.com/metinsalik/self-agent/refs/heads/main/mlpcare.jpg" 
                 />
               </div>
            </div>
            
            {/* The actual print container is handled natively by react-to-print, but we keep this just in case */}
          </div>
        )}
      </div>


      {/* CUSTOM MODALS */}
      {alertMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 dark:bg-slate-800 border dark:border-slate-700">
            <h4 className="text-lg font-bold text-slate-800 mb-2 dark:text-white">Uyarı</h4>
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
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}

      {promptDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 dark:bg-slate-800 border dark:border-slate-700">
            <h4 className="text-lg font-bold text-slate-800 mb-4 dark:text-white">{promptDialog.title}</h4>
            <input 
              type="text" 
              autoFocus
              value={promptVal}
              onChange={e => setPromptVal(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg outline-none mb-6 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  promptDialog.onSubmit(promptVal.trim());
                  setPromptDialog(null);
                }
              }}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setPromptDialog(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-700">İptal</button>
              <button 
                onClick={() => {
                  promptDialog.onSubmit(promptVal.trim());
                  setPromptDialog(null);
                }} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center">
            <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors">
              <X size={24} />
            </button>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  );
}
