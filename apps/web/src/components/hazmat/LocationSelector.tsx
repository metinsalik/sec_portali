import { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { extractLocationParts } from '@/utils/locationHierarchy';

interface LocationSelectorProps {
  departments: any[];
  value: string;
  onChange: (departmentId: string) => void;
  disabled?: boolean;
}

export default function LocationSelector({ departments, value, onChange, disabled }: LocationSelectorProps) {
  const [selectedBuildingName, setSelectedBuildingName] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');

  const parsedLocations = useMemo(
    () =>
      departments.map((d) => ({
        raw: d,
        parts: extractLocationParts(d),
      })),
    [departments]
  );

  const reset = () => {
    setSelectedBuildingName('');
    setSelectedBlock('');
    setSelectedFloor('');
    setSelectedUnit('');
    setSelectedArea('');
  };

  // Sync state when external value changes
  useEffect(() => {
    if (value && parsedLocations.length > 0) {
      const found = parsedLocations.find((item) => String(item.raw.id) === String(value));
      if (found) {
        setSelectedBuildingName(found.parts.buildingName || 'belirtilmemis');
        setSelectedBlock(found.parts.block || 'belirtilmemis');
        setSelectedFloor(found.parts.floor || 'belirtilmemis');
        setSelectedUnit(found.parts.department || 'belirtilmemis');
        setSelectedArea(found.parts.description || 'belirtilmemis');
      }
    } else if (!value && parsedLocations.length === 0) {
      reset();
    }
  }, [value, parsedLocations]);

  // Unique Buildings
  const uniqueBuildingNames = useMemo(() => {
    return Array.from(
      new Set(parsedLocations.map(({ parts }) => parts.buildingName || 'belirtilmemis'))
    ).sort();
  }, [parsedLocations]);

  // Auto-select single building or "Ana Bina" if not selected
  useEffect(() => {
    if (!selectedBuildingName && uniqueBuildingNames.length > 0) {
      if (uniqueBuildingNames.length === 1) {
        setSelectedBuildingName(uniqueBuildingNames[0]);
      } else if (uniqueBuildingNames.includes('Ana Bina')) {
        setSelectedBuildingName('Ana Bina');
      }
    }
  }, [uniqueBuildingNames, selectedBuildingName]);

  const byBuildingName = useMemo(() => {
    if (!selectedBuildingName) return [];
    return parsedLocations.filter(
      ({ parts }) => (parts.buildingName || 'belirtilmemis') === selectedBuildingName
    );
  }, [parsedLocations, selectedBuildingName]);

  // Unique Blocks for selected building
  const uniqueBlocks = useMemo(() => {
    return Array.from(
      new Set(byBuildingName.map(({ parts }) => parts.block || 'belirtilmemis'))
    ).sort();
  }, [byBuildingName]);

  // Auto-select single block if only 1 option
  useEffect(() => {
    if (selectedBuildingName && !selectedBlock && uniqueBlocks.length > 0) {
      if (uniqueBlocks.length === 1) {
        setSelectedBlock(uniqueBlocks[0]);
      }
    }
  }, [selectedBuildingName, selectedBlock, uniqueBlocks]);

  const byBlock = useMemo(() => {
    if (!selectedBlock) return byBuildingName;
    return byBuildingName.filter(
      ({ parts }) => !selectedBlock || (parts.block || 'belirtilmemis') === selectedBlock
    );
  }, [byBuildingName, selectedBlock]);

  // Unique Floors
  const uniqueFloors = useMemo(() => {
    return Array.from(
      new Set(byBlock.map(({ parts }) => parts.floor || 'belirtilmemis'))
    ).sort();
  }, [byBlock]);

  // Auto-select floor if only 1 floor available
  useEffect(() => {
    if (selectedBuildingName && !selectedFloor && uniqueFloors.length === 1) {
      setSelectedFloor(uniqueFloors[0]);
    }
  }, [selectedBuildingName, selectedFloor, uniqueFloors]);

  const byFloor = useMemo(() => {
    if (!selectedFloor) return byBlock;
    return byBlock.filter(
      ({ parts }) => !selectedFloor || (parts.floor || 'belirtilmemis') === selectedFloor
    );
  }, [byBlock, selectedFloor]);

  // Unique Units (Birimler)
  const uniqueUnits = useMemo(() => {
    const list = Array.from(
      new Set(byFloor.map(({ parts }) => parts.department || 'belirtilmemis'))
    ).sort();
    // Return items with non-empty first
    return list;
  }, [byFloor]);

  const byUnit = useMemo(() => {
    if (!selectedUnit) return byFloor;
    return byFloor.filter(
      ({ parts }) => !selectedUnit || (parts.department || 'belirtilmemis') === selectedUnit
    );
  }, [byFloor, selectedUnit]);

  // Unique Areas (Mahaller)
  const uniqueAreas = useMemo(() => {
    return Array.from(
      new Set(byUnit.map(({ parts }) => parts.description || 'belirtilmemis'))
    ).sort();
  }, [byUnit]);

  const resolveMatchId = (bName: string, blk: string, flr: string, unit: string, area: string) => {
    if (!bName) {
      onChange('');
      return;
    }

    const candidates = parsedLocations.filter(({ parts }) => {
      if ((parts.buildingName || 'belirtilmemis') !== bName) return false;
      if (blk && blk !== 'belirtilmemis' && (parts.block || 'belirtilmemis') !== blk) return false;
      if (flr && flr !== 'belirtilmemis' && (parts.floor || 'belirtilmemis') !== flr) return false;
      if (unit && unit !== 'belirtilmemis' && (parts.department || 'belirtilmemis') !== unit) return false;
      if (area && area !== 'belirtilmemis' && (parts.description || 'belirtilmemis') !== area) return false;
      return true;
    });

    if (candidates.length === 0) {
      const fallback = parsedLocations.filter(
        ({ parts }) => (parts.buildingName || 'belirtilmemis') === bName
      );
      if (fallback.length > 0) {
        onChange(fallback[0].raw.id);
      }
      return;
    }

    // Prefer exact matching candidate
    const exact = candidates.find(
      ({ parts }) =>
        (!unit || unit === 'belirtilmemis' || (parts.department || 'belirtilmemis') === unit) &&
        (!area || area === 'belirtilmemis' || (parts.description || 'belirtilmemis') === area)
    );
    onChange((exact || candidates[0]).raw.id);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 border border-border/70 p-3.5 rounded-lg bg-muted/15 shadow-2xs">
      {/* 1. Bina Adı */}
      <div className="space-y-1.5 min-w-0">
        <Label className="text-xs font-semibold text-foreground">Bina Adı</Label>
        <Select
          disabled={disabled || uniqueBuildingNames.length === 0}
          value={selectedBuildingName}
          onValueChange={(val) => {
            if (!val) return;
            setSelectedBuildingName(val);
            setSelectedBlock('');
            setSelectedFloor('');
            setSelectedUnit('');
            setSelectedArea('');
            resolveMatchId(val, '', '', '', '');
          }}
        >
          <SelectTrigger className="h-9 w-full text-xs bg-background">
            <span className="truncate pr-2 block text-left w-full">
              <SelectValue placeholder="Bina Seçiniz" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {uniqueBuildingNames.map((b) => (
              <SelectItem key={b} value={b} className="text-xs">
                {b === 'belirtilmemis' ? 'Ana Bina / Belirtilmemiş' : b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 2. Blok */}
      <div className="space-y-1.5 min-w-0">
        <Label className="text-xs font-semibold text-foreground">Blok</Label>
        <Select
          disabled={disabled || !selectedBuildingName || uniqueBlocks.length === 0}
          value={selectedBlock}
          onValueChange={(val) => {
            if (!val) return;
            setSelectedBlock(val);
            setSelectedFloor('');
            setSelectedUnit('');
            setSelectedArea('');
            resolveMatchId(selectedBuildingName, val, '', '', '');
          }}
        >
          <SelectTrigger className="h-9 w-full text-xs bg-background">
            <span className="truncate pr-2 block text-left w-full">
              <SelectValue placeholder="Blok Seçiniz" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {uniqueBlocks.map((b) => (
              <SelectItem key={b} value={b} className="text-xs">
                {b === 'belirtilmemis' ? 'Tek Blok / Genel' : b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 3. Kat */}
      <div className="space-y-1.5 min-w-0">
        <Label className="text-xs font-semibold text-foreground">Kat</Label>
        <Select
          disabled={disabled || !selectedBuildingName || uniqueFloors.length === 0}
          value={selectedFloor}
          onValueChange={(val) => {
            if (!val) return;
            setSelectedFloor(val);
            setSelectedUnit('');
            setSelectedArea('');
            resolveMatchId(selectedBuildingName, selectedBlock, val, '', '');
          }}
        >
          <SelectTrigger className="h-9 w-full text-xs bg-background">
            <span className="truncate pr-2 block text-left w-full">
              <SelectValue placeholder="Kat Seçiniz" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {uniqueFloors.map((f) => (
              <SelectItem key={f} value={f} className="text-xs">
                {f === 'belirtilmemis' ? 'Genel / Belirtilmemiş Kat' : f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 4. Birim */}
      <div className="space-y-1.5 min-w-0">
        <Label className="text-xs font-semibold text-foreground">Birim</Label>
        <Select
          disabled={disabled || !selectedBuildingName || uniqueUnits.length === 0}
          value={selectedUnit}
          onValueChange={(val) => {
            if (!val) return;
            setSelectedUnit(val);
            setSelectedArea('');

            // If floor was not explicitly chosen, see if this unit belongs to a single floor
            let effectiveFloor = selectedFloor;
            if (!effectiveFloor) {
              const matchedRows = byBlock.filter(
                ({ parts }) => (parts.department || 'belirtilmemis') === val
              );
              const distinctFloors = Array.from(
                new Set(matchedRows.map(({ parts }) => parts.floor || 'belirtilmemis'))
              );
              if (distinctFloors.length === 1 && distinctFloors[0] !== 'belirtilmemis') {
                effectiveFloor = distinctFloors[0];
                setSelectedFloor(effectiveFloor);
              }
            }

            resolveMatchId(selectedBuildingName, selectedBlock, effectiveFloor, val, '');
          }}
        >
          <SelectTrigger className="h-9 w-full text-xs bg-background">
            <span className="truncate pr-2 block text-left w-full">
              <SelectValue placeholder="Birim Seçiniz" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {uniqueUnits.map((u) => (
              <SelectItem key={u} value={u} className="text-xs">
                {u === 'belirtilmemis' ? 'Genel / Birim Yok' : u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 5. Mahal */}
      <div className="space-y-1.5 min-w-0">
        <Label className="text-xs font-semibold text-foreground">Mahal</Label>
        <Select
          disabled={disabled || !selectedBuildingName || uniqueAreas.length === 0}
          value={selectedArea}
          onValueChange={(val) => {
            if (!val) return;
            setSelectedArea(val);
            resolveMatchId(
              selectedBuildingName,
              selectedBlock,
              selectedFloor,
              selectedUnit,
              val
            );
          }}
        >
          <SelectTrigger className="h-9 w-full text-xs bg-background">
            <span className="truncate pr-2 block text-left w-full">
              <SelectValue placeholder="Mahal Seçiniz" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {uniqueAreas.map((a) => (
              <SelectItem key={a} value={a} className="text-xs">
                {a === 'belirtilmemis' ? 'Genel / Mahal Yok' : a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
