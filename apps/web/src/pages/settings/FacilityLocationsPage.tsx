import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  Loader2,
  Building,
  FileSpreadsheet,
  Download,
  Upload,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';

export default function FacilityLocationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [facilityId, setFacilityId] = useState(localStorage.getItem('activeFacilityId') || '');
  
  // Excel Modal State
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Hızlı Ekleme
  const [newLocation, setNewLocation] = useState({
    building: 'Ana Bina',
    block: '',
    floor: 'Zemin Kat',
    department: '',
    description: '',
    type: 'KAT'
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNode, setEditingNode] = useState<any>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const { data: facilities = [] } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['facility-locations', facilityId],
    queryFn: async () => {
      if (!facilityId || facilityId === 'all') return [];
      const res = await api.get(`/locations?facilityId=${facilityId}`);
      if (!res.ok) throw new Error('Lokasyonlar getirilemedi');
      return res.json();
    },
    enabled: !!facilityId && facilityId !== 'all'
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/locations', { ...data, facilityId });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Ekleme başarısız');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-locations'] });
      toast.success('Lokasyon eklendi');
      setNewLocation({
        building: 'Ana Bina',
        block: '',
        floor: 'Zemin Kat',
        department: '',
        description: '',
        type: 'KAT'
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lokasyon eklenirken hata oluştu');
    }
  });

  const renameMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/locations/rename-node', { ...data, facilityId });
      if (!res.ok) throw new Error('Güncelleme başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-locations'] });
      toast.success('İsim güncellendi');
      setEditingNode(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/locations/delete-node', { ...data, facilityId });
      if (!res.ok) throw new Error('Silme başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-locations'] });
      toast.success('Düğüm silindi');
    }
  });

  const addLoc = () => {
    let buildingField = newLocation.building || 'Ana Bina';
    if (newLocation.block && newLocation.block !== buildingField) {
      buildingField = `${buildingField} (${newLocation.block})`;
    }
    const floorField = newLocation.floor || 'Zemin Kat';
    const name = `${buildingField} - ${floorField}`;

    addMutation.mutate({
      building: buildingField,
      floor: floorField,
      department: newLocation.department,
      description: newLocation.block || newLocation.description,
      name,
      type: 'KAT'
    });
  };

  const removeNode = (level: string, value: string, parentBuilding?: string, parentFloor?: string) => {
    if (!window.confirm(`${value} ve altındaki kayıtlar silinecek. Onaylıyor musunuz?`)) return;
    deleteMutation.mutate({ level, value, parentBuilding, parentFloor });
  };

  const saveEdit = () => {
    if (!editingNode || !editingNode.newValue) return;
    renameMutation.mutate({ ...editingNode });
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Excel Şablon İndir
  const handleDownloadTemplate = () => {
    window.open('/api/locations/excel-template', '_blank');
  };

  // Excel İle Yükle
  const handleExcelImport = async () => {
    if (!excelFile) {
      toast.error('Lütfen bir Excel dosyası seçin');
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', excelFile);
    if (facilityId && facilityId !== 'all') {
      formData.append('facilityId', facilityId);
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/locations/import-excel', {
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
      queryClient.invalidateQueries({ queryKey: ['facility-locations'] });
    } catch (err: any) {
      toast.error(err.message || 'Hata oluştu');
    } finally {
      setIsImporting(false);
    }
  };

  // Hiyerarşik Ağaç Yapısı
  const tree = useMemo(() => {
    const root: Record<string, any> = {};
    const q = searchQuery.toLowerCase();

    locations.forEach((loc: any) => {
      const b = loc.building || 'Belirtilmemiş Bina/Blok';
      const f = loc.floor || 'Belirtilmemiş Kat';
      const d = loc.department || loc.description || 'Genel Alan';

      if (q && !b.toLowerCase().includes(q) && !f.toLowerCase().includes(q) && !d.toLowerCase().includes(q)) {
        return;
      }

      if (!root[b]) root[b] = { type: 'building', name: b, children: {}, id: `b-${b}` };
      if (!root[b].children[f]) root[b].children[f] = { type: 'floor', name: f, children: {}, id: `f-${b}-${f}` };
      if (!root[b].children[f].children[d]) root[b].children[f].children[d] = { type: 'department', name: d, locations: [], id: `d-${b}-${f}-${d}` };
      
      root[b].children[f].children[d].locations.push(loc);
    });
    return root;
  }, [locations, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 pb-16">
      {/* Üst Başlık & Aksiyon Kartı */}
      <div className="bg-card border rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Tesis Bina, Blok & Kat Lokasyon Yönetimi
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tesislerin Bina, Blok ve Kat bilgilerini Excel şablonuyla toplu yükleyebilir veya pratik form ile ekleyebilirsiniz.
              </p>
            </div>
          </div>
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
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center gap-2 text-xs h-10 rounded-xl border-slate-200 dark:border-slate-800"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel'den Yükle
          </Button>

          <div className="w-64">
            <Select value={facilityId} onValueChange={v => {
              setFacilityId(v);
              localStorage.setItem('activeFacilityId', v);
            }}>
              <SelectTrigger className="h-10 bg-background text-xs font-semibold rounded-xl">
                <div className="flex items-center gap-2 truncate">
                  <Building className="w-3.5 h-3.5 text-primary shrink-0" />
                  <SelectValue placeholder="Tesis Seçiniz..." />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {facilities.map((f: any) => (
                  <SelectItem key={f.id} value={f.id} className="text-xs font-medium">
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {(!facilityId || facilityId === 'all') ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed rounded-3xl bg-muted/20">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <Building className="w-7 h-7 text-muted-foreground/60" />
          </div>
          <h3 className="text-base font-bold text-foreground">Tesis Seçimi Bekleniyor</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Lokasyon ağacını görüntülemek veya Excel'den toplu bina, blok ve kat yüklemek için lütfen üst menüden bir tesis seçiniz.
          </p>
        </div>
      ) : (
        <>
          {/* Kolay & Yalın Manuel Ekleme Formu (Kullanıcının İstediği: Bina, Blok, Kat) */}
          <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Hızlı Konum Ekle (Bina &gt; Blok &gt; Kat)
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Örn: Tesis: MP Adana | Bina: Ana Bina | Blok: A Blok | Kat: Zemin Kat
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Bina Adı <span className="text-rose-500">*</span></Label>
                <Input 
                  value={newLocation.building} 
                  onChange={e => setNewLocation({...newLocation, building: e.target.value})} 
                  placeholder="Örn: Ana Bina, Tek Blok" 
                  className="h-10 text-xs rounded-xl" 
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Blok (Opsiyonel)</Label>
                <Input 
                  value={newLocation.block} 
                  onChange={e => setNewLocation({...newLocation, block: e.target.value})} 
                  placeholder="Örn: A Blok, B Blok" 
                  className="h-10 text-xs rounded-xl" 
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Kat <span className="text-rose-500">*</span></Label>
                <Input 
                  value={newLocation.floor} 
                  onChange={e => setNewLocation({...newLocation, floor: e.target.value})} 
                  placeholder="Örn: Zemin Kat, 1.Kat, B1.Kat" 
                  className="h-10 text-xs rounded-xl" 
                />
              </div>

              <div>
                <Button 
                  onClick={addLoc} 
                  disabled={!newLocation.building || !newLocation.floor || addMutation.isPending}
                  className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90"
                >
                  {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
                  Konumu Ekle
                </Button>
              </div>
            </div>
          </div>

          {/* Arama & Hiyerarşik Ağaç Kartı */}
          <div className="bg-card border rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Tanımlı Konumlar ({locations.length})
                </h3>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Bina, blok veya kat ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" /> Lokasyonlar yükleniyor...
              </div>
            ) : Object.keys(tree).length === 0 ? (
              <div className="p-12 text-center border border-dashed rounded-xl bg-muted/10">
                <Building className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">Henüz Konum Eklenmemiş</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Yukarıdaki "Hızlı Konum Ekle" formunu kullanabilir veya "Excel'den Yükle" ile tek tıkla aktarabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.values(tree).map((buildingNode: any) => {
                  const isExpanded = expandedNodes[buildingNode.id] !== false; // varsayılan açık
                  return (
                    <div key={buildingNode.id} className="border rounded-xl overflow-hidden bg-background">
                      {/* Bina Başlığı */}
                      <div
                        onClick={() => toggleNode(buildingNode.id)}
                        className="px-4 py-3 bg-muted/40 hover:bg-muted/70 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-primary" />
                            {buildingNode.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                            {Object.keys(buildingNode.children).length} Kat
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNode('building', buildingNode.name);
                            }}
                            className="p-1 text-muted-foreground hover:text-rose-600 transition-colors"
                            title="Binayı ve Alt Katları Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Katlar Listesi */}
                      {isExpanded && (
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-muted/10">
                          {Object.values(buildingNode.children).map((floorNode: any) => (
                            <div
                              key={floorNode.id}
                              className="p-2.5 rounded-lg bg-card border flex items-center justify-between gap-2 shadow-2xs"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                <span className="text-xs font-semibold text-foreground truncate">
                                  {floorNode.name}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeNode('floor', floorNode.name, buildingNode.name)}
                                className="p-1 text-muted-foreground hover:text-rose-600 transition-colors shrink-0"
                                title="Bu Katı Sil"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Excel İle Yükleme Modalı (Tesis Adı, Bina, Blok, Kat) */}
      <Dialog open={isExcelModalOpen} onOpenChange={setIsExcelModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Excel ile Bina, Blok ve Kat Yükleme
            </DialogTitle>
            <DialogDescription className="text-xs">
              Excel tablonuzda <b>Tesis Adı</b>, <b>Bina</b>, <b>Blok</b> ve <b>Kat</b> sütunlarını içerecek şekilde toplu yükleme yapabilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Şablon Görseli Rehberi */}
            <div className="p-3 bg-muted/50 rounded-xl border text-[11px] space-y-1.5 text-muted-foreground">
              <div className="font-semibold text-foreground flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Desteklenen Sütun Formatı:
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                <li><b>Tesis Adı:</b> MP Adana, Liv Gaziantep vb.</li>
                <li><b>Bina:</b> Ana Bina, Tek Blok vb.</li>
                <li><b>Blok:</b> A Blok, B Blok veya Tek Blok ise Ana Bina</li>
                <li><b>Kat:</b> 1.Kat, 2.Kat, Zemin Kat, B1.Kat vb.</li>
              </ul>
            </div>

            <div>
              <Label className="text-xs font-semibold">Excel Dosyası (.xlsx) *</Label>
              <div className="mt-1 flex items-center justify-center border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/80 transition-colors">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setExcelFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="locations-excel-input"
                />
                <label htmlFor="locations-excel-input" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <span className="text-xs font-semibold text-primary">
                    {excelFile ? excelFile.name : 'Dosya Seç veya Sürükle'}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Sadece Excel (.xlsx, .xls) dosyaları</p>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Şablon dosyanız yok mu?</span>
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
