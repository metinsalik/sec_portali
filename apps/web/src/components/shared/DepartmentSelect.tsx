import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Check, ChevronDown, Search, X, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface DepartmentOption {
  id: number;
  name: string;
  usageCount?: number;
}

export function useDepartments(withUsage = false) {
  return useQuery<DepartmentOption[]>({
    queryKey: withUsage ? ['departments', 'withUsage'] : ['departments'],
    queryFn: async () => {
      const res = await api.get(
        withUsage ? '/settings/definitions/departments?withUsage=true' : '/settings/definitions/departments'
      );
      if (!res.ok) throw new Error('Departmanlar yüklenemedi.');
      return res.json();
    },
    staleTime: 60_000,
  });
}

interface DepartmentSelectProps {
  /** Selected value (department name or id string depending on valueType) */
  value: string;
  onChange: (value: string) => void;
  /** 'name' (default) stores Department.name; 'id' stores String(Department.id) */
  valueType?: 'name' | 'id';
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  excludeIds?: number[];
  className?: string;
}

/**
 * Tekli departman seçici — yalnızca /settings/definitions üzerindeki
 * kurumsal departmanların seçilmesine izin verir (serbest metin kapalıdır).
 */
export const DepartmentSelect: React.FC<DepartmentSelectProps> = ({
  value,
  onChange,
  valueType = 'name',
  placeholder = 'Departman seçiniz...',
  searchPlaceholder = 'Departman ara...',
  disabled = false,
  allowClear = false,
  excludeIds,
  className = '',
}) => {
  const { data: departments = [], isLoading } = useDepartments();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const available = useMemo(() => {
    const excluded = new Set(excludeIds || []);
    return departments.filter((d) => !excluded.has(d.id));
  }, [departments, excludeIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR');
    if (!q) return available;
    return available.filter((d) => d.name.toLocaleLowerCase('tr-TR').includes(q));
  }, [available, search]);

  const selectedLabel = useMemo(() => {
    if (!value) return '';
    if (valueType === 'id') {
      const found = departments.find((d) => String(d.id) === String(value));
      return found ? found.name : '';
    }
    return value;
  }, [value, valueType, departments]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={`truncate text-left ${selectedLabel ? 'text-foreground' : 'text-muted-foreground'}`}>
          {selectedLabel || (isLoading ? 'Yükleniyor...' : placeholder)}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {allowClear && value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] rounded-md border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                Eşleşen departman bulunamadı.
              </div>
            ) : (
              filtered.map((dept) => {
                const optionVal = valueType === 'id' ? String(dept.id) : dept.name;
                const isSelected = String(value) === optionVal;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      onChange(optionVal);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs transition-colors ${
                      isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <span className="truncate flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {dept.name}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface DepartmentMultiSelectProps {
  /** Comma-separated string or string[] */
  value: string | string[];
  onChange: (value: any) => void;
  /** 'csv' (default when value is string) or 'array' */
  mode?: 'csv' | 'array';
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Çoklu departman seçici — yalnızca /settings/definitions üzerindeki
 * kurumsal departmanların seçilmesine izin verir (serbest metin kapalıdır).
 */
export const DepartmentMultiSelect: React.FC<DepartmentMultiSelectProps> = ({
  value,
  onChange,
  mode,
  placeholder = 'Departman / sorumlu birim seçin...',
  searchPlaceholder = 'Departman ara...',
  disabled = false,
  className = '',
}) => {
  const { data: departments = [], isLoading } = useDepartments();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveMode = mode || (Array.isArray(value) ? 'array' : 'csv');

  const selectedList = useMemo<string[]>(() => {
    if (Array.isArray(value)) return value.map((v) => v.trim()).filter(Boolean);
    if (!value) return [];
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR');
    if (!q) return departments;
    return departments.filter((d) => d.name.toLocaleLowerCase('tr-TR').includes(q));
  }, [departments, search]);

  const emit = (next: string[]) => {
    if (effectiveMode === 'array') {
      onChange(next);
    } else {
      onChange(next.join(', '));
    }
  };

  const toggle = (name: string) => {
    const exists = selectedList.some((s) => s.toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'));
    if (exists) {
      emit(selectedList.filter((s) => s.toLocaleLowerCase('tr-TR') !== name.toLocaleLowerCase('tr-TR')));
    } else {
      emit([...selectedList, name]);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        className={`flex min-h-9 w-full flex-wrap items-center justify-between gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm transition-colors ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-muted/30'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
          {selectedList.length === 0 ? (
            <span className="text-xs text-muted-foreground px-0.5">
              {isLoading ? 'Yükleniyor...' : placeholder}
            </span>
          ) : (
            selectedList.map((item) => (
              <Badge key={item} variant="secondary" className="gap-1 text-xs font-normal py-0.5 px-2">
                <span className="truncate max-w-[180px]">{item}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(item);
                    }}
                    className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full min-w-[240px] rounded-md border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                Eşleşen departman bulunamadı.
              </div>
            ) : (
              filtered.map((dept) => {
                const isSelected = selectedList.some(
                  (s) => s.toLocaleLowerCase('tr-TR') === dept.name.toLocaleLowerCase('tr-TR')
                );
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => toggle(dept.name)}
                    className={`flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs transition-colors ${
                      isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <span className="truncate">{dept.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-border px-2.5 py-1.5 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>{selectedList.length} seçili</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-primary font-medium hover:underline"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
