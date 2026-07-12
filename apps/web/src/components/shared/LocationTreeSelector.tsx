import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChevronRight, ChevronDown, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LocationTreeSelectorProps {
  facilityId: string;
  value: string;
  onChange: (locationId: string) => void;
  disabled?: boolean;
}

export default function LocationTreeSelector({ facilityId, value, onChange, disabled }: LocationTreeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['facility-locations', facilityId],
    queryFn: async () => {
      const res = await api.get(`/risks/facilities/${facilityId}/locations`);
      if (!res.ok) throw new Error('Lokasyonlar alınamadı');
      return res.json();
    },
    enabled: !!facilityId,
  });

  const selectedLocation = useMemo(() => {
    return locations.find((l: any) => l.id === value);
  }, [locations, value]);

  const tree = useMemo(() => {
    const root: Record<string, any> = {};
    const flatLocations: any[] = [];

    locations.forEach((loc: any) => {
      if (!loc.building) {
        flatLocations.push(loc);
        return;
      }
      if (!root[loc.building]) root[loc.building] = { id: `b-${loc.building}`, name: loc.building, type: 'building', children: {} };
      const bNode = root[loc.building];

      if (!bNode.locationId) bNode.locationId = loc.id;

      if (!loc.floor) {
        return;
      }
      if (!bNode.children[loc.floor]) bNode.children[loc.floor] = { id: `f-${loc.building}-${loc.floor}`, name: loc.floor, type: 'floor', children: {} };
      const fNode = bNode.children[loc.floor];
      if (!fNode.locationId) fNode.locationId = loc.id;

      if (!loc.department) {
        return;
      }
      if (!fNode.children[loc.department]) fNode.children[loc.department] = { id: `d-${loc.building}-${loc.floor}-${loc.department}`, name: loc.department, type: 'department', children: {} };
      const dNode = fNode.children[loc.department];
      if (!dNode.locationId) dNode.locationId = loc.id;

      if (loc.description) {
        dNode.children[loc.description] = { id: loc.id, name: loc.description, type: 'unit', locationId: loc.id };
      }
    });

    return { root, flatLocations };
  }, [locations]);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelect = (id: string) => {
    if (id) {
      onChange(id);
      setIsOpen(false);
    }
  };

  const renderNode = (node: any, level: number = 0) => {
    const hasChildren = Object.keys(node.children || {}).length > 0;
    const isExpanded = expandedNodes[node.id];
    const isSelectable = !!node.locationId;
    const isSelected = value === node.locationId;

    return (
      <div key={node.id} className="select-none">
        <div 
          className={cn(
            "flex items-center py-1.5 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-colors text-sm",
            isSelected && "bg-primary/10 text-primary font-medium"
          )}
          style={{ paddingLeft: `${(level * 16) + 8}px` }}
          onClick={() => {
            if (isSelectable) handleSelect(node.locationId);
            else if (hasChildren) toggleExpand({ stopPropagation: () => {} } as any, node.id);
          }}
        >
          <div className="w-5 h-5 flex items-center justify-center mr-1 shrink-0">
            {hasChildren ? (
              <div 
                className="w-full h-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"
                onClick={(e) => toggleExpand(e, node.id)}
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </div>
            ) : <MapPin className="w-3.5 h-3.5 text-slate-400" />}
          </div>
          <span className="truncate flex-1">{node.name}</span>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="border-l border-slate-200 dark:border-slate-700 ml-[18px] pl-1 my-1">
            {Object.values(node.children).map((childNode: any) => renderNode(childNode, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const displayValue = selectedLocation ? (
    selectedLocation.building ? 
      [selectedLocation.building, selectedLocation.floor, selectedLocation.department, selectedLocation.description].filter(Boolean).join(' > ')
      : selectedLocation.name
  ) : 'Lokasyon Seçiniz...';

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal text-left px-3 h-10", 
            !value && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronDown className="w-4 h-4 opacity-50 ml-2 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[300px] max-w-[90vw] max-h-[400px] overflow-y-auto p-2" align="start">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : locations.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            Bu tesise ait lokasyon bulunamadı.
          </div>
        ) : (
          <div className="space-y-1">
            {Object.values(tree.root).map((node: any) => renderNode(node))}
            
            {tree.flatLocations.length > 0 && (
              <>
                {Object.keys(tree.root).length > 0 && <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />}
                <div className="text-xs font-semibold text-slate-500 px-2 mb-1 uppercase tracking-wider">
                  Diğer (Eski Sistem) Departmanlar
                </div>
                {tree.flatLocations.map((loc: any) => (
                  <div 
                    key={loc.id}
                    className={cn(
                      "flex items-center py-1.5 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-colors text-sm",
                      value === loc.id && "bg-primary/10 text-primary font-medium"
                    )}
                    onClick={() => handleSelect(loc.id)}
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <span className="truncate">{loc.name}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
