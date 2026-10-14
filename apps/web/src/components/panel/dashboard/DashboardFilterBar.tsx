import React from 'react';
import { Search, X, RotateCw, Filter, MapPin, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DashboardFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  availableCities: string[];
  selectedDanger: string;
  onDangerChange: (danger: string) => void;
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
  activeFiltersCount,
  onResetFilters,
  onRefresh,
  isRefreshing,
  totalFilteredCount,
  totalCount,
}: DashboardFilterBarProps) {
  return (
    <div className="rounded-xl border border-border bg-card/80 backdrop-blur-md p-4 shadow-xs transition-all duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tesis adı, şehir veya uzman ara..."
            className="pl-9 pr-8 h-9 text-sm rounded-lg bg-background/80 border-border focus-visible:ring-1 focus-visible:ring-primary"
            aria-label="Panel dashboard arama"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm"
              title="Aramayı Temizle"
              type="button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Middle: Filter selects */}
        <div className="flex flex-wrap items-center gap-2">
          {/* City Filter */}
          <div className="min-w-[150px]">
            <Select value={selectedCity} onValueChange={onCityChange}>
              <SelectTrigger 
                size="sm"
                className="h-9 w-full rounded-lg bg-background/80 border-border text-xs font-medium"
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

          {/* Danger Class Filter */}
          <div className="min-w-[150px]">
            <Select value={selectedDanger} onValueChange={onDangerChange}>
              <SelectTrigger 
                size="sm"
                className="h-9 w-full rounded-lg bg-background/80 border-border text-xs font-medium"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">
                    {selectedDanger === 'all' ? 'Tüm Tehlike Sınıfları' : selectedDanger}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tehlike Sınıfları</SelectItem>
                {DANGER_CLASSES.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters Button */}
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="h-9 px-2.5 rounded-lg border-dashed text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Sıfırla
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px] rounded-full">
                {activeFiltersCount}
              </Badge>
            </Button>
          )}

          {/* Refresh Action */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-9 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground gap-1.5"
            title="Verileri Yenile"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            <span className="hidden sm:inline">Yenile</span>
          </Button>
        </div>
      </div>

      {/* Filter status summary bar when filtered */}
      {(activeFiltersCount > 0 || (totalFilteredCount !== undefined && totalCount !== undefined && totalFilteredCount !== totalCount)) && (
        <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span>Filtrelenmiş Görünüm:</span>
            {selectedCity !== 'all' && (
              <Badge variant="outline" className="text-[11px] gap-1 py-0.5 px-2 bg-primary/5 text-primary border-primary/20">
                Şehir: {selectedCity}
              </Badge>
            )}
            {selectedDanger !== 'all' && (
              <Badge variant="outline" className="text-[11px] gap-1 py-0.5 px-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                Sınıf: {selectedDanger}
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="outline" className="text-[11px] gap-1 py-0.5 px-2 bg-muted text-foreground">
                "{searchTerm}"
              </Badge>
            )}
          </div>

          {totalFilteredCount !== undefined && totalCount !== undefined && (
            <div className="font-medium text-foreground">
              {totalFilteredCount} / {totalCount} tesis listeleniyor
            </div>
          )}
        </div>
      )}
    </div>
  );
}
