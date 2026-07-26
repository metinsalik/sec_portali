import React, { useEffect } from 'react';
import type { RenovationReportInput, RenovationReportCheck } from '@/types/renovationReport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  data: Partial<RenovationReportInput>;
  updateData: (data: React.SetStateAction<Partial<RenovationReportInput>>) => void;
}

const DEFAULT_CHECKS: Partial<RenovationReportCheck>[] = [
  { id: '1', field: 'Elektrik Tesisatı', scope: 'ADP, UPS, Panolar, prizler, aydınlatma, kaçak akım rölesi, topraklama vb.', status: 'DEGERLENDIRILMEDI' },
  { id: '2', field: 'Zayıf Akım Sistemleri', scope: 'Yangın algılama, hemşire çağrı, acil anons, kamera sistemleri', status: 'DEGERLENDIRILMEDI' },
  { id: '3', field: 'Sıhhi Tesisat', scope: 'Temiz su, pis su, armatürler, gider eğimi, hidrofor bağlantıları', status: 'DEGERLENDIRILMEDI' },
  { id: '4', field: 'HVAC', scope: 'Fan-coil, menfez, VAV/CAV, klima santrali, hava yönü ve debisi', status: 'DEGERLENDIRILMEDI' },
  { id: '5', field: 'Medikal Gaz Tesisatı', scope: 'O2, vakum, hava, N2O, regülatörler, vanalar, etiketleme, sızdırmazlık', status: 'DEGERLENDIRILMEDI' },
  { id: '6', field: 'Yangın Algılama ve Alarm Sistemi', scope: 'Dedektörler, alarm butonları, flaşörler, senaryo bağlantıları', status: 'DEGERLENDIRILMEDI' },
  { id: '7', field: 'Yangın Söndürme Sistemi', scope: 'Sprinkler, yangın dolapları, FM200 sistemleri, çıkış yön levhaları', status: 'DEGERLENDIRILMEDI' },
  { id: '8', field: 'Zemin Kaplamaları', scope: 'PVC, epoksi veya seramik yüzeyin düzgünlüğü, birleşim yerleri, kaymazlık, yanma dayanımı vb.', status: 'DEGERLENDIRILMEDI' },
  { id: '9', field: 'Duvar ve Tavan Kaplamaları', scope: 'Boya, alçıpan, tavan modülleri, hijyenik yüzey durumu, yanma dayanımı vb.', status: 'DEGERLENDIRILMEDI' },
  { id: '10', field: 'Aydınlatma Sistemi', scope: 'Genel ve acil aydınlatmalar, lümen seviyesi, enerji verimliliği', status: 'DEGERLENDIRILMEDI' },
  { id: '11', field: 'Acil Aydınlatma ve Yönlendirme', scope: 'UPS beslemeli acil armatürler, çıkış yön tabelaları', status: 'DEGERLENDIRILMEDI' },
  { id: '12', field: 'Kartlı Geçiş ve Güvenlik Sistemleri', scope: 'Kartlı giriş, manyetik kilit, kontrol paneli', status: 'DEGERLENDIRILMEDI' },
  { id: '13', field: 'Seslendirme ve Anons Sistemleri', scope: 'Hoparlör yerleşimi, acil durum anons testi', status: 'DEGERLENDIRILMEDI' },
  { id: '14', field: 'Donanım ve Mobilya Sabitlemeleri', scope: 'Sabitlenmiş masa, dolap, hasta başı ünitesi, duvar montaj kontrolleri', status: 'DEGERLENDIRILMEDI' },
  { id: '15', field: 'Termostat ve Kontrol Panelleri', scope: 'Ayar aralıkları, kalibrasyon, fonksiyon testi', status: 'DEGERLENDIRILMEDI' },
  { id: '16', field: 'Kapı ve Geçiş Elemanları', scope: 'Otomatik kapı, cam kapı, stoper, kapı kolu vb.', status: 'DEGERLENDIRILMEDI' },
  { id: '17', field: 'Ses ve Gürültü Düzeyi', scope: 'Fan-coil, HVAC, cihaz kaynaklı gürültü ölçümü', status: 'DEGERLENDIRILMEDI' },
  { id: '18', field: 'Temizlik ve Hijyen Durumu', scope: 'İnşaat kalıntısı, toz birikimi, geçici koruma malzemeleri', status: 'DEGERLENDIRILMEDI' },
  { id: '19', field: 'Etiketleme ve Yönlendirme', scope: 'Mahallerin isimlendirilmesi, pano ve cihaz etiketleri', status: 'DEGERLENDIRILMEDI' },
  { id: '20', field: 'Ortamdaki Fiziksel Güvenlik Unsurları', scope: 'Kablo gizleme, sivri köşe koruma, çocuk güvenliği unsurları', status: 'DEGERLENDIRILMEDI' },
  { id: '21', field: 'Projeler', scope: 'Elektrik-Mekanik-Doğalgaz-HVAC-Medikal Gaz-Yangın Sistemi altyapısı vb.', status: 'DEGERLENDIRILMEDI' },
  { id: '22', field: 'Diğer', scope: 'Tesis emniyet ve güvenliğine etki eden diğer donanım ve teçhizatlar', status: 'DEGERLENDIRILMEDI' },
];

