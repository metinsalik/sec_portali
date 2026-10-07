import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileSpreadsheet,
  Download,
  Search,
  Building2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Filter,
  CheckCircle2,
  ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';

export interface HospitalMatrixRow {
  name: string;
  facilityId?: string;
  doorfan: number;
  preventiveMaintenance: number;
  periodicControl: number;
  tightness: number;
  total: number;
}

export const DEFAULT_HOSPITAL_AUDIT_MATRIX: HospitalMatrixRow[] = [
  { name: 'İSÜ Liv Topkapı', facilityId: 'İSU-LIV-TOPKAP', doorfan: 20, preventiveMaintenance: 96, periodicControl: 97, tightness: 40, total: 253 },
  { name: 'İSÜ MP Gaziosmanpaşa', facilityId: 'İSU-MP-GAZIOSM', doorfan: 10, preventiveMaintenance: 47, periodicControl: 19, tightness: 30, total: 106 },
  { name: 'İSÜ Tıp Fakültesi', facilityId: 'İSU-TIP-FAKULT', doorfan: 4, preventiveMaintenance: 11, periodicControl: 0, tightness: 6, total: 21 },
  { name: 'Liv Ankara', facilityId: 'LIV-ANKARA', doorfan: 6, preventiveMaintenance: 6, periodicControl: 11, tightness: 6, total: 29 },
  { name: 'Liv Vadi', facilityId: 'LIV-VADI', doorfan: 10, preventiveMaintenance: 10, periodicControl: 24, tightness: 15, total: 59 },
  { name: 'MP Antalya', facilityId: 'MP-ANTALYA', doorfan: 8, preventiveMaintenance: 47, periodicControl: 16, tightness: 17, total: 88 },
  { name: 'MP Ataşehir', facilityId: 'MP-ATASEHIR', doorfan: 17, preventiveMaintenance: 132, periodicControl: 187, tightness: 36, total: 372 },
  { name: 'MP Bahçelievler', facilityId: 'MP-BAHCELIEVLER', doorfan: 6, preventiveMaintenance: 36, periodicControl: 40, tightness: 17, total: 99 },
  { name: 'MP Göztepe', facilityId: 'MP-GOZTEPE', doorfan: 9, preventiveMaintenance: 17, periodicControl: 30, tightness: 25, total: 81 },
  { name: 'MP İstanbul Onkoloji', facilityId: 'MP-İSTANBUL-ON', doorfan: 10, preventiveMaintenance: 46, periodicControl: 31, tightness: 23, total: 110 },
  { name: 'MP Seyhan', facilityId: 'MP-SEYHAN', doorfan: 9, preventiveMaintenance: 36, periodicControl: 10, tightness: 27, total: 82 },
  { name: 'MP Tem', facilityId: 'MP-TEM', doorfan: 9, preventiveMaintenance: 30, periodicControl: 14, tightness: 17, total: 70 },
  { name: 'MP Tokat', facilityId: 'MP-TOKAT', doorfan: 7, preventiveMaintenance: 20, periodicControl: 12, tightness: 12, total: 51 },
  { name: 'MP Yıldızlı', facilityId: 'MP-YILDIZLI', doorfan: 5, preventiveMaintenance: 1, periodicControl: 2, tightness: 8, total: 16 },
  { name: 'VM MP Ankara', facilityId: 'VM-MP-ANKARA', doorfan: 7, preventiveMaintenance: 9, periodicControl: 13, tightness: 21, total: 50 },
  { name: 'VM MP Bursa', facilityId: 'VM-MP-BURSA', doorfan: 17, preventiveMaintenance: 99, periodicControl: 125, tightness: 52, total: 293 },
  { name: 'VM MP Fatih', facilityId: 'VM-MP-FATIH', doorfan: 7, preventiveMaintenance: 20, periodicControl: 13, tightness: 16, total: 56 },
  { name: 'VM MP Florya', facilityId: 'VM-MP-FLORYA', doorfan: 7, preventiveMaintenance: 12, periodicControl: 3, tightness: 1, total: 23 },
  { name: 'VM MP Maltepe', facilityId: 'VM-MP-MALTEPE', doorfan: 0, preventiveMaintenance: 0, periodicControl: 0, tightness: 1, total: 1 },
  { name: 'VM MP Mersin', facilityId: 'VM-MP-MERSIN', doorfan: 7, preventiveMaintenance: 8, periodicControl: 1, tightness: 7, total: 23 },
  { name: 'VM MP Pendik', facilityId: 'VM-MP-PENDIK', doorfan: 0, preventiveMaintenance: 2, periodicControl: 15, tightness: 0, total: 17 }
];

interface Props {
  data?: HospitalMatrixRow[];
  onSelectFacility?: (facilityId: string) => void;
  selectedFacilityId?: string;
}

