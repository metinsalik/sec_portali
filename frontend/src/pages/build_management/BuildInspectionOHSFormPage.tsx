import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const OHS_QUESTIONS = [
  "Çalışma alanı yetkisiz girişe karşı kapatıldı mı?",
  "Yalnızca önceden bildirilen ve evrakları eksiksiz olan kişiler mi çalıştırılıyor?",
  "Yetkilendirilen alan ve iş dışında herhangi bir çalışma yapılıyor mu?",
  "Çalışanların KKD'leri işe uygun ve eksiksiz şekilde kullanılıyor mu?",
  "Alanda uyarı/ikaz levhaları uygun mu? Eksiksiz şekilde bulunuyor mu?",
  "Çalışma alanında yangın söndürme cihazları kullanıma hazır şekilde bulunuyor mu?",
  "El aletleri çalışma için uygun mu? Güvenli şekilde muhafaza ediliyor ve kullanılıyor mu?",
  "Elektrikli el aletleri çalışma için uygun mu? Güvenli şekilde muhafaza ediliyor ve kullanılıyor mu?",
  "Taşıma - istifleme aletleri uygun mu? Güvenli şekilde muhafaza ediliyor ve kullanılıyor mu?",
  "Tehlikeli maddeler çalışma için uygun mu? Güvenli şekilde muhafaza ediliyor ve kullanılıyor mu?",
  "Aydınlatma uygun ve yeterli mi? Aydınlatma sistemleri çalışıyor mu?",
  "Sıcaklık ve nem uygun mu? Havalandırma yeterli mi?",
  "Gürültü koşulları uygun mu?",
  "Altyapı Sistemlerini korumaya yönelik önlemler alınmış ve yetkisiz müdahaleden kaçınılıyor mu?",
  "Düşmeye neden olacak boşluklara yönelik tedbirler alınmış mı? Bu tedbirler uygulanıyor mu?",
  "İstifleme alanlarında malzeme düşmesi / devrilmesi gibi durumlara karşı önlemler alınmış mı?",
  "Acil Kaçış Yolları ve Acil Çıkışlar yabancı malzemeden arındırılmış ve kullanılabilir durumda mı?",
  "Atıklar belirlenen alanlarda düzenli şekilde depolanıyor mu?"
];