export default function StepChecklist({ data, updateData }: Props) {
  useEffect(() => {
    // If empty or new, populate with defaults
    if (!data.checks || data.checks.length === 0) {
      updateData(prev => ({ ...prev, checks: DEFAULT_CHECKS as RenovationReportCheck[] }));
    }
  }, []);

  const handleUpdate = (id: string, field: string, value: string) => {
    updateData(prev => ({
      ...prev,
      checks: prev.checks?.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const handleAdd = () => {
    const newId = Date.now().toString();
    updateData(prev => ({
      ...prev,
      checks: [...(prev.checks || []), { id: newId, field: '', scope: '', status: 'DEGERLENDIRILMEDI' }]
    }));
  };

  const handleRemove = (id: string) => {
    updateData(prev => ({
      ...prev,
      checks: prev.checks?.filter(c => c.id !== id)
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">2. İnceleme ve Uygunluk Değerlendirmesi</h3>
          <p className="text-sm text-slate-500">Mekanik, elektrik, yangın vb. sistemlerin görsel ve işlevsel uygunluk durumunu değerlendirin.</p>
        </div>
        <Button onClick={handleAdd} variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Yeni Madde Ekle
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="grid grid-cols-12 gap-4 bg-slate-100 dark:bg-slate-800 p-3 font-medium text-sm border-b">
          <div className="col-span-1 text-center">No</div>
          <div className="col-span-3">İnceleme Alanı</div>
          <div className="col-span-5">Kontrol Kapsamı</div>
          <div className="col-span-2 text-center">Uygunluk</div>
          <div className="col-span-1 text-center">İşlem</div>
        </div>
        
        <div className="divide-y max-h-[500px] overflow-y-auto">
          {data.checks?.map((check, index) => (
            <div key={check.id} className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="col-span-1 text-center text-sm font-medium">{index + 1}</div>
              <div className="col-span-3">
                <Input 
                  value={check.field} 
                  onChange={(e) => handleUpdate(check.id, 'field', e.target.value)} 
                  className="h-8 text-sm"
                  placeholder="İnceleme Alanı"
                />
              </div>
              <div className="col-span-5">
                <Input 
                  value={check.scope} 
                  onChange={(e) => handleUpdate(check.id, 'scope', e.target.value)} 
                  className="h-8 text-sm"
                  placeholder="Kontrol Kapsamı"
                />
              </div>
              <div className="col-span-2">
                <Select value={check.status} onValueChange={(val) => handleUpdate(check.id, 'status', val)}>
                  <SelectTrigger className={`h-8 text-sm ${check.status === 'UYGUN' ? 'text-green-600' : check.status === 'UYGUN_DEGIL' ? 'text-red-600' : ''}`}>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UYGUN" className="text-green-600">Uygun (✓)</SelectItem>
                    <SelectItem value="UYGUN_DEGIL" className="text-red-600">Uygun Değil (✖)</SelectItem>
                    <SelectItem value="DEGERLENDIRILMEDI">Değerlendirilmedi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 flex justify-center">
                <Button variant="ghost" size="icon" onClick={() => handleRemove(check.id)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
