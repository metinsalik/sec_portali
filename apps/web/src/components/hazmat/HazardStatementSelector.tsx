import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import zararlilikData from '@/data/zararlilik_ifadeleri.json';

interface HazardStatement {
  kod: string;
  ifade: string;
  kategori: string;
}

interface HazardStatementSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const STATEMENTS: HazardStatement[] = zararlilikData.ifadeler || [];
const CODE_LINE_REGEX = /^(H\d{3}[a-zA-Z*]?(?:\s*\+\s*H\d{3}[a-zA-Z*]?)*|EUH\d{3}[a-zA-Z*]?)\s*[:\-\.]?\s*(.*)$/i;

export function HazardStatementSelector({ value, onChange, disabled = false }: HazardStatementSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Mevcut metin içerisindeki standart H/EUH kodlarını tespit et
  const selectedCodes = useMemo(() => {
    const codes = new Set<string>();
    const lines = (value || '').split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const match = line.match(CODE_LINE_REGEX);
      if (match) {
        codes.add(match[1].replace(/\s+/g, '').toUpperCase());
      }
    }
    return codes;
  }, [value]);

  const filteredStatements = useMemo(() => {
    const q = searchTerm.trim().toLocaleLowerCase('tr-TR');
    if (!q) return STATEMENTS;
    return STATEMENTS.filter(
      item =>
        item.kod.toLocaleLowerCase('tr-TR').includes(q) ||
        item.ifade.toLocaleLowerCase('tr-TR').includes(q) ||
        item.kategori.toLocaleLowerCase('tr-TR').includes(q)
    );
  }, [searchTerm]);

  const toggleStatement = (item: HazardStatement) => {
    if (disabled) return;
    const normalizedCode = item.kod.replace(/\s+/g, '').toUpperCase();
    const lines = (value || '').split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);

    const existingIndex = lines.findIndex(line => {
      const m = line.match(CODE_LINE_REGEX);
      return m && m[1].replace(/\s+/g, '').toUpperCase() === normalizedCode;
    });

    if (existingIndex !== -1) {
      lines.splice(existingIndex, 1);
    } else {
      lines.push(`${item.kod}: ${item.ifade}`);
    }

    onChange(lines.join('\n'));
  };

  return (
    <div ref={containerRef} className="space-y-2 relative">
      {/* Açılır ve Arama Yapılabilir H/EUH Seçici */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors ${
          disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-accent/40 cursor-pointer'
        }`}
      >
        <span className="text-muted-foreground truncate">
          {selectedCodes.size > 0
            ? `${selectedCodes.size} zararlılık ifadesi seçili (eklemek veya çıkarmak için tıklayın)`
            : 'Zararlılık ifadesi seçmek için tıklayın (H / EUH kodları içinde ara)...'}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 rounded-lg border bg-popover text-popover-foreground shadow-lg">
          <div className="p-2 border-b flex items-center gap-2 bg-muted/30">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              ref={searchInputRef}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="H kodu (örn: H225, H319, EUH210) veya ifade metni ara..."
              className="h-8 border-0 bg-transparent focus-visible:ring-0 px-1 text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
            {filteredStatements.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Eşleşen zararlılık ifadesi bulunamadı.
              </div>
            ) : (
              filteredStatements.map(item => {
                const isSelected = selectedCodes.has(item.kod.replace(/\s+/g, '').toUpperCase());
                return (
                  <button
                    key={item.kod}
                    type="button"
                    onClick={() => toggleStatement(item)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-start gap-2.5 transition-colors hover:bg-muted/70 ${
                      isSelected ? 'bg-blue-50/80 dark:bg-blue-950/30' : ''
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-muted-foreground/40 bg-background'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                          {item.kod}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{item.kategori}</span>
                      </div>
                      <p className="text-sm text-foreground mt-0.5 leading-snug">{item.ifade}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Seçili standart kodların hızlı etiketleri */}
      {selectedCodes.size > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Array.from(selectedCodes).map(code => {
            const matched = STATEMENTS.find(s => s.kod.replace(/\s+/g, '').toUpperCase() === code);
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
              >
                <span className="font-mono font-bold">{matched?.kod || code}</span>
                {!disabled && matched && (
                  <button
                    type="button"
                    onClick={() => toggleStatement(matched)}
                    className="hover:text-rose-900 dark:hover:text-rose-100 ml-0.5"
                    title="Kaldır"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Mevcut / eski metinler korunur; seçim yapıldıkça buraya otomatik eklenir ve elle de düzenlenebilir */}
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        rows={3}
        placeholder="Yukarıdaki listeden zararlılık ifadesi seçebilir veya doğrudan yazabilirsiniz..."
      />
    </div>
  );
}

