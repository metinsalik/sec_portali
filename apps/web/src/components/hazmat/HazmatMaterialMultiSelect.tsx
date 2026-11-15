import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check, X, ShieldAlert, PackageSearch } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface HazmatMaterialMultiSelectProps {
  materials: any[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function HazmatMaterialMultiSelect({
  materials,
  selectedIds = [],
  onChange,
  disabled = false,
}: HazmatMaterialMultiSelectProps) {
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

    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setIsOpen(false);
      return;
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldOpenUp = spaceBelow < 280 && spaceAbove > spaceBelow;

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

  const selectedMaterials = useMemo(() => {
    const set = new Set(selectedIds.map(String));
    return materials.filter((m) => set.has(String(m.id)));
  }, [materials, selectedIds]);

  const filteredMaterials = useMemo(() => {
    const q = searchTerm.trim().toLocaleLowerCase('tr-TR');
    if (!q) return materials;
    return materials.filter((m) => {
      const name = (m.productName || '').toLocaleLowerCase('tr-TR');
      const brand = (m.brandName || '').toLocaleLowerCase('tr-TR');
      const cat = (m.category?.name || '').toLocaleLowerCase('tr-TR');
      const cas = (m.casNumber || '').toLocaleLowerCase('tr-TR');
      return name.includes(q) || brand.includes(q) || cat.includes(q) || cas.includes(q);
    });
  }, [materials, searchTerm]);

  const toggleMaterial = (id: string) => {
    if (disabled) return;
    const strId = String(id);
    const set = new Set(selectedIds.map(String));
    if (set.has(strId)) {
      set.delete(strId);
    } else {
      set.add(strId);
    }
    onChange(Array.from(set));
  };

  const removeMaterial = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    const strId = String(id);
    onChange(selectedIds.map(String).filter((itemId) => itemId !== strId));
  };

  return (
    <div className="space-y-2">
      {/* Açılır Tetikleyici Buton */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || materials.length === 0}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background transition-colors ${
          disabled || materials.length === 0
            ? 'cursor-not-allowed opacity-60'
            : 'hover:bg-accent/40 cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2 truncate text-left flex-1 min-w-0 pr-2">
          <PackageSearch className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground">
            {selectedIds.length > 0
              ? `${selectedIds.length} Madde Seçili`
              : '0 Madde Seçili'}
          </span>
          <span className="text-muted-foreground truncate hidden sm:inline">
            {selectedIds.length > 0
              ? '(Değiştirmek veya eklemek için tıklayın)'
              : '- Olaya karışan kimyasalları arayın ve seçin...'}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Portal ile Doğrudan Body'e Render Edilen Çoklu Seçim Menüsü */}
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
                placeholder="Tehlikeli madde adı, marka veya kategori ara..."
                className="h-8 border-0 bg-transparent focus-visible:ring-0 px-1 text-xs"
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

            <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
              {filteredMaterials.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  {materials.length === 0
                    ? 'Bu tesiste kayıtlı tehlikeli madde bulunmamaktadır.'
                    : 'Arama kriterlerine uygun kimyasal madde bulunamadı.'}
                </div>
              ) : (
                filteredMaterials.map((m: any) => {
                  const isSelected = selectedIds.map(String).includes(String(m.id));
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMaterial(m.id)}
                      className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between gap-3 transition-colors hover:bg-muted/70 ${
                        isSelected ? 'bg-primary/10 text-primary' : 'text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground/40 bg-background'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-foreground truncate">
                              {m.productName}
                            </span>
                            {m.brandName && (
                              <span className="text-[11px] text-muted-foreground">
                                ({m.brandName})
                              </span>
                            )}
                          </div>
                          {m.casNumber && (
                            <span className="text-[10px] text-muted-foreground font-mono block">
                              CAS: {m.casNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      {m.category?.name && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0.5 px-1.5 font-normal shrink-0"
                        >
                          {m.category.name}
                        </Badge>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {selectedIds.length > 0 && (
              <div className="p-2 border-t border-border/60 bg-muted/20 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">
                  Toplam <strong className="text-foreground">{selectedIds.length}</strong> madde seçildi
                </span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-destructive hover:underline font-medium cursor-pointer"
                >
                  Tümünü Kaldır
                </button>
              </div>
            )}
          </div>,
          document.body
        )}

      {/* Seçili Kimyasalların Etiketleri (Chips/Badges) */}
      {selectedMaterials.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedMaterials.map((mat) => (
            <span
              key={mat.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-all hover:bg-amber-500/20"
            >
              <ShieldAlert className="w-3 h-3 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="font-semibold">{mat.productName}</span>
              {mat.brandName && (
                <span className="text-[10px] opacity-75">({mat.brandName})</span>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => removeMaterial(mat.id, e)}
                  className="hover:text-amber-900 dark:hover:text-amber-100 ml-0.5 p-0.5 rounded-full hover:bg-amber-500/30 transition-colors cursor-pointer"
                  title="Kaldır"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground italic px-0.5">
          Olaya karışan veya dökülen kimyasalları yukarıdaki menüden seçebilirsiniz.
        </p>
      )}
    </div>
  );
}
