import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Audit, IRSCFacility, IRSCCategory, IRSCDepartment, IRSCArea } from '../types';
import { fetchAudits } from '../services/auditApi';

export type ViewState = 'TRACKING' | 'LIBRARY' | 'CONSOLE' | 'WORKSPACE' | 'SETTINGS';

interface IRSCState {
  currentView: ViewState;
  selectedLocationId: string | null;
  activeAuditId: string | null;
  audits: Audit[];
  facilities: IRSCFacility[];
  categories: IRSCCategory[];
  departments: IRSCDepartment[];
  globalAreas: IRSCArea[];
  globalCriteria: string[];
}

interface IRSCContextType extends IRSCState {
  setCurrentView: (view: ViewState) => void;
  setSelectedLocationId: (id: string | null) => void;
  setActiveAuditId: (id: string | null) => void;
  setAudits: (audits: Audit[]) => void;
  setFacilities: (facilities: IRSCFacility[]) => void;
  setCategories: (categories: IRSCCategory[]) => void;
  setDepartments: (departments: IRSCDepartment[]) => void;
  setGlobalAreas: (areas: IRSCArea[]) => void;
  setGlobalCriteria: (criteria: string[]) => void;
}

const IRSCContext = createContext<IRSCContextType | undefined>(undefined);

export function IRSCProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewState>('TRACKING');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null);

  // Initialize from localStorage or use defaults
  const [audits, setAudits] = useState<Audit[]>([]);

  const [facilities, setFacilities] = useState<IRSCFacility[]>(() => {
    try {
      const saved = localStorage.getItem('irsc_facilities');
      if (saved) return JSON.parse(saved);
    } catch {}
    
    return [
      { id: 'f1', name: 'ISU Liv Hospital Bahçeşehir', audits: [] },
      { id: 'f2', name: 'VM Medical Park Pendik', audits: [] },
      { id: 'f3', name: 'Medical Park Antalya', audits: [] },
      { id: 'f4', name: 'Liv Hospital Vadi İstanbul', audits: [] }
    ];
  });

  const [globalAreas, setGlobalAreas] = useState<IRSCArea[]>(() => {
    try {
      const saved = localStorage.getItem('irsc_global_areas');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure it's the new object structure, not the old array of strings
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && 'subareas' in parsed[0]) {
          return parsed;
        } else if (Array.isArray(parsed) && parsed.length === 0) {
          return [];
        }
      }
    } catch {}
    return [
      { id: 'a1', name: 'Acil Servis', subareas: ['Sarı Alan', 'Kırmızı Alan', 'Yeşil Alan', 'Triyaj'] },
      { id: 'a2', name: 'Ortak Alanlar', subareas: ['Kafeterya', 'Bekleme Salonu', 'WC'] },
      { id: 'a3', name: 'Teknik Mahaller', subareas: ['Kazan Dairesi', 'Jeneratör Odası', 'Medikal Gaz Santrali'] },
      { id: 'a4', name: 'Poliklinikler', subareas: ['Dahiliye', 'KBB', 'Göz'] }
    ];
  });

  const [globalCriteria, setGlobalCriteria] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('irsc_global_criteria');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['6331 sayılı İSG Kanunu', 'SKS', 'JCI', 'Yangın Yönetmeliği'];
  });

  // Always fetch all audits initially (no facility filter)
  useEffect(() => {
    fetchAudits().then(data => {
      setAudits(data);
    }).catch(err => console.error("Error fetching audits", err));
  }, []);

  useEffect(() => {
    localStorage.setItem('irsc_facilities', JSON.stringify(facilities));
  }, [facilities]);

  useEffect(() => {
    localStorage.setItem('irsc_global_areas', JSON.stringify(globalAreas));
  }, [globalAreas]);

  useEffect(() => {
    localStorage.setItem('irsc_global_criteria', JSON.stringify(globalCriteria));
  }, [globalCriteria]);
  
  // Default mock data for categories and departments based on user requirements
  const [categories, setCategories] = useState<IRSCCategory[]>([
    {
      id: 'c1',
      name: 'Tesis Güvenliği',
      subcategories: [
        'Acil Durum ve Afet Yönetimi',
        'Altyapı Sistemleri',
        'Atık yönetimi süreci',
        'Diğer cihaz ve malzemelerin yönetimi',
        'Emniyet',
        'Tıbbi cihaz ve malzeme yönetimi',
        'Yangın Güvenliği',
        'İnşaat ve Renovasyon'
      ]
    },
    {
      id: 'c2',
      name: 'Çevre Güvenliği',
      subcategories: [
        'Atıkların çevreye zarar vermesi',
        'Hava kirliliği oluşturabilecek unsurlar',
        'Tehlikeli atıklardan oluşabilecek zararlar',
        'Çevreden hastaneye gelecek zararlar'
      ]
    },
    {
      id: 'c3',
      name: 'İş Sağlığı ve Güvenliği',
      subcategories: [
        'Güvenlik - Biyolojik Risk Etmenleri',
        'Güvenlik - Fiziksel Risk Etmenleri',
        'Güvenlik - Psikososyal Risk Etmenleri',
        'Güvenlik - Ergonomik Risk Etmenleri',
        'Tehlikeli Madde Yönetimi / Kimyasal Riskler'
      ]
    }
  ]);

  const [departments, setDepartments] = useState<IRSCDepartment[]>([
    { id: 'd1', name: 'Teknik Hizmetler' },
    { id: 'd2', name: 'İdari İşler' },
    { id: 'd3', name: 'İş Sağlığı ve Güvenliği Birimi' },
    { id: 'd4', name: 'Kalite Yönetimi' }
  ]);

  return (
    <IRSCContext.Provider
      value={{
        currentView,
        selectedLocationId,
        activeAuditId,
        audits,
        facilities,
        categories,
        departments,
        setCurrentView,
        setSelectedLocationId,
        setActiveAuditId,
        setAudits,
        setFacilities,
        setCategories,
        setDepartments,
        globalAreas,
        setGlobalAreas,
        globalCriteria,
        setGlobalCriteria
      }}
    >
      {children}
    </IRSCContext.Provider>
  );
}

export function useIRSC() {
  const context = useContext(IRSCContext);
  if (context === undefined) {
    throw new Error('useIRSC must be used within an IRSCProvider');
  }
  return context;
}
