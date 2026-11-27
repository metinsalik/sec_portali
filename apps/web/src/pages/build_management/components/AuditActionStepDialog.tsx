import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  FileText,
  Scale,
  ShoppingCart,
  HardHat,
  Package,
  Wrench,
  MoreHorizontal,
  Upload,
  X,
  Loader2,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  type Finding,
  type ActionStep,
  type StepStatus,
  type ImprovementStatus,
  type IRSCDepartment,
} from '../types';
import { uploadAuditFiles } from '../services/auditApi';

interface ActionTemplateField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number';
  placeholder?: string;
  required?: boolean;
}

interface ActionTemplate {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  suggestedStatus?: string;
  progressWeight?: number;
  sentenceTemplate?: string;
  fields?: ActionTemplateField[];
  isActive?: boolean;
}

interface ProcessChainStep {
  id: string;
  order: number;
  title: string;
  shortTitle: string;
  baseProgress: number;
  prerequisites: string[];
  requiresPrereqInputs?: boolean;
}

const PROCESS_CHAIN_MAP: Record<string, ProcessChainStep> = {
  TALEP_ACILDI: {
    id: 'TALEP_ACILDI',
    order: 1,
    title: 'Talep Açıldı',
    shortTitle: 'Talep Açıldı',
    baseProgress: 15,
    prerequisites: [],
  },
  IHALE_SURECINDE: {
    id: 'IHALE_SURECINDE',
    order: 2,
    title: 'İhale Sürecinde',
    shortTitle: 'İhale / Teklif',
    baseProgress: 30,
    prerequisites: ['Talep Açıldı'],
  },
  SS_VERILDI: {
    id: 'SS_VERILDI',
    order: 3,
    title: 'SS / Sipariş Verildi',
    shortTitle: 'SS Sipariş',
    baseProgress: 50,
    prerequisites: ['Talep Açıldı', 'İhale / Satınalma Onayı'],
    requiresPrereqInputs: true,
  },
  MALZEME_TEMINI: {
    id: 'MALZEME_TEMINI',
    order: 4,
    title: 'Malzeme Temini / Bekleniyor',
    shortTitle: 'Malzeme Temini',
    baseProgress: 65,
    prerequisites: ['Talep Açıldı', 'SS Sipariş Verildi'],
    requiresPrereqInputs: true,
  },
  FIRMA_BEKLENIYOR: {
    id: 'FIRMA_BEKLENIYOR',
    order: 5,
    title: 'Firma Sahaya Bekleniyor',
    shortTitle: 'Firma Bekleniyor',
    baseProgress: 70,
    prerequisites: ['Talep Açıldı', 'SS Sipariş Verildi', 'Randevu Alındı'],
    requiresPrereqInputs: true,
  },
  SAHA_CALISMASI: {
    id: 'SAHA_CALISMASI',
    order: 6,
    title: 'Saha Çalışması Devam Ediyor',
    shortTitle: 'Saha Çalışması',
    baseProgress: 80,
    prerequisites: ['Talep Açıldı', 'SS Sipariş Verildi', 'Firma Sahaya Giriş Yaptı'],
    requiresPrereqInputs: true,
  },
  TAMAMLANDI: {
    id: 'TAMAMLANDI',
    order: 7,
    title: 'Giderim & Test Tamamlandı',
    shortTitle: 'Giderim & Test',
    baseProgress: 100,
    prerequisites: ['Tüm Süreç Adımları ve Sahada İşlemler Tamamlandı'],
  },
  SAHA_KONTROL: {
    id: 'SAHA_KONTROL',
    order: 7,
    title: 'Sahada Kontrol Ettim & Kapat',
    shortTitle: 'Saha Doğrulama',
    baseProgress: 100,
    prerequisites: ['Denetçi Tarafından Sahada Yerinde Doğrulandı'],
  },
  YERINDE_KONTROL_YOK: {
    id: 'YERINDE_KONTROL_YOK',
    order: 0,
    title: 'Yerinde Kontrol: İlerleme Yok',
    shortTitle: 'İlerleme Yok',
    baseProgress: 0,
    prerequisites: [],
  },
  DIGER: {
    id: 'DIGER',
    order: 0,
    title: 'Diğer / Serbest Aksiyon',
    shortTitle: 'Serbest',
    baseProgress: 10,
    prerequisites: [],
  },
};

