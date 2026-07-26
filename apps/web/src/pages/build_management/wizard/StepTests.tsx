import React, { useEffect } from 'react';
import type { RenovationReportInput, RenovationReportTest, RenovationReportCertificate } from '@/types/renovationReport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  data: Partial<RenovationReportInput>;
  updateData: (data: React.SetStateAction<Partial<RenovationReportInput>>) => void;
}

const DEFAULT_TESTS: Partial<RenovationReportTest>[] = [
  { id: 't1', installation: 'Elektrik Tesisatı', control: 'Elektrik ve Topraklama İç Tesisat Kontrol Raporu', status: 'RAPOR_GORULEMEDI', description: 'Rapor bekleniyor' },
  { id: 't2', installation: 'Medikal Gaz Tesisatı', control: 'Medikal Gaz Tesisatı Uygunluk ve Sızdırmazlık Testleri', status: 'RAPOR_GORULEMEDI', description: 'Rapor bekleniyor' },
  { id: 't3', installation: 'Havalandırma Tesisatı', control: 'HVAC Sistemleri Test ve Kontrol Raporları', status: 'RAPOR_GORULEMEDI', description: 'Rapor bekleniyor' },
  { id: 't4', installation: 'Yangın Sistemleri', control: 'Yangın Algılama Sistemleri Periyodik Kontrol Raporu', status: 'RAPOR_GORULEMEDI', description: 'Rapor bekleniyor' },
  { id: 't5', installation: 'Yangın Sistemleri', control: 'Sulu Söndürme Sistemleri Periyodik Kontrol Raporu', status: 'RAPOR_GORULEMEDI', description: 'Rapor bekleniyor' },
  { id: 't6', installation: 'Yangın Sistemleri', control: 'Otomatik Söndürme Sistemleri Periyodik Kontrol Raporu', status: 'RAPOR_GORULEMEDI', description: 'Rapor bekleniyor' },
  { id: 't7', installation: 'Yangın Sistemleri', control: 'Duman Tahliye Sistemleri Periyodik Kontrol Raporu', status: 'RAPOR_GORULEMEDI', description: 'Rapor bekleniyor' },
  { id: 't8', installation: 'Yangın Sistemleri', control: 'Basınçlandırma Sistemleri Periyodik Kontrol Raporu', status: 'RAPOR_GORULEMEDI', description: 'Rapor bekleniyor' },
  { id: 't9', installation: 'Yangın Sistemleri', control: 'Sızdırmazlık Test Raporları', status: 'RAPOR_GORULEMEDI', description: 'Rapor bekleniyor' },
  { id: 't10', installation: 'Aydınlatma Sistemleri', control: 'Aydınlatma Ölçüm Raporları', status: 'RAPOR_GORULEMEDI', description: 'Rapor bekleniyor' },
  { id: 't11', installation: 'Havalandırma, İklimlendirme', control: 'Termal Konfor Ölçüm Raporları', status: 'RAPOR_GORULEMEDI', description: 'Rapor bekleniyor' },
  { id: 't12', installation: 'Havalandırma, İklimlendirme', control: 'Gürültü Maruziyeti Ölçüm Raporları', status: 'RAPOR_GORULEMEDI', description: 'Rapor bekleniyor' },
];

const DEFAULT_CERTS: Partial<RenovationReportCertificate>[] = [
  { id: 'c1', area: 'Kat Geneli', control: 'Yangına dayanıklı duvar ve yangın durdurucu uygulamalar', status: 'SERTIFIKA_GORULEMEDI', description: 'Sertifika / Belge bekleniyor' },
  { id: 'c2', area: 'Kat Geneli', control: 'Tavan, duvar, döşeme, kaplama, kapı ve mobilyaların yangına dayanımı', status: 'SERTIFIKA_GORULEMEDI', description: 'Sertifika / Belge bekleniyor' },
  { id: 'c3', area: 'Elektrik Tesisatı', control: 'Elektrik tesisatında kullanılan kabloların yangın dayanımı', status: 'SERTIFIKA_GORULEMEDI', description: 'Sertifika / Belge bekleniyor' },
  { id: 'c4', area: 'Yangın Sistemleri', control: 'Yangın kapıları ve şaft kapakları için yangın / duman dayanımı', status: 'SERTIFIKA_GORULEMEDI', description: 'Sertifika / Belge bekleniyor' },
  { id: 'c5', area: 'Yangın Sistemleri', control: 'Duman tahliye sistemleri bileşenleri için uygunluk belgeleri', status: 'SERTIFIKA_GORULEMEDI', description: 'Sertifika / Belge bekleniyor' },
  { id: 'c6', area: 'Yangın Sistemleri', control: 'Yangın söndürme sistemleri bileşenleri için uygunluk belgeleri', status: 'SERTIFIKA_GORULEMEDI', description: 'Sertifika / Belge bekleniyor' },
  { id: 'c7', area: 'Acil Durum Yönetimi', control: 'Acil durum aydınlatma ve yönlendirme sistemleri için uygunluk belgeleri', status: 'SERTIFIKA_GORULEMEDI', description: 'Sertifika / Belge bekleniyor' },
];

