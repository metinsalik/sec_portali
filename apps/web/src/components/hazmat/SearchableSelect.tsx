import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface SearchableSelectOption {
  id: string;
  name: string;
  description?: string | null;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string, selectedOption?: SearchableSelectOption) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Seçiniz...',
  searchPlaceholder = 'Listede ara...',
  emptyMessage = 'Eşleşen kayıt bulunamadı.',
  disabled = false,
  allowClear = true,
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    // If trigger is out of screen vertically, close
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setIsOpen(false);
      return;
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldOpenUp = spaceBelow < 250 && spaceAbove > spaceBelow;

    if (shouldOpenUp) {
      setCoords({
        bottom: window.innerHeight - rect.top + 4,
        left: Math.max(8, rect.left),
        width: rect.width,
      });
    } else {
      setCoords({
        top: rect.bottom + 4,
        left: Math.max(8, rect.left),
        width: rect.width,
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    const focusTimer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 30);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const selectedOption = useMemo(() => {
    return options.find(
      (opt) =>
        String(opt.id) === String(value) ||
        opt.name.toLowerCase() === (value || '').toLowerCase()
    );
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const q = searchTerm.trim().toLocaleLowerCase('tr-TR');
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.name.toLocaleLowerCase('tr-TR').includes(q) ||
        (opt.description && opt.description.toLocaleLowerCase('tr-TR').includes(q))
    );
  }, [options, searchTerm]);

  const handleSelect = (option: SearchableSelectOption) => {
    onChange(String(option.id), option);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Tetikleyici Buton */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background transition-colors ${disabled
            ? 'cursor-not-allowed opacity-50'
            : 'hover:bg-accent/40 cursor-pointer'
          }`}
      >
        <div className="flex items-center gap-2 truncate text-left flex-1 min-w-0 pr-1">
          {selectedOption ? (
            <span className="font-medium text-foreground truncate">
              {selectedOption.name}
            </span>
          ) : (
            <span className="text-muted-foreground truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {allowClear && selectedOption && !disabled && (
            <span
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer transition-colors"
              title="Seçimi Temizle"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
              }`}
          />
        </div>
      </button>

      {/* Portal ile Doğrudan Body'e Render Edilen Açılır Menü (Kartların Dışına Taşar, Kırpılmaz) */}
      {isOpen &&
        !disabled &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom:
                coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 9999,
            }}
            className="rounded-lg border border-border bg-popover text-popover-foreground shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100"
          >
            <div className="p-2 border-b border-border/60 flex items-center gap-2 bg-muted/40">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-7 border-0 bg-transparent focus-visible:ring-0 px-1 text-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                  title="Aramayı temizle"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-border/40">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected =
                    String(opt.id) === String(value) ||
                    opt.name.toLowerCase() === (value || '').toLowerCase();
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelect(opt)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-start gap-2.5 transition-colors hover:bg-muted/70 ${isSelected
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-foreground'
                        }`}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/40 bg-background'
                          }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold leading-tight">
                          {opt.name}
                        </div>
                        {opt.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                            {opt.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Seçili öğenin açıklaması (trigger altında gösterilir) */}
      {selectedOption?.description && (
        <p className="text-[11px] text-muted-foreground italic px-0.5 pt-0.5 leading-tight">
          {selectedOption.description}
        </p>
      )}
    </div>
  );
}
