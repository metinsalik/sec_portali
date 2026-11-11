import { useState, useMemo, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  decodeGroup5LocationId,
  encodeGroup5LocationId,
  extractLocationParts,
} from '@/utils/locationHierarchy';

interface LocationCascadingSelectorProps {
  locations: any[];
  value: string;
  onChange: (locationId: string, level: string, selectedPath: any) => void;
  disabled?: boolean;
}

export default function LocationCascadingSelector({
  locations,
  value,
  onChange,
  disabled,
}: LocationCascadingSelectorProps) {
  const [selectedBuildingName, setSelectedBuildingName] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  const [customBuildingName, setCustomBuildingName] = useState<string>('');
  const [customBlock, setCustomBlock] = useState<string>('');
  const [customFloor, setCustomFloor] = useState<string>('');
  const [customDepartment, setCustomDepartment] = useState<string>('');
  const [customUnit, setCustomUnit] = useState<string>('');

  const parsedLocations = useMemo(
    () => locations.map((l) => ({ raw: l, parts: extractLocationParts(l) })),
    [locations]
  );

  // 1. Bina Adları
  const buildingNames = useMemo(() => {
    const set = new Set<string>();
    parsedLocations.forEach(({ parts }) => {
      if (parts.buildingName) set.add(parts.buildingName);
    });
    return Array.from(set).sort();
  }, [parsedLocations]);

  const activeBName = selectedBuildingName === 'custom' ? customBuildingName : selectedBuildingName;

  // 2. Bloklar (seçili bina için)
  const blocks = useMemo(() => {
    if (!activeBName) return [];
    const set = new Set<string>();
    parsedLocations.forEach(({ parts }) => {
      if (parts.buildingName === activeBName && parts.block) set.add(parts.block);
    });
    return Array.from(set).sort();
  }, [parsedLocations, activeBName]);

  const activeBlock = selectedBlock === 'custom' ? customBlock : selectedBlock;

  // 3. Katlar (seçili bina ve blok için; blok seçilmediyse bloğu olmayanlar da dahil)
  const floors = useMemo(() => {
    if (!activeBName) return [];
    const set = new Set<string>();
    parsedLocations.forEach(({ parts }) => {
      const bMatch = parts.buildingName === activeBName;
      const blkMatch = !activeBlock || parts.block === activeBlock;
      if (bMatch && blkMatch && parts.floor) set.add(parts.floor);
    });
    return Array.from(set).sort();
  }, [parsedLocations, activeBName, activeBlock]);

  const activeFloor = selectedFloor === 'custom' ? customFloor : selectedFloor;

  // 4. Birimler
  const departments = useMemo(() => {
    if (!activeBName) return [];
    const set = new Set<string>();
    parsedLocations.forEach(({ parts }) => {
      const bMatch = parts.buildingName === activeBName;
      const blkMatch = !activeBlock ? !parts.block : parts.block === activeBlock;
      const flrMatch = !activeFloor ? !parts.floor : parts.floor === activeFloor;
      if (bMatch && blkMatch && flrMatch && parts.department) {
        set.add(parts.department);
      }
    });
    return Array.from(set).sort();
  }, [parsedLocations, activeBName, activeBlock, activeFloor]);

  const activeDept = selectedDepartment === 'custom' ? customDepartment : selectedDepartment;

  // 5. Mahaller
  const units = useMemo(() => {
    if (!activeBName) return [];
    const list: { id: string; label: string; raw: any }[] = [];
    parsedLocations.forEach(({ raw, parts }) => {
      const bMatch = parts.buildingName === activeBName;
      const blkMatch = !activeBlock ? !parts.block : parts.block === activeBlock;
      const flrMatch = !activeFloor ? !parts.floor : parts.floor === activeFloor;
      const deptMatch = !activeDept ? !parts.department : parts.department === activeDept;
      if (bMatch && blkMatch && flrMatch && deptMatch && parts.description) {
        list.push({ id: raw.id, label: parts.description, raw });
      }
    });
    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [parsedLocations, activeBName, activeBlock, activeFloor, activeDept]);

  // Initial sync
  useEffect(() => {
    if (!value) return;
    if (value.startsWith('group5:')) {
      const p = decodeGroup5LocationId(value);
      if (p) {
        setSelectedBuildingName(p.buildingName);
        setSelectedBlock(p.block);
        setSelectedFloor(p.floor);
        setSelectedDepartment(p.department);
      }
      return;
    }
    const match = parsedLocations.find((item) => item.raw.id === value);
    if (match) {
      setSelectedBuildingName(match.parts.buildingName);
      setSelectedBlock(match.parts.block);
      setSelectedFloor(match.parts.floor);
      setSelectedDepartment(match.parts.department);
      if (match.parts.description) setSelectedUnit(match.raw.id);
    }
  }, [value, parsedLocations]);

  // Emit value on selection change
  useEffect(() => {
    if (!activeBName) return;

    const unitObj = units.find((u) => u.id === selectedUnit);
    const activeDesc = selectedUnit === 'custom' ? customUnit.trim() : unitObj?.label || '';

    // Check exact existing FacilityLocation match
    const exactMatch = parsedLocations.find(({ parts }) => {
      return (
        parts.buildingName === activeBName &&
        parts.block === activeBlock &&
        parts.floor === activeFloor &&
        parts.department === activeDept &&
        parts.description === activeDesc
      );
    });

    const level = activeDesc
      ? 'unit'
      : activeDept
      ? 'department'
      : activeFloor
      ? 'floor'
      : activeBlock
      ? 'block'
      : 'building';

    const emitValue = exactMatch
      ? exactMatch.raw.id
      : encodeGroup5LocationId({
          buildingName: activeBName,
          block: activeBlock,
          floor: activeFloor,
          department: activeDept,
          description: activeDesc,
        });

    if (emitValue && emitValue !== value) {
      onChange(emitValue, level, {
        buildingName: activeBName,
        building: activeBlock,
        floor: activeFloor,
        department: activeDept,
        description: activeDesc,
      });
    }
  }, [
    activeBName,
    activeBlock,
    activeFloor,
    activeDept,
    selectedUnit,
    customUnit,
    parsedLocations,
    units,
    value,
    onChange,
  ]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {/* 1. Bina Adı */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Bina Adı *</Label>
        <select
          value={selectedBuildingName}
          onChange={(e) => {
            setSelectedBuildingName(e.target.value);
            setSelectedBlock('');
            setSelectedFloor('');
            setSelectedDepartment('');
            setSelectedUnit('');
            if (e.target.value !== 'custom') setCustomBuildingName('');
          }}
          disabled={disabled}
          className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs focus:ring-2 focus:ring-ring focus:outline-none"
        >
          <option value="">Bina Seçiniz...</option>
          {buildingNames.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
          <option value="custom">+ Yeni Bina Yaz...</option>
        </select>
        {selectedBuildingName === 'custom' && (
          <input
            type="text"
            placeholder="Bina Adı (Örn: Ana Bina)"
            value={customBuildingName}
            onChange={(e) => setCustomBuildingName(e.target.value)}
            className="w-full h-8 mt-1 rounded-md border border-input bg-background px-2.5 text-xs"
          />
        )}
      </div>

      {/* 2. Blok */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Blok (Opsiyonel)</Label>
        <select
          value={selectedBlock}
          onChange={(e) => {
            setSelectedBlock(e.target.value);
            setSelectedFloor('');
            setSelectedDepartment('');
            setSelectedUnit('');
            if (e.target.value !== 'custom') setCustomBlock('');
          }}
          disabled={disabled || !activeBName}
          className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
        >
          <option value="">Tek Blok / Seçilmedi</option>
          {blocks.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
          <option value="custom">+ Yeni Blok Yaz...</option>
        </select>
        {selectedBlock === 'custom' && (
          <input
            type="text"
            placeholder="Blok Adı (Örn: A Blok)"
            value={customBlock}
            onChange={(e) => setCustomBlock(e.target.value)}
            className="w-full h-8 mt-1 rounded-md border border-input bg-background px-2.5 text-xs"
          />
        )}
      </div>

      {/* 3. Kat */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Kat</Label>
        <select
          value={selectedFloor}
          onChange={(e) => {
            setSelectedFloor(e.target.value);
            setSelectedDepartment('');
            setSelectedUnit('');
            if (e.target.value !== 'custom') setCustomFloor('');
          }}
          disabled={disabled || !activeBName}
          className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
        >
          <option value="">Kat Seçiniz... (Opsiyonel)</option>
          {floors.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
          <option value="custom">+ Yeni Kat Yaz...</option>
        </select>
        {selectedFloor === 'custom' && (
          <input
            type="text"
            placeholder="Kat Adı (Örn: 1.Kat)"
            value={customFloor}
            onChange={(e) => setCustomFloor(e.target.value)}
            className="w-full h-8 mt-1 rounded-md border border-input bg-background px-2.5 text-xs"
          />
        )}
      </div>

      {/* 4. Birim */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Birim</Label>
        <select
          value={selectedDepartment}
          onChange={(e) => {
            setSelectedDepartment(e.target.value);
            setSelectedUnit('');
            if (e.target.value !== 'custom') setCustomDepartment('');
          }}
          disabled={disabled || !activeFloor}
          className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
        >
          <option value="">Birim Seçiniz... (Opsiyonel)</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
          <option value="custom">+ Yeni Birim Yaz...</option>
        </select>
        {selectedDepartment === 'custom' && (
          <input
            type="text"
            placeholder="Birim Adı (Örn: Acil Servis)"
            value={customDepartment}
            onChange={(e) => setCustomDepartment(e.target.value)}
            className="w-full h-8 mt-1 rounded-md border border-input bg-background px-2.5 text-xs"
          />
        )}
      </div>

      {/* 5. Mahal */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Mahal / Oda</Label>
        <select
          value={selectedUnit}
          onChange={(e) => {
            setSelectedUnit(e.target.value);
            if (e.target.value !== 'custom') setCustomUnit('');
          }}
          disabled={disabled || !activeDept}
          className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
        >
          <option value="">Mahal Seçiniz... (Opsiyonel)</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>{u.label}</option>
          ))}
          <option value="custom">+ Yeni Mahal Yaz...</option>
        </select>
        {selectedUnit === 'custom' && (
          <input
            type="text"
            placeholder="Mahal (Örn: Triaj Odası)"
            value={customUnit}
            onChange={(e) => setCustomUnit(e.target.value)}
            className="w-full h-8 mt-1 rounded-md border border-input bg-background px-2.5 text-xs"
          />
        )}
      </div>
    </div>
  );
}
