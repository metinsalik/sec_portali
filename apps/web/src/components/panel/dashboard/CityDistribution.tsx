import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, LayoutGrid, Search, ChevronRight } from "lucide-react";

interface CityDistributionProps {
  data: Record<string, number>;
  onCityClick?: (cityName: string) => void;
  selectedCity?: string | null;
}

export function CityDistribution({ data = {}, onCityClick, selectedCity }: CityDistributionProps) {
  const [filterQuery, setFilterQuery] = useState('');

  const sortedCities = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const filteredCities = sortedCities.filter(([city]) =>
    city.toLocaleLowerCase('tr-TR').includes(filterQuery.toLocaleLowerCase('tr-TR'))
  );
  const maxCount = Math.max(...Object.values(data), 1);
  const totalFacilities = Object.values(data).reduce((sum, count) => sum + count, 0);

  return (
    <Card className="rounded-lg border border-border bg-card shadow-xs transition-all duration-200 flex flex-col">
      <CardHeader className="py-3 px-4 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">İl Bazlı Dağılım</span>
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">
              Tesis sayıları ve oranları
            </CardDescription>
          </div>
          <Badge variant="outline" className="h-6 px-2 text-[11px] font-semibold bg-muted/50 border-border tabular-nums shrink-0">
            {totalFacilities} / {sortedCities.length} İl
          </Badge>
        </div>

        {/* Quick Filter */}
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="İl ara..."
            className="pl-8 h-8 text-xs rounded-lg bg-background border-border"
          />
        </div>
      </CardHeader>

      <CardContent className="p-3 flex-1">
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
          {filteredCities.map(([city, count]) => {
            const isSelected = selectedCity === city;
            const percentage = Math.round((count / totalFacilities) * 100);

            return (
              <div
                key={city}
                onClick={() => onCityClick?.(city)}
                className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer group ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-xs'
                    : 'border-border/60 hover:border-border hover:bg-muted/40'
                }`}
                role="button"
                tabIndex={0}
                aria-label={`${city}: ${count} tesis`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {city}
                    </span>
                    {isSelected && (
                      <Badge variant="default" className="text-[10px] h-4 px-1.5">
                        Seçili
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{count} Tesis</span>
                    <span className="text-[10px] text-muted-foreground">({percentage}%)</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
                <div className="relative">
                  <Progress
                    value={(count / maxCount) * 100}
                    className="h-1.5 bg-muted rounded-full"
                  />
                </div>
              </div>
            );
          })}

          {filteredCities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
              <LayoutGrid className="w-8 h-8 opacity-40" />
              <p className="text-xs font-medium">Eşleşen il bulunamadı.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
