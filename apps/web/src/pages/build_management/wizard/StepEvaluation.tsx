import React from 'react';
import type { RenovationReportInput, RenovationReportEvaluation } from '@/types/renovationReport';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Props {
  data: Partial<RenovationReportInput>;
  updateData: (data: React.SetStateAction<Partial<RenovationReportInput>>) => void;
}

export default function StepEvaluation({ data, updateData }: Props) {
  const evaluation = data.evaluation || {
    decision: 'KABUL_EDILDI',
    signatures: {
      teknikHizmetler: { name: '', date: '' },
      idariIsler: { name: '', date: '' },
      sec: { name: '', date: '' },
      dizayn: { name: '', date: '' },
      hastaneIdari: { name: '', date: '' },
      yuklenici: { name: '', date: '' }
    }
  };

  const handleDecisionChange = (value: RenovationReportEvaluation['decision']) => {
    updateData(prev => ({
      ...prev,
      evaluation: {
        ...evaluation,
        decision: value,
        signatures: prev.evaluation?.signatures || evaluation.signatures
      }
    }));
  };

  const handleSignatureChange = (role: keyof RenovationReportEvaluation['signatures'], field: 'name' | 'date', value: string) => {
    updateData(prev => ({
      ...prev,
      evaluation: {
        ...evaluation,
        signatures: {
          ...(prev.evaluation?.signatures || evaluation.signatures),
          [role]: {
            ...(prev.evaluation?.signatures?.[role] || { name: '', date: '' }),
            [field]: value
          }
        }
      }
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h3 className="text-lg font-medium">5. Değerlendirme ve Sonuç</h3>
        <p className="text-sm text-slate-500">Çalışmaların son değerlendirmesi ve onay bilgileri.</p>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Değerlendirme Sonucu</h4>
        <RadioGroup value={evaluation.decision} onValueChange={handleDecisionChange} className="space-y-3">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="KABUL_EDILDI" id="d1" />
            <Label htmlFor="d1">Koşulsuz kabul edilmiştir.</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="KISMI_KABUL" id="d2" />
            <Label htmlFor="d2">Kısmi eksiklerle birlikte kabul edilmiştir.</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="GECICI_KABUL" id="d3" />
            <Label htmlFor="d3">Eksikliklerin tamamlanması şartı ile geçici kabul yapılmıştır.</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="REDDEDILDI" id="d4" />
            <Label htmlFor="d4">Kabul edilmemiştir. Yeni düzenleme istenmektedir.</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <h4 className="font-medium">Onaylayanlar</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <Label className="font-semibold text-slate-700 dark:text-slate-300">Teknik Hizmetler Direktörlüğü</Label>
            <Input 
              placeholder="Adı Soyadı" 
              value={evaluation.signatures.teknikHizmetler.name} 
              onChange={e => handleSignatureChange('teknikHizmetler', 'name', e.target.value)} 
            />
            <Input 
              type="date" 
              value={evaluation.signatures.teknikHizmetler.date} 
              onChange={e => handleSignatureChange('teknikHizmetler', 'date', e.target.value)} 
            />
          </div>

          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <Label className="font-semibold text-slate-700 dark:text-slate-300">İdari İşler Direktörlüğü</Label>
            <Input 
              placeholder="Adı Soyadı" 
              value={evaluation.signatures.idariIsler.name} 
              onChange={e => handleSignatureChange('idariIsler', 'name', e.target.value)} 
            />
            <Input 
              type="date" 
              value={evaluation.signatures.idariIsler.date} 
              onChange={e => handleSignatureChange('idariIsler', 'date', e.target.value)} 
            />
          </div>

          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <Label className="font-semibold text-slate-700 dark:text-slate-300">Sağlık Emniyet Çevre Direktörlüğü</Label>
            <Input 
              placeholder="Adı Soyadı" 
              value={evaluation.signatures.sec.name} 
              onChange={e => handleSignatureChange('sec', 'name', e.target.value)} 
            />
            <Input 
              type="date" 
              value={evaluation.signatures.sec.date} 
              onChange={e => handleSignatureChange('sec', 'date', e.target.value)} 
            />
          </div>

          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <Label className="font-semibold text-slate-700 dark:text-slate-300">Dizayn Yöneticisi</Label>
            <Input 
              placeholder="Adı Soyadı" 
              value={evaluation.signatures.dizayn.name} 
              onChange={e => handleSignatureChange('dizayn', 'name', e.target.value)} 
            />
            <Input 
              type="date" 
              value={evaluation.signatures.dizayn.date} 
              onChange={e => handleSignatureChange('dizayn', 'date', e.target.value)} 
            />
          </div>

          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <Label className="font-semibold text-slate-700 dark:text-slate-300">Hastane İdari Yöneticisi</Label>
            <Input 
              placeholder="Adı Soyadı" 
              value={evaluation.signatures.hastaneIdari.name} 
              onChange={e => handleSignatureChange('hastaneIdari', 'name', e.target.value)} 
            />
            <Input 
              type="date" 
              value={evaluation.signatures.hastaneIdari.date} 
              onChange={e => handleSignatureChange('hastaneIdari', 'date', e.target.value)} 
            />
          </div>

          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <Label className="font-semibold text-slate-700 dark:text-slate-300">Yüklenici Proje Sorumlusu</Label>
            <Input 
              placeholder="Adı Soyadı" 
              value={evaluation.signatures.yuklenici.name} 
              onChange={e => handleSignatureChange('yuklenici', 'name', e.target.value)} 
            />
            <Input 
              type="date" 
              value={evaluation.signatures.yuklenici.date} 
              onChange={e => handleSignatureChange('yuklenici', 'date', e.target.value)} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
