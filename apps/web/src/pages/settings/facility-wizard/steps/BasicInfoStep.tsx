import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IL_ILCE_DATA } from '@/data/turkiye';

const FACILITY_TYPES = ["Hastane", "Ofis", "Depo", "Tıp Merkezi", "Diyaliz Merkezi", "Çağrı Merkezi", "Konuk Evi", "Şantiye"];

export default function BasicInfoStep({ data, update }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">1. Temel Bilgiler</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tesis Adı</label>
          <Input value={data.name || ''} onChange={e => update({ name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Kısa Ad</label>
          <Input value={data.shortName || ''} onChange={e => update({ shortName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Tesis Tipi</label>
          <Select value={data.type || ''} onValueChange={v => update({ type: v })}>
            <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
            <SelectContent>
              {FACILITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Tehlike Sınıfı</label>
          <Select value={data.dangerClass || ''} onValueChange={v => update({ dangerClass: v })}>
            <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Az Tehlikeli">Az Tehlikeli</SelectItem>
              <SelectItem value="Tehlikeli">Tehlikeli</SelectItem>
              <SelectItem value="Çok Tehlikeli">Çok Tehlikeli</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