const CHAIN_STEPS_DISPLAY = [
  { id: 'TALEP_ACILDI', order: 1, shortTitle: '1. Talep', baseProgress: 15 },
  { id: 'IHALE_SURECINDE', order: 2, shortTitle: '2. İhale', baseProgress: 30 },
  { id: 'SS_VERILDI', order: 3, shortTitle: '3. SS Sipariş', baseProgress: 50 },
  { id: 'MALZEME_TEMINI', order: 4, shortTitle: '4. Malzeme', baseProgress: 65 },
  { id: 'FIRMA_BEKLENIYOR', order: 5, shortTitle: '5. Randevu', baseProgress: 70 },
  { id: 'SAHA_CALISMASI', order: 6, shortTitle: '6. Saha İşi', baseProgress: 80 },
  { id: 'TAMAMLANDI', order: 7, shortTitle: '7. Bitti', baseProgress: 100 },
];

const FALLBACK_TEMPLATES: ActionTemplate[] = [
  {
    id: 'SAHA_KONTROL',
    title: 'Sahada Kontrol Ettim & Kapat',
    description: 'Denetim sırasında yerinde kontrol edilip kapatıldı',
    icon: 'ShieldCheck',
    suggestedStatus: 'Tamamlandı',
    progressWeight: 100,
    sentenceTemplate:
      'Saha denetimi esnasında yerinde yapılan kontrol neticesinde uygunsuzluğun giderildiği tespit edilerek bulgu kapatılmıştır.',
    fields: [],
  },
  {
    id: 'YERINDE_KONTROL_YOK',
    title: 'Yerinde Kontrol: İlerleme Yok',
    description: 'Tekerrür tespiti: Sahada kontrol edildi, iyileştirme yapılmamış',
    icon: 'AlertTriangle',
    suggestedStatus: 'Başlamadı',
    progressWeight: 0,
    sentenceTemplate:
      '{tarih} tarihinde sahada yapılan yerinde kontrolde söz konusu uygunsuzluğa yönelik henüz bir iyileştirme/aksiyon alınmadığı tespit edilmiştir.',
    fields: [
      { key: 'tarih', label: 'Kontrol Tarihi', type: 'date' },
    ],
  },
  {
    id: 'TALEP_ACILDI',
    title: 'Talep Açıldı',
    icon: 'FileText',
    suggestedStatus: 'Devam Ediyor',
    progressWeight: 15,
    sentenceTemplate: '{tarih} tarihinde #{talepNo} nolu satınalma / iş talebi oluşturulmuştur.',
    fields: [
      { key: 'talepNo', label: 'Talep No', type: 'text', placeholder: 'Örn: 2026-9481' },
      { key: 'tarih', label: 'Talep Tarihi', type: 'date' },
    ],
  },
  {
    id: 'SS_VERILDI',
    title: 'SS / Sipariş Verildi',
    icon: 'ShoppingCart',
    suggestedStatus: 'Devam Ediyor',
    progressWeight: 50,
    fields: [
      { key: 'firma', label: 'Yüklenici Firma', type: 'text', placeholder: 'Firma adı' },
      { key: 'siparisNo', label: 'SS / Sipariş No', type: 'text', placeholder: 'Örn: SS-4021' },
      { key: 'siparisTarihi', label: 'Sipariş Tarihi', type: 'date' },
    ],
  },
  {
    id: 'SAHA_CALISMASI',
    title: 'Saha Çalışması Devam Ediyor',
    icon: 'Wrench',
    suggestedStatus: 'Devam Ediyor',
    progressWeight: 80,
    fields: [
      { key: 'ekip', label: 'Çalışan Ekip / Firma', type: 'text', placeholder: 'Örn: Teknik Servis' },
      { key: 'yapilanIslem', label: 'Yapılan Çalışma', type: 'text', placeholder: 'Örn: Montaj ve test' },
    ],
  },
  {
    id: 'TAMAMLANDI',
    title: 'Giderim & Test Tamamlandı',
    icon: 'CheckCircle2',
    suggestedStatus: 'Tamamlandı',
    progressWeight: 100,
    sentenceTemplate:
      'Tespit edilen uygunsuzluk giderilmiş, gerekli saha kontrolleri ve testler tamamlanmıştır.',
    fields: [],
  },
  {
    id: 'DIGER',
    title: 'Diğer / Serbest Aksiyon',
    icon: 'MoreHorizontal',
    suggestedStatus: 'Devam Ediyor',
    progressWeight: 10,
    sentenceTemplate: '',
    fields: [],
  },
];

