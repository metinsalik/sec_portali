import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  AlertTriangle,
  PlusCircle,
  Settings2,
  Search,
  Flame,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';

interface FacilityItem {
  id: string;
  name: string;
  shortName?: string;
  type?: string;
  city?: string;
  district?: string;
  _count?: {
    fm200Locations?: number;
    fm200BuildingFloors?: number;
  };
}

interface Props {
  facilities?: FacilityItem[];
  hospitalsWithoutLocations?: FacilityItem[];
}

export default function HospitalsWithoutLocationsCard({
  facilities = [],
  hospitalsWithoutLocations: backendHospitals
}: Props) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Sadece 'Hastane' olan ve FM-200 mahal sayısı 0 olan tesisler
  const missingHospitals = useMemo(() => {
    if (backendHospitals && backendHospitals.length > 0) {
      if (!searchQuery.trim()) return backendHospitals;
      const q = searchQuery.toLowerCase().trim();
      return backendHospitals.filter(h => h.name.toLowerCase().includes(q));
    }

    return facilities.filter((f) => {
      const isHospital =
        f.type === 'Hastane' ||
        (f.name && (f.name.includes('Liv') || f.name.includes('MP') || f.name.includes('Hastane') || f.name.includes('Tıp')));
      
      const locCount = f._count?.fm200Locations ?? 0;
      if (!isHospital || locCount > 0) return false;

      if (!searchQuery.trim()) return true;
      return f.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    });
  }, [backendHospitals, facilities, searchQuery]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-900/60 shadow-sm overflow-hidden p-5 sm:p-6 space-y-4">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* BAŞLIK & ARAMA                                                            */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Henüz Mahal Tanımlanmamış Hastaneler
                </h3>
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs">
                  {missingHospitals.length} Hastane Bekliyor
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sadece <b>Hastane</b> türündeki tesislerden FM-200 gazlı söndürme mahalleri henüz girilmemiş olanlar. Hızlıca mahal tanımlayıp denetimi başlatabilirsiniz.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <Input
              type="text"
              placeholder="Hastane adı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8.5 h-9 text-xs rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* HASTANELER LİSTESİ / IZGARASI                                              */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {missingHospitals.length === 0 ? (
        <div className="p-8 text-center text-slate-400 border border-dashed rounded-2xl space-y-1 bg-slate-50/50 dark:bg-slate-800/20">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {searchQuery ? 'Aramaya uygun hastane bulunamadı.' : 'Tebrikler! Tüm hastanelerde en az bir mahal kaydı tanımlanmış.'}
          </p>
          <p className="text-[11px] text-slate-400">
            Hiçbir hastane boşta kalmamıştır.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
          {missingHospitals.map((hosp) => (
            <div
              key={hosp.id}
              className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between gap-3 hover:border-blue-300 transition-all hover:shadow-xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Hastane
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                    0 Mahal Girildi
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                  {hosp.name}
                </h4>

                <div className="text-[11px] text-slate-400">
                  {hosp.city ? `${hosp.city} ${hosp.district ? `· ${hosp.district}` : ''}` : 'Lokasyon Bilgisi Belirtilmemiş'}
                </div>
              </div>

              {/* Aksiyon Butonları */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/fm200/settings?facilityId=${hosp.id}`)}
                  className="flex-1 h-8 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-slate-200 hover:bg-slate-100"
                  title="Bina, Blok ve Kat Yapılandırması"
                >
                  <Settings2 className="w-3 h-3 mr-1 text-slate-500" />
                  Bina/Kat
                </Button>

                <Button
                  size="sm"
                  onClick={() => navigate(`/fm200/wizard?facilityId=${hosp.id}`)}
                  className="flex-1 h-8 text-[11px] font-bold bg-[#0051d5] hover:bg-[#0042b0] text-white"
                  title="Bu hastanede ilk mahali tanımla ve denetim başlat"
                >
                  <PlusCircle className="w-3 h-3 mr-1" />
                  Mahal Ekle
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
