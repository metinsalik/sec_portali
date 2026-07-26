import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRenovationReport, createRenovationReport, updateRenovationReport } from '@/services/renovationReportApi';
import type { RenovationReportInput } from '@/types/renovationReport';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, Printer } from 'lucide-react';
import { toast } from 'sonner';

import StepProjectInfo from './wizard/StepProjectInfo';
import StepChecklist from './wizard/StepChecklist';
import StepTests from './wizard/StepTests';
import StepFindings from './wizard/StepFindings';
import StepEvaluation from './wizard/StepEvaluation';

interface Props {
  reportId: string | null;
  onCancel: () => void;
  onComplete: () => void;
}

const STEPS = [
  { id: 1, title: 'Proje Bilgileri' },
  { id: 2, title: 'İnceleme ve Uygunluk' },
  { id: 3, title: 'Test ve Sertifikalar' },
  { id: 4, title: 'Saha Bulguları' },
  { id: 5, title: 'Değerlendirme ve Sonuç' }
];

export default function RenovationReportWizard({ reportId, onCancel, onComplete }: Props) {
  const { currentFacility } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  
  const [facilityId, setFacilityId] = useState(localStorage.getItem('activeFacilityId') || '');

  useEffect(() => {
    const handleFacilityChange = () => {
      setFacilityId(localStorage.getItem('activeFacilityId') || '');
    };
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  const [formData, setFormData] = useState<Partial<RenovationReportInput>>({
    facilityId: localStorage.getItem('activeFacilityId') || '',
    projectName: '',
    location: '',
    startDate: null,
    endDate: null,
    controlledBy: '',
    assessmentDate: new Date().toISOString(),
    reportDate: new Date().toISOString(),
    status: 'DRAFT',
    checks: [],
    tests: [],
    certificates: [],
    findings: { intros: {}, items: [] },
    evaluation: {
      decision: 'GECICI_KABUL',
      signatures: {
        teknikHizmetler: { name: '', date: '' },
        idariIsler: { name: '', date: '' },
        sec: { name: '', date: '' },
        dizayn: { name: '', date: '' },
        hastaneIdari: { name: '', date: '' },
        yuklenici: { name: '', date: '' }
      }
    }
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, facilityId }));
  }, [facilityId]);

  const { data: existingReport, isLoading } = useQuery({
    queryKey: ['renovation-report', reportId],
    queryFn: () => getRenovationReport(reportId!),
    enabled: !!reportId
  });

  useEffect(() => {
    if (existingReport) {
      setFormData(existingReport as Partial<RenovationReportInput>);
    } else {
      // Setup initial default values
      const initialChecks = [
        { id: '1', field: 'Elektrik Tesisatı', scope: 'ADP, UPS, Panolar, prizler, aydınlatma, kaçak akım rölesi, topraklama vb.', status: 'DEGERLENDIRILMEDI' as const },
        { id: '2', field: 'Zayıf Akım Sistemleri', scope: 'Yangın algılama, hemşire çağrı, acil anons, kamera sistemleri', status: 'DEGERLENDIRILMEDI' as const },
        // ... (will be fully populated in StepChecklist component initialization)
      ];
      setFormData(prev => ({ ...prev, checks: initialChecks }));
    }
  }, [existingReport]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<RenovationReportInput>) => {
      if (reportId) {
        return updateRenovationReport(reportId, data);
      }
      return createRenovationReport(data as RenovationReportInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renovation-reports'] });
      toast.success('Rapor başarıyla kaydedildi');
    },
    onError: () => {
      toast.error('Rapor kaydedilirken bir hata oluştu');
    }
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) setCurrentStep(c => c + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleComplete = async () => {
    await saveMutation.mutateAsync({ ...formData, status: 'COMPLETED' });
    onComplete();
  };

  if (isLoading) {
    return <div className="p-12 text-center">Yükleniyor...</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-white dark:bg-slate-900 border-x">
      {/* Wizard Header */}
      <div className="border-b px-6 py-4 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
        <div>
          <h2 className="text-xl font-semibold">{reportId ? 'Raporu Düzenle' : 'Yeni Teslim Raporu'}</h2>
          <div className="flex gap-2 mt-2">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  currentStep === step.id ? 'bg-primary text-primary-foreground' : 
                  currentStep > step.id ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'
                }`}>
                  {step.id}
                </div>
                <span className={`text-sm hidden md:block ${currentStep === step.id ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                  {step.title}
                </span>
                {idx < STEPS.length - 1 && <div className="w-8 h-px bg-slate-300 dark:bg-slate-600 mx-1 hidden md:block" />}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>İptal</Button>
          <Button variant="secondary" onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            Taslak Kaydet
          </Button>
        </div>
      </div>

      {/* Wizard Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto pb-20">
          {currentStep === 1 && <StepProjectInfo data={formData} updateData={setFormData} />}
          {currentStep === 2 && <StepChecklist data={formData} updateData={setFormData} />}
          {currentStep === 3 && <StepTests data={formData} updateData={setFormData} />}
          {currentStep === 4 && <StepFindings data={formData} updateData={setFormData} />}
          {currentStep === 5 && <StepEvaluation data={formData} updateData={setFormData} />}
        </div>
      </div>

      {/* Wizard Footer */}
      <div className="border-t p-4 bg-white dark:bg-slate-900 flex justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentStep === 1} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Geri
        </Button>
        
        {currentStep < STEPS.length ? (
          <Button onClick={handleNext} className="gap-2">
            İleri <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={saveMutation.isPending} className="gap-2">
            <Save className="w-4 h-4" /> Raporu Tamamla
          </Button>
        )}
      </div>
    </div>
  );
}
