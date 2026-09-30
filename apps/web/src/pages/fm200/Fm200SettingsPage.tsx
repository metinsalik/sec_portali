import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Layers,
  Flame,
  Search,
  ChevronRight,
  ShieldAlert,
  Edit2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function Fm200SettingsPage() {
  const queryClient = useQueryClient();
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Manuel Ekleme Formu (Bina, Blok, Kat)
  const [manualForm, setManualForm] = useState({
    facilityId: '',
    building: 'Ana Bina',
    block: '',
    floor: 'Zemin Kat'
  });

  // Excel Yükleme State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelTargetFacility, setExcelTargetFacility] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Tesisleri Çek
  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Tesisler alınamadı');
      return res.json();
    }
  });

  // Bina, Blok ve Kat Konum Listesini Çek
  const { data: buildingFloors = [], isLoading } = useQuery<any[]>({
    queryKey: ['fm200BuildingFloors', selectedFacilityId],
    queryFn: async () => {
      const url = selectedFacilityId === 'all'
        ? '/fm200/building-floors'
        : `/fm200/building-floors?facilityId=${selectedFacilityId}`;
      const res = await api.get(url);
      if (!res.ok) throw new Error('Konum listesi alınamadı');
      return res.json();
    }
  });

  // Manuel Konum Ekleme
  const addBuildingFloorMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/fm200/building-floors', manualForm);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Eklenemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fm200BuildingFloors'] });
      toast.success('Bina/Kat konumu eklendi');
      setIsManualModalOpen(false);
      setManualForm({
        facilityId: selectedFacilityId !== 'all' ? selectedFacilityId : (facilities[0]?.id || ''),
        building: 'Ana Bina',
        block: '',
        floor: 'Zemin Kat'
      });
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Konum Silme
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/fm200/building-floors/${id}`);
      if (!res.ok) throw new Error('Silinemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fm200BuildingFloors'] });
      toast.success('Konum silindi');
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Excel Şablon İndir
  const handleDownloadTemplate = () => {
    window.open('/api/fm200/excel-template', '_blank');
  };

  // Excel Yükle
  const handleExcelImport = async () => {
    if (!excelFile) {
      toast.error('Lütfen bir Excel dosyası seçin');
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', excelFile);
    if (excelTargetFacility && excelTargetFacility !== 'all') {
      formData.append('facilityId', excelTargetFacility);
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/fm200/import-excel', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'İçe aktarma başarısız');

      toast.success(data.message || 'Konumlar aktarıldı');
      setIsExcelModalOpen(false);
      setExcelFile(null);
      queryClient.invalidateQueries({ queryKey: ['fm200BuildingFloors'] });
    } catch (err: any) {
      toast.error(err.message || 'Hata oluştu');
    } finally {
      setIsImporting(false);
    }
  };

  // Filtreleme
  const filteredItems = buildingFloors.filter(item => {
    const q = searchQuery.toLowerCase();
    const match =
      item.building?.toLowerCase().includes(q) ||
      (item.block && item.block.toLowerCase().includes(q)) ||
      item.floor?.toLowerCase().includes(q);
    return match;
  });

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Açıklama */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0051d5] dark:text-[#b4c5ff]">
              <Settings2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              FM-200 Konum Tanımları (Bina, Blok, Kat)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            FM-200 sistemleri için tesislerin Bina, Blok ve Kat bilgilerini Excel şablonuyla toplu yükleyin. Odalar (Mahal) ve Tüpler denetim sırasında tanımlanır.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 text-xs h-10 rounded-xl border-slate-200 dark:border-slate-800"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Excel Şablonu İndir
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setExcelTargetFacility(selectedFacilityId !== 'all' ? selectedFacilityId : (facilities[0]?.id || ''));
              setIsExcelModalOpen(true);
            }}
            className="flex items-center gap-2 text-xs h-10 rounded-xl border-slate-200 dark:border-slate-800"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel'den Yükle
          </Button>

          <Button
            onClick={() => {
              setManualForm({
                facilityId: selectedFacilityId !== 'all' ? selectedFacilityId : (facilities[0]?.id || ''),
                building: 'Ana Bina',
                block: '',
                floor: 'Zemin Kat'
              });
              setIsManualModalOpen(true);
            }}
            className="flex items-center gap-2 text-xs h-10 bg-[#0051d5] hover:bg-[#0042b0] text-white shadow-sm rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Manuel Konum Ekle
          </Button>
        </div>
      </div>

      {/* Tesis ve Arama Filtre Çubuğu */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-72">
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Tüm Tesisler ({facilities.length})</option>
            {facilities.map((f: any) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <Input
            placeholder="Bina, blok veya kat ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
          />
        </div>
      </div>

      {/* Konum Tablosu & Liste */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Konumlar yükleniyor...</div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Tanımlı Bina, Blok ve Kat Bulunamadı
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Henüz tesis için konum tanımlanmamış. "Excel'den Yükle" butonuyla hazır şablonunuzu yükleyebilir veya "Manuel Konum Ekle" ile ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Konum Listesi ({filteredItems.length} Kayıt)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">Bina Adı</th>
                  <th className="px-6 py-3">Blok</th>
                  <th className="px-6 py-3">Kat</th>
                  <th className="px-6 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                      {item.building}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">
                      {item.block || '—'}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-primary">
                      {item.floor}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`${item.building} - ${item.floor} konumunu silmek istediğinize emin misiniz?`)) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors rounded"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manuel Konum Ekleme Modalı */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              Yeni Konum Ekle (Bina, Blok, Kat)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tesis içindeki bina ve kat bilgisini kaydedin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tesis *</label>
              <select
                value={manualForm.facilityId}
                onChange={(e) => setManualForm({ ...manualForm, facilityId: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs mt-1"
              >
                {facilities.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bina Adı *</label>
              <Input
                placeholder="Örn: Ana Bina, Tek Blok"
                value={manualForm.building}
                onChange={(e) => setManualForm({ ...manualForm, building: e.target.value })}
                className="h-9 mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Blok (Opsiyonel)</label>
              <Input
                placeholder="Örn: A Blok, B Blok"
                value={manualForm.block}
                onChange={(e) => setManualForm({ ...manualForm, block: e.target.value })}
                className="h-9 mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Kat *</label>
              <Input
                placeholder="Örn: Zemin Kat, 1.Kat, B1.Kat"
                value={manualForm.floor}
                onChange={(e) => setManualForm({ ...manualForm, floor: e.target.value })}
                className="h-9 mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsManualModalOpen(false)}>
              İptal
            </Button>
            <Button
              size="sm"
              onClick={() => addBuildingFloorMutation.mutate()}
              disabled={!manualForm.facilityId || !manualForm.floor || addBuildingFloorMutation.isPending}
              className="bg-[#0051d5] hover:bg-[#0042b0] text-white"
            >
              {addBuildingFloorMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excel İle Yükleme Modalı (Tesis Adı, Bina, Blok, Kat) */}
      <Dialog open={isExcelModalOpen} onOpenChange={setIsExcelModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Excel ile Bina, Blok ve Kat Yükleme
            </DialogTitle>
            <DialogDescription className="text-xs">
              Excel tablonuzdaki <b>Tesis Adı</b>, <b>Bina</b>, <b>Blok</b> ve <b>Kat</b> bilgilerini toplu olarak sisteme aktarır.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Desteklenen Sütun Formatı:
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
                <li><b>Tesis Adı:</b> MP Adana, Liv Gaziantep vb.</li>
                <li><b>Bina:</b> Ana Bina, Tek Blok</li>
                <li><b>Blok:</b> A Blok, B Blok (Tek blok ise Ana Bina yazabilirsiniz)</li>
                <li><b>Kat:</b> 1.Kat, 2.Kat, Zemin Kat, B1.Kat vb.</li>
              </ul>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Excel Dosyası (.xlsx) *</label>
              <div className="mt-1 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-primary/80 transition-colors">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setExcelFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="fm200-excel-file-input"
                />
                <label htmlFor="fm200-excel-file-input" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <span className="text-xs font-semibold text-primary">
                    {excelFile ? excelFile.name : 'Dosya Seç veya Sürükle'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Sadece .xlsx dosyaları kabul edilir</p>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Şablon dosyanız yok mu?</span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Şablonu İndir
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsExcelModalOpen(false)}>
              İptal
            </Button>
            <Button
              size="sm"
              onClick={handleExcelImport}
              disabled={isImporting || !excelFile}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yükle ve Aktar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
