import { useState, useMemo, useEffect } from 'react';
import { Label } from '@/components/ui/label';

interface LocationCascadingSelectorProps {
  locations: any[];
  value: string;
  onChange: (locationId: string, level: string, selectedPath: any) => void;
  disabled?: boolean;
}

export default function LocationCascadingSelector({ locations, value, onChange, disabled }: LocationCascadingSelectorProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  const [customBuilding, setCustomBuilding] = useState<string>('');
  const [customFloor, setCustomFloor] = useState<string>('');
  const [customDepartment, setCustomDepartment] = useState<string>('');
  const [customUnit, setCustomUnit] = useState<string>('');

  // Extract unique buildings
  const buildings = useMemo(() => {
    const set = new Set<string>();
    locations.forEach(l => { if (l.building) set.add(l.building); });
    return Array.from(set).sort();
  }, [locations]);

  // Extract floors for selected building
  const floors = useMemo(() => {
    if (!selectedBuilding) return [];
    const set = new Set<string>();
    locations.forEach(l => {
      if (l.building === selectedBuilding && l.floor) set.add(l.floor);
    });
    return Array.from(set).sort();
  }, [locations, selectedBuilding]);

  // Extract departments for selected building & floor
  const departments = useMemo(() => {
    if (!selectedBuilding) return [];
    const set = new Set<string>();
    locations.forEach(l => {
      const floorMatch = (!selectedFloor && !l.floor) || (l.floor === selectedFloor);
      if (l.building === selectedBuilding && floorMatch && l.department) {
        set.add(l.department);
      }
    });
    return Array.from(set).sort();
  }, [locations, selectedBuilding, selectedFloor]);

  // Extract units for selected building & floor & department
  const units = useMemo(() => {
    if (!selectedBuilding) return [];
    const list: any[] = [];
    locations.forEach(l => {
      const floorMatch = (!selectedFloor && !l.floor) || (l.floor === selectedFloor);
      const deptMatch = (!selectedDepartment && !l.department) || (l.department === selectedDepartment);
      if (l.building === selectedBuilding && floorMatch && deptMatch) {
        if (l.description || l.name) {
          list.push(l);
        }
      }
    });
    return list.sort((a, b) => (a.description || a.name || '').localeCompare(b.description || b.name || ''));
  }, [locations, selectedBuilding, selectedFloor, selectedDepartment]);

  // Sync initial value if provided
  useEffect(() => {
    if (value && locations.length > 0) {
      if (value.startsWith('group:')) {
        const parts = value.split(':');
        // group:{level}:{facId}:{path...}
        const level = parts[1];
        const facId = parts[2];
        const path = parts.slice(3).join(':');
        const pathParts = path.split('|');

        if (level === 'building') {
          setSelectedBuilding(pathParts[0] || '');
        } else if (level === 'floor') {
          setSelectedBuilding(pathParts[0] || '');
          setSelectedFloor(pathParts[1] || '');
        } else if (level === 'department' || !['building', 'floor', 'department'].includes(level)) {
          // Fallback if it's the old 'group:facId:deptName' format
          if (parts.length === 3 && !['building', 'floor', 'department'].includes(level)) {
             const deptMatch = locations.find(l => l.department === parts[2]);
             if (deptMatch) {
               setSelectedBuilding(deptMatch.building || '');
               setSelectedFloor(deptMatch.floor || '');
               setSelectedDepartment(deptMatch.department || '');
             }
          } else {
            setSelectedBuilding(pathParts[0] || '');
            setSelectedFloor(pathParts[1] || '');
            setSelectedDepartment(pathParts[2] || '');
          }
        }
      } else {
        const match = locations.find(l => l.id === value);
        if (match) {
          setSelectedBuilding(match.building || '');
          setSelectedFloor(match.floor || '');
          setSelectedDepartment(match.department || '');
          setSelectedUnit(match.id);
        }
      }
    }
  }, [value, locations]);

  // Handle value emission
  useEffect(() => {
    const finalBuilding = customBuilding || selectedBuilding;
    const finalFloor = customFloor || selectedFloor;
    const finalDepartment = customDepartment || selectedDepartment;
    const finalUnit = customUnit || selectedUnit;

    let level = 'building';
    let emitValue = '';
    const facId = locations[0]?.facilityId || '';

    if (finalBuilding && finalFloor && finalDepartment && finalUnit) {
      level = 'unit';
      emitValue = finalUnit;
    } else if (finalBuilding && finalFloor && finalDepartment) {
      level = 'department';
      const match = locations.find(l => l.building === finalBuilding && l.floor === finalFloor && l.department === finalDepartment && !l.description);
      emitValue = match ? match.id : `group:department:${facId}:${finalBuilding}|${finalFloor}|${finalDepartment}`;
    } else if (finalBuilding && finalFloor) {
      level = 'floor';
      const match = locations.find(l => l.building === finalBuilding && l.floor === finalFloor && !l.department && !l.description);
      emitValue = match ? match.id : `group:floor:${facId}:${finalBuilding}|${finalFloor}`;
    } else if (finalBuilding) {
      level = 'building';
      const match = locations.find(l => l.building === finalBuilding && !l.floor && !l.department && !l.description);
      emitValue = match ? match.id : `group:building:${facId}:${finalBuilding}`;
    }

    if (emitValue && emitValue !== value) {
      onChange(emitValue, level, {
        building: finalBuilding,
        floor: finalFloor,
        department: finalDepartment,
        description: customUnit || (locations.find(l => l.id === selectedUnit)?.description) || ''
      });
    }
  }, [selectedBuilding, selectedFloor, selectedDepartment, selectedUnit, customBuilding, customFloor, customDepartment, customUnit]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Bina Seçimi */}
      <div className="space-y-1.5">
        <Label>Bina (Blok)</Label>
        <select 
          value={selectedBuilding} 
          onChange={e => {
            setSelectedBuilding(e.target.value);
            setSelectedFloor('');
            setSelectedDepartment('');
            setSelectedUnit('');
            setCustomBuilding(e.target.value === 'custom' ? customBuilding : '');
          }}
          disabled={disabled}
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
        >
          <option value="">Bina Seçiniz...</option>
          {buildings.map(b => <option key={b} value={b}>{b}</option>)}
          <option value="custom">+ Yeni Bina Yaz...</option>
        </select>
        {selectedBuilding === 'custom' && (
          <input 
            type="text" 
            placeholder="Bina Adı" 
            value={customBuilding} 
            onChange={e => setCustomBuilding(e.target.value)} 
            className="w-full h-9 mt-2 rounded-md border border-input bg-background px-3 text-sm"
          />
        )}
      </div>

      {/* Kat Seçimi */}
      <div className="space-y-1.5">
        <Label>Kat</Label>
        <select 
          value={selectedFloor} 
          onChange={e => {
            setSelectedFloor(e.target.value);
            setSelectedDepartment('');
            setSelectedUnit('');
            setCustomFloor(e.target.value === 'custom' ? customFloor : '');
          }}
          disabled={disabled || (!selectedBuilding && !customBuilding)}
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
        >
          <option value="">Kat Seçiniz...</option>
          {floors.map(f => <option key={f} value={f}>{f}</option>)}
          <option value="custom">+ Yeni Kat Yaz...</option>
        </select>
        {selectedFloor === 'custom' && (
          <input 
            type="text" 
            placeholder="Kat Adı" 
            value={customFloor} 
            onChange={e => setCustomFloor(e.target.value)} 
            className="w-full h-9 mt-2 rounded-md border border-input bg-background px-3 text-sm"
          />
        )}
      </div>

      {/* Birim Seçimi */}
      <div className="space-y-1.5">
        <Label>Birim (Departman)</Label>
        <select 
          value={selectedDepartment} 
          onChange={e => {
            setSelectedDepartment(e.target.value);
            setSelectedUnit('');
            setCustomDepartment(e.target.value === 'custom' ? customDepartment : '');
          }}
          disabled={disabled || (!selectedFloor && !customFloor)}
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
        >
          <option value="">Birim Seçiniz...</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
          <option value="custom">+ Yeni Birim Yaz...</option>
        </select>
        {selectedDepartment === 'custom' && (
          <input 
            type="text" 
            placeholder="Birim Adı" 
            value={customDepartment} 
            onChange={e => setCustomDepartment(e.target.value)} 
            className="w-full h-9 mt-2 rounded-md border border-input bg-background px-3 text-sm"
          />
        )}
      </div>

      {/* Mahal Seçimi */}
      <div className="space-y-1.5">
        <Label>Mahal (Oda / Detay)</Label>
        <select 
          value={selectedUnit} 
          onChange={e => {
            setSelectedUnit(e.target.value);
            setCustomUnit(e.target.value === 'custom' ? customUnit : '');
          }}
          disabled={disabled || (!selectedDepartment && !customDepartment)}
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
        >
          <option value="">Mahal Seçiniz... (Opsiyonel)</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.description || u.name}</option>)}
          <option value="custom">+ Yeni Mahal Yaz...</option>
        </select>
        {selectedUnit === 'custom' && (
          <input 
            type="text" 
            placeholder="Mahal Açıklaması (Örn: Depo 2)" 
            value={customUnit} 
            onChange={e => setCustomUnit(e.target.value)} 
            className="w-full h-9 mt-2 rounded-md border border-input bg-background px-3 text-sm"
          />
        )}
      </div>
    </div>
  );
}
