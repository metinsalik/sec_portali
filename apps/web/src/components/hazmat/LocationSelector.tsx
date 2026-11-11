import React, { useState, useEffect, useMemo } from 'react';
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

  useEffect(() => {
    if (value && parsedLocations.length > 0) {
      const found = parsedLocations.find((item) => item.raw.id === value);
      if (found) {
        setSelectedBuildingName(found.parts.buildingName || 'belirtilmemis');
        setSelectedBlock(found.parts.block || 'belirtilmemis');
        setSelectedFloor(found.parts.floor || 'belirtilmemis');
        setSelectedUnit(found.parts.department || 'belirtilmemis');
        setSelectedArea(found.parts.description || 'belirtilmemis');
      } else {
        reset();
      }
    } else if (!value) {
      reset();
    }
  }, [value, parsedLocations]);

  const resolveMatchId = (bName: string, blk: string, flr: string, unit: string, area: string) => {
    if (!bName) {
      onChange('');
      return;
    }

    const candidates = parsedLocations.filter(({ parts }) => {
      if ((parts.buildingName || 'belirtilmemis') !== bName) return false;
      if (blk && (parts.block || 'belirtilmemis') !== blk) return false;
      if (flr && (parts.floor || 'belirtilmemis') !== flr) return false;
      if (unit && (parts.department || 'belirtilmemis') !== unit) return false;
      if (area && (parts.description || 'belirtilmemis') !== area) return false;
      return true;
    });

    if (candidates.length === 0) {
      onChange('');
      return;
    }

    // Prefer exact leaf match, otherwise pick the shallowest/first matching node
    const exact = candidates.find(
      ({ parts }) =>
        (!blk || (parts.block || 'belirtilmemis') === blk) &&
        (!flr || (parts.floor || 'belirtilmemis') === flr) &&
        (!unit || (parts.department || 'belirtilmemis') === unit) &&
        (!area || (parts.description || 'belirtilmemis') === area)
    );
    onChange((exact || candidates[0]).raw.id);
  };

  const uniqueBuildingNames = Array.from(
    new Set(parsedLocations.map(({ parts }) => parts.buildingName || 'belirtilmemis'))
  ).sort();

  const byBuildingName = parsedLocations.filter(
    ({ parts }) => (parts.buildingName || 'belirtilmemis') === selectedBuildingName
  );
  const uniqueBlocks = Array.from(
    new Set(byBuildingName.map(({ parts }) => parts.block || 'belirtilmemis'))
  ).sort();

  const byBlock = byBuildingName.filter(
    ({ parts }) => !selectedBlock || (parts.block || 'belirtilmemis') === selectedBlock
  );
  const uniqueFloors = Array.from(
    new Set(byBlock.map(({ parts }) => parts.floor || 'belirtilmemis'))
  ).sort();

  const byFloor = byBlock.filter(
    ({ parts }) => !selectedFloor || (parts.floor || 'belirtilmemis') === selectedFloor
  );
  const uniqueUnits = Array.from(
    new Set(byFloor.map(({ parts }) => parts.department || 'belirtilmemis'))
  ).sort();

  const byUnit = byFloor.filter(
    ({ parts }) => !selectedUnit || (parts.department || 'belirtilmemis') === selectedUnit
  );
  const uniqueAreas = Array.from(
    new Set(byUnit.map(({ parts }) => parts.description || 'belirtilmemis'))
  ).sort();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 border p-4 rounded-xl bg-white shadow-sm dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <div className="space-y-1.5 min-w-0">
        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Bina Adı</Label>
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
          <SelectTrigger className="h-9 w-full">
            <span className="truncate pr-2 block text-left w-full"><SelectValue placeholder="Seçiniz" /></span>
          </SelectTrigger>
          <SelectContent>
            {uniqueBuildingNames.map((b) => (
              <SelectItem key={b} value={b}>
                {b === 'belirtilmemis' ? 'Belirtilmemiş' : b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 min-w-0">
        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Blok</Label>
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
          <SelectTrigger className="h-9 w-full">
            <span className="truncate pr-2 block text-left w-full"><SelectValue placeholder="Seçiniz" /></span>
          </SelectTrigger>
          <SelectContent>
            {uniqueBlocks.map((b) => (
              <SelectItem key={b} value={b}>
                {b === 'belirtilmemis' ? 'Tek Blok / Genel' : b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 min-w-0">
        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Kat</Label>
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
          <SelectTrigger className="h-9 w-full">
            <span className="truncate pr-2 block text-left w-full"><SelectValue placeholder="Seçiniz" /></span>
          </SelectTrigger>
          <SelectContent>
            {uniqueFloors.map((f) => (
              <SelectItem key={f} value={f}>
                {f === 'belirtilmemis' ? 'Belirtilmemiş' : f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 min-w-0">
        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Birim</Label>
        <Select
          disabled={disabled || !selectedFloor || uniqueUnits.length === 0}
          value={selectedUnit}
          onValueChange={(val) => {
            if (!val) return;
            setSelectedUnit(val);
            setSelectedArea('');
            resolveMatchId(selectedBuildingName, selectedBlock, selectedFloor, val, '');
          }}
        >
          <SelectTrigger className="h-9 w-full">
            <span className="truncate pr-2 block text-left w-full"><SelectValue placeholder="Seçiniz" /></span>
          </SelectTrigger>
          <SelectContent>
            {uniqueUnits.map((u) => (
              <SelectItem key={u} value={u}>
                {u === 'belirtilmemis' ? 'Genel / Birim Yok' : u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 min-w-0">
        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Mahal</Label>
        <Select
          disabled={disabled || !selectedUnit || uniqueAreas.length === 0}
          value={selectedArea}
          onValueChange={(val) => {
            if (!val) return;
            setSelectedArea(val);
            resolveMatchId(selectedBuildingName, selectedBlock, selectedFloor, selectedUnit, val);
          }}
        >
          <SelectTrigger className="h-9 w-full">
            <span className="truncate pr-2 block text-left w-full"><SelectValue placeholder="Seçiniz" /></span>
          </SelectTrigger>
          <SelectContent>
            {uniqueAreas.map((a) => (
              <SelectItem key={a} value={a}>
                {a === 'belirtilmemis' ? 'Genel / Mahal Yok' : a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
