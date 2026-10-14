import React from 'react';
import TurkeyMapComponent from "turkey-map-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { MapPin, LayoutGrid, Info } from "lucide-react";

const TurkeyMap = (TurkeyMapComponent as any).default || TurkeyMapComponent;

// Helper to normalize Turkish characters for matching
const normalizeCityName = (name: string) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/i/g, "i")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .trim();
};

interface TurkeyMapSectionProps {
  cityData: Record<string, number>;
  onCityClick: (cityName: string) => void;
  selectedCity?: string | null;
}

export function TurkeyMapSection({ cityData, onCityClick, selectedCity }: TurkeyMapSectionProps) {
  const normalizedData: Record<string, number> = {};
  Object.entries(cityData || {}).forEach(([name, count]) => {
    normalizedData[normalizeCityName(name)] = count;
  });

  const counts = Object.values(cityData || {});
  const maxCount = counts.length > 0 ? Math.max(...counts, 1) : 1;
  const activeCityCount = Object.keys(cityData || {}).length;

  return (
    <Card className="rounded-xl border border-border bg-card shadow-xs transition-all duration-200">
      <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border/40">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <MapPin className="w-4 h-4" />
            </div>
            Portföy Coğrafi Dağılımı (İl Bazlı)
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Tesislerin Türkiye geneli il bazlı yoğunluğu. Detaylı ilçe ve tesis raporu için il üzerine tıklayın.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-7 px-2.5 text-xs font-medium bg-muted/50 border-border">
            {activeCityCount} Aktif İl
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="relative w-full min-h-[380px] flex items-center justify-center bg-muted/20 dark:bg-muted/10 rounded-xl border border-border/60 p-4 transition-colors">
          <TooltipProvider delayDuration={100}>
            <TurkeyMap
              customStyle={{
                idleColor: "hsl(var(--muted))",
                hoverColor: "hsl(var(--primary))",
              }}
              hoverable={true}
              onClick={(city: any) => onCityClick(city.name)}
              renderCity={(cityComponent: any, cityDataProps: any) => {
                const count = cityData[cityDataProps.name] || normalizedData[normalizeCityName(cityDataProps.name)] || 0;
                const isSelected = selectedCity && (
                  normalizeCityName(selectedCity) === normalizeCityName(cityDataProps.name)
                );

                const intensity = count > 0 ? 0.35 + (count / maxCount) * 0.65 : 0;
                const fill = isSelected 
                  ? "hsl(var(--primary))" 
                  : count > 0 
                    ? `rgba(37, 99, 235, ${intensity})` 
                    : "hsl(var(--muted) / 0.5)";
                const stroke = isSelected 
                  ? "hsl(var(--foreground))" 
                  : count > 0 
                    ? "#1d4ed8" 
                    : "hsl(var(--border))";

                return (
                  <Tooltip key={cityDataProps.id}>
                    <TooltipTrigger asChild>
                      <g
                        className="cursor-pointer transition-all duration-200 hover:opacity-85 focus:outline-none"
                        onClick={() => onCityClick(cityDataProps.name)}
                        tabIndex={0}
                        role="button"
                        aria-label={`${cityDataProps.name}: ${count} tesis`}
                      >
                        {React.isValidElement(cityComponent) &&
                          React.cloneElement(cityComponent as React.ReactElement, {
                            style: {
                              fill: fill,
                              stroke: stroke,
                              strokeWidth: isSelected ? 2 : count > 0 ? 1.2 : 0.6,
                              transition: 'fill 200ms ease, stroke 200ms ease',
                            },
                          })}

                        {count > 0 && (
                          <g pointerEvents="none">
                            <circle
                              cx={cityDataProps.textX}
                              cy={cityDataProps.textY}
                              r="9"
                              fill="#1e40af"
                              stroke="white"
                              strokeWidth="1.5"
                            />
                            <text
                              x={cityDataProps.textX}
                              y={cityDataProps.textY}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="white"
                              fontSize="9px"
                              fontWeight="bold"
                            >
                              {count}
                            </text>
                          </g>
                        )}
                      </g>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-popover text-popover-foreground border-border shadow-md rounded-lg p-2.5 z-50 text-xs"
                    >
                      <div className="space-y-1">
                        <p className="font-bold text-foreground text-sm uppercase tracking-tight">
                          {cityDataProps.name}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-1.5 font-medium">
                          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                          {count} Aktif Tesis
                        </p>
                        {count > 0 ? (
                          <p className="text-[11px] text-primary font-medium mt-1">
                            İl ve ilçe detayları için tıklayın →
                          </p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground italic">
                            Bu ilde henüz aktif tesis kaydı bulunmuyor.
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }}
            />
          </TooltipProvider>

          {/* Map Legend */}
          <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-md p-3 rounded-lg border border-border shadow-xs space-y-2 hidden sm:block min-w-[130px] z-10 text-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1.5 flex items-center gap-1.5">
              <LayoutGrid className="w-3 h-3 text-primary" />
              Tesis Yoğunluğu
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-sm bg-muted/60 border border-border" />
                <span className="text-[11px] text-muted-foreground">Tesis Yok</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-sm bg-blue-300 dark:bg-blue-900 border border-blue-400" />
                <span className="text-[11px] text-muted-foreground">Düşük (1-2)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-sm bg-blue-600 border border-blue-700" />
                <span className="text-[11px] text-muted-foreground font-medium">Yüksek (3+)</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
