import { useState, useMemo, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
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

  const [dynamicDepartments, setDynamicDepartments] = useState<string[]>([]);
  const [dynamicMahals, setDynamicMahals] = useState<string[]>([]);

  const lastEmittedValueRef = useRef<string>('');

  const confirmCustomDepartment = () => {
    const val = customDepartment.trim();
    if (!val) {
      toast.error('Lütfen birim adını yazınız.');
      return;
    }
    setDynamicDepartments((prev) => Array.from(new Set([...prev, val])));
    setSelectedDepartment(val);
    setCustomDepartment('');
    toast.success(`"${val}" birimi eklendi ve seçildi ✓`);
  };

  const confirmCustomMahal = () => {
    const val = customMahal.trim();
    if (!val) {
      toast.error('Lütfen mahal adını yazınız.');
      return;
    }
    setDynamicMahals((prev) => Array.from(new Set([...prev, val])));
    setSelectedMahal(val);
    setCustomMahal('');
    toast.success(`"${val}" mahali eklendi ve seçildi ✓`);
  };

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
    dynamicDepartments.forEach((d) => set.add(d));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [parsedLocations, dynamicDepartments]);

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
    dynamicMahals.forEach((m) => set.add(m));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [parsedLocations, selectedBuildingName, selectedBlock, selectedFloor, activeDept, dynamicMahals]);

  const allDeptMahals = useMemo(() => {
    const set = new Set<string>();
    if (activeDept) {
      parsedLocations.forEach(({ parts }) => {
        if (parts.department.toLowerCase() === activeDept.toLowerCase() && parts.description) {
          set.add(parts.description);
        }
      });
    }
    dynamicMahals.forEach((m) => set.add(m));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [parsedLocations, activeDept, dynamicMahals]);

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
            setDynamicDepartments((prev) => Array.from(new Set([...prev, p.department])));
            setSelectedDepartment(p.department);
            setCustomDepartment('');
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
            setDynamicMahals((prev) => Array.from(new Set([...prev, p.description])));
            setSelectedMahal(p.description);
            setCustomMahal('');
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
        <div className="flex items-center min-h-[20px]">
          <Label className="text-xs font-medium">Bina Adı *</Label>
        </div>
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
        <div className="flex items-center min-h-[20px]">
          <Label className="text-xs font-medium">Blok (Opsiyonel)</Label>
        </div>
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
        <div className="flex items-center min-h-[20px]">
          <Label className="text-xs font-medium">Kat</Label>
        </div>
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
        <div className="flex items-center justify-between min-h-[20px]">
          <Label className="text-xs font-medium">
            {selectedDepartment === 'custom' ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Yeni Birim
              </span>
            ) : (
              'Birim'
            )}
          </Label>
          {selectedDepartment === 'custom' ? (
            <button
              type="button"
              onClick={() => {
                setSelectedDepartment('');
                setCustomDepartment('');
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground hover:underline transition-colors cursor-pointer"
            >
              Listeye Dön
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled || !selectedBuildingName}
              onClick={() => {
                setSelectedDepartment('custom');
                setCustomDepartment('');
              }}
              className="text-[11px] text-primary hover:underline font-normal disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              + Yeni Yaz
            </button>
          )}
        </div>

        {selectedDepartment === 'custom' ? (
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Birim Adı (Örn: Acil Servis)"
              value={customDepartment}
              onChange={(e) => setCustomDepartment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  confirmCustomDepartment();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setSelectedDepartment('');
                  setCustomDepartment('');
                }
              }}
              autoFocus
              className="w-full h-9 rounded-md border-2 border-emerald-500/80 bg-background pl-2.5 pr-14 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors shadow-xs"
            />
            <div className="absolute right-1 inset-y-1 flex items-center gap-0.5">
              <Button
                type="button"
                size="sm"
                className="h-7 w-7 p-0 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-xs rounded flex items-center justify-center cursor-pointer"
                onClick={confirmCustomDepartment}
                title="Kaydet ve Seç (Enter / ✓)"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0 rounded flex items-center justify-center cursor-pointer"
                onClick={() => {
                  setSelectedDepartment('');
                  setCustomDepartment('');
                }}
                title="İptal (Esc / ✕)"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
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
            {selectedDepartment &&
              selectedDepartment !== 'custom' &&
              !floorDepartments.includes(selectedDepartment) &&
              !otherDepartments.includes(selectedDepartment) && (
                <option value={selectedDepartment}>{selectedDepartment}</option>
              )}
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
        )}
      </div>

      {/* 5. Mahal (Kayıtlılar + Yeni Mahal Yaz) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between min-h-[20px]">
          <Label className="text-xs font-medium">
            {selectedMahal === 'custom' ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Yeni Mahal
              </span>
            ) : (
              'Mahal / Oda'
            )}
          </Label>
          {selectedMahal === 'custom' ? (
            <button
              type="button"
              onClick={() => {
                setSelectedMahal('');
                setCustomMahal('');
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground hover:underline transition-colors cursor-pointer"
            >
              Listeye Dön
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled || (!selectedFloor && !activeDept)}
              onClick={() => {
                setSelectedMahal('custom');
                setCustomMahal('');
              }}
              className="text-[11px] text-primary hover:underline font-normal disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              + Yeni Yaz
            </button>
          )}
        </div>

        {selectedMahal === 'custom' ? (
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Mahal (Örn: Triaj Odası)"
              value={customMahal}
              onChange={(e) => setCustomMahal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  confirmCustomMahal();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setSelectedMahal('');
                  setCustomMahal('');
                }
              }}
              autoFocus
              className="w-full h-9 rounded-md border-2 border-emerald-500/80 bg-background pl-2.5 pr-14 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors shadow-xs"
            />
            <div className="absolute right-1 inset-y-1 flex items-center gap-0.5">
              <Button
                type="button"
                size="sm"
                className="h-7 w-7 p-0 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-xs rounded flex items-center justify-center cursor-pointer"
                onClick={confirmCustomMahal}
                title="Kaydet ve Seç (Enter / ✓)"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0 rounded flex items-center justify-center cursor-pointer"
                onClick={() => {
                  setSelectedMahal('');
                  setCustomMahal('');
                }}
                title="İptal (Esc / ✕)"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
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
            {selectedMahal &&
              selectedMahal !== 'custom' &&
              !floorMahals.includes(selectedMahal) &&
              !otherMahals.includes(selectedMahal) && (
                <option value={selectedMahal}>{selectedMahal}</option>
              )}
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
        )}
      </div>
    </div>
  );
}
