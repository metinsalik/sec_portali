import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MapPin, LayoutGrid } from "lucide-react";

interface CityDistributionProps {
  data: Record<string, number>;
}

export function CityDistribution({ data }: CityDistributionProps) {
  const sortedCities = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...Object.values(data), 1);

  return (
    <Card className="col-span-1 md:col-span-2 border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl overflow-hidden">
      <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800">
        <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-500 uppercase tracking-widest">
          <MapPin className="w-4 h-4 text-primary" />
          Bölgesel Tesis Dağılımı
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6 max-h-[400px] overflow-auto pr-4 custom-scrollbar">
          {sortedCities.map(([city, count]) => (
            <div key={city} className="group space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter group-hover:text-primary transition-colors">{city}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase">{count} TESİS</span>
              </div>
              <div className="relative">
                <Progress 
                  value={(count / maxCount) * 100} 
                  className="h-1.5 bg-slate-100 dark:bg-slate-800" 
                />
              </div>
            </div>
          ))}
          {sortedCities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-30 gap-3 text-slate-400">
              <LayoutGrid className="w-8 h-8" />
              <p className="text-[10px] font-black uppercase tracking-widest">Veri bulunmuyor.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
