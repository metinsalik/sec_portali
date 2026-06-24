import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

const INFECTION_CLASS_QUESTIONS: Record<string, string[]> = {
  "Sınıf I": [
    "İnşaat operasyonlarından toz kalkmasını en aza indirgeyecek metodlarla çalışma yürütülür.",
    "Görsel olarak inceleme için çıkarılan tavan kapağı hemen yerleştirilir."
  ],
  "Sınıf II": [
    "Tozun atmosfere yayılmasını engellemek için aktif yollar bulunur.",
    "Keserken tozu kontrol etmek için çalışma yüzeyi nemlendirilir.",
    "Kanal bantları ile kullanılmayan kapıların açıklıkları kapatılır.",
    "Hava girişleri ve açıklıklarıda kapatılır.",
    "Çalışma bölgesinin giriş ve çıkışına toz tutucu bir materyal yerleştirilir.",
    "Çalışmanın uygulandığı bölgede mevcut havalandırma sistemi kaldırılır veya izole edilir.",
    "İnşaat atığı transport edilmeden önce kapağı sıkı kapalı kaplarda toplanır."
  ],
  "Sınıf III": [
    "Mevcut havalandırma sistemi kanalın kontaminasyonunu engellemek için çalışma yapılan bölgede kaldırılır veya izole edilir.",
    "Çalışma bölgesini çalışma dışı bölgelere kapatmak için bariyerler tamamlanır.",
    "HEPA ile donanımlı hava filtrasyon birimleri kullanılarak çalışma bölgesi içinde negatif basıncı idame ettirilir.",
    "İnşaat işçileri çalışma bölgesinden hasta bakım bölgelerine giderken koruyucu elbise (örn; önlük, galoş) giyilir."
  ],
  "Sınıf IV": [
    "Delik, kanal ve kablo girişleri uygun olarak kapatılır.",
    "Çalışma bölgesine giren tüm personel galoş giyer. İşçilerin çalışma alanından çıktığı her seferde galoş değiştirilir."
  ]
};

const getQuestionsForClass = (icraClass: string) => {
  let classesToInclude: string[] = [];
  if (icraClass === 'Sınıf I') classesToInclude = ['Sınıf I'];
  else if (icraClass === 'Sınıf II') classesToInclude = ['Sınıf I', 'Sınıf II'];
  else if (icraClass === 'Sınıf III') classesToInclude = ['Sınıf I', 'Sınıf II', 'Sınıf III'];
  else if (icraClass === 'Sınıf IV') classesToInclude = ['Sınıf I', 'Sınıf II', 'Sınıf III', 'Sınıf IV'];
  else classesToInclude = ['Sınıf I', 'Sınıf II', 'Sınıf III', 'Sınıf IV']; // Fallback

  return classesToInclude.flatMap(c => 
    INFECTION_CLASS_QUESTIONS[c].map(q => ({ className: c, text: q }))
  );
};

export default function BuildInspectionInfectionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [questions, setQuestions] = useState<{className: string, text: string}[]>([]);
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: project, isLoading } = useQuery({
    queryKey: ['buildProject', id],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects/${id}`);
      if (!res.ok) throw new Error();
      return res.json();
    }
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/build-management/projects/${id}/inspections/infection`, payload);
      if (!res.ok) throw new Error('Kaydedilemedi');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Denetim başarıyla kaydedildi.');
      queryClient.invalidateQueries({ queryKey: ['buildProject', id] });
      navigate(`/build-management/project/${id}/inspections`);
    },
    onError: () => {
      toast.error('Kaydetme hatası.');
    }
  });

  useEffect(() => {
    if (project) {
      const classType = project.icraClass || 'Sınıf IV';
      setQuestions(getQuestionsForClass(classType));

      if (project.findings) {
        const infectionFindings = project.findings.filter((f: any) => f.type === 'infection' && f.status === 'Açık');
        setOpenQuestions(infectionFindings.map((f: any) => f.questionId));
      }
    }
  }, [project]);

  const handleAnswer = (qIndex: number, value: string) => {
    setAnswers(prev => ({ ...prev, [(qIndex + 1).toString()]: value }));
  };

  const handleSave = async () => {
    if (Object.keys(answers).length !== questions.length) {
      toast.error("Lütfen tüm soruları işaretleyiniz.");
      return;
    }

    mutation.mutate({
      inspectionDate: new Date(date).toISOString(),
      inspector: `${currentUser.firstName} ${currentUser.lastName}`,
      checklistData: answers,
      notes
    });
  };

  if (isLoading) return <div>Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#011d2b] dark:text-[#cbe6fa]">Enfeksiyon Kontrol Formu</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Saha Enfeksiyon güvenlik standartlarını denetleyin. Proje Sınıfı: {project?.icraClass || 'Bilinmiyor'}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Denetim Tarihi</label>
            <input 
              type="date"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-[#202427] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Denetçi</label>
            <input 
              type="text"
              disabled
              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500"
              value={`${currentUser.firstName || ''} ${currentUser.lastName || ''}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
          <span className="flex items-center gap-1 text-sm font-medium"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> U: Uygun</span>
          <span className="flex items-center gap-1 text-sm font-medium"><span className="w-3 h-3 rounded-full bg-red-500"></span> UD: Uygun Değil</span>
          <span className="flex items-center gap-1 text-sm font-medium"><span className="w-3 h-3 rounded-full bg-slate-400"></span> KD: Kapsam Dışı</span>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const questionId = `${idx + 1}`;
            const isOpenFinding = openQuestions.includes(questionId);
            const showHeader = idx === 0 || questions[idx - 1].className !== q.className;

            return (
              <React.Fragment key={questionId}>
                {showHeader && (
                  <div className="mt-6 mb-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2 px-4 rounded-lg shadow-sm">
                    {q.className} Kriterleri
                  </div>
                )}
                <div className={`p-4 rounded-lg border flex flex-col gap-3 ${isOpenFinding ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-slate-100 dark:border-slate-800'}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        <span className="mr-2 text-slate-400">{questionId}.</span> 
                        {q.text}
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
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${answers[questionId] === 'U' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'}`}
                      >
                        U
                      </button>
                      <button 
                        onClick={() => handleAnswer(idx, 'UD')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${answers[questionId] === 'UD' ? 'bg-red-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-700'}`}
                      >
                        UD
                      </button>
                      <button 
                        onClick={() => handleAnswer(idx, 'KD')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${answers[questionId] === 'KD' ? 'bg-slate-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
                      >
                        KD
                      </button>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className="mt-8">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ek Notlar / Bulgular</label>
          <textarea
            className="w-full px-4 py-3 bg-slate-50 dark:bg-[#202427] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 min-h-[100px]"
            placeholder="Varsa eklemek istediğiniz notlar..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate(`/build-management/project/${id}/inspections`)}>İptal</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Kaydediliyor...' : 'Denetimi Tamamla ve Kaydet'}
          </Button>
        </div>
      </div>
    </div>
  );
}
