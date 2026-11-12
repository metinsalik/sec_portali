import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

interface SettingMultiSelectProps {
  value: string;
  onChange: (value: string) => void;
  endpoint: string;
  defaultOptions: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  ensureLastOption?: string;
}

/**
 * İyileştirme ayarlarından (Sorumlular, Denetim Adları vb.) beslenen,
 * aranabilir ve çoklu seçime izin veren ortak açılır liste bileşeni.
 */
export const SettingMultiSelect: React.FC<SettingMultiSelectProps> = ({
  value,
  onChange,
  endpoint,
  defaultOptions,
  placeholder = 'Seçin (birden fazla seçilebilir)...',
  searchPlaceholder = 'Ara...',
  emptyText = 'Eşleşen kayıt bulunamadı.',
  ensureLastOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rawOptions, setRawOptions] = useState<string[]>(defaultOptions);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const loadOptions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}${endpoint}`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const data = await res.json();
        if (active && data.success && Array.isArray(data.data)) {
          setRawOptions(data.data);
        }
      } catch {
        // Varsayılan liste korunur
      }
    };
    loadOptions();
    return () => {
      active = false;
    };
  }, [endpoint]);

  const options = useMemo(() => {
    if (!ensureLastOption) return rawOptions;
    const targetLower = ensureLastOption.toLocaleLowerCase('tr-TR');
    const withoutLast = rawOptions.filter(o => o.toLocaleLowerCase('tr-TR') !== targetLower);
    return [...withoutLast, ensureLastOption];
  }, [rawOptions, ensureLastOption]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 20);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const selectedItems = useMemo(() => {
    return (value || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }, [value]);

  const selectedSet = useMemo(() => {
    return new Set(selectedItems.map(s => s.toLocaleLowerCase('tr-TR')));
  }, [selectedItems]);

  const filteredOptions = useMemo(() => {
    const q = searchTerm.trim().toLocaleLowerCase('tr-TR');
    if (!q) return options;
    return options.filter(opt => opt.toLocaleLowerCase('tr-TR').includes(q));
  }, [options, searchTerm]);

  const toggleItem = (item: string) => {
    const lower = item.toLocaleLowerCase('tr-TR');
    let next: string[];
    if (selectedSet.has(lower)) {
      next = selectedItems.filter(s => s.toLocaleLowerCase('tr-TR') !== lower);
    } else {
      next = [...selectedItems, item];
    }
    onChange(next.join(', '));
  };

  const removeItem = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const lower = item.toLocaleLowerCase('tr-TR');
    const next = selectedItems.filter(s => s.toLocaleLowerCase('tr-TR') !== lower);
    onChange(next.join(', '));
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(prev => !prev)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(prev => !prev);
          }
        }}
        className="min-h-9 w-full px-2.5 py-1.5 rounded-lg border bg-background text-foreground text-xs flex items-center justify-between gap-2 cursor-pointer hover:border-primary/60 transition-colors"
      >
        <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
          {selectedItems.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedItems.map(item => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 font-medium text-[11px]"
              >
                <span className="truncate max-w-[160px]">{item}</span>
                <button
                  type="button"
                  onClick={e => removeItem(item, e)}
                  className="hover:text-blue-950 dark:hover:text-white"
                  title="Kaldır"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 rounded-lg border bg-popover text-popover-foreground shadow-lg">
          <div className="p-2 border-b flex items-center gap-2 bg-muted/30">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-52 overflow-y-auto divide-y divide-border/50">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = selectedSet.has(opt.toLocaleLowerCase('tr-TR'));
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleItem(opt)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted/70 transition-colors ${
                      isSelected ? 'bg-blue-50/70 dark:bg-blue-950/30 font-semibold' : ''
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-muted-foreground/40 bg-background'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{opt}</span>
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

