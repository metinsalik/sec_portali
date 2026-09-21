import { useState, useEffect } from 'react';

/**
 * Custom hook to reactively track the selected facility id from localStorage
 * and stay synced with 'facilityChanged' and 'storage' window events.
 */
export function useActiveFacility() {
  const [activeFacilityId, setActiveFacilityId] = useState<string | null>(() => {
    return localStorage.getItem('activeFacilityId');
  });

  useEffect(() => {
    const handleUpdate = () => {
      const current = localStorage.getItem('activeFacilityId');
      setActiveFacilityId(current);
    };

    window.addEventListener('facilityChanged', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Initial check in case it changed between initial state and effect mount
    handleUpdate();

    return () => {
      window.removeEventListener('facilityChanged', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return activeFacilityId;
}
