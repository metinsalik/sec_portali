import { useState, useMemo, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import {
  decodeGroup5LocationId,
  encodeGroup5LocationId,
  extractLocationParts,
  compareFloors,
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
  const [selectedMahal, setSelectedMahal] = useState<string>('');

  const [customDepartment, setCustomDepartment] = useState<string>('');
  const [customMahal, setCustomMahal] = useState<string>('');

  const lastEmittedValueRef = useRef<string>('');

  const parsedLocations = useMemo(
    () => locations.map((l) => ({ raw: l, parts: extractLocationParts(l) })),
    [locations]
  );

  // 1. Bina Adları (Sadece sistemde mevcut olanlar)
  const buildingNames = useMemo(() => {
    const set = new Set<string>();
    parsedLocations.forEach(({ parts }) => {
      if (parts.buildingName) set.add(parts.buildingName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [parsedLocations]);

  // Otomatik tek bina varsa seç
  useEffect(() => {
    if (!selectedBuildingName && buildingNames.length === 1) {
      setSelectedBuildingName(buildingNames[0]);
    }
  }, [buildingNames, selectedBuildingName]);

  // 2. Bloklar (Seçili bina için sistemde mevcut olanlar)
  const blocks = useMemo(() => {
    if (!selectedBuildingName) return [];
    const set = new Set<string>();
    parsedLocations.forEach(({ parts }) => {
      if (parts.buildingName === selectedBuildingName && parts.block) {
        set.add(parts.block);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [parsedLocations, selectedBuildingName]);

  // 3. Katlar (Sayısal olarak yukarıdan aşağıya sıralı: 13, 12, ... 1, Zemin, -1, -2)
  const floors = useMemo(() => {
    if (!selectedBuildingName) return [];
    const set = new Set<string>();
    parsedLocations.forEach(({ parts }) => {
      const bMatch = parts.buildingName === selectedBuildingName;
      const blkMatch = !selectedBlock || parts.block === selectedBlock;
      if (bMatch && blkMatch && parts.floor) {
        set.add(parts.floor);
      }
    });
    return Array.from(set).sort((a, b) => compareFloors(a, b, true));
  }, [parsedLocations, selectedBuildingName, selectedBlock]);

  const activeDept = selectedDepartment === 'custom' ? customDepartment.trim() : selectedDepartment;

  // 4. Birimler (Seçili kata ait olanlar ve tesis genelinde kayıtlı olanlar)
  const floorDepartments = useMemo(() => {
    if (!selectedBuildingName) return [];
    const set = new Set<string>();
    parsedLocations.forEach(({ parts }) => {
      const bMatch = parts.buildingName === selectedBuildingName;
      const blkMatch = !selectedBlock || parts.block === selectedBlock;
      const flrMatch = !selectedFloor || parts.floor === selectedFloor;
      if (bMatch && blkMatch && flrMatch && parts.department) {
        set.add(parts.department);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [parsedLocations, selectedBuildingName, selectedBlock, selectedFloor]);

  const allFacilityDepartments = useMemo(() => {
    const set = new Set<string>();
    parsedLocations.forEach(({ parts }) => {
      if (parts.department) {
        set.add(parts.department);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [parsedLocations]);

  const otherDepartments = useMemo(() => {
    return allFacilityDepartments.filter((d) => !floorDepartments.includes(d));
  }, [allFacilityDepartments, floorDepartments]);

  // 5. Mahaller (Seçili kata/birime ait olanlar ve birimin diğer mahalleri)
  const floorMahals = useMemo(() => {
    if (!selectedBuildingName) return [];
    const set = new Set<string>();
    parsedLocations.forEach(({ parts }) => {
      const bMatch = parts.buildingName === selectedBuildingName;
      const blkMatch = !selectedBlock || parts.block === selectedBlock;
      const flrMatch = !selectedFloor || parts.floor === selectedFloor;
      const deptMatch = !activeDept || parts.department.toLowerCase() === activeDept.toLowerCase();
      if (bMatch && blkMatch && flrMatch && deptMatch && parts.description) {
        set.add(parts.description);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [parsedLocations, selectedBuildingName, selectedBlock, selectedFloor, activeDept]);

  const allDeptMahals = useMemo(() => {
    if (!activeDept) return [];
    const set = new Set<string>();
    parsedLocations.forEach(({ parts }) => {
      if (parts.department.toLowerCase() === activeDept.toLowerCase() && parts.description) {
        set.add(parts.description);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [parsedLocations, activeDept]);

  const otherMahals = useMemo(() => {
    return allDeptMahals.filter((m) => !floorMahals.includes(m));
  }, [allDeptMahals, floorMahals]);

  // Initial sync from external value (Edit mode or preset)
  useEffect(() => {
    if (!value) return;
    // Do not re-sync if this value was emitted by this component itself
    if (value === lastEmittedValueRef.current) return;

    if (value.startsWith('group5:')) {
      const p = decodeGroup5LocationId(value);
      if (p) {
        if (p.buildingName) setSelectedBuildingName(p.buildingName);
        if (p.block) setSelectedBlock(p.block);
        if (p.floor) setSelectedFloor(p.floor);

        if (p.department) {
          const deptMatch = parsedLocations.find(
            (l) => l.parts.department?.toLowerCase() === p.department.toLowerCase()
          );
          if (deptMatch) {
            setSelectedDepartment(deptMatch.parts.department);
            setCustomDepartment('');
          } else {
            setSelectedDepartment('custom');
            setCustomDepartment(p.department);
          }
        }

        if (p.description) {
          const descMatch = parsedLocations.find(
            (l) => l.parts.description?.toLowerCase() === p.description.toLowerCase()
          );
          if (descMatch) {
            setSelectedMahal(descMatch.parts.description);
            setCustomMahal('');
          } else {
            setSelectedMahal('custom');
            setCustomMahal(p.description);
          }
        }
      }
      return;
    }

    const match = parsedLocations.find((item) => item.raw.id === value);
    if (match) {
      if (match.parts.buildingName) setSelectedBuildingName(match.parts.buildingName);
      if (match.parts.block) setSelectedBlock(match.parts.block);
      if (match.parts.floor) setSelectedFloor(match.parts.floor);
      if (match.parts.department) {
        setSelectedDepartment(match.parts.department);
        setCustomDepartment('');
      } else {
        setSelectedDepartment('');
        setCustomDepartment('');
      }
      if (match.parts.description) {
        setSelectedMahal(match.parts.description);
        setCustomMahal('');
      } else {
        setSelectedMahal('');
        setCustomMahal('');
      }
    }
  }, [value, parsedLocations]);

  const activeDesc = selectedMahal === 'custom' ? customMahal.trim() : selectedMahal;

  // Emit change when user changes selection
  useEffect(() => {
    if (!selectedBuildingName) return;

    // Check exact existing FacilityLocation match
    const exactMatch = parsedLocations.find(({ parts }) => {
      return (
        parts.buildingName.toLowerCase() === selectedBuildingName.toLowerCase() &&
        (parts.block || '').toLowerCase() === (selectedBlock || '').toLowerCase() &&
        (parts.floor || '').toLowerCase() === (selectedFloor || '').toLowerCase() &&
        (parts.department || '').toLowerCase() === (activeDept || '').toLowerCase() &&
        (parts.description || '').toLowerCase() === (activeDesc || '').toLowerCase()
      );
    });

    const level = activeDesc
      ? 'description'
      : activeDept
      ? 'department'
      : selectedFloor
      ? 'floor'
      : selectedBlock
      ? 'building'
      : 'buildingName';

    const emitValue = exactMatch
      ? exactMatch.raw.id
      : encodeGroup5LocationId({
          buildingName: selectedBuildingName,
          block: selectedBlock,
          floor: selectedFloor,
          department: activeDept,
          description: activeDesc,
        });

    if (emitValue && emitValue !== value) {
      lastEmittedValueRef.current = emitValue;
      onChange(emitValue, level, {
        buildingName: selectedBuildingName,
        block: selectedBlock,
        building: selectedBlock,
        floor: selectedFloor,
        department: activeDept,
        description: activeDesc,
      });
    }
  }, [
    selectedBuildingName,
    selectedBlock,
    selectedFloor,
    activeDept,
    activeDesc,
    parsedLocations,
    value,
    onChange,
  ]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {/* 1. Bina Adı (Sistemde tanımlı olanlar) */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Bina Adı *</Label>
        <select
          value={selectedBuildingName}
          onChange={(e) => {
            setSelectedBuildingName(e.target.value);
            setSelectedBlock('');
            setSelectedFloor('');
            setSelectedDepartment('');
            setSelectedMahal('');
            setCustomDepartment('');
            setCustomMahal('');
          }}
          disabled={disabled}
          className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs focus:ring-2 focus:ring-ring focus:outline-none"
        >
          <option value="">Bina Seçiniz...</option>
          {buildingNames.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* 2. Blok (Sistemde tanımlı olanlar) */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Blok (Opsiyonel)</Label>
        <select
          value={selectedBlock}
          onChange={(e) => {
            setSelectedBlock(e.target.value);
            setSelectedFloor('');
            setSelectedDepartment('');
            setSelectedMahal('');
            setCustomDepartment('');
            setCustomMahal('');
          }}
          disabled={disabled || !selectedBuildingName}
          className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
        >
          <option value="">{blocks.length > 0 ? 'Tüm Bloklar / Seçilmedi' : 'Tek Blok / Genel'}</option>
          {blocks.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* 3. Kat (Sayısal Sıralı) */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Kat</Label>
        <select
          value={selectedFloor}
          onChange={(e) => {
            setSelectedFloor(e.target.value);
            setSelectedDepartment('');
            setSelectedMahal('');
            setCustomDepartment('');
            setCustomMahal('');
          }}
          disabled={disabled || !selectedBuildingName}
          className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
        >
          <option value="">Kat Seçiniz... (Opsiyonel)</option>
          {floors.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* 4. Birim (Kayıtlılar + Yeni Birim Yaz) */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Birim</Label>
        <select
          value={selectedDepartment}
          onChange={(e) => {
            setSelectedDepartment(e.target.value);
            setSelectedMahal('');
            if (e.target.value !== 'custom') setCustomDepartment('');
            setCustomMahal('');
          }}
          disabled={disabled || !selectedBuildingName}
          className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
        >
          <option value="">Birim Seçiniz... (Opsiyonel)</option>
          {floorDepartments.length > 0 && (
            <optgroup label="Bu Katta Tanımlı Birimler">
              {floorDepartments.map((d) => (
                <option key={`flr-d-${d}`} value={d}>{d}</option>
              ))}
            </optgroup>
          )}
          {otherDepartments.length > 0 && (
            <optgroup label="Diğer Kayıtlı Birimler">
              {otherDepartments.map((d) => (
                <option key={`oth-d-${d}`} value={d}>{d}</option>
              ))}
            </optgroup>
          )}
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

      {/* 5. Mahal (Kayıtlılar + Yeni Mahal Yaz) */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Mahal / Oda</Label>
        <select
          value={selectedMahal}
          onChange={(e) => {
            setSelectedMahal(e.target.value);
            if (e.target.value !== 'custom') setCustomMahal('');
          }}
          disabled={disabled || (!selectedFloor && !activeDept)}
          className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
        >
          <option value="">Mahal Seçiniz... (Opsiyonel)</option>
          {floorMahals.length > 0 && (
            <optgroup label="Bu Katta / Birimde Tanımlı Mahaller">
              {floorMahals.map((m) => (
                <option key={`flr-m-${m}`} value={m}>{m}</option>
              ))}
            </optgroup>
          )}
          {otherMahals.length > 0 && (
            <optgroup label="Diğer Kayıtlı Mahaller">
              {otherMahals.map((m) => (
                <option key={`oth-m-${m}`} value={m}>{m}</option>
              ))}
            </optgroup>
          )}
          <option value="custom">+ Yeni Mahal Yaz...</option>
        </select>
        {selectedMahal === 'custom' && (
          <input
            type="text"
            placeholder="Mahal (Örn: Triaj Odası)"
            value={customMahal}
            onChange={(e) => setCustomMahal(e.target.value)}
            className="w-full h-8 mt-1 rounded-md border border-input bg-background px-2.5 text-xs"
          />
        )}
      </div>
    </div>
  );
}
