import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PrintCardModal } from '@/components/hazmat/PrintCardModal';

export default function FacilityInventoryListPage() {
  const navigate = useNavigate();
  const activeFacilityId = localStorage.getItem('activeFacilityId');

  const [searchMaterial, setSearchMaterial] = useState('');
  const [searchDepartment, setSearchDepartment] = useState('');
  const [printMaterial, setPrintMaterial] = useState<any>(null);

  // 1. Fetch summary for the list
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['inventory-summary', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId) return [];
      const res = await api.get(`/hazmat/inventory/summary?facilityId=${activeFacilityId}`);
      if (!res.ok) throw new Error('Failed to fetch summary');
      const data = await res.json();
      return data.inventoryItems;
    },
    enabled: !!activeFacilityId
  });

  // 2. Fetch facility materials for amount and unit
  const { data: facilityItems = [] } = useQuery({
    queryKey: ['facility-materials', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId) return [];
      const res = await api.get(`/hazmat/materials?facilityId=${activeFacilityId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!activeFacilityId
  });

  const groupedSummary = useMemo(() => {
    if (!summaryData) return [];
    
    const groups: Record<string, any> = {};
    summaryData.forEach((item: any) => {
      const matId = item.material.id;
      if (!groups[matId]) {
        groups[matId] = {
          materialId: matId,
          productName: item.material.productName,
          brandName: item.material.brandName,
          hazardLabels: item.material.hazardLabels || [],
          ppes: item.material.ppes || [],
          departments: [],
          material: item.material
        };
      }
      groups[matId].departments.push(item.department.name);
    });

    // Merge facility quantity/unit
    const enrichedGroups = Object.values(groups).map((g: any) => {
      const facItem = facilityItems.find((fi: any) => fi.materialId === g.materialId);
      return {
        ...g,
        amountValue: facItem?.amountValue || null,
        unitName: facItem?.unit?.name || null,
        unitSymbol: facItem?.unit?.symbol || null,
      };
    });
    
    return enrichedGroups;
  }, [summaryData, facilityItems]);

  // Apply filters
  const filteredGroups = useMemo(() => {
    if (!groupedSummary) return [];
    let filtered = groupedSummary;

    if (searchMaterial) {
      const q = searchMaterial.toLowerCase();
      filtered = filtered.filter((g: any) => 
        g.productName?.toLowerCase().includes(q) || 
        g.brandName?.toLowerCase().includes(q)
      );
    }

    if (searchDepartment) {
      const q = searchDepartment.toLowerCase();
      filtered = filtered.filter((g: any) => 
        g.departments.some((d: string) => d.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [groupedSummary, searchMaterial, searchDepartment]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tesis Envanteri</h1>
          <p className="text-muted-foreground mt-1">
            Tesisteki tehlikeli maddeleri ve atandıkları departmanları listeleyin.
          </p>
        </div>
        <Button onClick={() => navigate('/hazmat/inventory/new')} className="shadow-md shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Envanter Ekle
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-muted/30 p-4 rounded-lg border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Tehlikeli Madde veya Marka Ara..." 
            className="pl-9 bg-background"
            value={searchMaterial}
            onChange={(e) => setSearchMaterial(e.target.value)}
          />
        </div>
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Departman Adı Ara..." 
            className="pl-9 bg-background"
            value={searchDepartment}
            onChange={(e) => setSearchDepartment(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-primary/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <CardHeader>
          <CardTitle>Envanter Listesi</CardTitle>
          <CardDescription>Departmanlara dağıtımı yapılmış tehlikeli maddelerin özet tablosu.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Tehlikeli Madde</th>
                    <th className="px-4 py-3 font-medium">Miktar / Birim</th>
                    <th className="px-4 py-3 font-medium">Etiketler / KKD</th>
                    <th className="px-4 py-3 font-medium">Bulunduğu Departmanlar</th>
                    <th className="px-4 py-3 font-medium text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">Yükleniyor...</td>
                  </tr>
                ) : filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="py-8 text-center text-muted-foreground bg-muted/20">
                        {groupedSummary.length === 0 
                          ? "Henüz departmanlara atanmış bir tehlikeli madde bulunmuyor."
                          : "Arama kriterlerinize uygun kayıt bulunamadı."}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
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
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {item.amountValue ? item.amountValue : '-'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.unitName ? `${item.unitName} ${item.unitSymbol ? `(${item.unitSymbol})` : ''}` : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {item.ppes?.slice(0, 3).map((p: any) => (
                            <span key={p.ppe.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                              {p.ppe.name}
                            </span>
                          ))}
                          {item.ppes?.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                              +{item.ppes.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {item.departments.map((dName: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="font-normal text-xs bg-primary/5 hover:bg-primary/10 transition-colors">
                              {dName}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          title="Bilgi Kartı Oluştur"
                          onClick={() => setPrintMaterial(item.material)}
                        >
                          <Printer className="h-4 w-4 text-blue-600" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <PrintCardModal 
        isOpen={!!printMaterial}
        onClose={() => setPrintMaterial(null)}
        material={printMaterial}
      />
    </div>
  );
}
