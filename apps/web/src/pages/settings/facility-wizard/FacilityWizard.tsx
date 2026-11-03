import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Building2, 
  MapPin, 
  Users, 
  Settings, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import BasicInfoStep from './steps/BasicInfoStep';
import BuildingStep from './steps/BuildingStep';
import LocationsStep from './steps/LocationsStep';
import TeamStep from './steps/TeamStep';
import ModulesStep from './steps/ModulesStep';

const STEPS = [
  { id: 'basic', title: '1. Temel Bilgiler', icon: Building2 },
  { id: 'building', title: '2. Bina & Bloklar', icon: Building },
  { id: 'locations', title: '3. Lokasyon Yapısı', icon: MapPin },
  { id: 'team', title: '4. Uzman Ekip Atamaları', icon: Users },
  { id: 'modules', title: '5. Modül Yetkileri', icon: Settings },
];

export default function FacilityWizardPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [searchParams] = useSearchParams();
  const initialStep = parseInt(searchParams.get("step") || "0", 10);
  const [currentStep, setCurrentStep] = useState(initialStep >= 0 && initialStep < STEPS.length ? initialStep : 0);
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
    locations: [],
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
      if (!res.ok) throw new Error('Tesis bilgileri yüklenemedi.');
      return res.json();
    },
    enabled: isEditing
  });

  useEffect(() => {
    if (facility) {
      setFormData((prev: any) => ({ 
        ...prev, 
        ...facility,
        buildings: facility.buildings || [],
        locations: facility.locations || [],
        assignments: facility.assignments || []
      }));
    }
  }, [facility]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = isEditing
        ? await api.put(`/settings/facilities/${id}`, payload)
        : await api.post('/settings/facilities', payload);
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Tesis kaydedilirken sunucu hatası oluştu.');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Tesis bilgileri başarıyla güncellendi.' : 'Yeni tesis başarıyla sisteme kaydedildi.');
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      queryClient.invalidateQueries({ queryKey: ['facility', id] });
      queryClient.invalidateQueries({ queryKey: ['assignments-status'] });
      navigate('/settings/facilities');
    },
    onError: (err: any) => {
      console.error('Save error:', err);
      toast.error(err.message || 'Tesis kaydedilirken bir hata oluştu.');
    }
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(s => s + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      toast.error('Lütfen tesis adını giriniz.');
      setCurrentStep(0);
      return;
    }

    if (!formData.id?.trim()) {
      toast.error('Tesis kodu boş bırakılamaz.');
      setCurrentStep(0);
      return;
    }

    // Prepare clean payload for backend
    const payload = {
      id: formData.id.trim(),
      name: formData.name.trim(),
      shortName: formData.shortName?.trim() || null,
      type: formData.type || null,
      city: formData.city || null,
      district: formData.district || null,
      fullAddress: formData.fullAddress || null,
      phone: formData.phone || null,
      email: formData.email || null,
      website: formData.website || null,
      logoUrl: formData.logoUrl || null,
      commercialTitle: formData.commercialTitle || null,
      taxOffice: formData.taxOffice || null,
      taxNumber: formData.taxNumber || null,
      sgkNumber: formData.sgkNumber || null,
      naceCode: formData.naceCode || null,
      dangerClass: formData.dangerClass || 'Az Tehlikeli',
      employeeCount: parseInt(formData.employeeCount) || 0,
      buildings: (formData.buildings || []).map((b: any) => ({
        id: b.id,
        name: b.name || 'İsimsiz Blok',
        constructionYear: b.constructionYear,
        buildingHeight: b.buildingHeight,
        structureHeight: b.structureHeight,
        buildingFloors: b.buildingFloors,
        structureFloors: b.structureFloors,
        closedArea: b.closedArea,
        parkingArea: b.parkingArea,
        gardenArea: b.gardenArea,
        bedCapacity: b.bedCapacity
      })),
      locations: (formData.locations || []).filter((l: any) => !l.id)
    };

    saveMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium">Tesis bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 animate-in fade-in duration-200">
      {/* Wizard Top Bar */}
      <header className="sticky top-0 z-30 bg-card/85 backdrop-blur-md border-b border-border/60 px-6 py-3 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate('/settings/facilities')}
              className="h-8 w-8 rounded-md border-border/60 hover:bg-muted"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                {isEditing ? 'Tesis Bilgilerini Düzenle' : 'Yeni Tesis Kurulum Sihirbazı'}
              </h1>
              <p className="text-[11px] text-muted-foreground">
                {formData.name ? formData.name : 'Yeni Kurumsal Tesis Kaydı'} {formData.id && `(${formData.id})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Stepper Pill Indicators */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-md border border-border/60 overflow-x-auto max-w-full">
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
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap",
                      isActive && "bg-background text-foreground shadow-xs font-semibold",
                      isPast && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
                      !isActive && !isPast && "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{step.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Direct Quick Save Button in Header */}
            <Button
              type="button"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="h-8 px-3.5 text-xs font-semibold rounded-md gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs shrink-0"
              title="Değişiklikleri Kaydet"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kaydet</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-5">
          <Card className="border-border/60 rounded-lg p-6 sm:p-7 shadow-xs bg-card">
            {currentStep === 0 && (
              <BasicInfoStep 
                data={formData} 
                update={(d: any) => setFormData((p: any) => ({ ...p, ...d }))} 
              />
            )}
            {currentStep === 1 && (
              <BuildingStep 
                data={formData} 
                update={(d: any) => setFormData((p: any) => ({ ...p, ...d }))} 
              />
            )}
            {currentStep === 2 && (
              <LocationsStep 
                data={formData} 
                update={(d: any) => setFormData((p: any) => ({ ...p, ...d }))} 
              />
            )}
            {currentStep === 3 && (
              <TeamStep 
                data={formData} 
                update={(d: any) => setFormData((p: any) => ({ ...p, ...d }))} 
              />
            )}
            {currentStep === 4 && (
              <ModulesStep 
                data={formData} 
                update={(d: any) => setFormData((p: any) => ({ ...p, ...d }))} 
              />
            )}
          </Card>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={currentStep === 0}
              onClick={handlePrev}
              className="h-9 px-4 text-xs font-medium rounded-md gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Önceki Adım
            </Button>

            <div className="flex items-center gap-2.5">
              {currentStep < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="h-9 px-4 text-xs font-medium rounded-md gap-2"
                >
                  Sonraki Adım <ChevronRight className="w-4 h-4" />
                </Button>
              ) : null}

              <Button
                type="button"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="h-9 px-5 text-xs font-medium rounded-md gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Kurulumu Tamamla ve Kaydet
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