function parseExistingChainInfo(steps?: ActionStep[]) {
  const joined = (steps || []).map((s) => s.explanation || '').join(' ');
  if (!joined) return { talepNo: '', siparisNo: '' };
  const talepMatch = joined.match(/(?:Talep\s*(?:No|Numaras[ıi])?[:#\s]*)([A-Za-z0-9_-]+)/i);
  const ssMatch = joined.match(/(?:SS|Sipari[şs])\s*(?:No|Numaras[ıi])?[:#\s]*([A-Za-z0-9_-]+)/i);
  return {
    talepNo: talepMatch ? talepMatch[1] : '',
    siparisNo: ssMatch ? ssMatch[1] : '',
  };
}

interface AuditActionStepDialogProps {
  open: boolean;
  finding: Finding | null;
  departments: IRSCDepartment[];
  facilityId?: string;
  facilityName?: string;
  defaultTemplateId?: string;
  saving?: boolean;
  onClose: () => void;
  onSaveStep: (
    findingId: string,
    step: ActionStep,
    nextFindingStatus: ImprovementStatus,
    nextProgress: number
  ) => Promise<void> | void;
}

export function AuditActionStepDialog({
  open,
  finding,
  departments,
  facilityId,
  facilityName,
  defaultTemplateId,
  saving = false,
  onClose,
  onSaveStep,
}: AuditActionStepDialogProps) {
  const { user } = useAuth();

  const existingChain = useMemo(
    () => parseExistingChainInfo(finding?.steps),
    [finding?.steps]
  );

  const defaultDept = useMemo(() => {
    if (!finding) return '';
    if (finding.departments && finding.departments.length > 0) return finding.departments[0];
    if (finding.steps && finding.steps.length > 0) {
      return finding.steps[finding.steps.length - 1].department || '';
    }
    return departments[0]?.name || 'Teknik Servis';
  }, [finding, departments]);

  const [templates, setTemplates] = useState<ActionTemplate[]>(FALLBACK_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    defaultTemplateId || 'SAHA_KONTROL'
  );
  const [department, setDepartment] = useState<string>(defaultDept);
  const [actionDate, setActionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<StepStatus>('Tamamlandı');
  const [stepFields, setStepFields] = useState<Record<string, any>>({});
  const [customRemark, setCustomRemark] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [customProgress, setCustomProgress] = useState<number | null>(null);
  const [files, setFiles] = useState<{ name: string; url: string; type: string }[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // İyileştirme Modülü ile birebir aynı şablonları çek (+ Saha Kontrol şablonunu en başa ekle)
  useEffect(() => {
    let mounted = true;
    const loadTemplates = async () => {
      try {
        const res = await api.get('/operations/improvements/action-templates');
        if (res.ok) {
          const d = await res.json();
          if (mounted && d?.success && Array.isArray(d.data) && d.data.length > 0) {
            const activeList = d.data.filter((t: any) => t.isActive !== false);
            const sahaKontrolTpl = FALLBACK_TEMPLATES[0];
            const yerindeYokTpl = FALLBACK_TEMPLATES[1];
            const merged = [
              sahaKontrolTpl,
              yerindeYokTpl,
              ...activeList.filter(
                (t: any) => t.id !== 'SAHA_KONTROL' && t.id !== 'YERINDE_KONTROL_YOK'
              ),
            ];
            setTemplates(merged);
          }
        }
      } catch {
        // Fallback templates stay active
      }
    };
    loadTemplates();
    return () => {
      mounted = false;
    };
  }, []);

  // Modal açıldığında state'i sıfırla
  useEffect(() => {
    if (!open || !finding) return;
    const initTplId =
      defaultTemplateId ||
      (finding.isCarryover ? 'SAHA_KONTROL' : 'TALEP_ACILDI');
    setSelectedTemplateId(initTplId);
    setDepartment(defaultDept);
    setActionDate(new Date().toISOString().split('T')[0]);
    setStatus(
      initTplId === 'SAHA_KONTROL' || initTplId === 'TAMAMLANDI'
        ? 'Tamamlandı'
        : initTplId === 'YERINDE_KONTROL_YOK'
          ? 'Başlamadı'
          : 'Devam Ediyor'
    );
    setStepFields({
      talepNo: existingChain.talepNo || '',
      siparisNo: existingChain.siparisNo || '',
      tarih: new Date().toISOString().split('T')[0],
      siparisTarihi: new Date().toISOString().split('T')[0],
      beklenenTarih: new Date().toISOString().split('T')[0],
      tamamlanmaTarihi: new Date().toISOString().split('T')[0],
    });
    setCustomRemark('');
    setCustomProgress(null);
    setFiles([]);
  }, [open, finding?.id, defaultTemplateId, defaultDept, existingChain.talepNo, existingChain.siparisNo]);

  const activeTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const activeChainStep =
    PROCESS_CHAIN_MAP[selectedTemplateId] || PROCESS_CHAIN_MAP.DIGER;

  const baseProgress = useMemo(() => {
    if (!finding) return 0;
    if (finding.status === 'Tamamlanan') return 100;
    const stepMax = (finding.steps || []).reduce(
      (m, s) => Math.max(m, Number(s.progress) || 0),
      0
    );
    return Math.max(Number(finding.progress) || 0, stepMax);
  }, [finding]);

  const isNoProgressCheck = selectedTemplateId === 'YERINDE_KONTROL_YOK';
  const isCompletionStep =
    status === 'Tamamlandı' ||
    selectedTemplateId === 'TAMAMLANDI' ||
    selectedTemplateId === 'SAHA_KONTROL';
  const isNotStartedStep = status === 'Başlamadı' || isNoProgressCheck;

  let calcAdded = 0;
  let calcProgress = baseProgress;

  if (isCompletionStep) {
    calcProgress = 100;
    calcAdded = Math.max(0, 100 - baseProgress);
  } else if (isNoProgressCheck) {
    calcProgress = baseProgress;
    calcAdded = 0;
  } else if (isNotStartedStep) {
    calcProgress = 0;
    calcAdded = 0;
  } else if (customProgress !== null) {
    calcProgress = customProgress;
    calcAdded = Math.max(0, customProgress - baseProgress);
  } else if (activeChainStep && activeChainStep.baseProgress > 0) {
    if (baseProgress < activeChainStep.baseProgress) {
      calcProgress = activeChainStep.baseProgress;
      calcAdded = activeChainStep.baseProgress - baseProgress;
    } else {
      const weight = activeTemplate?.progressWeight ?? 10;
      calcAdded = weight;
      calcProgress = Math.min(99, baseProgress + weight);
    }
  } else {
    const weight = activeTemplate?.progressWeight ?? 10;
    calcAdded = weight;
    calcProgress = Math.min(99, baseProgress + weight);
  }

  // İyileştirme Modülü ile birebir aynı şablon cümlesi üretimi
  useEffect(() => {
    if (!activeTemplate) return;
    let sentence = '';

    if (selectedTemplateId === 'SAHA_KONTROL') {
      sentence =
        'Saha denetimi esnasında yerinde yapılan kontrol neticesinde uygunsuzluğun giderildiği tespit edilerek bulgu kapatılmıştır.';
    } else if (selectedTemplateId === 'YERINDE_KONTROL_YOK') {
      const checkDateStr = stepFields.tarih
        ? new Date(stepFields.tarih).toLocaleDateString('tr-TR')
        : new Date(actionDate || Date.now()).toLocaleDateString('tr-TR');
      sentence = `${checkDateStr} tarihinde sahada yapılan yerinde kontrolde söz konusu uygunsuzluğa yönelik henüz bir iyileştirme/aksiyon alınmadığı tespit edilmiştir.`;
    } else if (selectedTemplateId === 'SAHA_CALISMASI') {
      const ekipStr = (stepFields.ekip || '').trim() || 'Yetkili ekip / firma';
      const islemStr =
        (stepFields.yapilanIslem || '').trim() || 'fiziki montaj ve onarım çalışmaları';
      const talepStr = (stepFields.talepNo || '').trim();
      const ssStr = (stepFields.siparisNo || '').trim();

      let refPrefix = '';
      if (talepStr && ssStr) {
        refPrefix = `Talep No: #${talepStr} ve SS No: #${ssStr} siparişi kapsamında; `;
      } else if (talepStr) {
        refPrefix = `Talep No: #${talepStr} kapsamında; `;
      } else if (ssStr) {
        refPrefix = `SS No: #${ssStr} siparişi kapsamında; `;
      }
      sentence = `${refPrefix}${ekipStr} tarafından sahada fiziki çalışma başlatılmış olup işlemler devam etmektedir. Yapılan çalışma: ${islemStr}.`;
    } else if (selectedTemplateId === 'SS_VERILDI') {
      const firmaStr = (stepFields.firma || '').trim() || 'ilgili yüklenici';
      const ssStr = (stepFields.siparisNo || '').trim() || 'SS-Belirleniyor';
      const talepStr = (stepFields.talepNo || '').trim();
      const dateStr = stepFields.siparisTarihi
        ? new Date(stepFields.siparisTarihi).toLocaleDateString('tr-TR')
        : '';
      const refPrefix = talepStr ? `Talep No: #${talepStr} kapsamında; ` : '';
      const datePart = dateStr ? `${dateStr} tarihinde ` : '';
      sentence = `${refPrefix}${datePart}${firmaStr} firmasına #${ssStr} nolu satınalma siparişi (SS) iletilmiştir.`;
    } else if (selectedTemplateId === 'FIRMA_BEKLENIYOR') {
      const firmaStr = (stepFields.firma || '').trim() || 'Yüklenici firma';
      const beklenenStr = stepFields.beklenenTarih
        ? new Date(stepFields.beklenenTarih).toLocaleDateString('tr-TR')
        : 'belirlenen tarihte';
      const talepStr = (stepFields.talepNo || '').trim();
      const ssStr = (stepFields.siparisNo || '').trim();
      let refPrefix = '';
      if (talepStr && ssStr) {
        refPrefix = `Talep No: #${talepStr}, SS No: #${ssStr} siparişi kapsamında; `;
      } else if (ssStr) {
        refPrefix = `SS No: #${ssStr} siparişi kapsamında; `;
      } else if (talepStr) {
        refPrefix = `Talep No: #${talepStr} kapsamında; `;
      }
      sentence = `${refPrefix}${firmaStr} firması ile mutabakat sağlanmış olup, ${beklenenStr} tarihinde sahada müdahaleye başlaması beklenmektedir.`;
    } else {
      sentence = activeTemplate.sentenceTemplate || '';
      if (activeTemplate.fields) {
        activeTemplate.fields.forEach((f) => {
          const val = stepFields[f.key];
          const strVal =
            val !== undefined && val !== null && String(val).trim() !== ''
              ? f.type === 'date'
                ? new Date(val).toLocaleDateString('tr-TR')
                : String(val).trim()
              : '';
          sentence = sentence.replace(new RegExp(`\\{${f.key}\\}`, 'g'), strVal);
        });
      }
      sentence = sentence.replace(/\{[a-zA-Z0-9_-]+\}/g, '').replace(/\s+/g, ' ').trim();
    }

    if (customRemark.trim()) {
      sentence = sentence ? `${sentence} (Not: ${customRemark.trim()})` : customRemark.trim();
    }
    setExplanation(sentence);
  }, [selectedTemplateId, stepFields, customRemark, activeTemplate]);

  const handleSelectTemplate = (tpl: ActionTemplate) => {
    setSelectedTemplateId(tpl.id);
    if (tpl.id === 'TAMAMLANDI' || tpl.id === 'SAHA_KONTROL') {
      setStatus('Tamamlandı');
    } else if (tpl.suggestedStatus) {
      setStatus(tpl.suggestedStatus as StepStatus);
    } else {
      setStatus('Devam Ediyor');
    }
    setCustomProgress(null);

    const nextFields: Record<string, any> = {
      ...stepFields,
      talepNo: stepFields.talepNo || existingChain.talepNo || '',
      siparisNo: stepFields.siparisNo || existingChain.siparisNo || '',
    };
    if (tpl.fields) {
      tpl.fields.forEach((f) => {
        if (f.type === 'date' && !nextFields[f.key]) {
          nextFields[f.key] = new Date().toISOString().split('T')[0];
        } else if (nextFields[f.key] === undefined) {
          nextFields[f.key] = '';
        }
      });
    }
    setStepFields(nextFields);
  };

  const getStepIcon = (iconName?: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'FileText':
        return <FileText className="w-3.5 h-3.5" />;
      case 'Scale':
        return <Scale className="w-3.5 h-3.5" />;
      case 'ShoppingCart':
        return <ShoppingCart className="w-3.5 h-3.5" />;
      case 'HardHat':
        return <HardHat className="w-3.5 h-3.5" />;
      case 'Package':
        return <Package className="w-3.5 h-3.5" />;
      case 'Wrench':
        return <Wrench className="w-3.5 h-3.5" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'AlertTriangle':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      default:
        return <MoreHorizontal className="w-3.5 h-3.5" />;
    }
  };

  if (!finding) return null;

  const actorFullName = user?.fullName || user?.username || 'Yetkili Kullanıcı';
  const actorTitle = (user as any)?.title || (user?.isAdmin ? 'Sistem Yöneticisi' : 'Denetçi / Uzman');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explanation.trim() && files.length === 0) {
      toast.error('Lütfen bir aksiyon açıklaması girin veya kanıt görseli ekleyin.');
      return;
    }

    const finalDept = department.trim() || defaultDept || 'İlgili Birim';
    const finalStepStatus: StepStatus = isCompletionStep ? 'Tamamlandı' : status;

    const newStep: ActionStep = {
      id:
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `step_${Date.now()}`,
      department: finalDept,
      order: (finding.steps?.length || 0) + 1,
      status: finalStepStatus,
      actionDate: actionDate || new Date().toISOString().split('T')[0],
      completedAt:
        finalStepStatus === 'Tamamlandı'
          ? actionDate || new Date().toISOString().split('T')[0]
          : undefined,
      title: activeTemplate?.title || 'Aksiyon Güncellemesi',
      explanation: explanation.trim(),
      stepType: activeTemplate?.id || 'DIGER',
      progress: calcProgress,
      progressAdded: calcAdded,
      performedBy: user?.username || null,
      performedByName: actorFullName,
      performedByTitle: actorTitle,
      files,
    };

    const nextFindingStatus: ImprovementStatus =
      finalStepStatus === 'Tamamlandı'
        ? 'Tamamlanan'
        : isNoProgressCheck
          ? finding.status
          : finalStepStatus === 'Devam Ediyor'
            ? 'Kısmen İyileştirilen'
            : finding.status;

    await onSaveStep(finding.id, newStep, nextFindingStatus, calcProgress);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !saving && onClose()}>
      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] rounded-lg border border-border bg-card p-0 overflow-hidden shadow-lg flex flex-col gap-0">
        <DialogHeader className="px-5 py-3.5 bg-muted/30 border-b border-border shrink-0">
          <div className="flex items-center gap-3 pr-8">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                Süreç Adımı &amp; Aksiyon Girişi
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate mt-0.5">
                {finding.no} • {finding.area || 'Mahal'} — İyileştirme Modülü ile tam uyumlu süreç kaydı
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* İlgili Tespit Özeti */}
            <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground block">
                İlgili Bulgu Tespiti:
              </span>
              <p className="text-foreground line-clamp-2 leading-relaxed">
                "{finding.findingDesc}"
              </p>
            </div>

            {/* 7 Aşamalı Süreç Zinciri */}
            <div className="p-3 bg-muted/20 border border-border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Aksiyon Süreç Zinciri (Kademeli İlerleme)
                </span>
                <Badge
                  variant="outline"
                  className="tabular-nums text-[10px] bg-primary/10 text-primary border-primary/20 font-semibold"
                >
                  Aşama: {activeChainStep.shortTitle} (%{calcProgress})
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1">
                {CHAIN_STEPS_DISPLAY.map((step) => {
                  const isPast = activeChainStep && activeChainStep.order > step.order;
                  const isCurrent = activeChainStep && activeChainStep.order === step.order;
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        'p-1.5 rounded-lg border text-[10px] flex flex-col justify-between select-none',
                        isCurrent
                          ? 'bg-primary text-primary-foreground font-semibold border-primary'
                          : isPast
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 font-medium'
                            : 'bg-background text-muted-foreground/70 border-border'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="tabular-nums text-[9px] opacity-80">
                          %{step.baseProgress}
                        </span>
                        {isPast && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                      <span className="truncate block font-semibold mt-0.5">
                        {step.shortTitle}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Şablon Seçimi */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                1. Aksiyon Kalıbını / Aşamasını Seçin
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {templates.map((tpl) => {
                  const isSelected = selectedTemplateId === tpl.id;
                  const isDone = tpl.id === 'TAMAMLANDI' || tpl.id === 'SAHA_KONTROL';
                  const chainItem = PROCESS_CHAIN_MAP[tpl.id];
                  const pct = chainItem?.baseProgress ?? tpl.progressWeight;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className={cn(
                        'p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer',
                        isSelected
                          ? 'bg-primary/10 border-primary ring-1 ring-primary text-foreground font-semibold'
                          : 'bg-card border-border hover:bg-muted/40 text-muted-foreground'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div
                          className={cn(
                            'w-6 h-6 rounded-md flex items-center justify-center',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {getStepIcon(tpl.icon)}
                        </div>
                        <span
                          className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded border tabular-nums',
                            isDone
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                              : tpl.id === 'DIGER'
                                ? 'bg-muted text-muted-foreground border-border'
                                : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30'
                          )}
                        >
                          {tpl.id === 'DIGER' ? 'Serbest' : `%${pct}`}
                        </span>
                      </div>
                      <span className="text-xs truncate block font-medium leading-tight">
                        {tpl.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Yüzdelik İlerleme Çubuğu */}
            <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">İlerleme:</span>
                  <span className="text-muted-foreground tabular-nums">
                    Mevcut: <strong className="text-foreground">%{baseProgress}</strong>
                  </span>
                  {calcAdded > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                      (+%{calcAdded})
                    </span>
                  )}
                </div>
                <Badge
                  className={cn(
                    'tabular-nums text-xs',
                    calcProgress === 100
                      ? 'bg-emerald-600 text-white'
                      : 'bg-primary text-primary-foreground'
                  )}
                >
                  Hedef: %{calcProgress}
                </Badge>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${Math.min(100, baseProgress)}%` }}
                />
                {calcAdded > 0 && (
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${Math.min(100 - baseProgress, calcAdded)}%` }}
                  />
                )}
              </div>
              <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                <div className="flex items-center gap-1 flex-wrap">
                  {[25, 50, 70, 85, 100].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setCustomProgress(p);
                        if (p === 100) setStatus('Tamamlandı');
                        else setStatus('Devam Ediyor');
                      }}
                      className={cn(
                        'px-2 py-0.5 rounded border text-[10px] tabular-nums font-semibold cursor-pointer',
                        calcProgress === p
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:bg-muted'
                      )}
                    >
                      %{p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sorumlu Birim, Durum ve Tarih */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground block">
                  Sorumlu Birim *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-border bg-background text-foreground text-xs outline-none"
                >
                  <option value="">Birim seçin...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                  {department &&
                    !departments.some((d) => d.name === department) && (
                      <option value={department}>{department}</option>
                    )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground block">Durum</label>
                <select
                  value={isCompletionStep ? 'Tamamlandı' : status}
                  onChange={(e) => {
                    const st = e.target.value as StepStatus;
                    setStatus(st);
                    if (st === 'Tamamlandı') setCustomProgress(100);
                  }}
                  className="w-full h-9 px-2.5 rounded-lg border border-border bg-background text-foreground text-xs outline-none"
                >
                  <option value="Devam Ediyor">Devam Ediyor</option>
                  <option value="Tamamlandı">Tamamlandı</option>
                  <option value="Başlamadı">Başlamadı</option>
                  <option value="İptal Edildi">İptal Edildi</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground block">
                  İşlem Tarihi *
                </label>
                <Input
                  type="date"
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                  className="h-9 rounded-lg text-xs tabular-nums"
                  required
                />
              </div>
            </div>

            {/* Şablona Özel Dinamik Alanlar (Talep No, SS No, Firma vb.) */}
            {activeChainStep.requiresPrereqInputs && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/25">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground block">
                    Satınalma Talep No (Varsa)
                  </label>
                  <Input
                    value={stepFields.talepNo || ''}
                    onChange={(e) =>
                      setStepFields({ ...stepFields, talepNo: e.target.value })
                    }
                    placeholder="Örn: 2026-9481"
                    className="h-8 rounded-lg text-xs bg-background tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground block">
                    SS / Sipariş No (Varsa)
                  </label>
                  <Input
                    value={stepFields.siparisNo || ''}
                    onChange={(e) =>
                      setStepFields({ ...stepFields, siparisNo: e.target.value })
                    }
                    placeholder="Örn: SS-4021"
                    className="h-8 rounded-lg text-xs bg-background tabular-nums"
                  />
                </div>
              </div>
            )}

            {activeTemplate?.fields && activeTemplate.fields.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTemplate.fields
                  .filter(
                    (f) =>
                      !activeChainStep.requiresPrereqInputs ||
                      (f.key !== 'talepNo' && f.key !== 'siparisNo')
                  )
                  .map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground block">
                        {field.label}
                      </label>
                      <Input
                        type={field.type === 'date' ? 'date' : 'text'}
                        value={stepFields[field.key] || ''}
                        onChange={(e) =>
                          setStepFields({ ...stepFields, [field.key]: e.target.value })
                        }
                        placeholder={field.placeholder || ''}
                        className="h-8 rounded-lg text-xs"
                      />
                    </div>
                  ))}
              </div>
            )}

            {/* Ek Not & Oluşan Şablon Cümlesi */}
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground block">
                  Ek Açıklama / Saha Notu (İsteğe Bağlı)
                </label>
                <Input
                  value={customRemark}
                  onChange={(e) => setCustomRemark(e.target.value)}
                  placeholder="Şablon cümleye eklenecek özel not..."
                  className="h-8 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground block">
                  Kaydedilecek Aksiyon Açıklaması *
                </label>
                <textarea
                  rows={3}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Yapılan işlemi veya saha kontrol sonucunu yazın..."
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>
            </div>

            {/* Kanıt Fotoğrafları ve Belgeler */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">
                  Kanıt Görseli / Kapanış Fotoğrafı (İsteğe Bağlı)
                </label>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border bg-muted/30 hover:bg-muted/60 text-xs font-medium cursor-pointer transition-colors">
                  {uploadingFiles ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-primary" />
                  )}
                  <span>Fotoğraf / PDF Yükle</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                    disabled={uploadingFiles}
                    onChange={async (e) => {
                      if (!e.target.files?.length) return;
                      setUploadingFiles(true);
                      try {
                        const uploaded = await uploadAuditFiles(
                          Array.from(e.target.files),
                          facilityId,
                          facilityName
                        );
                        setFiles((prev) => [...prev, ...uploaded]);
                        toast.success(`${uploaded.length} dosya eklendi.`);
                      } catch {
                        toast.error('Dosya yüklenemedi.');
                      } finally {
                        setUploadingFiles(false);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              </div>

              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {files.map((f, idx) => (
                    <div
                      key={idx}
                      className="relative group w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted"
                    >
                      {f.type?.startsWith('image/') ? (
                        <img
                          src={f.url}
                          alt={f.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center text-[10px]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kaydeden Kullanıcı Bilgisi */}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/20 px-3 py-2 rounded-lg border border-border/60">
              <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>
                İşlemi Kaydeden:{' '}
                <strong className="text-foreground">{actorFullName}</strong>
                {actorTitle ? ` (${actorTitle})` : ''}
              </span>
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-3.5 bg-muted/30 border-t border-border shrink-0 gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
              className="h-8 rounded-lg text-xs"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving || uploadingFiles}
              className={cn(
                'h-8 px-4 rounded-lg text-xs font-semibold gap-1.5',
                isCompletionStep && 'bg-emerald-600 hover:bg-emerald-700 text-white'
              )}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isCompletionStep ? 'Onayla ve Bulguyu Kapat' : 'Aksiyon Adımını Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
