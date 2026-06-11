import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/context/AuthContext';

export function FacilitySwitcher() {
  const [open, setOpen] = useState(false);
  const [activeFacilityId, setActiveFacilityId] = useState<string | null>(
    localStorage.getItem('activeFacilityId')
  );
  const { user } = useAuth();

  const { data: facilities = [], isLoading } = useQuery<any[]>({
    queryKey: ['user-facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      return res.json();
    },
  });

  // Filter facilities based on user access if not admin/management
  const hasAdminAccess = user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management');
  
  const accessibleFacilities = hasAdminAccess 
    ? facilities 
    : facilities.filter((f: any) => user?.facilities?.includes(f.id));

  useEffect(() => {
    // If no active facility but we have facilities, set the first one as active
    if (!activeFacilityId && accessibleFacilities.length > 0) {
      const firstId = accessibleFacilities[0].id;
      setActiveFacilityId(firstId);
      localStorage.setItem('activeFacilityId', firstId);
      
      // Dispatch a custom event so other components know it changed
      window.dispatchEvent(new Event('facilityChanged'));
    }
  }, [accessibleFacilities, activeFacilityId]);

  const handleSelect = (facilityId: string) => {
    setActiveFacilityId(facilityId);
    localStorage.setItem('activeFacilityId', facilityId);
    setOpen(false);
    
    // Dispatch event to trigger re-renders where necessary
    window.dispatchEvent(new Event('facilityChanged'));
  };

  if (isLoading || accessibleFacilities.length === 0) {
    return (
      <div className="px-3 py-2">
        <Button variant="outline" className="w-full justify-start text-muted-foreground" disabled>
          <Building2 className="mr-2 h-4 w-4" />
          Yükleniyor...
        </Button>
      </div>
    );
  }

  const activeFacility = accessibleFacilities.find((f: any) => f.id === activeFacilityId) || accessibleFacilities[0];

  return (
    <div className="px-3 py-3 border-b border-border/50">
      <Popover open={open} onOpenChange={setOpen}>
        // @ts-ignore
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            <div className="flex items-center truncate">
              <Building2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-medium">
                {activeFacility?.name || 'Tesis Seçin'}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Tesis ara..." />
            <CommandList>
              <CommandEmpty>Tesis bulunamadı.</CommandEmpty>
              <CommandGroup>
                {accessibleFacilities.map((facility: any) => (
                  <CommandItem
                    key={facility.id}
                    value={facility.name}
                    onSelect={() => handleSelect(facility.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        activeFacilityId === facility.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{facility.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
