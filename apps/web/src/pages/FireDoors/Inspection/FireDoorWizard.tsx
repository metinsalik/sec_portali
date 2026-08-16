import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { BASE_URL } from '@/lib/api';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { toast } from 'sonner';
import { CheckCircle2, ArrowRight, ArrowLeft, DoorClosed, QrCode, Camera } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function FireDoorWizard() {
  const currentFacilityId = localStorage.getItem('activeFacilityId') || '';
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const inspectionId = searchParams.get('inspectionId');

  const [step, setStep] = useState(id ? 2 : 0); // 0 = Start, 1 = Location, 2 = Questions, 3 = Success
  const [doorId, setDoorId] = useState<string | null>(id || null);
  
  // Step 1 State
  const [doorNo, setDoorNo] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [doorPhotoUrl, setDoorPhotoUrl] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [floor, setFloor] = useState('');
  const [department, setDepartment] = useState('');
  const [roomName, setRoomName] = useState('');
  const [selectedProps, setSelectedProps] = useState<Record<string, string>>({});

  // Step 2 State
  const [answers, setAnswers] = useState<Record<string, { value: 'PASS' | 'PARTIAL' | 'FAIL' | 'NA', note: string, photoUrl?: string, photos?: string[] }>>({});

  // Queries
  const { data: facilityData } = useQuery({
    queryKey: ['facility', currentFacilityId],
    queryFn: async () => {
      if (!currentFacilityId || currentFacilityId === 'all') return null;
      const res = await api.get(`/settings/facilities/${currentFacilityId}`);
      return await res.json();
    },
    enabled: !!currentFacilityId && currentFacilityId !== 'all',
  });
  const buildings = facilityData?.buildings || [];

  const { data: doors } = useQuery({
    queryKey: ['fireDoors', currentFacilityId],
    queryFn: async () => {
      const res = await api.get(`/safety-management/fire-doors/doors?facilityId=${currentFacilityId}`);
      return res.json();
    },
    enabled: !!currentFacilityId && currentFacilityId !== 'all',
  });

  const { data: properties } = useQuery({
    queryKey: ['fireDoorProperties'],
    queryFn: async () => {
      const res = await api.get('/safety-management/fire-doors/settings/properties');
      return res.json();
    },
  });

  const { data: existingDoor } = useQuery({
    queryKey: ['fireDoor', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get(`/safety-management/fire-doors/doors/${id}`);
      return res.json();
    },
    enabled: !!id,
  });

  React.useEffect(() => {
    if (existingDoor) {
      setDoorNo(existingDoor.doorNo || '');
      setQrCode(existingDoor.qrCode || '');
      setDoorPhotoUrl(existingDoor.photoUrl || '');
      setBuildingId(existingDoor.properties?.Bina || '');
      setFloor(existingDoor.properties?.Kat || '');
      setDepartment(existingDoor.properties?.Departman || '');
      setRoomName(existingDoor.properties?.Mahal || '');
      
      const props = { ...existingDoor.properties };
      delete props.Bina;
      delete props.Kat;
      delete props.Departman;
      delete props.Mahal;
      setSelectedProps(props);
    }
  }, [existingDoor]);

  const { data: questionGroups } = useQuery({
    queryKey: ['fireDoorQuestionGroups'],
    queryFn: async () => {
      const res = await api.get('/safety-management/fire-doors/settings/question-groups');
      return res.json();
    },
    enabled: step === 2,
  });

  const { data: existingInspection } = useQuery({
      queryKey: ['fireDoorInspection', inspectionId],
      queryFn: async () => {
          if (!id || !inspectionId) return null;
          // We can just fetch all inspections and find it, or we already have it in the list.
          // Let's fetch the list of inspections for the door and pick the one
          const res = await api.get(`/safety-management/fire-doors/doors/${id}/inspections`);
          const all = await res.json();
          return all.find((i: any) => i.id === inspectionId);
      },
      enabled: !!id && !!inspectionId,
  });

  React.useEffect(() => {
      if (existingInspection && existingInspection.items) {
          const newAnswers: Record<string, any> = {};
          existingInspection.items.forEach((item: any) => {
              newAnswers[item.questionId] = {
                  value: item.answer,
                  note: item.comment || '',
                  photoUrl: item.photoUrl,
                  photos: item.photos || []
              };
          });
          setAnswers(newAnswers);
      }
  }, [existingInspection]);

  // Mutations
  const createDoor = useMutation({
    mutationFn: async () => {
      const finalDoorNo = doorNo || (facilityData?.shortName ? `${facilityData.shortName}-${Math.floor(Math.random()*10000)}` : `KAPI-${Math.floor(Math.random()*10000)}`);
      
      const payload = {
        facilityId: currentFacilityId,
        doorNo: finalDoorNo,
        qrCode: qrCode || undefined,
        photoUrl: doorPhotoUrl || undefined,
        properties: {
            ...selectedProps,
            Bina: buildingId,
            Kat: floor,
            Departman: department,
            Mahal: roomName
        },
        status: 'AKTIF'
      };
      if (id) {
          const res = await api.put(`/safety-management/fire-doors/doors/${id}`, payload);
          return res.json();
      } else {
          const res = await api.post('/safety-management/fire-doors/doors', payload);
          return res.json();
      }
    },
    onSuccess: (data) => {
      setDoorId(data.id);
      setStep(2);
      toast.success('Kapı kaydedildi. Şimdi kontrol listesini doldurabilirsiniz.');
    }
  });

  const submitInspection = useMutation({
    mutationFn: async () => {
      if (!doorId) throw new Error('Kapı ID bulunamadı');
      
      const payload = {
        items: Object.keys(answers).map(qId => ({
            questionId: qId,
            answer: answers[qId].value,
            comment: answers[qId].note,
            photoUrl: answers[qId].photoUrl || undefined,
            photos: answers[qId].photos || []
        })),
        notes: "Mobil saha denetimi ile tamamlandı."
      };
      
      let res;
      if (inspectionId) {
          res = await api.put(`/safety-management/fire-doors/doors/${doorId}/inspections/${inspectionId}`, payload);
      } else {
          res = await api.post(`/safety-management/fire-doors/doors/${doorId}/inspections`, payload);
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Denetim başarıyla tamamlandı. Puan: ${data.score} (${data.grade})`);
      queryClient.invalidateQueries({ queryKey: ['fireDoors'] });
      setStep(3);
    }
  });

  const handleNextStep1 = () => {
    if (!buildingId || !floor || !roomName) {
        toast.error('Lütfen Bina, Kat ve Mahal Adı zorunlu alanlarını doldurunuz.');
        return;
    }
    createDoor.mutate();
  };

  const handleNextStep2 = () => {
    // Check if all questions are answered
    let totalQuestions = 0;
    questionGroups?.forEach((g: any) => totalQuestions += g.questions?.length || 0);
    
    if (Object.keys(answers).length < totalQuestions) {
        toast.error('Lütfen tüm soruları cevaplayınız.');
        return;
    }

    const missingNotes = Object.keys(answers).some(qId => {
       const ans = answers[qId];
       return (ans.value === 'FAIL' || ans.value === 'PARTIAL') && !ans.note?.trim();
    });

    if (missingNotes) {
        toast.error('Lütfen "Kısmen" veya "Karşılamıyor" seçtiğiniz sorular için açıklama giriniz.');
        return;
    }

    submitInspection.mutate();
  };

  const handleReset = () => {
    setDoorId(null);
    setDoorNo('');
    setQrCode('');
    setDoorPhotoUrl('');
    // Bilerek buildingId, floor, department ve selectedProps'u sıfırlamıyoruz.
    // Böylece mobil sahada aynı katta kapı eklerken tekrar tekrar seçmek zorunda kalmaz.
    setRoomName('');
    setAnswers({});
    setStep(1);
  };

  if (!currentFacilityId || currentFacilityId === 'all') return <div className="p-6">Lütfen sol menüden bir tesis seçiniz.</div>;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-6">
      {step > 0 && (
        <div className="flex items-center gap-2 md:gap-3 mb-6 md:mb-8 text-xs md:text-sm px-2 max-w-2xl mx-auto">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm transition-all duration-500 ${step >= 1 ? 'bg-primary text-white shadow-primary/30' : 'bg-slate-100 text-slate-400'}`}>1</div>
            <div className="h-1 flex-1 rounded-full bg-slate-100 overflow-hidden relative">
                <div className={`absolute top-0 left-0 h-full bg-primary transition-all duration-700 ease-in-out ${step >= 2 ? 'w-full' : 'w-0'}`}></div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm transition-all duration-500 delay-100 ${step >= 2 ? 'bg-primary text-white shadow-primary/30' : 'bg-slate-100 text-slate-400'}`}>2</div>
            <div className="h-1 flex-1 rounded-full bg-slate-100 overflow-hidden relative">
                <div className={`absolute top-0 left-0 h-full bg-primary transition-all duration-700 ease-in-out ${step >= 3 ? 'w-full' : 'w-0'}`}></div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm transition-all duration-500 delay-100 ${step >= 3 ? 'bg-primary text-white shadow-primary/30' : 'bg-slate-100 text-slate-400'}`}>3</div>
        </div>
      )}

      {step === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-lg border border-slate-200/60 dark:border-slate-800/60 max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 transform rotate-3 hover:rotate-6 transition-all duration-300">
            <DoorClosed className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
              Yangın Kapısı Saha Denetimi
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
              Sahada bulunan kapıları sisteme eklemek ve kontrollerini yapmak için kuruluma başlayın. Aynı katta işlem yaparken bilgileriniz otomatik olarak saklanır, böylece daha hızlı denetim yapabilirsiniz.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
            <Button size="lg" onClick={() => setStep(1)} className="flex-1 h-12 text-base rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all">
              Denetime Başla <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/safety-management/fire-doors/list')} className="flex-1 h-12 text-base rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              Kapı Listesine Dön
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <Card>
            <CardHeader>
                <CardTitle>Adım 1: Lokasyon ve Özellikler</CardTitle>
                <CardDescription>Eklemek istediğiniz yangın kapısının konumunu ve temel özelliklerini giriniz.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-1 md:col-span-2">
                        <Label>QR Kod</Label>
                        <div className="flex gap-2">
                            <Input value={qrCode} onChange={e => setQrCode(e.target.value)} placeholder="Okutun veya manuel girin" />
                            <Button type="button" onClick={() => setShowQrScanner(!showQrScanner)} variant="secondary">
                                <QrCode className="w-4 h-4 mr-2" /> QR Okut
                            </Button>
                        </div>
                        {showQrScanner && (
                            <div className="w-full max-w-sm mx-auto mt-2 rounded overflow-hidden">
                                <Scanner onScan={(result) => {
                                    setQrCode(result[0].rawValue);
                                    setShowQrScanner(false);
                                    toast.success('QR Kod okundu!');
                                }} />
                                <Button type="button" variant="ghost" className="w-full mt-2" onClick={() => setShowQrScanner(false)}>Kapat</Button>
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-2 col-span-1 md:col-span-2">
                        <Label>Kapı Fotoğrafı (Opsiyonel)</Label>
                        <div className="flex items-center gap-2">
                            <Input type="file" accept="image/*" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const formData = new FormData();
                                formData.append('file', file);
                                try {
                                    const res = await api.post('/settings/facilities/upload-logo', formData);
                                    if (!res.ok) throw new Error('Yükleme başarısız');
                                    const data = await res.json();
                                    setDoorPhotoUrl(data.url);
                                    toast.success('Fotoğraf eklendi.');
                                } catch (err) {
                                    toast.error('Fotoğraf yüklenemedi. Boyut büyük olabilir.');
                                }
                            }} />
                            {doorPhotoUrl && (
                              <div className="relative group rounded-md border bg-white p-1">
                                <img src={BASE_URL + doorPhotoUrl} alt="Yüklenen Fotoğraf" className="w-16 h-16 object-cover rounded-sm" />
                              </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Kapı No / Tanım (Boşsa otomatik atanır)</Label>
                        <Input value={doorNo} onChange={e => setDoorNo(e.target.value)} placeholder="Örn: K-01" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Bina Adı</Label>
                            <Input value={buildingId} onChange={e => setBuildingId(e.target.value)} placeholder="Örn: Ana Bina" list="building-list" />
                            <datalist id="building-list">
                                {Array.from(new Set(doors?.map((d: any) => d.properties?.Bina).filter(Boolean))).map((b: any) => (
                                    <option key={b} value={b} />
                                ))}
                            </datalist>
                        </div>
                        <div className="space-y-2">
                            <Label>Kat</Label>
                            <Input value={floor} onChange={e => setFloor(e.target.value)} placeholder="Örn: 1. Kat" list="floor-list" />
                            <datalist id="floor-list">
                                {Array.from(new Set(doors?.map((d: any) => d.properties?.Kat).filter(Boolean))).map((f: any) => (
                                    <option key={f} value={f} />
                                ))}
                            </datalist>
                        </div>
                        <div className="space-y-2">
                            <Label>Departman</Label>
                            <Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="Örn: Kardiyoloji" list="dept-list" />
                            <datalist id="dept-list">
                                {Array.from(new Set(doors?.map((d: any) => d.properties?.Departman).filter(Boolean))).map((dep: any) => (
                                    <option key={dep} value={dep} />
                                ))}
                            </datalist>
                        </div>
                        <div className="space-y-2">
                            <Label>Mahal Adı / Yönü</Label>
                            <Input value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="Örn: Poliklinik Girişi" list="room-list" />
                            <datalist id="room-list">
                                {Array.from(new Set(doors?.map((d: any) => d.properties?.Mahal).filter(Boolean))).map((r: any) => (
                                    <option key={r} value={r} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-4">Dinamik Kapı Özellikleri</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {properties?.map((prop: any) => (
                            <div key={prop.id} className="space-y-2">
                                <Label>{prop.name}</Label>
                                <Select 
                                    value={selectedProps[prop.id] || ''} 
                                    onValueChange={v => setSelectedProps({...selectedProps, [prop.id]: v})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {prop.options?.map((opt: string, i: number) => (
                                            <SelectItem key={i} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleNextStep1} disabled={createDoor.isPending}>
                        İleri <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
            <CardHeader>
                <CardTitle>Adım 2: Kontrol Listesi (Denetim)</CardTitle>
                <CardDescription>Kapı eklendi. Lütfen aşağıdaki kontrol listesini doldurunuz.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {questionGroups?.map((group: any) => (
                    <div key={group.id} className="border p-4 rounded-md space-y-4">
                        <h3 className="font-bold text-lg bg-muted p-2 rounded">{group.name}</h3>
                        {group.questions?.map((q: any) => (
                            <div key={q.id} className="grid grid-cols-12 gap-4 items-center border-b pb-4 last:border-0 last:pb-0">
                                <div className="col-span-12 md:col-span-5 font-medium text-sm">
                                    {q.order}. {q.text}
                                </div>
                                <div className="col-span-12 md:col-span-7 flex flex-wrap gap-2">
                                    <Button 
                                        type="button"
                                        size="sm"
                                        variant={answers[q.id]?.value === 'PASS' ? 'default' : 'outline'}
                                        className={`flex-1 ${answers[q.id]?.value === 'PASS' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                                        onClick={() => setAnswers({...answers, [q.id]: { ...answers[q.id], value: 'PASS' }})}
                                    >
                                        Karşılıyor
                                    </Button>
                                    <Button 
                                        type="button"
                                        size="sm"
                                        variant={answers[q.id]?.value === 'PARTIAL' ? 'default' : 'outline'}
                                        className={`flex-1 ${answers[q.id]?.value === 'PARTIAL' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : ''}`}
                                        onClick={() => setAnswers({...answers, [q.id]: { ...answers[q.id], value: 'PARTIAL' }})}
                                    >
                                        Kısmen
                                    </Button>
                                    <Button 
                                        type="button"
                                        size="sm"
                                        variant={answers[q.id]?.value === 'FAIL' ? 'default' : 'outline'}
                                        className={`flex-1 ${answers[q.id]?.value === 'FAIL' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                                        onClick={() => setAnswers({...answers, [q.id]: { ...answers[q.id], value: 'FAIL' }})}
                                    >
                                        Karşılamıyor
                                    </Button>
                                    <Button 
                                        type="button"
                                        size="sm"
                                        variant={answers[q.id]?.value === 'NA' ? 'default' : 'outline'}
                                        className={`flex-1 ${answers[q.id]?.value === 'NA' ? 'bg-gray-600 hover:bg-gray-700 text-white' : ''}`}
                                        onClick={() => setAnswers({...answers, [q.id]: { ...answers[q.id], value: 'NA' }})}
                                    >
                                        Kapsam Dışı
                                    </Button>
                                </div>
                                {(answers[q.id]?.value === 'PARTIAL' || answers[q.id]?.value === 'FAIL') && (
                                    <div className="col-span-12 mt-3 p-4 bg-red-50/50 border border-red-100 rounded-lg space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-red-700 font-semibold flex items-center gap-1">Açıklama <span className="text-red-500">*</span></Label>
                                            <Input 
                                                placeholder="Lütfen durum ile ilgili zorunlu açıklamanızı giriniz..."
                                                value={answers[q.id]?.note || ''}
                                                onChange={e => setAnswers({...answers, [q.id]: { ...answers[q.id], value: answers[q.id]?.value as any, note: e.target.value }})}
                                                className={`bg-white ${!answers[q.id]?.note?.trim() ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-gray-700 font-medium">Durum Fotoğrafları (Opsiyonel)</Label>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-3">
                                                    <Input type="file" multiple accept="image/*" className="bg-white flex-1 cursor-pointer" onChange={async (e) => {
                                                        const files = e.target.files;
                                                        if (!files || files.length === 0) return;
                                                        const currentPhotos = answers[q.id]?.photos || [];
                                                        const newPhotos = [...currentPhotos];
                                                        
                                                        toast.loading('Fotoğraflar yükleniyor...', { id: 'uploading' });
                                                        let hasError = false;
                                                        
                                                        for (let i = 0; i < files.length; i++) {
                                                            const formData = new FormData();
                                                            formData.append('file', files[i]);
                                                            try {
                                                                const res = await api.post('/settings/facilities/upload-logo', formData);
                                                                if (!res.ok) throw new Error('Yükleme başarısız');
                                                                const data = await res.json();
                                                                newPhotos.push(data.url);
                                                            } catch (err) {
                                                                hasError = true;
                                                            }
                                                        }
                                                        
                                                        setAnswers({...answers, [q.id]: { ...answers[q.id], value: answers[q.id]?.value as any, note: answers[q.id]?.note || '', photos: newPhotos }});
                                                        toast.dismiss('uploading');
                                                        
                                                        if (hasError) toast.error('Bazı fotoğraflar yüklenemedi. Boyut büyük olabilir.');
                                                        else toast.success('Fotoğraflar başarıyla eklendi.');
                                                        
                                                        e.target.value = '';
                                                    }} />
                                                </div>
                                                
                                                {answers[q.id]?.photos && answers[q.id].photos!.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {answers[q.id].photos!.map((photo, idx) => (
                                                            <div key={idx} className="relative group rounded-md border bg-white p-1">
                                                                <img src={BASE_URL + photo} alt="Yüklenen Fotoğraf" className="w-16 h-16 object-cover rounded-sm" />
                                                                <button
                                                                    type="button"
                                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => {
                                                                        const newPhotos = answers[q.id].photos!.filter((_, i) => i !== idx);
                                                                        setAnswers({...answers, [q.id]: { ...answers[q.id], photos: newPhotos }});
                                                                    }}
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
                
                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep(1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Kapı Özelliklerine Geri Dön
                    </Button>
                    <Button onClick={handleNextStep2} disabled={submitInspection.isPending}>
                        Kaydet ve Bitir <CheckCircle2 className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="text-center py-12">
            <CardContent className="space-y-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold">Denetim Başarıyla Tamamlandı!</h2>
                <p className="text-muted-foreground">Bu kapı için tüm veriler sisteme işlendi.</p>
                <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 pt-6">
                    <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto min-w-[200px] h-14 text-lg">
                        Sıradaki Kapıyı Ekle
                    </Button>
                    <Button onClick={() => navigate(`/safety-management/fire-doors/${doorId}`)} variant="secondary" className="w-full sm:w-auto min-w-[200px] h-14 text-lg bg-blue-50 hover:bg-blue-100 text-blue-700">
                        Eklenen Kapıya Git
                    </Button>
                    <Button onClick={() => navigate('/safety-management/fire-doors/list')} className="w-full sm:w-auto min-w-[200px] h-14 text-lg">
                        Kapı Listesine Dön
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
