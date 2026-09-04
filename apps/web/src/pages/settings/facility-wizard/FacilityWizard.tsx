import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Save, Building2, MapPin, Users, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

import BasicInfoStep from './steps/BasicInfoStep';
import BuildingStep from './steps/BuildingStep';
import TeamStep from './steps/TeamStep';
import ModulesStep from './steps/ModulesStep';

const STEPS = [
  { id: 'basic', title: 'Temel & Kurumsal Bilgiler', icon: Building2 },
  { id: 'building', title: 'Bina & Blok Özellikleri', icon: MapPin },
  { id: 'team', title: 'Uzman Ekip', icon: Users },
  { id: 'modules', title: 'Modüller & Yetkiler', icon: Settings },
];

export default function FacilityWizardPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [searchParams] = useSearchParams();
  const initialStep = parseInt(searchParams.get("step") || "0", 10);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState<any>({
    id: '',
    name: '',
    shortName: '',
    type: '',
    city: '',
    district: '',
    fullAddress: '',
    dangerClass: 'Az Tehlikeli',
    commercialTitle: '',
    taxOffice: '',
    taxNumber: '',
    sgkNumber: '',
    naceCode: '',
    employeeCount: 0,
    logoUrl: '',
    buildings: [],
    assignments: [],
    modules: []
  });

  const { data: facilitiesList } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !isEditing
  });

  useEffect(() => {
    if (!isEditing && !formData.id && facilitiesList && facilitiesList.length >= 0) {
      const nextNum = facilitiesList.length + 1;
      setFormData((prev: any) => ({
        ...prev,
        id: `TES-${nextNum.toString().padStart(3, '0')}`
      }));
    }
  }, [isEditing, facilitiesList, formData.id]);

  const { data: facility, isLoading } = useQuery({
    queryKey: ['facility', id],
    queryFn: async () => {
      const res = await api.get(`/settings/facilities/${id}`);
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
    enabled: isEditing
  });

  useEffect(() => {
    if (facility) {
      setFormData((prev: any) => ({ ...prev, ...facility }));
    }
  }, [facility]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        return api.put(`/settings/facilities/${id}`, data);
      } else {
        return api.post('/settings/facilities', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      navigate('/settings/facilities');
    }
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(s => s + 1);
  };
  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };
  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) return <div>Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 animate-in fade-in duration-300">
      {/* Wizard Top Bar */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border/60 px-6 py-3.5 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate('/settings/facilities')}
              className="h-9 w-9 rounded-xl border-border/80 hover:bg-muted"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-base font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                {isEditing ? 'Tesis Bilgilerini Düzenle' : 'Yeni Tesis Kurulum Sihirbazı'}
              </h1>
              <p className="text-[11px] text-muted-foreground">
                {formData.name ? formData.name : 'Yeni Kurumsal Tesis Kaydı'} {formData.id && `(${formData.id})`}
              </p>
            </div>
          </div>

          {/* Stepper Pill Indicators */}
          <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-2xl border border-border/50">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === idx;
              const isPast = currentStep > idx;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                    isActive && "bg-primary text-primary-foreground shadow-xs shadow-primary/20",
                    isPast && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
                    !isActive && !isPast && "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="border-border/60 rounded-3xl p-6 sm:p-8 shadow-xs bg-card">
            {currentStep === 0 && <BasicInfoStep data={formData} update={(d: any) => setFormData((p: any) => ({ ...p, ...d }))} />}
            {currentStep === 1 && <BuildingStep data={formData} update={(d: any) => setFormData((p: any) => ({ ...p, ...d }))} />}
            {currentStep === 2 && <TeamStep data={formData} update={(d: any) => setFormData((p: any) => ({ ...p, ...d }))} />}
            {currentStep === 3 && <ModulesStep data={formData} update={(d: any) => setFormData((p: any) => ({ ...p, ...d }))} />}
          </Card>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={currentStep === 0}
              onClick={handlePrev}
              className="h-10 px-5 text-xs font-semibold rounded-xl gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Önceki Adım
            </Button>

            <div className="flex items-center gap-3">
              {currentStep < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="h-10 px-6 text-xs font-semibold rounded-xl gap-2 bg-primary hover:bg-primary/90 shadow-sm"
                >
                  Sonraki Adım <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="h-10 px-7 text-xs font-bold rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Kurulumu Tamamla ve Kaydet
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