export default function StepTests({ data, updateData }: Props) {
  useEffect(() => {
    let updateNeeded = false;
    const newData = { ...data };
    if (!data.tests || data.tests.length === 0) {
      newData.tests = DEFAULT_TESTS as RenovationReportTest[];
      updateNeeded = true;
    }
    if (!data.certificates || data.certificates.length === 0) {
      newData.certificates = DEFAULT_CERTS as RenovationReportCertificate[];
      updateNeeded = true;
    }
    if (updateNeeded) {
      updateData(newData);
    }
  }, []);

  const handleUpdateTest = (id: string, field: string, value: string) => {
    updateData(prev => ({
      ...prev,
      tests: prev.tests?.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const handleAddTest = () => {
    const newId = 't_' + Date.now().toString();
    updateData(prev => ({
      ...prev,
      tests: [...(prev.tests || []), { id: newId, installation: '', control: '', status: 'RAPOR_GORULEMEDI', description: '' }]
    }));
  };

  const handleRemoveTest = (id: string) => {
    updateData(prev => ({
      ...prev,
      tests: prev.tests?.filter(c => c.id !== id)
    }));
  };

  const handleUpdateCert = (id: string, field: string, value: string) => {
    updateData(prev => ({
      ...prev,
      certificates: prev.certificates?.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const handleAddCert = () => {
    const newId = 'c_' + Date.now().toString();
    updateData(prev => ({
      ...prev,
      certificates: [...(prev.certificates || []), { id: newId, area: '', control: '', status: 'SERTIFIKA_GORULEMEDI', description: '' }]
    }));
  };

  const handleRemoveCert = (id: string) => {
    updateData(prev => ({
      ...prev,
      certificates: prev.certificates?.filter(c => c.id !== id)
    }));
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
      {/* Tests Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">3.1. Test ve Fonksiyon Kontrolleri</h3>
            <p className="text-sm text-slate-500">Sistemlerin, donanımların ve altyapı bileşenlerinin işlev kontrolleri.</p>
          </div>
          <Button onClick={handleAddTest} variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Test Ekle
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <div className="grid grid-cols-12 gap-4 bg-slate-100 dark:bg-slate-800 p-3 font-medium text-sm border-b">
            <div className="col-span-2">Tesisat</div>
            <div className="col-span-4">Kontrol</div>
            <div className="col-span-2">Durum</div>
            <div className="col-span-3">Açıklama</div>
            <div className="col-span-1 text-center">İşlem</div>
          </div>
          
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {data.tests?.map((test) => (
              <div key={test.id} className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="col-span-2">
                  <Input value={test.installation} onChange={(e) => handleUpdateTest(test.id, 'installation', e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="col-span-4">
                  <Input value={test.control} onChange={(e) => handleUpdateTest(test.id, 'control', e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="col-span-2">
                  <Select value={test.status} onValueChange={(val) => handleUpdateTest(test.id, 'status', val)}>
                    <SelectTrigger className={`h-8 text-sm ${test.status === 'UYGUN' ? 'text-green-600' : test.status === 'RAPOR_GORULEMEDI' ? 'text-red-600' : ''}`}>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UYGUN" className="text-green-600">Uygun</SelectItem>
                      <SelectItem value="UYGUN_DEGIL" className="text-amber-600">Uygun Değil</SelectItem>
                      <SelectItem value="RAPOR_GORULEMEDI" className="text-red-600">Rapor Görülemedi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Input value={test.description} onChange={(e) => handleUpdateTest(test.id, 'description', e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="col-span-1 flex justify-center">
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveTest(test.id)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Certificates Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">3.2. Sertifika ve Uygunluk Beyanları</h3>
            <p className="text-sm text-slate-500">Malzeme, ekipman ve sistemlerin standartlara uygunluğunu belgeleyen teknik sertifikalar.</p>
          </div>
          <Button onClick={handleAddCert} variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Sertifika Ekle
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <div className="grid grid-cols-12 gap-4 bg-slate-100 dark:bg-slate-800 p-3 font-medium text-sm border-b">
            <div className="col-span-2">Tesisat/Alan</div>
            <div className="col-span-4">Kontrol</div>
            <div className="col-span-2">Durum</div>
            <div className="col-span-3">Açıklama</div>
            <div className="col-span-1 text-center">İşlem</div>
          </div>
          
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {data.certificates?.map((cert) => (
              <div key={cert.id} className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="col-span-2">
                  <Input value={cert.area} onChange={(e) => handleUpdateCert(cert.id, 'area', e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="col-span-4">
                  <Input value={cert.control} onChange={(e) => handleUpdateCert(cert.id, 'control', e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="col-span-2">
                  <Select value={cert.status} onValueChange={(val) => handleUpdateCert(cert.id, 'status', val)}>
                    <SelectTrigger className={`h-8 text-sm ${cert.status === 'UYGUN' ? 'text-green-600' : cert.status === 'SERTIFIKA_GORULEMEDI' ? 'text-red-600' : ''}`}>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UYGUN" className="text-green-600">Uygun</SelectItem>
                      <SelectItem value="UYGUN_DEGIL" className="text-amber-600">Uygun Değil</SelectItem>
                      <SelectItem value="SERTIFIKA_GORULEMEDI" className="text-red-600">Sertifika Görülemedi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Input value={cert.description} onChange={(e) => handleUpdateCert(cert.id, 'description', e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="col-span-1 flex justify-center">
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveCert(cert.id)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
