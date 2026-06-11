import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Search, AlertTriangle, Eye, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function MaterialsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeFacilityId = localStorage.getItem('activeFacilityId');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBrand, setFilterBrand] = useState('ALL');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: ['global-materials', activeFacilityId],
    queryFn: async () => {
      // Fetch global materials
      const globalRes = await api.get('/hazmat/materials/search');
      if (!globalRes.ok) throw new Error('Sunucu hatası');
      const globalMaterials = await globalRes.json();

      // Fetch facility items to get amount and unit
      let facilityItemsMap = new Map();
      if (activeFacilityId) {
        try {
          const facRes = await api.get(`/hazmat/materials?facilityId=${activeFacilityId}`);
          if (facRes.ok) {
            const facData = await facRes.json();
            facData.forEach((item: any) => {
              facilityItemsMap.set(item.materialId, {
                amountValue: item.amountValue,
                unit: item.unit
              });
            });
          }
        } catch (e) {
          console.error("Facility items fetch failed", e);
        }
      }

      // Merge
      return globalMaterials.map((m: any) => {
        const facItem = facilityItemsMap.get(m.id);
        return {
          ...m,
          facilityAmount: facItem?.amountValue || null,
          facilityUnit: facItem?.unit?.name || null,
          facilityUnitSymbol: facItem?.unit?.symbol || null,
        };
      });
    }
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
      queryClient.invalidateQueries({ queryKey: ['global-materials', activeFacilityId] });
    },
    onError: () => toast.error('Silme işlemi başarısız.')
  });

  const uniqueBrands = useMemo(() => {
    const brands = new Set(items.map(item => item.brandName).filter(Boolean));
    return Array.from(brands);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brandName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesBrand = filterBrand === 'ALL' || item.brandName === filterBrand;
      
      return matchesSearch && matchesBrand;
    });
  }, [items, searchQuery, filterBrand]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tehlikeli Maddeler</h1>
          <p className="text-muted-foreground">Tesisinizde bulunan tehlikeli maddelerin listesi.</p>
        </div>
        <div className="flex items-center gap-2">
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
        <Select value={filterBrand} onValueChange={setFilterBrand}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Marka Filtresi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tüm Markalar</SelectItem>
            {uniqueBrands.map(brand => (
              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
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
                  <th className="px-4 py-3 font-medium">Ürün Adı / Marka</th>
                  <th className="px-4 py-3 font-medium">Miktar</th>
                  <th className="px-4 py-3 font-medium">Birim</th>
                  <th className="px-4 py-3 font-medium text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-3">
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
                        <div>
                          {item.productName}
                          <div className="text-xs text-muted-foreground font-normal">
                            {item.brandName || 'Marka Belirtilmemiş'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {item.facilityAmount ? item.facilityAmount : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.facilityUnit ? `${item.facilityUnit} ${item.facilityUnitSymbol ? `(${item.facilityUnitSymbol})` : ''}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
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
    </div>
  );
}
