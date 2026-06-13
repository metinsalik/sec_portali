import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, LayoutGrid, List, Printer, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PrintCardModal } from '@/components/hazmat/PrintCardModal';
import { DepartmentPrintModal } from '@/components/hazmat/DepartmentPrintModal';

export default function HazmatDepartmentViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const activeFacilityId = localStorage.getItem('activeFacilityId');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [printMaterial, setPrintMaterial] = useState<any>(null);
  const [isDepartmentPrintOpen, setIsDepartmentPrintOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['hazmat-department-details', id, activeFacilityId],
    queryFn: async () => {
      const res = await api.get(`/hazmat/inventory/department/${id}?facilityId=${activeFacilityId}`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    enabled: !!id && !!activeFacilityId
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>;
  }

  if (!data?.department) {
    return <div className="p-8 text-center text-red-500">Departman bulunamadı.</div>;
  }

  const { department, inventoryItems = [] } = data;

  const filteredItems = inventoryItems.filter((item: any) => 
    item.material?.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.material?.brandName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between border-b pb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/hazmat/departments')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{department.name}</h1>
            <p className="text-muted-foreground">Departmana atanan tehlikeli maddeler</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            className="shadow-sm"
            onClick={() => navigate(`/hazmat/inventory/new?departmentId=${id}`)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Envanter Ekle
          </Button>
          <Button 
            variant="outline" 
            className="shadow-sm border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            onClick={() => setIsDepartmentPrintOpen(true)}
          >
            <Printer className="w-4 h-4 mr-2" />
            Departman Envanteri Çıktısı Al
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20 p-4 rounded-lg border">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Madde adı veya marka ara..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Toplam {filteredItems.length} kayıt
          </div>
          <div className="flex bg-muted p-1 rounded-md">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('list')}
              title="Liste Görünümü"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('card')}
              title="Kart Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center p-12 bg-card border rounded-lg">
          <p className="text-muted-foreground mb-4">Bu departmana atanmış bir tehlikeli madde bulunmuyor.</p>
          <Button variant="outline" onClick={() => navigate('/hazmat/inventory')}>Envanterden Madde Ata</Button>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item: any) => {
            const mat = item.material;
            return (
              <div key={item.id} className="bg-card border rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="p-4 flex items-start gap-4">
                  <div className="w-16 h-16 bg-muted/50 rounded-lg flex items-center justify-center shrink-0 border overflow-hidden">
                    {mat.imageUrl ? (
                      <img src={`${BASE_URL}${mat.imageUrl}`} alt={mat.productName} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-xl font-bold text-muted-foreground">{mat.productName.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate" title={mat.productName}>{mat.productName}</h3>
                    <p className="text-sm text-muted-foreground truncate">{mat.brandName || 'Marka Yok'}</p>
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-muted/20 border-y grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs block mb-1">Min. Miktar</span>
                    <span className="font-medium">{item.minQuantity !== null ? item.minQuantity : '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block mb-1">Maks. Miktar</span>
                    <span className="font-medium">{item.maxQuantity !== null ? item.maxQuantity : '-'}</span>
                  </div>
                </div>

                <div className="p-4 flex-1">
                  <span className="text-xs text-muted-foreground mb-2 block">GHS Etiketleri</span>
                  <div className="flex flex-wrap gap-1.5">
                    {mat.hazardLabels?.length > 0 ? (
                      mat.hazardLabels.map((hl: any) => (
                        <div key={hl.id} title={hl.label.name} className="border rounded bg-card p-1">
                          {hl.label.imageUrl ? (
                            <img src={hl.label.imageUrl} alt={hl.label.name} className="w-6 h-6 object-contain" />
                          ) : (
                            <span className="text-[10px] px-1">{hl.label.name}</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Etiket yok</span>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t bg-muted/10 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setPrintMaterial(mat)} className="text-blue-600 hover:text-blue-700" title="Bilgi Kartı">
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/hazmat/materials/view/${mat.id}`)} className="text-blue-600 hover:text-blue-700">
                    Detayları Gör
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border rounded-lg bg-card overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-muted-foreground border-b bg-muted/30">
            <div className="col-span-5">Ürün Adı</div>
            <div className="col-span-3">GHS Etiketleri</div>
            <div className="col-span-2 text-right">Miktar Limiti</div>
            <div className="col-span-2 text-right">İşlemler</div>
          </div>
          <div className="divide-y">
            {filteredItems.map((item: any) => {
              const mat = item.material;
              return (
                <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/10 transition-colors">
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-muted/50 rounded flex items-center justify-center shrink-0 border overflow-hidden">
                      {mat.imageUrl ? (
                        <img src={`${BASE_URL}${mat.imageUrl}`} alt={mat.productName} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">{mat.productName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate" title={mat.productName}>{mat.productName}</p>
                      <p className="text-xs text-muted-foreground truncate">{mat.brandName || 'Marka Yok'}</p>
                    </div>
                  </div>
                  
                  <div className="col-span-3 flex flex-wrap gap-1">
                    {mat.hazardLabels?.slice(0, 3).map((hl: any) => (
                      <div key={hl.id} title={hl.label.name} className="border rounded bg-background p-0.5">
                        {hl.label.imageUrl ? (
                          <img src={hl.label.imageUrl} alt={hl.label.name} className="w-5 h-5 object-contain" />
                        ) : (
                          <span className="text-[9px] px-1">{hl.label.name.substring(0, 3)}</span>
                        )}
                      </div>
                    ))}
                    {mat.hazardLabels?.length > 3 && (
                      <span className="text-xs text-muted-foreground self-center">+{mat.hazardLabels.length - 3}</span>
                    )}
                  </div>
                  
                  <div className="col-span-2 text-right text-sm">
                    {item.minQuantity !== null || item.maxQuantity !== null ? (
                      <span className="text-muted-foreground">
                        {item.minQuantity ?? '-'} / {item.maxQuantity ?? '-'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  
                  <div className="col-span-2 text-right flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setPrintMaterial(mat)} className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0" title="Bilgi Kartı">
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/hazmat/materials/view/${mat.id}`)} className="text-blue-600 hover:text-blue-700">
                      Detay
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <PrintCardModal 
        isOpen={!!printMaterial}
        onClose={() => setPrintMaterial(null)}
        material={printMaterial}
      />

      <DepartmentPrintModal
        isOpen={isDepartmentPrintOpen}
        onClose={() => setIsDepartmentPrintOpen(false)}
        department={department}
        inventoryItems={filteredItems}
      />
    </div>
  );
}
