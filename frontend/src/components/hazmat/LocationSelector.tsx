import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface LocationSelectorProps {
  departments: any[];
  value: string;
  onChange: (departmentId: string) => void;
  disabled?: boolean;
}

export default function LocationSelector({ departments, value, onChange, disabled }: LocationSelectorProps) {
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>(''); // name
  const [selectedArea, setSelectedArea] = useState<string>(''); // description

  // Parse initial value
  useEffect(() => {
    if (value && departments.length > 0) {
      const dept = departments.find((d) => d.id === value);
      if (dept) {
        setSelectedBlock(dept.building || 'belirtilmemis');
        setSelectedFloor(dept.floor || 'belirtilmemis');
        setSelectedUnit(dept.name || 'belirtilmemis');
        setSelectedArea(dept.description || 'belirtilmemis');
      } else {
        reset();
      }
    } else if (!value) {
      reset();
    }
  }, [value, departments]);

  const reset = () => {
    setSelectedBlock('');
    setSelectedFloor('');
    setSelectedUnit('');
    setSelectedArea('');
  };

  const notifyChange = (block: string, floor: string, unit: string, area: string) => {
    if (!block || !floor || !unit || !area) {
      onChange('');
      return;
    }
    const dept = departments.find(
      (d) =>
        (d.building || 'belirtilmemis') === block &&
        (d.floor || 'belirtilmemis') === floor &&
        (d.name || 'belirtilmemis') === unit &&
        (d.description || 'belirtilmemis') === area
    );
    if (dept) {
      onChange(dept.id);
    } else {
      onChange('');
    }
  };

  const uniqueBlocks = Array.from(new Set(departments.map((d) => d.building || 'belirtilmemis'))).sort();
  
  const filteredForFloor = departments.filter((d) => (d.building || 'belirtilmemis') === selectedBlock);
  const uniqueFloors = Array.from(new Set(filteredForFloor.map((d) => d.floor || 'belirtilmemis'))).sort();
  
  const filteredForUnit = filteredForFloor.filter((d) => (d.floor || 'belirtilmemis') === selectedFloor);
  const uniqueUnits = Array.from(new Set(filteredForUnit.map((d) => d.name || 'belirtilmemis'))).sort();
  
  const filteredForArea = filteredForUnit.filter((d) => (d.name || 'belirtilmemis') === selectedUnit);
  const uniqueAreas = Array.from(new Set(filteredForArea.map((d) => d.description || 'belirtilmemis'))).sort();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 rounded-xl bg-white shadow-sm dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <div className="space-y-1.5 min-w-0">
        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Blok</Label>
        <Select
          disabled={disabled || uniqueBlocks.length === 0}
          value={selectedBlock}
          onValueChange={(val) => {
            setSelectedBlock(val);
            setSelectedFloor('');
            setSelectedUnit('');
            setSelectedArea('');
            notifyChange(val, '', '', '');
          }}
        >
          <SelectTrigger className="h-9 w-full">
            <span className="truncate pr-2 block text-left w-full"><SelectValue placeholder="Seçiniz" /></span>
          </SelectTrigger>
          <SelectContent>
            {uniqueBlocks.map((b) => (
              <SelectItem key={b} value={b}>
                {b === 'belirtilmemis' ? 'Belirtilmemiş' : b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 min-w-0">
        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Kat</Label>
        <Select
          disabled={disabled || !selectedBlock || uniqueFloors.length === 0}
          value={selectedFloor}
          onValueChange={(val) => {
            setSelectedFloor(val);
            setSelectedUnit('');
            setSelectedArea('');
            notifyChange(selectedBlock, val, '', '');
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
            setSelectedUnit(val);
            setSelectedArea('');
            notifyChange(selectedBlock, selectedFloor, val, '');
          }}
        >
          <SelectTrigger className="h-9 w-full">
            <span className="truncate pr-2 block text-left w-full"><SelectValue placeholder="Seçiniz" /></span>
          </SelectTrigger>
          <SelectContent>
            {uniqueUnits.map((u) => (
              <SelectItem key={u} value={u}>
                {u === 'belirtilmemis' ? 'Belirtilmemiş' : u}
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
            setSelectedArea(val);
            notifyChange(selectedBlock, selectedFloor, selectedUnit, val);
          }}
        >
          <SelectTrigger className="h-9 w-full">
            <span className="truncate pr-2 block text-left w-full"><SelectValue placeholder="Seçiniz" /></span>
          </SelectTrigger>
          <SelectContent>
            {uniqueAreas.map((a) => (
              <SelectItem key={a} value={a}>
                {a === 'belirtilmemis' ? 'Belirtilmemiş' : a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
