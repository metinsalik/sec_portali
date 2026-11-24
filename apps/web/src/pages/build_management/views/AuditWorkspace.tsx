import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIRSC } from '../context/IRSCContext';
import { useAuth } from '../../../context/AuthContext';
import { useReactToPrint } from 'react-to-print';
import { Save, ChevronRight, AlertTriangle, Plus, X, Upload, Edit2, Trash2, Mic, Calendar, FileText, CheckCircle, Search, Filter, Eye, MessageSquare, ArrowLeft, Check, Database, History as HistoryIcon, Printer } from 'lucide-react';
import {
  type RiskLevel,
  type ActionStep,
  type Finding,
  type StepStatus,
  type ImprovementStatus,
  type IrscFindingTemplate,
  RISK_LEVELS,
  RISK_COLORS,
  normalizeRiskLevel,
  getRiskSolidClass,
  getRiskBadgeClass,
  getRiskBorderClass,
  getRiskTermin,
} from '../types';
import AnalysisTab from './AnalysisTab';
import ReportTemplate from './ReportTemplate';
import { PoolTemplateDialog } from './FindingPoolPage';
import { FindingPoolPicker } from './FindingPoolPicker';
import { AuditMediaUploader } from '../components/AuditMediaUploader';
import { AuditFindingsList } from '../components/AuditFindingsList';
import { saveAudit, uploadAuditFiles } from '../services/auditApi';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import LocationCascadingSelector from '../../../components/shared/LocationCascadingSelector';
import { DepartmentMultiSelect } from '@/components/shared/DepartmentSelect';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { Card, CardContent } from '@/components/ui/card';
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

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface AuditWorkspaceProps {
  routeFindingId?: string | null;
  routeFindingMode?: 'CREATE' | 'VIEW' | 'EDIT' | null;
}