export default function BuildInspectionOHSFormPage() {
  const { id, inspectionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [inspectorName, setInspectorName] = useState(user?.fullName || '');
  const [overallResult, setOverallResult] = useState('UYGUNDUR');

  // Get project info
  const { data: project } = useQuery({
    queryKey: ['buildProject', id],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects/${id}`);
      return res.json();
    }
  });

  // Get open findings for this project
  const { data: findings = [] } = useQuery({
    queryKey: ['buildFindings', id],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects/${id}/findings`);
      return res.json();
    }
  });

  // Find open OHS findings to show warnings
  const openQuestions = findings
    .filter((f: any) => f.sourceType === 'İSG Denetimi' && f.actions?.some((a: any) => a.status === 'Açık'))
    .map((f: any) => f.sourceRef);

  // Get users for inspector selection
  const { data: users = [] } = useQuery({
    queryKey: ['settings-users'],
    queryFn: async () => {
      const res = await api.get('/settings/users');
      return res.json();
    }
  });

  // Get inspection details if editing
  const { data: existingInspection } = useQuery({
    queryKey: ['ohsInspection', inspectionId],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects/${id}/inspections/ohs`);
      const all = await res.json();
      return all.find((i: any) => i.id === inspectionId);
    },
    enabled: !!inspectionId
  });

  useEffect(() => {
    if (existingInspection) {
      setAnswers(existingInspection.checklistData || {});
      if (existingInspection.inspectionDate) {
        setInspectionDate(new Date(existingInspection.inspectionDate).toISOString().slice(0, 10));
      }
      setInspectorName(existingInspection.inspector || '');
      setOverallResult(existingInspection.result || 'UYGUNDUR');
    }
  }, [existingInspection]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (inspectionId) {
        const res = await api.put(`/build-management/projects/${id}/inspections/ohs/${inspectionId}`, payload);
        if (!res.ok) throw new Error('Güncellenemedi');
        return res.json();
      } else {
        const res = await api.post(`/build-management/projects/${id}/inspections/ohs`, payload);
        if (!res.ok) throw new Error('Kaydedilemedi');
        return res.json();
      }
    },
    onSuccess: () => {
      toast.success('Denetim başarıyla kaydedildi.');
      queryClient.invalidateQueries({ queryKey: ['buildFindings', id] });
      navigate(`/build-management/project/${id}/inspections`);
    },
    onError: () => toast.error('Kaydedilirken hata oluştu.')
  });

  const handleSave = () => {
    // Validate that all questions are answered
    if (Object.keys(answers).length < OHS_QUESTIONS.length) {
      toast.error('Lütfen tüm soruları işaretleyiniz.');
      return;
    }

    saveMutation.mutate({
      inspectionDate,
      inspector: inspectorName,
      checklistData: answers,
      result: overallResult,
      notes: ''
    });
  };

  const handleAnswer = (qIndex: number, value: string) => {
    setAnswers(prev => ({ ...prev, [(qIndex + 1).toString()]: value }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-[#011d2b] dark:text-[#cbe6fa]">İSG Kontrol Formu</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Saha İSG güvenlik standartlarını denetleyin.</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/build-management/project/${id}/inspections`)}>
          <span className="material-symbols-outlined mr-2">arrow_back</span>
          Geri Dön
        </Button>
      </div>

      <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="text-slate-500">
            <strong>Proje Adı:</strong> {project?.name} <br />
            <strong>Çalışma Alanı:</strong> {project?.workArea}
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col gap-1 w-64">
              <label className="text-xs font-semibold text-slate-500">Denetçi</label>
              <Select value={inspectorName} onValueChange={setInspectorName}>
                <SelectTrigger className="w-full text-sm bg-white dark:bg-[#1a1d1f]">
                  <SelectValue placeholder="Denetçi Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u: any) => (
                    <SelectItem key={u.username} value={u.fullName}>{u.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 w-48">
              <label className="text-xs font-semibold text-slate-500">Tarih</label>
              <input 
                type="date" 
                value={inspectionDate} 
                onChange={e => setInspectionDate(e.target.value)}
                className="w-full text-sm p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1a1d1f]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
          <span className="flex items-center gap-1 text-sm font-medium"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> U: Uygun</span>
          <span className="flex items-center gap-1 text-sm font-medium"><span className="w-3 h-3 rounded-full bg-red-500"></span> UD: Uygun Değil</span>
          <span className="flex items-center gap-1 text-sm font-medium"><span className="w-3 h-3 rounded-full bg-slate-400"></span> KD: Kapsam Dışı</span>
        </div>

        <div className="space-y-4">
          {OHS_QUESTIONS.map((q, idx) => {
            const qId = (idx + 1).toString();
            const isOpenFinding = openQuestions.includes(qId);

            return (
              <div key={idx} className={`p-4 rounded-lg border flex flex-col gap-3 ${isOpenFinding ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-slate-100 dark:border-slate-800'}`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      <span className="mr-2 text-slate-400">{idx + 1}.</span> 
                      {q}
                    </p>
                    {isOpenFinding && (
                      <div className="mt-2 flex items-center text-red-600 text-xs font-bold bg-red-100 dark:bg-red-900/40 w-fit px-2 py-1 rounded">
                        <span className="material-symbols-outlined text-[14px] mr-1">warning</span>
                        Önceki denetimde UYGUN DEĞİL seçilmişti, lütfen kontrol ediniz. (Uygun işaretlenirse otomatik kapatılır)
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => handleAnswer(idx, 'U')}
                      className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${answers[qId] === 'U' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'}`}
                    >
                      U
                    </button>
                    <button 
                      onClick={() => handleAnswer(idx, 'UD')}
                      className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${answers[qId] === 'UD' ? 'bg-red-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-700'}`}
                    >
                      UD
                    </button>
                    <button 
                      onClick={() => handleAnswer(idx, 'KD')}
                      className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${answers[qId] === 'KD' ? 'bg-slate-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      KD
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Genel Değerlendirme Sonucu</label>
          <div className="flex gap-4">
            <button
              onClick={() => setOverallResult('UYGUNDUR')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold border transition-colors ${
                overallResult === 'UYGUNDUR' 
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span className={`material-symbols-outlined ${overallResult === 'UYGUNDUR' ? 'text-emerald-500' : 'text-slate-400'}`}>check_circle</span>
                Uygun
              </span>
            </button>
            <button
              onClick={() => setOverallResult('UYGUN DEĞİLDİR')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold border transition-colors ${
                overallResult === 'UYGUN DEĞİLDİR' 
                  ? 'bg-red-50 border-red-500 text-red-700' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span className={`material-symbols-outlined ${overallResult === 'UYGUN DEĞİLDİR' ? 'text-red-500' : 'text-slate-400'}`}>cancel</span>
                Uygun Değil
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate(`/build-management/project/${id}/inspections`)}>İptal</Button>
        <Button 
          onClick={handleSave} 
          disabled={saveMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saveMutation.isPending ? 'Kaydediliyor...' : 'Denetimi Tamamla ve Kaydet'}
        </Button>
      </div>
    </div>
  );
}
