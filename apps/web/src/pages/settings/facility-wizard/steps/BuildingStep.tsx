import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

export default function BuildingStep({ data, update }: any) {
  const buildings = data.buildings || [];
  
  const addBuilding = () => update({ buildings: [...buildings, { name: `Blok ${buildings.length + 1}` }] });
  const removeBuilding = (idx: number) => update({ buildings: buildings.filter((_: any, i: number) => i !== idx) });
  const updateBuilding = (idx: number, field: string, val: string) => {
    const newB = [...buildings];
    newB[idx] = { ...newB[idx], [field]: val };
    update({ buildings: newB });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">2. Bina ve Blok Özellikleri</h2>
        <Button variant="outline" size="sm" onClick={addBuilding}><Plus className="w-4 h-4 mr-2" /> Blok Ekle</Button>
      </div>
      
      {buildings.length === 0 && <p className="text-slate-500 text-sm">Henüz bina/blok eklenmedi.</p>}
      
      {buildings.map((b: any, idx: number) => (
        <div key={idx} className="border p-4 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">Bina/Blok #{idx + 1}</h4>
            <Button variant="ghost" size="icon" onClick={() => removeBuilding(idx)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1"><label className="text-xs text-slate-500">Adı</label><Input value={b.name || ''} onChange={e => updateBuilding(idx, 'name', e.target.value)} /></div>
            <div className="space-y-1"><label className="text-xs text-slate-500">Yapım Yılı</label><Input value={b.constructionYear || ''} onChange={e => updateBuilding(idx, 'constructionYear', e.target.value)} /></div>
            <div className="space-y-1"><label className="text-xs text-slate-500">Kapalı Alan (m2)</label><Input value={b.closedArea || ''} onChange={e => updateBuilding(idx, 'closedArea', e.target.value)} /></div>
          </div>
        </div>
      ))}
    </div>
  );
}
