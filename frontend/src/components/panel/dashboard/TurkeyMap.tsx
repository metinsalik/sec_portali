import React from 'react';
import TurkeyMapComponent from "turkey-map-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, LayoutGrid } from "lucide-react";

const TurkeyMap = (TurkeyMapComponent as any).default || TurkeyMapComponent;

// Şehir isimlerini normalize etmek için yardımcı fonksiyon
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
}

export function TurkeyMapSection({ cityData, onCityClick }: TurkeyMapSectionProps) {
  // Normalize edilmiş cityData oluştur
  const normalizedData: Record<string, number> = {};
  Object.entries(cityData).forEach(([name, count]) => {
    normalizedData[normalizeCityName(name)] = count;
  });

  const counts = Object.values(cityData);
  const maxCount = counts.length > 0 ? Math.max(...counts, 1) : 1;

  return (
    <Card className="lg:col-span-3 overflow-hidden border-primary/5 bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Portföy Coğrafi Dağılımı (İl Bazlı)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-8">
        <div className="relative aspect-[2/1] w-full min-h-[400px] flex items-center justify-center bg-white rounded-2xl border border-primary/10 p-4 group shadow-inner">
          <TooltipProvider>
            <TurkeyMap 
              customStyle={{ 
                idleColor: "#f1f5f9", 
                hoverColor: "#2563eb" 
              }}
              hoverable={true}
              onClick={(city: any) => onCityClick(city.name)}
              renderCity={(cityComponent: any, cityDataProps: any) => {
                // Hem orijinal hem normalize edilmiş isimle kontrol et
                const count = cityData[cityDataProps.name] || normalizedData[normalizeCityName(cityDataProps.name)] || 0;
                
                const intensity = count > 0 ? 0.3 + (count / maxCount) * 0.7 : 0;
                const fill = count > 0 ? `rgba(37, 99, 235, ${intensity})` : "#f8fafc";
                const stroke = count > 0 ? "#1e40af" : "#cbd5e1";
                
                return (
                  <Tooltip key={cityDataProps.id}>
                    <TooltipTrigger asChild>
                      <g className="cursor-pointer transition-all duration-300 hover:filter hover:brightness-90 outline-none">
                        {React.isValidElement(cityComponent) && React.cloneElement(cityComponent as React.ReactElement, {
                          style: { 
                            fill: fill, 
                            stroke: stroke,
                            strokeWidth: count > 0 ? 1.5 : 0.5,
                            transition: 'all 0.3s'
                          }
                        })}
                        
                        {count > 0 && (
                          <g pointerEvents="none">
                            <circle 
                              cx={cityDataProps.textX} 
                              cy={cityDataProps.textY} 
                              r="10" 
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
                              fontSize="11px"
                              fontWeight="900"
                              style={{ pointerEvents: 'none' }}
                            >
                              {count}
                            </text>
                          </g>
                        )}
                      </g>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-popover/95 backdrop-blur-sm border-primary/20 shadow-2xl">
                      <div className="text-sm p-1">
                        <p className="font-black text-blue-700 uppercase tracking-tighter">{cityDataProps.name}</p>
                        <p className="text-muted-foreground font-bold">{count} Aktif Tesis</p>
                        {count > 0 && <p className="text-[10px] text-blue-600 mt-1 font-medium">İlçe detayları için tıklayın</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }}
            />
          </TooltipProvider>
          
          <div className="absolute bottom-6 right-8 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-primary/10 shadow-lg space-y-3 hidden md:block min-w-[140px]">
             <p className="text-[11px] font-black uppercase tracking-widest text-blue-900 border-b border-blue-100 pb-2 flex items-center gap-2">
                <LayoutGrid className="w-3 h-3" /> YOĞUNLUK
             </p>
             <div className="space-y-2">
               <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-md bg-[#f8fafc] border"></div>
                  <span className="text-[10px] font-medium text-slate-500">Tesis Yok</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-md bg-blue-200 border border-blue-300"></div>
                  <span className="text-[10px] font-medium text-slate-600">Düşük (1-2)</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-md bg-blue-600 border border-blue-700"></div>
                  <span className="text-[10px] font-medium text-slate-700">Yüksek (3+)</span>
               </div>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
