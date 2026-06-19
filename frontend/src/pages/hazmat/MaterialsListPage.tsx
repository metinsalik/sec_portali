import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Search, AlertTriangle, Eye, Pencil, Trash2, Upload, Loader2, ArrowUpDown, FileText } from 'lucide-react';
import { PrintCardModal } from '@/components/hazmat/PrintCardModal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function MaterialsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeFacilityId = localStorage.getItem('activeFacilityId');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBrand, setFilterBrand] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [sortField, setSortField] = useState<'name' | 'category'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [printMaterial, setPrintMaterial] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const isGlobalAdmin = user?.isAdmin || user?.isManagement;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [globalDeleteId, setGlobalDeleteId] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: ['facility-materials', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId) return [];
      
      const res = await api.get(`/hazmat/materials/global?facilityId=${activeFacilityId}`);
      if (!res.ok) throw new Error('Sunucu hatası');
      
      const data = await res.json();
      
      return data.map((item: any) => ({
        ...item.material,
        isInFacility: item.isInFacility,
        facilityAmount: item.facilityAmount,
        facilityUnit: item.facilityUnit,
      }));
    },
    enabled: !!activeFacilityId
  });

  const deleteMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const res = await api.delete(`/hazmat/materials/facility/${activeFacilityId}/${materialId}`);
      if (!res.ok) throw new Error('Silinemedi');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Tehlikeli madde tesisten silindi.');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['facility-materials', activeFacilityId] });
    },
    onError: () => toast.error('Silme işlemi başarısız.')
  });

  const globalDeleteMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const res = await api.delete(`/hazmat/materials/${materialId}`);
      if (!res.ok) throw new Error('Kalıcı silinemedi');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Tehlikeli madde sistemden kalıcı olarak silindi.');
      setGlobalDeleteId(null);
      setSelectedIds(prev => prev.filter(id => id !== globalDeleteId));
      queryClient.invalidateQueries({ queryKey: ['facility-materials', activeFacilityId] });
    },
    onError: () => toast.error('Kalıcı silme işlemi başarısız.')
  });

  const bulkGlobalDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.post(`/hazmat/materials/bulk-delete`, { ids });
      if (!res.ok) throw new Error('Toplu silinemedi');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Seçili maddeler kalıcı olarak silindi.');
      setBulkDeleteConfirm(false);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['facility-materials', activeFacilityId] });
    },
    onError: () => toast.error('Toplu silme işlemi başarısız.')
  });

  const addToFacilityMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const res = await api.post(`/hazmat/materials/add-to-facility`, { facilityId: activeFacilityId, materialId });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Madde tesise eklenemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-materials'] });
      queryClient.invalidateQueries({ queryKey: ['facility-materials', activeFacilityId] });
      toast.success('Madde tesise başarıyla eklendi');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const bulkAddToFacilityMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/hazmat/materials/bulk-add-to-facility`, { facilityId: activeFacilityId, materialIds: selectedIds });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Maddeler tesise eklenemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-materials'] });
      queryClient.invalidateQueries({ queryKey: ['facility-materials', activeFacilityId] });
      toast.success('Seçilen maddeler tesise başarıyla eklendi');
      setSelectedIds([]);
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        const importedMaterials: any[] = [];
        
        // Loop through all sheets
        wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
          
          if (data.length <= 1) return; // Skip if empty or only header
          
          const keywords = [
            'ürün adı', 'madde adı', 'malzeme adı', 'isim',
            'miktar', 'adedi',
            'birim',
            'marka',
            'kullanım şekli',
            'bileşimi', 'içerik',
            'tehlike tanımları',
            'ilk yardım', 'ilkyardım',
            'yangınla', 'yangında', 'yangın',
            'kaza sonucu', 'serbest kalması',
            'kullanım ve depolama',
            'maruz kalma', 'kişisel korunma',
            'fiziksel ve kimyasal',
            'stabilite', 'reaktivite', 'reaktiflik',
            'toksikolojik',
            'temizlik', 'imha',
            'tehlikeli madde sınıfı',
            'productname', 'brandname', 'amountvalue', 'usagemethod', 'composition',
            'hazarddescription', 'firstaid', 'firefightingmeasures', 'accidentalreleasemeasures',
            'handlingandstorage', 'exposurecontrolsppe', 'physicalandchemicalproperties',
            'stabilityandreactivity', 'toxicologicalinformation', 'disposalconsiderations', 'transportinfo'
          ];
          
          let searchData = data;
          let headerRow: any = searchData.find((row: any) => {
             if (!row) return false;
             let matchCount = 0;
             for (const cell of row) {
                 const c = String(cell).toLowerCase();
                 if (keywords.some(k => c.includes(k))) matchCount++;
             }
             return matchCount >= 3;
          });

          if (!headerRow) {
             const maxCols = Math.max(...data.map((r: any) => r?.length || 0));
             const transposed = [];
             for (let c = 0; c < maxCols; c++) {
                 transposed.push(data.map((r: any) => r[c]));
             }
             const transHeader = transposed.find((row: any) => {
                 if (!row) return false;
                 let matchCount = 0;
                 for (const cell of row) {
                     const c = String(cell).toLowerCase();
                     if (keywords.some(k => c.includes(k))) matchCount++;
                 }
                 return matchCount >= 3;
             });
             if (transHeader) {
                 searchData = transposed;
                 headerRow = transHeader;
             }
          }

          if (!headerRow) return;

          const normalizeText = (text: any) => String(text || '').toLocaleLowerCase('tr-TR').trim();
          const getColIndex = (kw: string[]) => headerRow.findIndex((h: string) => h && kw.some(k => normalizeText(h).includes(k)));

          const idxName = getColIndex(['ürün adı', 'madde adı', 'malzeme adı', 'isim', 'productname']);
          const idxBrand = getColIndex(['marka', 'brandname']);
          const idxAmount = getColIndex(['miktar', 'adedi', 'amountvalue']);
          const idxUnit = getColIndex(['birim', 'unitid']);
          const idxUsage = getColIndex(['kullanım şekli', 'usagemethod']);
          const idxComposition = getColIndex(['bileşimi', 'içerik', 'composition']);
          const idxHazard = getColIndex(['tehlike tanımları', 'tehlike', 'hazarddescription']);
          const idxFirstAid = getColIndex(['ilk yardım', 'ilkyardım', 'firstaid']);
          const idxFire = getColIndex(['yangınla', 'yangında', 'yangın', 'firefightingmeasures']);
          const idxRelease = getColIndex(['kaza sonucu', 'serbest kalması', 'accidentalreleasemeasures']);
          const idxHandling = getColIndex(['kullanım ve depolama', 'depolama', 'handlingandstorage']);
          const idxExposure = getColIndex(['maruz kalma', 'kişisel korunma', 'exposurecontrolsppe']);
          const idxPhysical = getColIndex(['fiziksel ve kimyasal', 'fiziksel', 'kimyasal', 'physicalandchemicalproperties']);
          const idxStability = getColIndex(['stabilite', 'reaktivite', 'reaktiflik', 'stabilityandreactivity']);
          const idxTox = getColIndex(['toksikolojik', 'toxicologicalinformation']);
          const idxDisposal = getColIndex(['temizlik', 'imha', 'disposalconsiderations']);
          const idxTransport = getColIndex(['tehlikeli madde sınıfı', 'transportinfo']);

          const startIndex = searchData.indexOf(headerRow) + 1;
          
          for (let i = startIndex; i < searchData.length; i++) {
            const row: any = searchData[i];
            if (!row) continue;
            
            let productName = '';
            if (idxName !== -1 && row[idxName]) productName = String(row[idxName]).trim();
            else if (idxBrand !== -1 && row[idxBrand]) productName = String(row[idxBrand]).trim();
            else if (idxComposition !== -1 && row[idxComposition]) productName = "Bilinmeyen Ürün (" + String(row[idxComposition]).substring(0,20) + ")";
            else continue;

            if (!productName) continue;
            
            // Avoid adding duplicate in the payload
            if (importedMaterials.some(m => normalizeText(m.productName) === normalizeText(productName))) continue;

            let parsedAmount = 1;
            if (idxAmount !== -1 && row[idxAmount]) {
               const match = String(row[idxAmount]).match(/\d+/);
               if (match) parsedAmount = parseInt(match[0], 10);
            }

            importedMaterials.push({
              productName,
              brandName: idxBrand !== -1 ? row[idxBrand] : '',
              amountValue: parsedAmount,
              usageMethod: idxUsage !== -1 ? row[idxUsage] : '',
              composition: idxComposition !== -1 ? row[idxComposition] : '',
              hazardDescription: idxHazard !== -1 ? row[idxHazard] : '',
              firstAid: idxFirstAid !== -1 ? row[idxFirstAid] : '',
              fireFightingMeasures: idxFire !== -1 ? row[idxFire] : '',
              accidentalReleaseMeasures: idxRelease !== -1 ? row[idxRelease] : '',
              handlingAndStorage: idxHandling !== -1 ? row[idxHandling] : '',
              exposureControlsPpe: idxExposure !== -1 ? row[idxExposure] : '',
              physicalAndChemicalProperties: idxPhysical !== -1 ? row[idxPhysical] : '',
              stabilityAndReactivity: idxStability !== -1 ? row[idxStability] : '',
              toxicologicalInfo: idxTox !== -1 ? row[idxTox] : '',
              disposalConsiderations: idxDisposal !== -1 ? row[idxDisposal] : '',
              transportInfo: idxTransport !== -1 ? row[idxTransport] : ''
            });
          }
        });

        if (importedMaterials.length === 0) {
          toast.error("Excel dosyasında okunabilir veri bulunamadı.");
          return;
        }

        // BATCHING: Send data in chunks of 100 to avoid corporate proxy 413 Payload Too Large limits
        const BATCH_SIZE = 100;
        let totalCreated = 0;
        let totalUpdated = 0;
        let hasError = false;

        toast.info(`Excel verisi işleniyor... Toplam ${importedMaterials.length} kayıt ${Math.ceil(importedMaterials.length / BATCH_SIZE)} parça halinde gönderilecek.`);

        for (let i = 0; i < importedMaterials.length; i += BATCH_SIZE) {
          const batch = importedMaterials.slice(i, i + BATCH_SIZE);
          
          const token = localStorage.getItem('token');
          const response = await api.post(`/hazmat/materials/import?token=${token}`, {
            facilityId: activeFacilityId,
            materials: batch
          });

          if (response.ok) {
            const result = await response.json();
            totalCreated += result.results?.created || 0;
            totalUpdated += result.results?.updated || 0;
          } else {
            console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, await response.text());
            hasError = true;
          }
        }

        if (hasError) {
          toast.error('İçe aktarma sırasında bazı kayıtlar gönderilirken sunucu hatası oluştu. Lütfen bağlantınızı kontrol edin.');
        } else {
          toast.success(`İçe aktarma tamamlandı: ${totalCreated} yeni madde oluşturuldu, ${totalUpdated} madde güncellendi.`);
        }
        queryClient.invalidateQueries({ queryKey: ['facility-materials', activeFacilityId] });

      } catch (err) {
        console.error("Excel parse error:", err);
        toast.error('Excel dosyası okunamadı.');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const uniqueBrands = useMemo(() => {
    const brands = new Set(items.map(item => item.brandName).filter(Boolean));
    return Array.from(brands);
  }, [items]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(items.map(item => item.category?.name).filter(Boolean));
    return Array.from(categories);
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const matchesSearch = 
        item.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brandName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesBrand = filterBrand === 'ALL' || item.brandName === filterBrand;
      const matchesCategory = filterCategory === 'ALL' || item.category?.name === filterCategory;
      
      return matchesSearch && matchesBrand && matchesCategory;
    });

    result.sort((a, b) => {
      if (sortField === 'name') {
        const nameA = a.productName || '';
        const nameB = b.productName || '';
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else if (sortField === 'category') {
        const catA = a.category?.name || '';
        const catB = b.category?.name || '';
        return sortOrder === 'asc' ? catA.localeCompare(catB) : catB.localeCompare(catA);
      }
      return 0;
    });

    return result;
  }, [items, searchQuery, filterBrand, filterCategory, sortField, sortOrder]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Tehlikeli Maddeler</h1>
            <span className="bg-primary/10 text-primary text-sm font-medium px-2.5 py-0.5 rounded-full">
              {items.length} Kayıt
            </span>
          </div>
          <p className="text-muted-foreground">Tesisinizde bulunan tehlikeli maddelerin listesi.</p>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="gap-2" disabled={isImporting}>
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isImporting ? 'Aktarılıyor...' : "Excel'den İçe Aktar"}
          </Button>
          <Button onClick={() => navigate('/hazmat/materials/new')} className="gap-2">
            <Plus className="w-4 h-4" />
            Yeni Ekle
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Ürün Adı veya Marka ara..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Kategori Filtresi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tüm Kategoriler</SelectItem>
            {uniqueCategories.map(cat => (
              <SelectItem key={cat as string} value={cat as string}>{cat as string}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterBrand} onValueChange={setFilterBrand}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Marka Filtresi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tüm Markalar</SelectItem>
            {uniqueBrands.map(brand => (
              <SelectItem key={brand as string} value={brand as string}>{brand as string}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedIds.length > 0 && (
          <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-between border">
            <span className="text-sm font-medium">{selectedIds.length} madde seçildi</span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-primary border-primary/50 hover:bg-primary/10"
                onClick={() => bulkAddToFacilityMutation.mutate()}
                disabled={bulkAddToFacilityMutation.isLoading}
              >
                <Plus className="w-4 h-4" />
                Seçilenleri Tesise Ekle
              </Button>
              {isGlobalAdmin && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setBulkDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Seçilenleri Kalıcı Sil
                </Button>
              )}
            </div>
          </div>
        )}

      <div className="bg-card border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Madde Bulunamadı</h3>
            <p className="text-muted-foreground mb-6">Arama kriterlerine uygun veya kayıtlı tehlikeli madde bulunamadı.</p>
            {!searchQuery && filterBrand === 'ALL' && (
              <Button onClick={() => navigate('/hazmat/materials/new')}>İlk Maddeyi Ekle</Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr className="bg-muted/50 border-b">
                  <th className="px-4 py-3 w-12">
                    <input 
                      type="checkbox" 
                      className="rounded border-muted-foreground/30 text-primary focus:ring-primary cursor-pointer"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(filteredItems.map(i => i.id));
                        else setSelectedIds([]);
                      }}
                      checked={selectedIds.length > 0 && selectedIds.length === filteredItems.length}
                    />
                  </th>
                  <th 
                    className="px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => {
                      if (sortField === 'name') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('name');
                        setSortOrder('asc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Madde Adı
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => {
                      if (sortField === 'category') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('category');
                        setSortOrder('asc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Kategori
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 font-medium">Tehlike Etiketleri</th>
                  <th className="px-4 py-3 font-medium text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        className="rounded border-muted-foreground/30 text-primary focus:ring-primary cursor-pointer"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(prev => [...prev, item.id]);
                          else setSelectedIds(prev => prev.filter(id => id !== item.id));
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                      {item.brandName ? `${item.brandName} - ` : ''}{item.productName}
                      {item.isInFacility ? (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                          Tesisimde Var
                        </span>
                      ) : (
                        <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                          Havuzda
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.category?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex -space-x-2">
                        {item.hazardLabels?.slice(0, 3).map((hl: any) => (
                          <img 
                            key={hl.label.id} 
                            src={hl.label.imageUrl} 
                            alt={hl.label.name} 
                            className="w-8 h-8 rounded-full border-2 border-background object-contain bg-white" 
                            title={hl.label.name}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Bilgi Kartı Yazdır"
                          onClick={() => setPrintMaterial(item)}
                        >
                          <FileText className="w-4 h-4 text-emerald-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Görüntüle"
                          onClick={() => navigate(`/hazmat/materials/view/${item.id}`)}
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        
                        {!item.isInFacility ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="ml-2 gap-1 text-primary border-primary/50 hover:bg-primary/10"
                            onClick={() => addToFacilityMutation.mutate(item.id)}
                            disabled={addToFacilityMutation.isLoading}
                          >
                            <Plus className="w-4 h-4" />
                            Tesise Ekle
                          </Button>
                        ) : (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Düzenle"
                              onClick={() => navigate(`/hazmat/materials/edit/${item.id}`)}
                            >
                              <Pencil className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Tesisten Çıkar" onClick={() => setDeleteId(item.id)}>
                              <Trash2 className="w-4 h-4 text-orange-500" />
                            </Button>
                          </>
                        )}

                        {isGlobalAdmin && (
                          <Button variant="ghost" size="icon" title="Kalıcı Sil" onClick={() => setGlobalDeleteId(item.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tehlikeli Maddeyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu tehlikeli maddeyi tesisinizden silmek istediğinize emin misiniz? Bu işlem, maddeyi ortak kütüphaneden silmez, yalnızca sizin tesisinizin envanterinden çıkarır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600 text-white" 
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isLoading ? 'Siliniyor...' : 'Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!globalDeleteId} onOpenChange={(open) => !open && setGlobalDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tehlikeli Maddeyi Kalıcı Olarak Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu tehlikeli maddeyi SİSTEMDEN TAMAMEN silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve madde diğer tüm tesislerden de kaldırılabilir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white" 
              onClick={() => globalDeleteId && globalDeleteMutation.mutate(globalDeleteId)}
            >
              {globalDeleteMutation.isLoading ? 'Siliniyor...' : 'Kalıcı Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteConfirm} onOpenChange={(open) => !open && setBulkDeleteConfirm(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seçili Maddeleri Kalıcı Olarak Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Seçilen {selectedIds.length} tehlikeli maddeyi SİSTEMDEN TAMAMEN silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white" 
              onClick={() => bulkGlobalDeleteMutation.mutate(selectedIds)}
            >
              {bulkGlobalDeleteMutation.isLoading ? 'Siliniyor...' : 'Kalıcı Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PrintCardModal 
        isOpen={!!printMaterial} 
        onClose={() => setPrintMaterial(null)} 
        material={printMaterial} 
      />
    </div>
  );
}
