import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, PackageSearch, Search, MapPin, Printer, ChevronRight, LayoutGrid, List, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DepartmentPrintModal } from '@/components/hazmat/DepartmentPrintModal';
import { HazmatMaterialSummaryDialog } from '@/components/hazmat/HazmatMaterialSummaryDialog';
import { Badge } from '@/components/ui/badge';

export default function HazmatDepartmentsPage() {
  const navigate = useNavigate();
  const activeFacilityId = localStorage.getItem('activeFacilityId');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const pathParam = searchParams.get('path');
  const currentPath = pathParam ? pathParam.split('|').filter(Boolean) : [];

  const setCurrentPath = (newPath: string[]) => {
    if (newPath.length === 0) {
      searchParams.delete('path');
    } else {
      searchParams.set('path', newPath.join('|'));
    }
    setSearchParams(searchParams);
  };

  // Print state
  const [printData, setPrintData] = useState<{department: any, items: any[]} | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Dialog state
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  const { data: summaryData } = useQuery({
    queryKey: ['inventory-summary', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId) return [];
      const res = await api.get(`/hazmat/inventory/summary?facilityId=${activeFacilityId}`);
      if (!res.ok) throw new Error('Hata');
      const data = await res.json();
      return data.facilityItems;
    },
    enabled: !!activeFacilityId
  });

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['hazmat-departments', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId) return [];
      const res = await api.get(`/hazmat/inventory/departments?facilityId=${activeFacilityId}&isCleaningCart=false`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    enabled: !!activeFacilityId
  });

  // Derived Inventory Items for the current path
  const currentLevelInventory = useMemo(() => {
    if (!summaryData || currentPath.length === 0) return [];
    const results: any[] = [];
    
    summaryData.forEach((facItem: any) => {
      const mat = facItem.material;
      if (!mat || !mat.inventory) return;
      
      mat.inventory.forEach((invItem: any) => {
        const dept = invItem.department;
        if (!dept || dept.isCleaningCart) return; // Skip cleaning carts here? Or keep them? We keep them if they somehow match.
        
        // Check if this department matches currentPath
        const b = dept.building || 'Belirtilmemiş Blok';
        const f = dept.floor || 'Belirtilmemiş Kat';
        const n = dept.name || 'Belirtilmemiş Birim';
        const desc = dept.description || 'İsimsiz Mahal';
        
        if (currentPath.length >= 1 && b !== currentPath[0]) return;
        if (currentPath.length >= 2 && f !== currentPath[1]) return;
        if (currentPath.length >= 3 && n !== currentPath[2]) return;
        if (currentPath.length >= 4 && desc !== currentPath[3]) return;

        results.push({
          id: invItem.id, // unique inventory item id
          material: mat,
          productName: mat.productName,
          brandName: mat.brandName,
          categoryName: mat.category?.name || 'Kategorisiz',
          department: dept,
          amountValue: facItem.amountValue,
          unitName: facItem.unit?.name,
          minQuantity: invItem.minQuantity,
          maxQuantity: invItem.maxQuantity,
          hazardLabels: mat.hazardLabels || []
        });
      });
    });
    
    // Sort by product name
    return results.sort((a, b) => a.productName.localeCompare(b.productName));
  }, [summaryData, currentPath]);

  // Auto-select single block
  useEffect(() => {
    if (departments.length > 0 && currentPath.length === 0) {
      const blocks = Array.from(new Set(departments.map((d: any) => d.building || 'Belirtilmemiş Blok')));
      if (blocks.length === 1) {
        setCurrentPath([blocks[0]]);
      }
    }
  }, [departments, currentPath.length]);

  if (!activeFacilityId) {
    return <div className="p-8 text-center text-muted-foreground">Lütfen önce bir tesis seçin.</div>;
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>;
  }

  const handlePrint = async (levelName: string, ids: string[]) => {
    try {
      const promises = ids.map(id => api.get(`/hazmat/inventory/department/${id}?facilityId=${activeFacilityId}`).then(res => res.json()));
      const results = await Promise.all(promises);
      
      let mergedItems: any[] = [];
      results.forEach(res => {
        if (res.inventoryItems && res.department) {
          const deptName = res.department.name || 'İsimsiz Birim';
          const itemsWithDept = res.inventoryItems.map((item: any) => ({
            ...item,
            _departmentName: deptName
          }));
          mergedItems = [...mergedItems, ...itemsWithDept];
        } else if (res.inventoryItems) {
          mergedItems = [...mergedItems, ...res.inventoryItems];
        }
      });

      const finalItems = mergedItems.sort((a, b) => {
        const deptComp = (a._departmentName || '').localeCompare(b._departmentName || '');
        if (deptComp !== 0) return deptComp;
        const nameA = a.material?.productName || '';
        const nameB = b.material?.productName || '';
        return nameA.localeCompare(nameB);
      });

      setPrintData({
        department: { name: levelName },
        items: finalItems
      });
      setIsPrintOpen(true);
    } catch (err) {
      console.error(err);
      alert("Yazdırma verileri alınırken hata oluştu.");
    }
  };

  // Determine Current Node Exact ID (for assigning inventory to current level)
  const exactNodeMatch = departments.find((d: any) => {
    const b = d.building || 'Belirtilmemiş Blok';
    const f = d.floor || 'Belirtilmemiş Kat';
    const n = d.name || 'Belirtilmemiş Birim';
    const desc = d.description || 'İsimsiz Mahal';

    if (currentPath.length === 1) return b === currentPath[0] && !d.floor && !d.name && !d.description;
    if (currentPath.length === 2) return b === currentPath[0] && f === currentPath[1] && !d.name && !d.description;
    if (currentPath.length === 3) return b === currentPath[0] && f === currentPath[1] && n === currentPath[2] && !d.description;
    if (currentPath.length === 4) return b === currentPath[0] && f === currentPath[1] && n === currentPath[2] && desc === currentPath[3];
    return false;
  });

  // Calculate Children for Current Path
  const filteredDepartments = departments.filter((d: any) => {
    const b = d.building || 'Belirtilmemiş Blok';
    const f = d.floor || 'Belirtilmemiş Kat';
    const n = d.name || 'Belirtilmemiş Birim';
    
    if (currentPath.length >= 1 && b !== currentPath[0]) return false;
    if (currentPath.length >= 2 && f !== currentPath[1]) return false;
    if (currentPath.length >= 3 && n !== currentPath[2]) return false;
    return true;
  });

  // Determine what level to show (Blocks, Floors, Depts, or Rooms)
  const nextLevelIndex = currentPath.length;
  
  // Group children
  const childrenMap = new Map<string, { count: number, ids: string[], isLeaf: boolean, exactId?: string }>();
  
  filteredDepartments.forEach((d: any) => {
    const b = d.building || 'Belirtilmemiş Blok';
    const f = d.floor || 'Belirtilmemiş Kat';
    const n = d.name || 'Belirtilmemiş Birim';
    const desc = d.description || 'İsimsiz Mahal';
    
    const pathParts = [b, f, n, desc];
    
    // Ignore exact matches to current path, we only want children
    if (pathParts.slice(0, 4).every((p, i) => i < currentPath.length ? p === currentPath[i] : !p || p === 'Belirtilmemiş Kat' || p === 'Belirtilmemiş Birim' || p === 'İsimsiz Mahal')) {
      return; 
    }

    const childName = pathParts[nextLevelIndex] || (nextLevelIndex === 1 ? 'Belirtilmemiş Kat' : nextLevelIndex === 2 ? 'Belirtilmemiş Birim' : 'İsimsiz Mahal');
    
    if (!childName) return;

    if (!childrenMap.has(childName)) {
      childrenMap.set(childName, { count: 0, ids: [], isLeaf: nextLevelIndex >= 3 });
    }
    
    const child = childrenMap.get(childName)!;
    child.count += (d._count?.inventory || 0);
    child.ids.push(d.id);
    
    // Check if this specific department object IS exactly the child node
    const isExactChild = (
      (nextLevelIndex === 0 && !d.floor && !d.name && !d.description) ||
      (nextLevelIndex === 1 && d.floor === childName && !d.name && !d.description) ||
      (nextLevelIndex === 2 && d.name === childName && !d.description) ||
      (nextLevelIndex === 3 && d.description === childName)
    );
    if (isExactChild) {
      child.exactId = d.id;
    }
  });

  const displayChildren = Array.from(childrenMap.entries())
    .filter(([name]) => name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Path Navigation Helpers
  const handleNavigateUp = (index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1));
  };

  const getLevelLabel = (level: number) => {
    if (level === 0) return 'Bloklar';
    if (level === 1) return 'Katlar';
    if (level === 2) return 'Birimler';
    return 'Mahaller';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Departmanlar (Lokasyonlar)</h1>
          <p className="text-muted-foreground">
            Tesisinize ait lokasyonlarda gezinerek tehlikeli madde envanterini görüntüleyin veya atama yapın.
          </p>
        </div>
      </div>

      <div className="bg-muted/20 p-4 rounded-lg border flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <span 
            className={`cursor-pointer hover:text-foreground hover:underline ${currentPath.length === 0 ? 'font-semibold text-foreground' : ''}`}
            onClick={() => setCurrentPath([])}
          >
            Tesis Ana Görünümü
          </span>
          {currentPath.map((pathItem, index) => (
            <div key={index} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4" />
              <span 
                className={`cursor-pointer hover:text-foreground hover:underline ${index === currentPath.length - 1 ? 'font-semibold text-foreground' : ''}`}
                onClick={() => handleNavigateUp(index)}
              >
                {pathItem}
              </span>
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          {exactNodeMatch && (
            <Button size="sm" onClick={() => navigate(`/hazmat/departments/${exactNodeMatch.id}`)}>
              {currentPath[currentPath.length - 1]} Envanterini Yönet
            </Button>
          )}
          {currentPath.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => handlePrint(currentPath.join(' / '), filteredDepartments.map((d: any) => d.id))}>
              <Printer className="w-4 h-4 mr-2" /> Toplu Yazdır
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/10 p-4 rounded-lg border">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={`${getLevelLabel(nextLevelIndex)} ara...`} 
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            {displayChildren.length} Alt Konum
          </div>
          <div className="flex bg-muted p-1 rounded-md">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('card')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {departments.length === 0 ? (
        <div className="text-center p-12 bg-muted/20 border rounded-lg">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Lokasyon Bulunamadı</h3>
          <p className="text-muted-foreground mb-4">Bu tesise henüz hiçbir lokasyon eklenmemiş.</p>
          <Button onClick={() => navigate('/hazmat/settings/departments')}>Ayarlardan Ekle</Button>
        </div>
      ) : displayChildren.length === 0 ? (
        <div className="text-center p-12 bg-muted/20 border rounded-lg">
          <p className="text-muted-foreground">Aradığınız kritere uygun alt konum bulunamadı.</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayChildren.map(([name, data]) => (
            <Card 
              key={name} 
              className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group flex flex-col"
              onClick={() => {
                if (data.isLeaf && data.exactId) {
                  navigate(`/hazmat/departments/${data.exactId}`);
                } else {
                  setCurrentPath([...currentPath, name]);
                }
              }}
            >
              <CardHeader className="pb-3 flex-1">
                <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                  <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                  {name}
                </CardTitle>
                <CardDescription>
                  {data.isLeaf ? 'Mahal (Son Seviye)' : 'Alt Seviyelere Gitmek İçin Tıklayın'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <PackageSearch className="w-4 h-4" />
                    <span>Tehlikeli Madde Sayısı:</span>
                  </div>
                  <span className="font-semibold text-base">{data.count}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => { e.stopPropagation(); handlePrint(currentPath.length > 0 ? `${currentPath.join(' / ')} / ${name}` : name, data.ids); }}
                  >
                    <Printer className="w-4 h-4 mr-2" /> Yazdır
                  </Button>
                  {(data.isLeaf && data.exactId) ? (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={(e) => { e.stopPropagation(); navigate(`/hazmat/departments/${data.exactId}`); }}
                    >
                      Envanter
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="flex-1"
                      onClick={(e) => { e.stopPropagation(); setCurrentPath([...currentPath, name]); }}
                    >
                      İçine Gir <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg bg-card overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-muted-foreground border-b bg-muted/30">
            <div className="col-span-5">Konum Adı</div>
            <div className="col-span-3 text-center">Tehlikeli Madde Sayısı</div>
            <div className="col-span-4 text-right">İşlemler</div>
          </div>
          <div className="divide-y">
            {displayChildren.map(([name, data]) => (
              <div 
                key={name} 
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/10 cursor-pointer transition-colors"
                onClick={() => {
                  if (data.isLeaf && data.exactId) {
                    navigate(`/hazmat/departments/${data.exactId}`);
                  } else {
                    setCurrentPath([...currentPath, name]);
                  }
                }}
              >
                <div className="col-span-5 font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-foreground">{name}</div>
                    <div className="text-xs text-muted-foreground">{data.isLeaf ? 'Mahal' : 'Tıklayarak içine girin'}</div>
                  </div>
                </div>
                <div className="col-span-3 text-center flex items-center justify-center gap-2 text-muted-foreground">
                  <PackageSearch className="w-4 h-4" />
                  <span className="font-semibold text-foreground">{data.count}</span>
                </div>
                <div className="col-span-4 flex items-center justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); handlePrint(currentPath.length > 0 ? `${currentPath.join(' / ')} / ${name}` : name, data.ids); }}
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </Button>
                  {(data.isLeaf && data.exactId) ? (
                    <Button 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); navigate(`/hazmat/departments/${data.exactId}`); }}
                    >
                      Envanter
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={(e) => { e.stopPropagation(); setCurrentPath([...currentPath, name]); }}
                    >
                      İçine Gir
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentPath.length > 0 && currentLevelInventory.length > 0 && (
        <Card className="border-primary/20 shadow-sm mt-8">
          <CardHeader>
            <CardTitle>Bu Konumdaki Tehlikeli Maddeler</CardTitle>
            <CardDescription>Bulunduğunuz seviye ve altındaki tüm konumlara atanmış maddeler.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Tehlikeli Madde</th>
                      <th className="px-4 py-3 font-medium">Kategori</th>
                      <th className="px-4 py-3 font-medium">Ambalaj</th>
                      <th className="px-4 py-3 font-medium">Bulunduğu Alt Konum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentLevelInventory.map((item: any) => (
                      <tr 
                        key={item.id} 
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => setSelectedMaterial(item)}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                              {item.hazardLabels.slice(0, 3).map((hl: any) => (
                                <img 
                                  key={hl.label.id} 
                                  src={hl.label.imageUrl} 
                                  alt={hl.label.name} 
                                  className="w-6 h-6 rounded-full border-2 border-background object-contain bg-white" 
                                  title={hl.label.name}
                                />
                              ))}
                            </div>
                            <div>
                              <span className="group-hover:text-primary transition-colors">{item.productName}</span>
                              {item.brandName && (
                                <div className="text-xs text-muted-foreground font-normal">
                                  {item.brandName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="font-normal bg-muted/50">
                            {item.categoryName}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {item.amountValue ? item.amountValue : '-'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.unitName || ''}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="font-normal bg-primary/5">
                            {item.department.name || item.department.description || 'İsimsiz Mahal'}
                            {(item.department.floor && currentPath.length < 2) ? ` (${item.department.floor})` : ''}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <HazmatMaterialSummaryDialog 
        material={selectedMaterial?.material}
        isOpen={!!selectedMaterial}
        onOpenChange={(open) => !open && setSelectedMaterial(null)}
        amountValue={selectedMaterial?.amountValue}
        unitName={selectedMaterial?.unitName}
        onNavigateToPool={() => {
          setSelectedMaterial(null);
          navigate(`/hazmat/materials/view/${selectedMaterial?.material?.id}`);
        }}
        onNavigateToLocations={() => {
          setSelectedMaterial(null);
          navigate(`/hazmat/inventory/material/${selectedMaterial?.material?.id}`);
        }}
      />

      {printData && (
        <DepartmentPrintModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          department={printData.department}
          inventoryItems={printData.items}
        />
      )}
    </div>
  );
}
