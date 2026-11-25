import React from 'react';
import { Search, X, RotateCw, Filter, MapPin, AlertTriangle, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

interface DashboardFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  availableCities: string[];
  selectedDanger: string;
  onDangerChange: (danger: string) => void;
  selectedType?: string;
  onTypeChange?: (type: string) => void;
  availableTypes?: string[];
  activeFiltersCount: number;
  onResetFilters: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  totalFilteredCount?: number;
  totalCount?: number;
}

export const DANGER_CLASSES = [
  'Çok Tehlikeli',
  'Tehlikeli',
  'Az Tehlikeli',
] as const;

export function DashboardFilterBar({
  searchTerm,
  onSearchChange,
  selectedCity,
  onCityChange,
  availableCities,
  selectedDanger,
  onDangerChange,
  selectedType = 'all',
  onTypeChange,
  availableTypes = [],
  activeFiltersCount,
  onResetFilters,
  onRefresh,
  isRefreshing,
  totalFilteredCount,
  totalCount,
}: DashboardFilterBarProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-xs transition-all duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tesis adı, ilçe, şehir veya uzman ara..."
            className="pl-8 pr-7 h-8 text-xs rounded-lg bg-background border-border"
            aria-label="Panel dashboard arama"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm"
              title="Aramayı Temizle"
              type="button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="min-w-[135px]">
            <Select value={selectedCity} onValueChange={onCityChange}>
              <SelectTrigger
                size="sm"
                className="h-8 w-full rounded-lg bg-background border-border text-xs font-medium"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">
                    {selectedCity === 'all' ? 'Tüm İller' : selectedCity}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-[280px]">
                <SelectItem value="all">Tüm İller ({availableCities.length})</SelectItem>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[140px]">
            <Select value={selectedDanger} onValueChange={onDangerChange}>
              <SelectTrigger
                size="sm"
                className="h-8 w-full rounded-lg bg-background border-border text-xs font-medium"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">
                    {selectedDanger === 'all' ? 'Tüm Sınıflar' : selectedDanger}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Sınıflar</SelectItem>
                {DANGER_CLASSES.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {onTypeChange && availableTypes.length > 0 && (
            <div className="min-w-[130px]">
              <Select value={selectedType} onValueChange={onTypeChange}>
                <SelectTrigger
                  size="sm"
                  className="h-8 w-full rounded-lg bg-background border-border text-xs font-medium"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {selectedType === 'all' ? 'Tüm Tipler' : selectedType}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Tipler</SelectItem>
                  {availableTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="h-8 px-2 rounded-lg border-dashed text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Sıfırla
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px] rounded-full tabular-nums">
                {activeFiltersCount}
              </Badge>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground gap-1"
            title="Verileri Yenile"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            <span className="hidden sm:inline">Yenile</span>
          </Button>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <div className="mt-2.5 pt-2 border-t border-border/50 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="w-3 h-3 text-primary" />
            <span>Aktif Filtre:</span>
            {selectedCity !== 'all' && (
              <Badge variant="outline" className="text-[10px] h-5 px-2 bg-primary/5 text-primary border-primary/20">
                İl: {selectedCity}
              </Badge>
            )}
            {selectedDanger !== 'all' && (
              <Badge variant="outline" className="text-[10px] h-5 px-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                Sınıf: {selectedDanger}
              </Badge>
            )}
            {selectedType !== 'all' && (
              <Badge variant="outline" className="text-[10px] h-5 px-2 bg-muted text-foreground">
                Tip: {selectedType}
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="outline" className="text-[10px] h-5 px-2 bg-muted text-foreground">
                "{searchTerm}"
              </Badge>
            )}
          </div>

          {totalFilteredCount !== undefined && totalCount !== undefined && (
            <div className="font-semibold text-foreground tabular-nums">
              {totalFilteredCount} / {totalCount} tesis eşleşti
            </div>
          )}
        </div>
      )}
    </div>
  );
}
