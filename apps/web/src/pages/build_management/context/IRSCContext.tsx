import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Audit, IRSCFacility, IRSCCategory, IRSCDepartment, IRSCArea } from '../types';
import { fetchAudits } from '../services/auditApi';

export type ViewState = 'TRACKING' | 'LIBRARY' | 'CONSOLE' | 'WORKSPACE' | 'SETTINGS';

interface IRSCState {
  currentView: ViewState;
  activeFacilityId: string | null;
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
  setActiveFacilityId: (id: string | null) => void;
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
  const [activeFacilityId, setActiveFacilityId] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null);

  const [audits, setAudits] = useState<Audit[]>([]);
  const [facilities, setFacilities] = useState<IRSCFacility[]>([]);
  const [globalAreas, setGlobalAreas] = useState<IRSCArea[]>([]);
  const [globalCriteria, setGlobalCriteria] = useState<string[]>([]);
  const [categories, setCategories] = useState<IRSCCategory[]>([]);
  const [departments, setDepartments] = useState<IRSCDepartment[]>([]);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  // Fetch facilities on mount
  useEffect(() => {
    import('../../../lib/api').then(({ default: api }) => {
      api.get('/settings/facilities')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setFacilities(data.map(f => ({ id: f.id, name: f.name, audits: [] })));
          }
        })
        .catch(err => console.error("Error fetching facilities", err));
    });
  }, []);

  // Always fetch all audits initially (no facility filter)
  useEffect(() => {
    fetchAudits().then(data => {
      setAudits(data);
    }).catch(err => console.error("Error fetching audits", err));
  }, []);

  // Fetch settings on mount
  useEffect(() => {
    import('../services/auditApi').then(({ fetchRenovationSettings }) => {
      fetchRenovationSettings().then(settings => {
        if (settings) {
          if (settings.categories?.length > 0) setCategories(settings.categories);
          if (settings.departments?.length > 0) setDepartments(settings.departments);
          if (settings.areas?.length > 0) setGlobalAreas(settings.areas);
          if (settings.criteria?.length > 0) setGlobalCriteria(settings.criteria);
        }
        setIsSettingsLoaded(true);
      }).catch(err => {
        console.error("Error fetching renovation settings", err);
        setIsSettingsLoaded(true); // Proceed even on error
      });
    });
  }, []);

  // Save settings when they change (only after initial load)
  useEffect(() => {
    if (!isSettingsLoaded) return;
    
    const timeoutId = setTimeout(() => {
      import('../services/auditApi').then(({ saveRenovationSettings }) => {
        saveRenovationSettings({
          categories,
          departments,
          areas: globalAreas,
          criteria: globalCriteria
        }).catch(err => console.error("Error saving renovation settings", err));
      });
    }, 1000); // 1s debounce

    return () => clearTimeout(timeoutId);
  }, [categories, departments, globalAreas, globalCriteria, isSettingsLoaded]);

  return (
    <IRSCContext.Provider
      value={{
        currentView,
        activeFacilityId,
        selectedLocationId,
        activeAuditId,
        audits,
        facilities,
        categories,
        departments,
        setCurrentView,
        setActiveFacilityId,
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
