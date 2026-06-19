import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HazmatMaterialSummaryContent } from '@/components/hazmat/HazmatMaterialSummaryContent';
import { PrintCardModal } from '@/components/hazmat/PrintCardModal';

export default function HazmatFacilityMaterialPage() {
  const { id: materialId } = useParams();
  const navigate = useNavigate();
  const activeFacilityId = localStorage.getItem('activeFacilityId');
  const [printMaterial, setPrintMaterial] = useState<any>(null);

  const { data: summaryData, isLoading } = useQuery({
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

  const facilityItem = useMemo(() => {
    if (!summaryData) return null;
    return summaryData.find((item: any) => item.material?.id === materialId);
  }, [summaryData, materialId]);

  const { totalMin, totalMax, departments } = useMemo(() => {
    if (!facilityItem || !facilityItem.material || !facilityItem.material.inventory) {
      return { totalMin: 0, totalMax: 0, departments: [] };
    }
    
    let tMin = 0;
    let tMax = 0;
    const depts: any[] = [];

    facilityItem.material.inventory.forEach((invItem: any) => {
      tMin += (invItem.minQuantity || 0);
      tMax += (invItem.maxQuantity || 0);
      if (invItem.department) {
        depts.push({
          ...invItem.department,
          inventoryItem: invItem
        });
      }
    });

    return { totalMin: tMin, totalMax: tMax, departments: depts };
  }, [facilityItem]);

  if (!activeFacilityId) {
    return <div className="p-8 text-center text-muted-foreground">Lütfen önce bir tesis seçin.</div>;
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>;
  }

  if (!facilityItem) {
    return (
      <div className="p-8 text-center border rounded-lg m-6 bg-muted/20">
        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Malzeme Bulunamadı</h3>
        <p className="text-muted-foreground mb-4">Bu tehlikeli madde bu tesise eklenmemiş.</p>
        <Button onClick={() => navigate(-1)}>Geri Dön</Button>
      </div>
    );
  }

  const material = facilityItem.material;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Tesis Geneli Malzeme Durumu</h1>
      </div>

      {/* Üst Kısım: Özet Kartı */}
      <Card className="shadow-sm border-primary/20">
        <CardContent className="p-6">
          <HazmatMaterialSummaryContent 
            material={material}
            amountValue={facilityItem.amountValue}
            unitName={facilityItem.unit?.name}
            onPrint={() => setPrintMaterial(material)}
            onNavigateToPool={() => navigate(`/hazmat/materials/view/${material.id}`)}
          />
        </CardContent>
      </Card>

      {/* Orta Kısım: Tesis Toplam Miktarları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-sm bg-blue-50/50 border-blue-100">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-medium text-blue-800 mb-1 uppercase tracking-wider">Tesis Geneli Minimum Miktar</span>
            <span className="text-3xl font-bold text-blue-900">{totalMin}</span>
            <span className="text-sm text-blue-700/80 mt-1">({facilityItem.unit?.name || 'Adet'})</span>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-orange-50/50 border-orange-100">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-medium text-orange-800 mb-1 uppercase tracking-wider">Tesis Geneli Maksimum Miktar</span>
            <span className="text-3xl font-bold text-orange-900">{totalMax}</span>
            <span className="text-sm text-orange-700/80 mt-1">({facilityItem.unit?.name || 'Adet'})</span>
          </CardContent>
        </Card>
      </div>

      {/* Alt Kısım: Lokasyon Listesi Tablosu */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            Bulunduğu Lokasyonlar ({departments.length})
          </CardTitle>
          <CardDescription>Bu tehlikeli maddenin tesis içerisinde bulunduğu tüm departmanlar ve belirlenen miktarlar.</CardDescription>
        </CardHeader>
        <CardContent>
          {departments.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Lokasyon / Departman</th>
                      <th className="px-4 py-3 font-medium text-center">Blok / Kat</th>
                      <th className="px-4 py-3 font-medium text-center">Min. Miktar</th>
                      <th className="px-4 py-3 font-medium text-center">Maks. Miktar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {departments.map((dept: any) => {
                      const isCart = dept.isCleaningCart || dept.name?.includes('[Temizlik Arabası]');
                      const nameStr = dept.name || dept.description || 'İsimsiz Lokasyon';
                      
                      return (
                        <tr 
                          key={dept.id} 
                          className="hover:bg-muted/30 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/hazmat/departments/${dept.id}`)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                                {isCart && <Badge variant="secondary" className="mr-2 text-[10px]">Temizlik Arabası</Badge>}
                                {nameStr}
                              </span>
                            </div>
                            {dept.description && dept.name && (
                              <div className="text-xs text-muted-foreground mt-1 ml-6">{dept.description}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="text-muted-foreground">
                              {dept.building || '-'}
                              {dept.floor ? ` / ${dept.floor}` : ''}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {dept.inventoryItem?.minQuantity || 0}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              {dept.inventoryItem?.maxQuantity || 0}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-muted/20 border rounded-lg text-muted-foreground">
              Bu tehlikeli madde tesiste hiçbir departmana atanmamış.
            </div>
          )}
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
