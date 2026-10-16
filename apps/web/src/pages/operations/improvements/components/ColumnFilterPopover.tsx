import React, { useState } from 'react';
import { Filter, ArrowDownAZ, ArrowUpZA, X, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface ColumnFilterPopoverProps {
  columnLabel: string;
  values: string[];
  selectedValues: string[];
  onFilterChange: (selected: string[]) => void;
  onSort?: (direction: 'asc' | 'desc') => void;
}

export const ColumnFilterPopover: React.FC<ColumnFilterPopoverProps> = ({
  columnLabel,
  values,
  selectedValues,
  onFilterChange,
  onSort,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [localSelected, setLocalSelected] = useState<string[]>(selectedValues);

  // Benzersiz değerleri al
  const distinctValues = Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'tr')
  );

  const filteredOptions = distinctValues.filter((v) =>
    v.toLowerCase().includes(search.toLowerCase())
  );

  const isAllSelected = localSelected.length === distinctValues.length;
  const isFiltered = selectedValues.length > 0 && selectedValues.length < distinctValues.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setLocalSelected([...distinctValues]);
    } else {
      setLocalSelected([]);
    }
  };

  const toggleOption = (val: string) => {
    if (localSelected.includes(val)) {
      setLocalSelected(localSelected.filter((v) => v !== val));
    } else {
      setLocalSelected([...localSelected, val]);
    }
  };

  const handleApply = () => {
    onFilterChange(localSelected);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalSelected([]);
    onFilterChange([]);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`p-1 rounded hover:bg-muted/60 transition-colors inline-flex items-center justify-center ${
            isFiltered ? 'text-primary font-bold bg-primary/10' : 'text-muted-foreground'
          }`}
          title={`${columnLabel} sütununu filtrele`}
        >
          <Filter className="w-3 h-3" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-3 text-xs space-y-3" align="start">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="font-semibold text-foreground truncate">{columnLabel} Filtresi</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        {/* Sıralama Butonları */}
        {onSort && (
          <div className="flex items-center gap-1.5 pb-2 border-b">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onSort('asc');
                setOpen(false);
              }}
              className="flex-1 h-7 text-[11px] gap-1"
            >
              <ArrowDownAZ className="w-3.5 h-3.5" />
              <span>A → Z</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onSort('desc');
                setOpen(false);
              }}
              className="flex-1 h-7 text-[11px] gap-1"
            >
              <ArrowUpZA className="w-3.5 h-3.5" />
              <span>Z → A</span>
            </Button>
          </div>
        )}

        {/* Arama Kutusu */}
        <Input
          placeholder="Değer ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 text-xs"
        />

        {/* Tümünü Seç Checkbox */}
        <div className="flex items-center gap-2 px-1">
          <Checkbox
            id={`select-all-${columnLabel}`}
            checked={isAllSelected}
            onCheckedChange={handleSelectAll}
          />
          <label
            htmlFor={`select-all-${columnLabel}`}
            className="text-[11px] font-medium text-foreground cursor-pointer select-none"
          >
            Tümünü Seç ({distinctValues.length})
          </label>
        </div>

        {/* Değer Listesi */}
        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 border rounded-md p-1.5 bg-muted/20">
          {filteredOptions.length === 0 ? (
            <p className="text-[11px] text-muted-foreground p-2 text-center">Eşleşen değer yok</p>
          ) : (
            filteredOptions.map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <Checkbox
                  id={`opt-${columnLabel}-${opt}`}
                  checked={localSelected.includes(opt)}
                  onCheckedChange={() => toggleOption(opt)}
                />
                <label
                  htmlFor={`opt-${columnLabel}-${opt}`}
                  className="text-[11px] text-foreground cursor-pointer truncate flex-1 select-none"
                  title={opt}
                >
                  {opt}
                </label>
              </div>
            ))
          )}
        </div>

        {/* Butonlar */}
        <div className="flex items-center justify-between pt-1 border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Temizle
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleApply}
            className="h-7 text-[11px]"
          >
            Uygula
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
