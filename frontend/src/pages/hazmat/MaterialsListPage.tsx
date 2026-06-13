import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: ['facility-materials', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId) return [];
      
      const res = await api.get(`/hazmat/materials?facilityId=${activeFacilityId}`);
      if (!res.ok) throw new Error('Sunucu hatası');
      
      const facData = await res.json();
      
      return facData.map((item: any) => ({
        ...item.material,
        facilityAmount: item.amountValue || null,
        facilityUnit: item.unit?.name || null,
        facilityUnitSymbol: item.unit?.symbol || null,
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
          
          // Find header row indices based on common keywords
          // Standard headers: Ürün Adı, Kullanım Şekli, Bileşimi/İçerik, vs.
          const headerRow: any = data.find((row: any) => row && row.some && row.some((cell: string) => String(cell).toLowerCase().includes('ürün adı')));
          if (!headerRow) return;
          
          const getColIndex = (keywords: string[]) => {
            return headerRow.findIndex((h: string) => h && keywords.some(k => String(h).toLowerCase().includes(k)));
          };

          const idxName = getColIndex(['ürün adı']);
          const idxAmount = getColIndex(['adedi', 'miktarı']);
          const idxUsage = getColIndex(['kullanım şekli']);
          const idxComposition = getColIndex(['bileşimi', 'içerik']);
          const idxHazard = getColIndex(['tehlike tanımları']);
          const idxFirstAid = getColIndex(['ilk yardım']);
          const idxFire = getColIndex(['yangında', 'yangın']);
          const idxRelease = getColIndex(['kaza sonucu', 'serbest kalması']);
          const idxHandling = getColIndex(['kullanım ve depolama']);
          const idxExposure = getColIndex(['maruz kalma', 'kişisel korunma']);
          const idxPhysical = getColIndex(['fiziksel ve kimyasal']);
          const idxStability = getColIndex(['stabilite', 'reaktiflik']);
          const idxTox = getColIndex(['toksikolojik']);
          const idxDisposal = getColIndex(['temizlik', 'imha']);

          const startIndex = data.indexOf(headerRow) + 1;
          
          for (let i = startIndex; i < data.length; i++) {
            const row: any = data[i];
            if (!row || !row[idxName]) continue;
            
            const productName = String(row[idxName]).trim();
            if (!productName) continue;
            
            // Avoid adding duplicate in the payload
            if (importedMaterials.some(m => m.productName.toLowerCase() === productName.toLowerCase())) continue;

            let parsedAmount = 1;
            if (idxAmount !== -1 && row[idxAmount]) {
               const match = String(row[idxAmount]).match(/\\d+/);
               if (match) parsedAmount = parseInt(match[0], 10);
            }

            importedMaterials.push({
              productName,
              amountValue: parsedAmount,
              usageMethod: idxUsage !== -1 ? row[idxUsage] : '',
              composition: idxComposition !== -1 ? row[idxComposition] : '',
              hazardDescription: idxHazard !== -1 ? row[idxHazard] : '',
              firstAid: idxFirstAid !== -1 ? row[idxFirstAid] : '',
              fireFightingMeasures: idxFire !== -1 ? row[idxFire] : '',
              accidentalReleaseMeasures: idxRelease !== -1 ? row[idxRelease] : '',
              handlingAndStorage: idxHandling !== -1 ? row[idxHandling] : '',
              exposureControls: idxExposure !== -1 ? row[idxExposure] : '',
              physicalProperties: idxPhysical !== -1 ? row[idxPhysical] : '',
              stabilityAndReactivity: idxStability !== -1 ? row[idxStability] : '',
              toxicologicalInfo: idxTox !== -1 ? row[idxTox] : '',
              disposalConsiderations: idxDisposal !== -1 ? row[idxDisposal] : ''
            });
          }
        });

        if (importedMaterials.length === 0) {
          toast.error("Excel dosyasında okunabilir veri bulunamadı.");
          return;
        }

        const response = await api.post('/hazmat/materials/import', {
          facilityId: activeFacilityId,
          materials: importedMaterials
        });

        if (response.ok) {
          const result = await response.json();
          toast.success(`İçe aktarma tamamlandı: ${result.results?.created} yeni madde oluşturuldu, ${result.results?.updated} madde güncellendi.`);
          queryClient.invalidateQueries({ queryKey: ['facility-materials', activeFacilityId] });
        } else {
          toast.error('İçe aktarma sırasında sunucu hatası oluştu.');
        }

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
                <tr>
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
                    <td className="px-4 py-3 font-medium text-foreground">
                      {item.brandName ? `${item.brandName} - ` : ''}{item.productName}
                      <span className="text-muted-foreground font-normal ml-1">
                        ( {item.facilityAmount ? item.facilityAmount : '-'} - {item.facilityUnit ? `${item.facilityUnit}` : '-'} )
                      </span>
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
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Düzenle"
                          onClick={() => navigate(`/hazmat/materials/edit/${item.id}`)}
                        >
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Sil" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
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

      <PrintCardModal 
        isOpen={!!printMaterial} 
        onClose={() => setPrintMaterial(null)} 
        material={printMaterial} 
      />
    </div>
  );
}