export default function HospitalAuditMatrixTable({
  data = DEFAULT_HOSPITAL_AUDIT_MATRIX,
  onSelectFacility,
  selectedFacilityId
}: Props) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof HospitalMatrixRow>('total');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Filtreleme ve Sıralama
  const filteredData = useMemo(() => {
    return [...data]
      .filter((row) => {
        if (!searchQuery.trim()) return true;
        return row.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      })
      .sort((a, b) => {
        const valA = a[sortField] ?? 0;
        const valB = b[sortField] ?? 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortAsc ? valA.localeCompare(valB, 'tr') : valB.localeCompare(valA, 'tr');
        }
        return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      });
  }, [data, searchQuery, sortField, sortAsc]);

  // Toplamlar
  const totals = useMemo(() => {
    return data.reduce(
      (acc, r) => ({
        doorfan: acc.doorfan + (r.doorfan || 0),
        preventiveMaintenance: acc.preventiveMaintenance + (r.preventiveMaintenance || 0),
        periodicControl: acc.periodicControl + (r.periodicControl || 0),
        tightness: acc.tightness + (r.tightness || 0),
        total: acc.total + (r.total || 0)
      }),
      { doorfan: 0, preventiveMaintenance: 0, periodicControl: 0, tightness: 0, total: 0 }
    );
  }, [data]);

  // Excel Dışa Aktarma
  const handleExportExcel = () => {
    const exportRows = filteredData.map((row, idx) => ({
      'Sıra': idx + 1,
      'Hastaneler': row.name,
      'Doorfan Testi': row.doorfan || 0,
      'Önleyici Bakım Uygunluğu': row.preventiveMaintenance || 0,
      'Periyodik Kontrol Uygunluğu': row.periodicControl || 0,
      'Sızdırmazlık': row.tightness || 0,
      'Genel Toplam': row.total || 0
    }));

    exportRows.push({
      'Sıra': '' as any,
      'Hastaneler': 'Genel Toplam',
      'Doorfan Testi': totals.doorfan,
      'Önleyici Bakım Uygunluğu': totals.preventiveMaintenance,
      'Periyodik Kontrol Uygunluğu': totals.periodicControl,
      'Sızdırmazlık': totals.tightness,
      'Genel Toplam': totals.total
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Hastaneler Matrisi');
    XLSX.writeFile(wb, `FM200_Hastaneler_Denetim_Matrisi_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Hastaneler Denetim Matrisi Excel olarak indirildi');
  };

  const toggleSort = (field: keyof HospitalMatrixRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* BAŞLIK & KONTROLLER                                                       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Hastaneler Bazında Konsolide Denetim & Uygunluk Matrisi
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-extrabold">
                  {totals.total.toLocaleString('tr-TR')} Toplam Madde
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Doorfan testi, önleyici bakım, periyodik kontrol ve sızdırmazlık kriterlerinin hastane bazlı konsolide tablosu.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <Input
              type="text"
              placeholder="Hastane adı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8.5 h-9 text-xs rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800"
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 text-xs font-bold text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Excel İndir
          </Button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 4 TEMEL DİSİPLİN KARTLARI (ÖZET KARTLAR)                                   */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-900/40">
          <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider block">
            Doorfan Testi
          </span>
          <div className="text-2xl font-black text-cyan-800 dark:text-cyan-200 mt-0.5">
            {totals.doorfan}
          </div>
          <span className="text-[10px] text-slate-400">Oda Bütünlüğü & Basınç</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
            Önleyici Bakım Uygunluğu
          </span>
          <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-0.5">
            {totals.preventiveMaintenance}
          </div>
          <span className="text-[10px] text-slate-400">Tüp & Ekipman Bakımları</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
            Periyodik Kontrol Uygunluğu
          </span>
          <div className="text-2xl font-black text-blue-800 dark:text-blue-200 mt-0.5">
            {totals.periodicControl}
          </div>
          <span className="text-[10px] text-slate-400">Yetkili Yıllık Denetimler</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
            Sızdırmazlık Kriterleri
          </span>
          <div className="text-2xl font-black text-amber-800 dark:text-amber-200 mt-0.5">
            {totals.tightness}
          </div>
          <span className="text-[10px] text-slate-400">Geçiş & Damper İzolasyonu</span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* EXCEL TABLOSU GÖRSELİ (AYNI DÜZENDE YÜKSEK KALİTELİ TABLO)                  */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-700 dark:bg-slate-800 text-white font-bold tracking-tight">
              <th
                onClick={() => toggleSort('name')}
                className="py-3 px-3.5 border-r border-slate-600 dark:border-slate-700 cursor-pointer hover:bg-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>Hastaneler</span>
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('doorfan')}
                className="py-3 px-3 border-r border-slate-600 dark:border-slate-700 text-center cursor-pointer hover:bg-slate-600 transition-colors"
              >
                Doorfan Testi
              </th>
              <th
                onClick={() => toggleSort('preventiveMaintenance')}
                className="py-3 px-3 border-r border-slate-600 dark:border-slate-700 text-center cursor-pointer hover:bg-slate-600 transition-colors"
              >
                Önleyici Bakım Uygunluğu
              </th>
              <th
                onClick={() => toggleSort('periodicControl')}
                className="py-3 px-3 border-r border-slate-600 dark:border-slate-700 text-center cursor-pointer hover:bg-slate-600 transition-colors"
              >
                Periyodik Kontrol Uygunluğu
              </th>
              <th
                onClick={() => toggleSort('tightness')}
                className="py-3 px-3 border-r border-slate-600 dark:border-slate-700 text-center cursor-pointer hover:bg-slate-600 transition-colors"
              >
                Sızdırmazlık
              </th>
              <th
                onClick={() => toggleSort('total')}
                className="py-3 px-3 text-center cursor-pointer hover:bg-slate-600 transition-colors bg-slate-800 dark:bg-slate-900"
              >
                Genel Toplam
              </th>
              <th className="py-3 px-3 text-right">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {filteredData.map((row, idx) => {
              const isSelected = selectedFacilityId === row.facilityId;

              return (
                <tr
                  key={row.name}
                  className={`transition-colors hover:bg-blue-50/60 dark:hover:bg-blue-950/20 ${
                    isSelected ? 'bg-blue-50/80 dark:bg-blue-950/40 font-bold' : idx % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-800/20' : ''
                  }`}
                >
                  {/* Hastane Adı */}
                  <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono w-4">{idx + 1}.</span>
                      <span>{row.name}</span>
                    </div>
                  </td>

                  {/* Doorfan Testi */}
                  <td className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-800 text-center font-bold text-cyan-700 dark:text-cyan-400">
                    {row.doorfan > 0 ? row.doorfan : <span className="text-slate-300">-</span>}
                  </td>

                  {/* Önleyici Bakım Uygunluğu */}
                  <td className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-800 text-center font-bold text-emerald-700 dark:text-emerald-400">
                    {row.preventiveMaintenance > 0 ? row.preventiveMaintenance : <span className="text-slate-300">-</span>}
                  </td>

                  {/* Periyodik Kontrol Uygunluğu */}
                  <td className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-800 text-center font-bold text-blue-700 dark:text-blue-400">
                    {row.periodicControl > 0 ? row.periodicControl : <span className="text-slate-300">-</span>}
                  </td>

                  {/* Sızdırmazlık */}
                  <td className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-800 text-center font-bold text-amber-700 dark:text-amber-400">
                    {row.tightness > 0 ? row.tightness : <span className="text-slate-300">-</span>}
                  </td>

                  {/* Genel Toplam */}
                  <td className="py-2.5 px-3 text-center font-extrabold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/40">
                    {row.total}
                  </td>

                  {/* İşlem */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {row.facilityId && onSelectFacility && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onSelectFacility(row.facilityId!)}
                          className="h-7 px-2 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                        >
                          Filtrele
                        </Button>
                      )}
                      {row.facilityId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/fm200/wizard?facilityId=${row.facilityId}`)}
                          className="h-7 px-2 text-[11px] font-semibold text-slate-600 hover:text-slate-900"
                        >
                          Denetim <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* GENEL TOPLAM SATIRI (AYNI GÖRSEL GİBİ ALTTA KOYU VE KIRMIZI SAYIYLA) */}
          <tfoot>
            <tr className="bg-slate-700 dark:bg-slate-800 text-white font-extrabold border-t-2 border-slate-900">
              <td className="py-3 px-3.5 border-r border-slate-600 text-white uppercase tracking-wider text-xs">
                Genel Toplam
              </td>
              <td className="py-3 px-3 border-r border-slate-600 text-center text-sm font-black text-cyan-300">
                {totals.doorfan}
              </td>
              <td className="py-3 px-3 border-r border-slate-600 text-center text-sm font-black text-emerald-300">
                {totals.preventiveMaintenance}
              </td>
              <td className="py-3 px-3 border-r border-slate-600 text-center text-sm font-black text-blue-300">
                {totals.periodicControl}
              </td>
              <td className="py-3 px-3 border-r border-slate-600 text-center text-sm font-black text-amber-300">
                {totals.tightness}
              </td>
              <td className="py-3 px-3 text-center text-base font-black text-red-400 bg-slate-900 dark:bg-black">
                {totals.total.toLocaleString('tr-TR')}
              </td>
              <td className="py-3 px-3 text-right text-[10px] text-slate-300">
                21 Hastane
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
