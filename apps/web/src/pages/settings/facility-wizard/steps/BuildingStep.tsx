import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Building, Ruler, Bed, Car, Trees, Layers } from 'lucide-react';

export default function BuildingStep({ data, update }: any) {
  const buildings = data.buildings || [];
  
  const addBuilding = () => {
    update({ 
      buildings: [
        ...buildings, 
        { 
          name: `Blok ${String.fromCharCode(65 + buildings.length)}`,
          constructionYear: '',
          closedArea: '',
          bedCapacity: '',
          buildingFloors: '',
          structureFloors: '',
          buildingHeight: '',
          structureHeight: '',
          parkingArea: '',
          gardenArea: ''
        }
      ] 
    });
  };

  const removeBuilding = (idx: number) => {
    update({ buildings: buildings.filter((_: any, i: number) => i !== idx) });
  };

  const updateBuilding = (idx: number, field: string, val: any) => {
    const newB = [...buildings];
    newB[idx] = { ...newB[idx], [field]: val };
    update({ buildings: newB });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            Bina & Blok Fiziksel Özellikleri
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tesis bünyesindeki ana bina, ek blok ve yapıların metrekare, kat, otopark ve kapasite verileri.
          </p>
        </div>

        <Button 
          type="button" 
          size="sm" 
          onClick={addBuilding} 
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs h-9 px-4 rounded-xl shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Yeni Blok Ekle
        </Button>
      </div>
      
      {buildings.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/20">
          <Building className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Henüz bina veya blok kaydı eklenmedi.</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            "Yeni Blok Ekle" butonuna tıklayarak tesisinize ait ilk bina bloğunun fiziksel parametrelerini girebilirsiniz.
          </p>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addBuilding} 
            className="mt-4 text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Blok Oluştur
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {buildings.map((b: any, idx: number) => (
            <div key={idx} className="border rounded-2xl p-5 bg-card space-y-4 shadow-2xs">
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <h4 className="font-bold text-sm text-foreground">
                    {b.name || `Blok ${idx + 1}`}
                  </h4>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeBuilding(idx)}
                  className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                  title="Bloğu Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Blok / Yapı Adı <span className="text-rose-500">*</span></Label>
                  <Input 
                    placeholder="Örn: Ana Bina (A Blok)" 
                    value={b.name || ''} 
                    onChange={e => updateBuilding(idx, 'name', e.target.value)} 
                    className="h-9 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Yapım Yılı</Label>
                  <Input 
                    type="number"
                    placeholder="Örn: 2015" 
                    value={b.constructionYear || ''} 
                    onChange={e => updateBuilding(idx, 'constructionYear', e.target.value)} 
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                    Kapalı Alan (m²)
                  </Label>
                  <Input 
                    type="number"
                    placeholder="Örn: 15000" 
                    value={b.closedArea || ''} 
                    onChange={e => updateBuilding(idx, 'closedArea', e.target.value)} 
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Bed className="w-3.5 h-3.5 text-muted-foreground" />
                    Yatak Kapasitesi
                  </Label>
                  <Input 
                    type="number"
                    placeholder="Örn: 150" 
                    value={b.bedCapacity || ''} 
                    onChange={e => updateBuilding(idx, 'bedCapacity', e.target.value)} 
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                    Bina Kat Sayısı
                  </Label>
                  <Input 
                    type="number"
                    placeholder="Örn: 8" 
                    value={b.buildingFloors || ''} 
                    onChange={e => updateBuilding(idx, 'buildingFloors', e.target.value)} 
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Yapı Kat Sayısı</Label>
                  <Input 
                    type="number"
                    placeholder="Örn: 10" 
                    value={b.structureFloors || ''} 
                    onChange={e => updateBuilding(idx, 'structureFloors', e.target.value)} 
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Bina Yüksekliği (m)</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    placeholder="Örn: 28.5" 
                    value={b.buildingHeight || ''} 
                    onChange={e => updateBuilding(idx, 'buildingHeight', e.target.value)} 
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Yapı Yüksekliği (m)</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    placeholder="Örn: 32.0" 
                    value={b.structureHeight || ''} 
                    onChange={e => updateBuilding(idx, 'structureHeight', e.target.value)} 
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-muted-foreground" />
                    Otopark Alanı (m²)
                  </Label>
                  <Input 
                    type="number"
                    placeholder="Örn: 2500" 
                    value={b.parkingArea || ''} 
                    onChange={e => updateBuilding(idx, 'parkingArea', e.target.value)} 
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Trees className="w-3.5 h-3.5 text-muted-foreground" />
                    Bahçe / Açık Alan (m²)
                  </Label>
                  <Input 
                    type="number"
                    placeholder="Örn: 1200" 
                    value={b.gardenArea || ''} 
                    onChange={e => updateBuilding(idx, 'gardenArea', e.target.value)} 
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
