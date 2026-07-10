import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Save, Building2, MapPin, Users, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

import BasicInfoStep from './steps/BasicInfoStep';
import BuildingStep from './steps/BuildingStep';
import LocationsStep from './steps/LocationsStep';
import TeamStep from './steps/TeamStep';
import ModulesStep from './steps/ModulesStep';

const STEPS = [
  { id: 'basic', title: 'Temel Bilgiler', icon: Building2 },
  { id: 'building', title: 'Bina/Blok', icon: MapPin },
  { id: 'locations', title: 'Lokasyonlar', icon: MapPin },
  { id: 'team', title: 'Ekip', icon: Users },
  { id: 'modules', title: 'Modüller', icon: Settings },
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
    name: '',
    shortName: '',
    type: '',
    city: '',
    district: '',
    fullAddress: '',
    dangerClass: 'Az Tehlikeli',
    buildings: [],
    locations: [],
    assignments: [],
    modules: []
  });

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <div className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings/facilities')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">{isEditing ? 'Tesis Düzenle' : 'Yeni Tesis Sihirbazı'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === idx;
            const isPast = currentStep > idx;
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isActive ? 'bg-primary text-white' : isPast ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {idx < STEPS.length - 1 && <div className={`w-12 h-1 ${isPast ? 'bg-emerald-100' : 'bg-slate-100'}`} />}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 min-h-[500px] flex flex-col">
            <div className="flex-1">
              {currentStep === 0 && <BasicInfoStep data={formData} update={(d: any) => setFormData((p: any) => ({ ...p, ...d }))} />}
              {currentStep === 1 && <BuildingStep data={formData} update={(d: any) => setFormData((p: any) => ({ ...p, ...d }))} />}
              {currentStep === 2 && <LocationsStep data={formData} update={(d: any) => setFormData((p: any) => ({ ...p, ...d }))} />}
              {currentStep === 3 && <TeamStep data={formData} update={(d: any) => setFormData((p: any) => ({ ...p, ...d }))} />}
              {currentStep === 4 && <ModulesStep data={formData} update={(d: any) => setFormData((p: any) => ({ ...p, ...d }))} />}
            </div>
            
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>Geri</Button>
              {currentStep < STEPS.length - 1 ? (
                <Button onClick={handleNext}>İleri <ChevronRight className="w-4 h-4 ml-2" /></Button>
              ) : (
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Kaydediliyor...' : 'Tamamla ve Kaydet'} <Save className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
