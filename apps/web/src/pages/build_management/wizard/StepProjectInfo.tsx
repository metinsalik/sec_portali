import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { RenovationReportInput } from '@/types/renovationReport';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown } from 'lucide-react';

interface Props {
  data: Partial<RenovationReportInput>;
  updateData: (data: React.SetStateAction<Partial<RenovationReportInput>>) => void;
}

export default function StepProjectInfo({ data, updateData }: Props) {
  const [facilityId, setFacilityId] = React.useState(localStorage.getItem('activeFacilityId'));

  React.useEffect(() => {
    const handleFacilityChange = () => {
      setFacilityId(localStorage.getItem('activeFacilityId'));
    };
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);
  
  const { data: departments, isLoading } = useQuery({
    queryKey: ['build-departments', facilityId],
    queryFn: async () => {
      const res = await api.get(`/build-management/settings/departments?facilityId=${facilityId}`);
      if (!res.ok) throw new Error('Birimler getirilemedi');
      return res.json();
    },
    enabled: !!facilityId
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateData(prev => ({ ...prev, [name]: value }));
  };

  const selectedDepts = data.controlledBy ? data.controlledBy.split(', ').filter(Boolean) : [];

  const toggleDept = (deptName: string) => {
    let newDepts;
    if (selectedDepts.includes(deptName)) {
      newDepts = selectedDepts.filter(d => d !== deptName);
    } else {
      newDepts = [...selectedDepts, deptName];
    }
    updateData(prev => ({ ...prev, controlledBy: newDepts.join(', ') }));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h3 className="text-lg font-medium">1. Proje Bilgileri</h3>
        <p className="text-sm text-slate-500">Raporlanacak renovasyon projesine ait temel bilgileri girin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="projectName">Proje Adı</Label>
          <Input 
            id="projectName" 
            name="projectName" 
            value={data.projectName || ''} 
            onChange={handleChange} 
            placeholder="Örn: 7. Kat Yatan Hasta Katı Renovasyonu" 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Lokasyon</Label>
          <Input 
            id="location" 
            name="location" 
            value={data.location || ''} 
            onChange={handleChange} 
            placeholder="Örn: 7. Kat" 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Proje Başlangıç Tarihi</Label>
          <Input 
            id="startDate" 
            name="startDate" 
            type="date"
            value={data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : ''} 
            onChange={handleChange} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Proje Bitiş Tarihi</Label>
          <Input 
            id="endDate" 
            name="endDate" 
            type="date"
            value={data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : ''} 
            onChange={handleChange} 
          />
        </div>

        <div className="space-y-2 flex flex-col justify-end">
          <Label htmlFor="controlledBy">Kontrol Eden Birim(ler)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-9 px-3 font-normal text-left">
                <span className="truncate flex-1">
                  {selectedDepts.length > 0 ? selectedDepts.join(', ') : 'Birim seçin...'}
                </span>
                <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-2" align="start">
              {isLoading ? (
                <div className="p-2 text-sm text-slate-500">Yükleniyor...</div>
              ) : departments?.length === 0 ? (
                <div className="p-2 text-sm text-slate-500">Kayıtlı birim bulunmuyor. Lütfen ayarlardan ekleyin.</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {departments?.map((dept: any) => (
                    <div key={dept.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`dept-${dept.id}`} 
                        checked={selectedDepts.includes(dept.name)}
                        onCheckedChange={() => toggleDept(dept.name)}
                      />
                      <label htmlFor={`dept-${dept.id}`} className="text-sm cursor-pointer flex-1">
                        {dept.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assessmentDate">Değerlendirme Tarihi</Label>
          <Input 
            id="assessmentDate" 
            name="assessmentDate" 
            type="date"
            value={data.assessmentDate ? new Date(data.assessmentDate).toISOString().split('T')[0] : ''} 
            onChange={handleChange} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reportDate">Rapor Tarihi</Label>
          <Input 
            id="reportDate" 
            name="reportDate" 
            type="date"
            value={data.reportDate ? new Date(data.reportDate).toISOString().split('T')[0] : ''} 
            onChange={handleChange} 
          />
        </div>
      </div>
    </div>
  );
}