export default function AuditWorkspace({
  routeFindingId = null,
  routeFindingMode = null,
}: AuditWorkspaceProps) {
  const { setCurrentView, facilities, categories: irscCategories, departments, audits, setAudits, activeAuditId, setActiveAuditId, globalAreas, setGlobalAreas, globalCriteria, setGlobalCriteria } = useIRSC();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isManager = user?.isAdmin || user?.roles.includes('admin') || user?.roles.includes('management') || user?.roles.includes('safety');
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [selectedLocationPath, setSelectedLocationPath] = useState<any>(null);
  const [locationSelectorKey, setLocationSelectorKey] = useState(0);

  const { data: globalCategories = [] } = useQuery<any[]>({
    queryKey: ['global-categories'],
    queryFn: async () => (await api.get('/settings/definitions/categories')).json()
  });

  const { data: globalLocations = [] } = useQuery<any[]>({
    queryKey: ['global-locations', selectedFacility],
    queryFn: async () => {
      if (!selectedFacility) return [];
      return (await api.get(`/risks/facilities/${selectedFacility}/locations`)).json();
    },
    enabled: !!selectedFacility
  });

  const [activeTab, setActiveTab] = useState<'INFO' | 'CARRYOVER' | 'FINDINGS' | 'ANALYSIS' | 'REPORT'>('INFO');
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

  // Sync URL finding route (/workspace/:id/findings/:findingId[/edit] | /findings/new) with workspace state
  useEffect(() => {
    if (!routeFindingMode) {
      setActiveFindingForm(null);
      setActiveFindingId(null);
      return;
    }

    setActiveTab('FINDINGS');

    if (routeFindingMode === 'CREATE') {
      setActiveFindingId(null);
      setActiveFindingForm('CREATE');
      return;
    }

    if (routeFindingId && findings.length > 0) {
      const target = findings.find((f) => f.id === routeFindingId);
      if (target) {
        setActiveFindingId(target.id);
        setActiveFindingForm(routeFindingMode);
        if (routeFindingMode === 'EDIT') {
          setNewFinding(target);
          setSelectedDepartments(target.departments || []);
        }
      }
    }
  }, [routeFindingMode, routeFindingId, findings]);

  const navigateToFindingList = () => {
    setActiveFindingForm(null);
    setActiveFindingId(null);
    setSelectedLocationPath(null);
    if (activeAuditId) {
      navigate(`/renovation-report/workspace/${activeAuditId}`);
    }
  };

  const navigateToCreateFinding = () => {
    setNewFinding({
      category: '',
      subcategory: '',
      findingDesc: '',
      riskDesc: '',
      recommendation: '',
      locationId: '',
      area: activeAreaView || '',
      subarea: activeSubareaView || '',
      files: [],
    });
    setSelectedDepartments([]);
    setSelectedLocationPath(null);
    setActiveFindingId(null);
    setActiveFindingForm('CREATE');
    if (activeAuditId) {
      navigate(`/renovation-report/workspace/${activeAuditId}/findings/new`);
    }
  };

  const navigateToViewFinding = (f: Finding) => {
    setActiveFindingId(f.id);
    setActiveFindingForm('VIEW');
    if (activeAuditId) {
      navigate(`/renovation-report/workspace/${activeAuditId}/findings/${f.id}`);
    }
  };

  const navigateToEditFinding = (f: Finding) => {
    setNewFinding(f);
    setSelectedDepartments(f.departments || []);
    setActiveFindingId(f.id);
    setActiveFindingForm('EDIT');
    if (activeAuditId) {
      navigate(`/renovation-report/workspace/${activeAuditId}/findings/${f.id}/edit`);
    }
  };

  // Auto-fill logic when facility is selected (ONLY if no activeAuditId and no existing reportNo)
  useEffect(() => {
    if (selectedFacility && !activeAuditId) {
      const facility = facilities.find(f => f.id === selectedFacility);
      if (facility) {
        const facIndex = facilities.findIndex(f => f.id === selectedFacility) + 1;
        const locCode = facIndex.toString().padStart(2, '0');

        const facAuditsCount = audits.filter(a => a.meta.locationId === selectedFacility).length + 1;
        const sequence = facAuditsCount.toString().padStart(2, '0');

        setAuditMeta((prev: any) => ({
          ...prev,
          reportNo: prev.reportNo || `H-IRSC-${locCode}.${sequence}`,
          locationId: selectedFacility
        }));
      }
    }
  }, [selectedFacility, activeAuditId, facilities, audits]);

  // Finding Modal State
  const [newFinding, setNewFinding] = useState<Partial<Finding>>({
    mainCategory: '',
    category: '',
    subcategory: '',
    findingDesc: '',
    riskDesc: '',
    recommendation: '',
    locationId: '',
    building: '',
    floor: '',
    department: '',
    room: '',
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
  const riskLevels: RiskLevel[] = RISK_LEVELS;

  const getRiskColor = (risk: RiskLevel) => getRiskSolidClass(risk);

  const calculateTargetDate = (risk: RiskLevel, reportDateStr: string) => {
    if (!reportDateStr) return '';
    const date = new Date(reportDateStr);
    if (isNaN(date.getTime())) return '';

    switch (normalizeRiskLevel(risk)) {
      case 'Kritik': date.setDate(date.getDate() + 3); break;
      case 'Yüksek': date.setMonth(date.getMonth() + 1); break;
      case 'Önemli': date.setMonth(date.getMonth() + 3); break;
      case 'Olası': date.setMonth(date.getMonth() + 9); break;
      case 'Önemsiz': date.setMonth(date.getMonth() + 12); break;
    }
    return date.toISOString().split('T')[0];
  };

  const carryoverFindings = findings.filter((f) => Boolean(f.history && f.history.includes('Devreden Bulgu')));
  const newSessionFindings = findings.filter((f) => !f.history || !f.history.includes('Devreden Bulgu'));

  const tabs = [
    { id: 'INFO', title: 'Hazırlık', sub: 'Tesis, tarih ve ekip' },
    { id: 'CARRYOVER', title: 'Önceki Denetim', sub: `${carryoverFindings.length} devreden` },
    { id: 'FINDINGS', title: 'Yeni Bulgular', sub: `${newSessionFindings.length} yeni • ${findings.length} toplam` },
    { id: 'ANALYSIS', title: 'Analiz ve Özet', sub: 'Dağılımlar ve anlatı' },
    { id: 'REPORT', title: 'Rapor & PDF', sub: 'Önizleme ve yayınla' }
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
            openFindings.push({ ...f, history: `${f.history}\nDevreden Bulgu (Önceki Rapor: ${a.meta.reportNo})` });
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
  const [poolDialogInitial, setPoolDialogInitial] = useState<Partial<IrscFindingTemplate> | null>(null);

  const handleSaveFinding = async (mode: 'CLOSE' | 'SAME_AREA' | 'NEW_AREA' = 'CLOSE') => {
    // Eğer yeni bir Birim veya Mahal yazıldıysa sistemdeki tesis lokasyonlarına da kaydet
    let resolvedLocationId = newFinding.locationId || '';
    const locBuildingName = selectedLocationPath?.buildingName || '';
    const locBlock = selectedLocationPath?.building || newFinding.building || '';
    const locFloor = selectedLocationPath?.floor || newFinding.floor || '';
    const locDept = selectedLocationPath?.department || newFinding.department || '';
    const locDesc = selectedLocationPath?.description || newFinding.room || '';

    if (
      selectedFacility &&
      (locBuildingName || locBlock || locFloor || locDept || locDesc) &&
      (!resolvedLocationId || resolvedLocationId.startsWith('group5:') || resolvedLocationId.startsWith('custom'))
    ) {
      try {
        const locRes = await api.post('/locations', {
          facilityId: selectedFacility,
          buildingName: locBuildingName || undefined,
          building: locBlock || undefined,
          floor: locFloor || undefined,
          department: locDept || undefined,
          description: locDesc || undefined,
        });
        if (locRes.ok) {
          const savedLoc = await locRes.json();
          if (savedLoc?.id) resolvedLocationId = savedLoc.id;
          queryClient.invalidateQueries({ queryKey: ['global-locations', selectedFacility] });
          queryClient.invalidateQueries({ queryKey: ['facility-locations'] });
        }
      } catch (e) {
        console.warn('Lokasyon otomatik kayıt uyarısı:', e);
      }
    }

    const areaParts = Array.from(
      new Set([locBuildingName, locBlock, locFloor, locDept].map((p) => (p || '').trim()).filter(Boolean))
    );
    const areaLabel = areaParts.join(' > ') || newFinding.area || '';
    const subareaLabel = locDesc || newFinding.subarea || '';

    let updatedFindings: Finding[];
    if (activeFindingId && activeFindingForm === 'EDIT') {
      updatedFindings = findings.map(f => {
        if (f.id === activeFindingId) {
          return {
            ...f,
            risk: newFinding.risk as RiskLevel,
            mainCategory: newFinding.mainCategory || '',
            category: newFinding.category || '',
            subcategory: newFinding.subcategory || '',
            findingDesc: newFinding.findingDesc || '',
            riskDesc: newFinding.riskDesc || '',
            recommendation: newFinding.recommendation || '',
            locationId: resolvedLocationId,
            building: locBlock || locBuildingName || '',
            floor: locFloor,
            department: locDept,
            room: locDesc,
            area: areaLabel,
            subarea: subareaLabel,
            targetDate: newFinding.targetDate || '',
            files: newFinding.files || [],
            departments: selectedDepartments
          };
        }
        return f;
      });
      setFindings(updatedFindings);
    } else {
      const fCount = findings.length + 1;
      const fNo = auditMeta.reportNo ? `${auditMeta.reportNo}-${String(fCount).padStart(3, '0')}` : `BULGU-${fCount}`;

      const completeFinding: Finding = {
        id: generateUUID(),
        no: fNo,
        locationId: resolvedLocationId,
        building: locBlock || locBuildingName || '',
        floor: locFloor,
        department: locDept,
        room: locDesc,
        area: areaLabel,
        subarea: subareaLabel,
        mainCategory: newFinding.mainCategory || '',
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
      updatedFindings = [...findings, completeFinding];
      setFindings(updatedFindings);
    }

    // OTOMATİK TASLAK KAYIT (AUTO SAVE DRAFT)
    if (auditMeta.locationId) {
      const currentAudit = activeAuditId ? audits.find(a => a.id === activeAuditId) : null;
      const audit = {
        id: activeAuditId || undefined,
        status: currentAudit?.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        saved: true,
        meta: auditMeta,
        findings: updatedFindings
      };

      saveAudit(audit as any, auditMeta.locationId).then(savedAudit => {
        if (!activeAuditId && savedAudit.id) {
          setActiveAuditId(savedAudit.id);
          if (mode === 'CLOSE') {
            navigate(`/renovation-report/workspace/${savedAudit.id}`, { replace: true });
          } else {
            navigate(`/renovation-report/workspace/${savedAudit.id}/findings/new`, { replace: true });
          }
        }
        let updatedAudits = audits.filter(a => a.id !== activeAuditId && a.id !== savedAudit.id);
        setAudits([...updatedAudits, savedAudit]);
      }).catch(err => console.error("Auto-save error:", err));
    }

    const keepSameArea = mode === 'SAME_AREA';
    if (mode === 'CLOSE') {
      navigateToFindingList();
      toast.success(activeFindingId ? 'Bulgu güncellendi.' : 'Bulgu kaydedildi.');
    } else if (mode === 'SAME_AREA') {
      setActiveFindingId(null);
      setActiveFindingForm('CREATE');
      if (activeAuditId) {
        navigate(`/renovation-report/workspace/${activeAuditId}/findings/new`, { replace: true });
      }
      toast.success('Bulgu eklendi — aynı mahalde yeni bulgu girebilirsiniz.');
    } else {
      setActiveFindingId(null);
      setActiveFindingForm('CREATE');
      setSelectedLocationPath(null);
      setLocationSelectorKey((k) => k + 1);
      if (activeAuditId) {
        navigate(`/renovation-report/workspace/${activeAuditId}/findings/new`, { replace: true });
      }
      toast.success('Bulgu eklendi — yeni mahal seçerek devam edebilirsiniz.');
    }

    setNewFinding(prev => ({
      mainCategory: keepSameArea ? prev.mainCategory : '',
      category: keepSameArea ? prev.category : '',
      subcategory: keepSameArea ? prev.subcategory : '',
      findingDesc: '',
      riskDesc: '',
      recommendation: '',
      locationId: keepSameArea ? resolvedLocationId : '',
      building: keepSameArea ? (locBlock || locBuildingName || '') : '',
      floor: keepSameArea ? locFloor : '',
      department: keepSameArea ? locDept : '',
      room: keepSameArea ? locDesc : '',
      area: keepSameArea ? areaLabel : '',
      subarea: keepSameArea ? subareaLabel : '',
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

      if (publish && savedAudit?.id) {
        toast.success('Rapor başarıyla yayınlandı.');
        navigate(`/renovation-report/reports/${savedAudit.id}`);
      } else {
        toast.success('Taslak başarıyla kaydedildi.');
        navigate('/renovation-report/drafts');
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Rapor kaydedilirken hata oluştu!");
    }
  };

  return (
    <div className="space-y-3">
      {/* Compact Unified Workspace Header + Inline 5-Step Tab Strip */}
      <Card className="overflow-hidden">
        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Geri dön"
              onClick={() => {
                setActiveAuditId(null);
                navigate(-1);
              }}
              className="h-8 w-8 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate">
                {activeAuditId ? (auditMeta.reportNo || 'Denetim Detayı') : 'Yeni Denetim'}
              </h2>
              <span className="text-muted-foreground text-xs hidden sm:inline">•</span>
              <span className="text-xs text-muted-foreground truncate max-w-[240px]">
                {selectedFacility
                  ? facilities.find((f) => f.id === selectedFacility)?.name
                  : 'Lokasyon seçilmedi'}
              </span>
              {isPublished ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] py-0 h-5">
                  Yayınlandı
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] py-0 h-5">
                  Taslak
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {activeTab === 'FINDINGS' && !isPublished && !activeFindingForm && (
              <Button
                type="button"
                size="sm"
                onClick={navigateToCreateFinding}
                className="h-8 text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Yeni Bulgu
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              className="h-8 text-xs gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Kaydet
            </Button>
            {isManager && (
              <Button
                size="sm"
                onClick={() => handleSave(true)}
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="w-3.5 h-3.5" /> Yayınla
              </Button>
            )}
          </div>
        </div>

        {/* Inline Single-Line 5-Step Navigation Strip (No Scrollbar) */}
        <div className="border-t border-border bg-muted/20 px-2 flex flex-wrap items-center gap-1">
          {tabs.map((t, idx) => {
            const isActive = activeTab === t.id;
            const isDisabled = idx > 0 && !selectedFacility;
            const countBadge =
              t.id === 'CARRYOVER'
                ? carryoverFindings.length
                : t.id === 'FINDINGS'
                  ? findings.length
                  : null;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                disabled={isDisabled}
                className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${isActive
                  ? 'border-primary text-foreground font-semibold bg-background/80'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted-foreground/15 text-muted-foreground'
                    }`}
                >
                  {idx + 1}
                </span>
                <span>{t.title}</span>
                {countBadge !== null && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold tabular-nums ${isActive
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    {countBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Content Area */}
      <Card className="min-h-[480px]">
        <CardContent className="p-4 sm:p-5">

          {/* INFO TAB */}
          {activeTab === 'INFO' && (
            <div className="max-w-3xl mx-auto space-y-5">
              <fieldset disabled={isPublished} className="space-y-4">
                {isPublished && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 p-4 rounded-lg flex items-center gap-3 text-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p><strong>Bu rapor yayınlanmıştır.</strong> Temel bilgiler ve analiz verileri değiştirilemez.</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Tesis / Lokasyon Seçimi *</label>
                  <select
                    className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={auditMeta.locationId}
                    onChange={e => {
                      setSelectedFacility(e.target.value);
                      setAuditMeta({ ...auditMeta, locationId: e.target.value });
                    }}
                  >
                    <option value="">-- Tesis Seçin --</option>
                    {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  {auditMeta.locationId && (
                    <p className="mt-2 text-xs text-primary bg-primary/5 border border-primary/20 p-2.5 rounded-md flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> Önceki denetimden kalan açık bulgular varsa bir sonraki "Önceki Denetim" adımında kontrol edilebilir.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Planlanan / Gerçek Başlangıç *</label>
                    <Input
                      type="date"
                      value={auditMeta.start || ''}
                      onChange={e => setAuditMeta({ ...auditMeta, start: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Denetim Bitişi</label>
                    <Input
                      type="date"
                      value={auditMeta.end || ''}
                      onChange={e => setAuditMeta({ ...auditMeta, end: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Rapor Tarihi</label>
                    <Input
                      type="date"
                      value={auditMeta.reportDate || ''}
                      onChange={e => setAuditMeta({ ...auditMeta, reportDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Rapor No</label>
                    <Input
                      type="text"
                      value={auditMeta.reportNo || ''}
                      onChange={e => setAuditMeta({ ...auditMeta, reportNo: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Biçim: H-IRSC-LokasyonNo.DenetimNo</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Raporlayan</label>
                    <Input type="text" defaultValue="MLPCARE HSE" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Denetim Durumu</label>
                    <select className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option>Planlandı</option>
                      <option>Devam Ediyor</option>
                      <option>Tamamlandı</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Denetimin Amacı</label>
                  <textarea
                    rows={3}
                    value={auditMeta.purpose || ''}
                    onChange={e => setAuditMeta({ ...auditMeta, purpose: e.target.value })}
                    className="w-full p-2.5 border border-input rounded-md bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Değerlendirme Kriterleri</label>
                  {(auditMeta.criteria || []).map((c: string, i: number) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <Input
                        type="text"
                        value={c}
                        onChange={e => {
                          const newCriteria = [...auditMeta.criteria];
                          newCriteria[i] = e.target.value;
                          setAuditMeta({ ...auditMeta, criteria: newCriteria });
                        }}
                        className="flex-1"
                        placeholder="Örn: ISO 45001, JCI Standartları"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newCriteria = auditMeta.criteria.filter((_: any, idx: number) => idx !== i);
                          setAuditMeta({ ...auditMeta, criteria: newCriteria });
                        }}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAuditMeta({ ...auditMeta, criteria: [...(auditMeta.criteria || []), ''] })}
                    className="mt-1 gap-1.5 text-primary hover:text-primary"
                  >
                    <Plus className="w-4 h-4" /> Kriter Ekle
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Değerlendirme Ekibi</label>
                  {(auditMeta.team || []).map((t: string, i: number) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <Input
                        type="text"
                        value={t}
                        onChange={e => {
                          const newTeam = [...auditMeta.team];
                          newTeam[i] = e.target.value;
                          setAuditMeta({ ...auditMeta, team: newTeam });
                        }}
                        className="flex-1"
                        placeholder="Ad Soyad | Departman | Unvan"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newTeam = auditMeta.team.filter((_: any, idx: number) => idx !== i);
                          setAuditMeta({ ...auditMeta, team: newTeam });
                        }}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAuditMeta({ ...auditMeta, team: [...(auditMeta.team || []), ''] })}
                    className="mt-1 gap-1.5 text-primary hover:text-primary"
                  >
                    <Plus className="w-4 h-4" /> Ekip Üyesi Ekle
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Katılımcılar</label>
                  {(auditMeta.participants || []).map((p: string, i: number) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <Input
                        type="text"
                        value={p}
                        onChange={e => {
                          const newP = [...auditMeta.participants];
                          newP[i] = e.target.value;
                          setAuditMeta({ ...auditMeta, participants: newP });
                        }}
                        className="flex-1"
                        placeholder="Ad Soyad | Departman | Unvan"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newP = auditMeta.participants.filter((_: any, idx: number) => idx !== i);
                          setAuditMeta({ ...auditMeta, participants: newP });
                        }}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAuditMeta({ ...auditMeta, participants: [...(auditMeta.participants || []), ''] })}
                    className="mt-1 gap-1.5 text-primary hover:text-primary"
                  >
                    <Plus className="w-4 h-4" /> Katılımcı Ekle
                  </Button>
                </div>
              </fieldset>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button
                  type="button"
                  onClick={() => setActiveTab('CARRYOVER')}
                  disabled={!auditMeta.locationId}
                  className="gap-1.5"
                >
                  Önceki Denetim Kontrolüne Geç <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: CARRYOVER REVIEW TAB (ÖNCEKİ DENETİM KONTROLÜ) */}
          {activeTab === 'CARRYOVER' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <HistoryIcon className="w-4 h-4 text-primary shrink-0" />
                  Önceki denetimden devreden açık bulguların son durumunu inceleyip güncelleyin veya kapatın.
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('INFO')} className="h-7 text-xs">
                    ← Hazırlık
                  </Button>
                  <Button type="button" size="sm" onClick={() => setActiveTab('FINDINGS')} className="h-7 text-xs gap-1">
                    Yeni Bulgular <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {carryoverFindings.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-14 text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-semibold text-foreground">
                        Önceki Denetimden Devreden Açık Bulgu Bulunmuyor
                      </h4>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Bu tesis için önceki bir denetim kaydı yok veya tüm eski bulgular kapatılmış. Doğrudan yeni saha bulgularına geçebilirsiniz.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setActiveTab('FINDINGS')}
                      className="gap-1.5"
                    >
                      Yeni Bulgulara Başla <ChevronRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Özet Şerit */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-lg border border-border bg-muted/30 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Devreden Toplam</span>
                      <span className="text-lg font-bold tabular-nums text-foreground">{carryoverFindings.length}</span>
                    </div>
                    <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Bu Denetimde Kapatılan</span>
                      <span className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {carryoverFindings.filter((f) => f.status === 'Tamamlanan').length}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Halen Açık / Devam Eden</span>
                      <span className="text-lg font-bold tabular-nums text-amber-700 dark:text-amber-400">
                        {carryoverFindings.filter((f) => f.status !== 'Tamamlanan').length}
                      </span>
                    </div>
                  </div>

                  {/* Devreden Bulgu Kartları */}
                  <div className="space-y-3">
                    {carryoverFindings.map((f) => {
                      const normRisk = normalizeRiskLevel(f.risk);
                      return (
                        <Card key={f.id} className={`border-l-4 ${getRiskBorderClass(normRisk)}`}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-foreground tabular-nums">{f.no}</span>
                                <Badge className={`text-[11px] border ${getRiskBadgeClass(normRisk)}`}>
                                  {normRisk}
                                </Badge>
                                {f.category && (
                                  <Badge variant="outline" className="text-[11px]">
                                    {f.category}
                                  </Badge>
                                )}
                                {f.area && (
                                  <span className="text-xs text-muted-foreground">• {f.area}</span>
                                )}
                              </div>

                              {/* Hızlı Son Durum Seçimi */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {([
                                  { id: 'Tamamlanan', label: 'Kapatıldı', active: 'bg-emerald-600 text-white border-emerald-700' },
                                  { id: 'Kısmen İyileştirilen', label: 'Kısmen', active: 'bg-amber-500 text-white border-amber-600' },
                                  { id: 'İyileştirilmeyen', label: 'İyileştirilmedi', active: 'bg-red-600 text-white border-red-700' },
                                ] as const).map((st) => {
                                  const selected = f.status === st.id;
                                  return (
                                    <button
                                      key={st.id}
                                      type="button"
                                      disabled={isPublished}
                                      onClick={() => {
                                        setFindings((prev) =>
                                          prev.map((item) =>
                                            item.id === f.id ? { ...item, status: st.id } : item
                                          )
                                        );
                                      }}
                                      className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors duration-200 ${selected
                                        ? st.active
                                        : 'bg-background text-muted-foreground border-border hover:text-foreground'
                                        } disabled:opacity-50`}
                                    >
                                      {st.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                              {f.findingDesc || 'Açıklama belirtilmemiş'}
                            </p>

                            {f.recommendation && (
                              <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-md border border-border">
                                <strong className="text-foreground">Öneri:</strong> {f.recommendation}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FINDINGS TAB */}
          {activeTab === 'FINDINGS' && (
            <div className="space-y-4">
              {findings.length === 0 && !activeFindingForm ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg space-y-3">
                  <div>
                    <p className="font-semibold text-sm text-foreground">Henüz bulgu eklenmemiş</p>
                    <p className="text-xs mt-1">
                      Sahada tespit ettiğiniz yeni bulguları ekleyin veya Denetim Havuzu şablonlarını kullanın.
                    </p>
                  </div>
                  {!isPublished && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setNewFinding({
                          category: '',
                          subcategory: '',
                          findingDesc: '',
                          riskDesc: '',
                          recommendation: '',
                          locationId: '',
                          area: activeAreaView || '',
                          subarea: activeSubareaView || '',
                          files: [],
                        });
                        setActiveFindingId(null);
                        setActiveFindingForm('CREATE');
                      }}
                      className="gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> İlk Bulguyu Ekle
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {!activeFindingForm ? (
                    <AuditFindingsList
                      findings={findings}
                      isPublished={isPublished}
                      onView={(f) => navigateToViewFinding(f)}
                      onEdit={(f) => navigateToEditFinding(f)}
                      onDelete={(f) => {
                        setConfirmDialog({
                          msg: 'Bu bulguyu tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
                          onConfirm: () => {
                            const remaining = findings.filter((fi) => fi.id !== f.id);
                            setFindings(remaining);
                            if (auditMeta.locationId) {
                              saveAudit(
                                {
                                  id: activeAuditId || undefined,
                                  status: isPublished ? 'PUBLISHED' : 'DRAFT',
                                  saved: true,
                                  meta: auditMeta,
                                  findings: remaining,
                                } as any,
                                auditMeta.locationId
                              ).catch((err) => console.error('Auto-save delete error:', err));
                            }
                            toast.success('Bulgu silindi.');
                          },
                        });
                      }}
                      onToggleStatus={(f) => {
                        const newFindings = findings.map((fi) =>
                          fi.id === f.id
                            ? {
                              ...fi,
                              status:
                                f.status === 'Tamamlanan' ? 'Yeni Tespit Edilen' : 'Tamamlanan',
                            }
                            : fi
                        );
                        setFindings(newFindings as any);
                      }}
                    />
                  ) : (
                    <div className="bg-card border border-border rounded-lg p-5 sm:p-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={navigateToFindingList}
                        className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
                      >
                        ← Listeye Dön
                      </Button>
                      {activeFindingForm === 'VIEW' ? (() => {
                        const f = findings.find(fi => fi.id === activeFindingId);
                        if (!f) {
                          return (
                            <div className="py-12 text-center text-xs text-muted-foreground">
                              Bulgu bulunamadı veya yükleniyor...
                            </div>
                          );
                        }
                        const viewRisk = normalizeRiskLevel(f.risk);
                        return (
                          <div className="space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h3 className="text-lg font-bold text-foreground flex items-center gap-2.5 flex-wrap">
                                <span>Bulgu Detayı: {f.no}</span>
                                <Badge className={`border ${getRiskBadgeClass(viewRisk)}`}>{viewRisk}</Badge>
                                <span className="text-[11px] font-mono font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                  ID: {f.id}
                                </span>
                              </h3>
                              {!isPublished && (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => navigateToEditFinding(f)}
                                  className="h-8 text-xs gap-1.5"
                                >
                                  <Edit2 className="w-3.5 h-3.5" /> Bulguyu Düzenle
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border">
                              <div>
                                <div className="text-xs font-medium text-muted-foreground mb-1 uppercase">Kategori & Süreç</div>
                                <div className="font-medium text-sm text-foreground">
                                  {f.category} {f.subcategory && `> ${f.subcategory}`}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-muted-foreground mb-1 uppercase">Değerlendirilen Mahal</div>
                                <div className="font-medium text-sm text-foreground">
                                  {f.area} {f.subarea && `> ${f.subarea}`}
                                </div>
                              </div>
                              <div className="md:col-span-2 border-t border-border pt-3 mt-1">
                                <div className="text-xs font-medium text-muted-foreground mb-1 uppercase">Sorumlu Departman(lar)</div>
                                <div className="font-medium text-sm text-primary">
                                  {Array.from(new Set([...(f.departments || []), ...(f.steps?.map(s => s.department) || [])])).join(', ') || 'Atanmadı'}
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-foreground mb-1.5">Tespit (Mevcut Durum)</div>
                              <div className="bg-background border border-border p-4 rounded-lg text-foreground text-sm whitespace-pre-wrap">
                                {f.findingDesc || 'Girilmemiş'}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-foreground mb-1.5">Risk (Olası Sonuçlar)</div>
                              <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-lg text-foreground text-sm whitespace-pre-wrap">
                                {f.riskDesc || 'Girilmemiş'}
                              </div>
                            </div>
                            {f.files && f.files.length > 0 && (
                              <div>
                                <div className="text-sm font-semibold text-foreground mb-1.5">Kanıt / Dokümanlar</div>
                                <div className="flex flex-wrap gap-3">
                                  {f.files.map((file, idx) => (
                                    <div key={idx} className="relative group rounded-md overflow-hidden border border-border">
                                      {file.type.startsWith('image/') ? (
                                        <img src={file.url} alt={file.name} className="w-32 h-32 object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(file.url)} />
                                      ) : (
                                        <div className="w-32 h-32 flex flex-col items-center justify-center bg-muted/40 text-muted-foreground p-2 text-center">
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
                              <div className="text-sm font-semibold text-foreground mb-1.5">Öneri / Aksiyon Planı</div>
                              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg text-foreground text-sm whitespace-pre-wrap">
                                {f.recommendation || 'Girilmemiş'}
                              </div>
                            </div>
                            {/* AKSİYON GEÇMİŞİ VE EKLENTİ FORMU */}
                            <div className="mt-6 border-t border-border pt-6">
                              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4 text-primary" />
                                  Aksiyon Geçmişi ve Yorumlar
                                  <Badge variant="secondary">{f.steps.length}</Badge>
                                </h3>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={activeActionFormId === f.id ? 'outline' : 'default'}
                                  onClick={() => setActiveActionFormId(activeActionFormId === f.id ? null : f.id)}
                                  className="gap-1.5"
                                >
                                  {activeActionFormId === f.id ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                  {activeActionFormId === f.id ? 'Vazgeç' : 'Aksiyon / Güncelleme Ekle'}
                                </Button>
                              </div>

                              {activeActionFormId === f.id && (
                                <div className="bg-muted/30 border border-border p-4 rounded-lg mb-6">
                                  <h4 className="font-semibold text-sm text-foreground mb-3">Yeni Aksiyon Ekle</h4>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Sorumlu Departman *</label>
                                        <select
                                          className="w-full h-9 px-3 bg-background border border-input rounded-md text-sm text-foreground"
                                          value={newAction.department}
                                          onChange={e => setNewAction({ ...newAction, department: e.target.value })}
                                        >
                                          <option value="">Seçiniz</option>
                                          {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Durum</label>
                                        <select
                                          className="w-full h-9 px-3 bg-background border border-input rounded-md text-sm text-foreground"
                                          value={newAction.status}
                                          onChange={e => setNewAction({ ...newAction, status: e.target.value as StepStatus })}
                                        >
                                          <option value="Başlamadı">Başlamadı</option>
                                          <option value="Devam Ediyor">Devam Ediyor</option>
                                          <option value="Tamamlandı">Tamamlandı</option>
                                          <option value="İptal Edildi">İptal Edildi</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">İşlem Tarihi</label>
                                        <Input
                                          type="date"
                                          value={newAction.actionDate}
                                          onChange={e => setNewAction({ ...newAction, actionDate: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Kanıt Dosyası</label>
                                        <label className="w-full h-9 px-3 flex items-center justify-center bg-background border border-input border-dashed rounded-md text-xs cursor-pointer hover:bg-muted/40">
                                          <Upload className="w-4 h-4 text-muted-foreground mr-2" />
                                          <span className="text-muted-foreground">{newAction.files?.length ? `${newAction.files.length} dosya seçildi` : 'Dosya Seç (Foto, PDF)'}</span>
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
                                                  setNewAction({ ...newAction, files: [...(newAction.files || []), ...uploaded] });
                                                } catch (err) {
                                                  console.error("Upload failed", err);
                                                  toast.error("Dosya yüklenemedi!");
                                                }
                                              }
                                            }}
                                          />
                                        </label>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-muted-foreground mb-1">Aksiyon Açıklaması *</label>
                                      <textarea
                                        className="w-full p-2.5 bg-background border border-input rounded-md text-sm text-foreground min-h-[80px]"
                                        placeholder="Yapılan veya yapılacak işlemleri açıklayın..."
                                        value={newAction.explanation}
                                        onChange={e => setNewAction({ ...newAction, explanation: e.target.value })}
                                      />
                                    </div>
                                    <div className="flex justify-end pt-1">
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => handleAddAction(f.id)}
                                        disabled={!newAction.department || !newAction.explanation}
                                      >
                                        Aksiyonu Ekle
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {f.steps.length > 0 ? (
                                <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pb-4 dark:border-slate-700 mt-4">
                                  {f.steps.map((step, idx) => (
                                    <div key={step.id} className="relative pl-6">
                                      {/* Timeline Node */}
                                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${step.status === 'Tamamlandı' ? 'bg-emerald-500' :
                                        step.status === 'İptal Edildi' ? 'bg-red-500' :
                                          step.status === 'Devam Ediyor' ? 'bg-blue-500' : 'bg-amber-500'
                                        }`}></div>

                                      <div className={`bg-white border p-4 rounded-xl shadow-sm dark:bg-slate-800 ${step.status === 'Tamamlandı' ? 'border-emerald-200 dark:border-emerald-900/50' :
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
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${step.status === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
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
                          <fieldset disabled={isPublished} className="space-y-5">
                            {isPublished && (
                              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 p-3.5 rounded-lg flex items-center gap-3 text-xs">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <p><strong>Bu rapor yayınlanmıştır.</strong> Bulgular üzerinde değişiklik yapılamaz.</p>
                              </div>
                            )}

                            {/* Form Başlığı + Denetim Havuzu Şablon Seçici */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
                              <h3 className="text-base font-bold tracking-tight text-foreground">
                                {activeFindingId ? 'Bulguyu Düzenle' : 'Yeni Bulgu Girişi'}
                              </h3>
                              {!isPublished && (
                                <FindingPoolPicker
                                  audits={audits}
                                  facilities={facilities}
                                  onApply={(picked, sourceLabel) => {
                                    const nextRisk = picked.risk || newFinding.risk;
                                    const nextTarget = nextRisk
                                      ? calculateTargetDate(nextRisk as RiskLevel, auditMeta.reportDate)
                                      : newFinding.targetDate;
                                    setNewFinding((prev) => ({
                                      ...prev,
                                      category: picked.category || prev.category,
                                      subcategory: picked.subcategory || prev.subcategory,
                                      findingDesc: picked.findingDesc,
                                      riskDesc: picked.riskDesc,
                                      recommendation: picked.recommendation,
                                      risk: nextRisk as RiskLevel,
                                      targetDate: nextTarget || prev.targetDate,
                                    }));
                                    if (picked.departments && picked.departments.length > 0) {
                                      setSelectedDepartments(picked.departments);
                                    }
                                    toast.success(`"${sourceLabel}" forma aktarıldı — dilediğiniz gibi özelleştirebilirsiniz.`);
                                  }}
                                  onPromoteToPool={(initial) => setPoolDialogInitial(initial)}
                                />
                              )}
                            </div>

                            {/* 1. LOKASYON SEÇİMİ (EN BAŞTA — Risk Modülü ile Aynı Kademeli + Yeni Birim/Mahal Kayıtlı Yapı) */}
                            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                              <LocationCascadingSelector
                                key={locationSelectorKey}
                                locations={globalLocations}
                                value={newFinding.locationId || ''}
                                disabled={isPublished}
                                onChange={(locId, _level, path) => {
                                  setSelectedLocationPath(path);
                                  const areaText = [path?.buildingName, path?.building, path?.floor, path?.department]
                                    .filter(Boolean)
                                    .join(' > ');
                                  setNewFinding((prev) => ({
                                    ...prev,
                                    locationId: locId,
                                    building: path?.building || path?.buildingName || '',
                                    floor: path?.floor || '',
                                    department: path?.department || '',
                                    room: path?.description || '',
                                    area: areaText || prev.area,
                                    subarea: path?.description || '',
                                  }));
                                }}
                              />
                            </div>

                            {/* 2. KATEGORİ SEÇİMİ (Aramalı Açılır Menüler) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">Ana Kategori *</label>
                                <SearchableSelect
                                  value={newFinding.mainCategory || ''}
                                  onChange={(val) =>
                                    setNewFinding({ ...newFinding, mainCategory: val, category: '', subcategory: '' })
                                  }
                                  options={globalCategories
                                    .filter((c) => !c.parentId)
                                    .map((c) => ({ value: c.name, label: c.name }))}
                                  placeholder="Ana kategori seçin..."
                                  searchPlaceholder="Ana kategori ara..."
                                  disabled={isPublished}
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">Kategori *</label>
                                <SearchableSelect
                                  value={newFinding.category || ''}
                                  onChange={(val) =>
                                    setNewFinding({ ...newFinding, category: val, subcategory: '' })
                                  }
                                  options={(() => {
                                    const parent = globalCategories.find(
                                      (c) => c.name === newFinding.mainCategory && !c.parentId
                                    );
                                    return parent
                                      ? globalCategories
                                        .filter((c) => c.parentId === parent.id)
                                        .map((c) => ({ value: c.name, label: c.name }))
                                      : [];
                                  })()}
                                  placeholder="Kategori seçin..."
                                  searchPlaceholder="Kategori ara..."
                                  disabled={isPublished || !newFinding.mainCategory}
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">Alt Kategori</label>
                                <SearchableSelect
                                  value={newFinding.subcategory || ''}
                                  onChange={(val) => setNewFinding({ ...newFinding, subcategory: val })}
                                  options={(() => {
                                    const parent = globalCategories.find(
                                      (c) => c.name === newFinding.category && c.parentId
                                    );
                                    return parent
                                      ? globalCategories
                                        .filter((c) => c.parentId === parent.id)
                                        .map((c) => ({ value: c.name, label: c.name }))
                                      : [];
                                  })()}
                                  placeholder="Alt kategori seçin..."
                                  searchPlaceholder="Alt kategori ara..."
                                  allowClear
                                  disabled={isPublished || !newFinding.category}
                                />
                              </div>
                            </div>

                            {/* 3. RİSK SEVİYESİ (Seçmeli Menü) + TERMİN + SORUMLU DEPARTMANLAR */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">Risk Seviyesi *</label>
                                <SearchableSelect
                                  value={newFinding.risk ? normalizeRiskLevel(newFinding.risk) : ''}
                                  onChange={(val) => {
                                    const r = val as RiskLevel;
                                    const targetD = r ? calculateTargetDate(r, auditMeta.reportDate) : '';
                                    setNewFinding({ ...newFinding, risk: r, targetDate: targetD });
                                  }}
                                  options={riskLevels.map((r) => ({
                                    value: r,
                                    label: r,
                                    dotColor: RISK_COLORS[r],
                                    sublabel: getRiskTermin(r),
                                  }))}
                                  placeholder="Risk seviyesi seçin..."
                                  showSearch={false}
                                  disabled={isPublished}
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">
                                  Termin Tarihi {newFinding.risk ? `(${getRiskTermin(newFinding.risk as RiskLevel)})` : ''}
                                </label>
                                <Input
                                  type="date"
                                  value={newFinding.targetDate || ''}
                                  onChange={(e) => setNewFinding({ ...newFinding, targetDate: e.target.value })}
                                  className="h-9 text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">
                                  Sorumlu Departmanlar
                                </label>
                                <DepartmentMultiSelect
                                  value={selectedDepartments}
                                  onChange={(next: string[]) => setSelectedDepartments(next)}
                                  mode="array"
                                  placeholder="Sorumlu departman seçin..."
                                  searchPlaceholder="Departman ara..."
                                  disabled={isPublished}
                                />
                              </div>
                            </div>

                            {/* 4. TESPİT, RİSK VE ÖNERİ */}
                            <div className="space-y-3.5">
                              <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5 flex justify-between items-center">
                                  <span>Tespit (Mevcut Durum) *</span>
                                  <button type="button" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-[11px]" title="Mikrofon ile dikte et">
                                    <Mic className="w-3.5 h-3.5" /> Dikte
                                  </button>
                                </label>
                                <textarea
                                  rows={3}
                                  className="w-full p-2.5 border border-input rounded-md bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  placeholder="Sahada tespit edilen uygunsuzluğu detaylıca açıklayın..."
                                  value={newFinding.findingDesc || ''}
                                  onChange={e => setNewFinding({ ...newFinding, findingDesc: e.target.value })}
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-semibold text-foreground mb-1.5">Risk (Etki ve Sonuçları)</label>
                                  <textarea
                                    rows={2}
                                    className="w-full p-2.5 border border-input rounded-md bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    placeholder="Olası kaza, zarar veya mevzuat riski..."
                                    value={newFinding.riskDesc || ''}
                                    onChange={e => setNewFinding({ ...newFinding, riskDesc: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-foreground mb-1.5">Öneri / Düzeltici Faaliyet</label>
                                  <textarea
                                    rows={2}
                                    className="w-full p-2.5 border border-input rounded-md bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    placeholder="Önerilen düzeltici faaliyet..."
                                    value={newFinding.recommendation || ''}
                                    onChange={e => setNewFinding({ ...newFinding, recommendation: e.target.value })}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* 5. FOTOĞRAF (Maks. 5, WebP, Lightbox) & DOKÜMAN YÜKLEME */}
                            <AuditMediaUploader
                              files={newFinding.files || []}
                              onChange={(nextFiles) => setNewFinding({ ...newFinding, files: nextFiles })}
                              facilityId={selectedFacility || undefined}
                              facilityName={facilities.find((f) => f.id === selectedFacility)?.name}
                              disabled={isPublished}
                            />
                          </fieldset>

                          <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 shrink-0 mt-5">
                            {isManager ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!newFinding.findingDesc?.trim()}
                                onClick={() =>
                                  setPoolDialogInitial({
                                    title: newFinding.category ? `${newFinding.category} — Standart Bulgu` : '',
                                    category: newFinding.category || newFinding.mainCategory || '',
                                    findingDesc: newFinding.findingDesc || '',
                                    riskDesc: newFinding.riskDesc || '',
                                    recommendation: newFinding.recommendation || '',
                                    defaultRisk: newFinding.risk ? normalizeRiskLevel(newFinding.risk) : 'Önemli',
                                    defaultDepartments: selectedDepartments,
                                  })
                                }
                                className="gap-1.5 text-xs"
                              >
                                <Database className="w-3.5 h-3.5 text-primary" />
                                Havuza Şablon Ekle
                              </Button>
                            ) : <div />}

                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setActiveFindingForm(null);
                                  setActiveFindingId(null);
                                  setSelectedLocationPath(null);
                                }}
                              >
                                İptal
                              </Button>

                              {!activeFindingId && (
                                <>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleSaveFinding('SAME_AREA')}
                                    disabled={!newFinding.findingDesc || !newFinding.risk || (!newFinding.area && !newFinding.building && !selectedLocationPath?.buildingName) || (!newFinding.category && !newFinding.mainCategory)}
                                  >
                                    Kaydet &amp; Aynı Mahalde Yeni
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleSaveFinding('NEW_AREA')}
                                    disabled={!newFinding.findingDesc || !newFinding.risk || (!newFinding.area && !newFinding.building && !selectedLocationPath?.buildingName) || (!newFinding.category && !newFinding.mainCategory)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    Kaydet &amp; Yeni Mahale Geç
                                  </Button>
                                </>
                              )}

                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleSaveFinding('CLOSE')}
                                disabled={!newFinding.findingDesc || !newFinding.risk || (!newFinding.area && !newFinding.building && !selectedLocationPath?.buildingName) || (!newFinding.category && !newFinding.mainCategory)}
                              >
                                {activeFindingId ? 'Değişiklikleri Kaydet' : 'Kaydet (Bitir)'}
                              </Button>
                            </div>
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
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 p-4 rounded-lg flex items-center gap-3 mb-6 text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p><strong>Bu rapor yayınlanmıştır.</strong> Analiz verileri değiştirilemez.</p>
                </div>
              )}
              <AnalysisTab findings={findings} auditMeta={auditMeta} setAuditMeta={setAuditMeta} />
            </fieldset>
          )}

          {activeTab === 'REPORT' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-4 rounded-lg border border-border no-print">
                <div>
                  <h2 className="text-base font-bold text-foreground">Rapor Önizleme, PDF ve Yayınlama</h2>
                  <p className="text-xs text-muted-foreground">
                    PDF çıktısı alabilir veya raporu yayınlayarak ilgili tesisin sayfasına otomatik düşmesini sağlayabilirsiniz.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
                    <Printer className="w-4 h-4" /> PDF İndir / Yazdır
                  </Button>
                  {isManager && !isPublished && (
                    <Button
                      size="sm"
                      onClick={() => handleSave(true)}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Check className="w-4 h-4" /> Yayınla ve Tesise Gönder
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-muted/40 p-4 rounded-lg border border-border overflow-x-auto flex justify-center no-print">
                <div className="w-[1000px] shadow-xl bg-white border border-border">
                  <ReportTemplate
                    ref={printRef}
                    findings={findings}
                    auditMeta={auditMeta}
                    facility={facilities.find((f) => f.id === auditMeta.locationId)}
                    logoUrl="https://raw.githubusercontent.com/metinsalik/self-agent/refs/heads/main/mlpcare.jpg"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SHADCN DIALOGS */}
      <Dialog open={Boolean(alertMsg)} onOpenChange={(open) => !open && setAlertMsg('')}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Uyarı</DialogTitle>
            <DialogDescription>{alertMsg}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" onClick={() => setAlertMsg('')}>
              Tamam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(confirmDialog)} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Onay</DialogTitle>
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
              Onayla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(promptDialog)} onOpenChange={(open) => !open && setPromptDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{promptDialog?.title}</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={promptVal}
            onChange={(e) => setPromptVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && promptDialog) {
                promptDialog.onSubmit(promptVal.trim());
                setPromptDialog(null);
              }
            }}
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => setPromptDialog(null)}>
              İptal
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (promptDialog) {
                  promptDialog.onSubmit(promptVal.trim());
                  setPromptDialog(null);
                }
              }}
            >
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PoolTemplateDialog
        open={Boolean(poolDialogInitial)}
        onClose={() => setPoolDialogInitial(null)}
        initialValues={poolDialogInitial || undefined}
        onSaved={() => setPoolDialogInitial(null)}
      />

      {previewImage && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setPreviewImage(null)}
              aria-label="Önizlemeyi kapat"
              className="absolute top-4 right-4 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
            <img
              src={previewImage}
              alt="Kanıt önizleme"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
