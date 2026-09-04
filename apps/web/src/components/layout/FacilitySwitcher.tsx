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

interface FacilitySwitcherProps {
  isCollapsed?: boolean;
}

export function FacilitySwitcher({ isCollapsed = false }: FacilitySwitcherProps) {
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
    ? [{ id: 'all', name: 'Tüm Tesisler' }, ...facilities]
    : facilities.filter((f: any) => user?.facilities?.includes(f.id));

  useEffect(() => {
    // If no active facility but we have facilities, set the default
    if (!activeFacilityId && accessibleFacilities.length > 0) {
      const defaultId = hasAdminAccess ? 'all' : accessibleFacilities[0].id;
      setActiveFacilityId(defaultId);
      localStorage.setItem('activeFacilityId', defaultId);
      
      // Dispatch a custom event so other components know it changed
      window.dispatchEvent(new Event('facilityChanged'));
    }
  }, [accessibleFacilities, activeFacilityId]);

  const handleSelect = (facilityId: string) => {
    setActiveFacilityId(facilityId);
    localStorage.setItem('activeFacilityId', facilityId);
    setOpen(false);
    
    window.dispatchEvent(new Event('facilityChanged'));

    const path = window.location.pathname;
    if (path === '/risks' || path.startsWith('/risks/facility')) {
      window.location.href = `/risks/facility/${facilityId}`;
    } else {
      window.location.reload();
    }
  };

  if (isLoading || accessibleFacilities.length === 0) {
    return (
      <div className={cn("px-3 py-2", isCollapsed && "px-2 py-2 flex justify-center")}>
        <Button variant="outline" size={isCollapsed ? "icon" : "default"} className={cn(isCollapsed ? "h-9 w-9 p-0" : "w-full justify-start", "text-muted-foreground")} disabled>
          <Building2 className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && <span>Yükleniyor...</span>}
        </Button>
      </div>
    );
  }

  const activeFacility = accessibleFacilities.find((f: any) => f.id === activeFacilityId) || accessibleFacilities[0];
  const activeLabel = activeFacilityId === 'all' ? 'Tüm Tesisler' : (activeFacility?.name || 'Tesis Seçin');

  return (
    <div className={cn("border-b border-border/50 transition-all", isCollapsed ? "p-2 flex justify-center" : "px-3 py-3")}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {isCollapsed ? (
            <Button
              variant="outline"
              size="icon"
              role="combobox"
              aria-expanded={open}
              title={`Tesis: ${activeLabel}`}
              className="h-10 w-10 p-0 rounded-lg bg-background shadow-xs hover:bg-accent hover:text-accent-foreground"
            >
              <Building2 className="h-4 w-4 text-foreground" />
            </Button>
          ) : (
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
            >
              <div className="flex items-center truncate">
                <Building2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">
                  {activeLabel}
                </span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0 z-50" align={isCollapsed ? "start" : "start"} side={isCollapsed ? "right" : "bottom"} sideOffset={8}>
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
