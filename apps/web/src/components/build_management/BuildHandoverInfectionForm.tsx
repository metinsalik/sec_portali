import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BuildHandoverInfectionPrintModal } from '@/components/build_management/BuildHandoverInfectionPrintModal';
import { CheckCircle2, Edit2, Plus, Printer, Trash2 } from 'lucide-react';

const QUESTIONS_BY_CLASS: Record<string, string[]> = {
  'Sınıf I': [
    "Bölgenin temiz olduğu kontrol edilir."
  ],
  'Sınıf II': [
    "Çalışma yüzeyi dezenfektanlarla silinir.",
    "İnşaat atığı transport edilmeden önce kapağı kapalı konteynırlarla taşınır.",
    "Çalışma bölgesinden ayrılmadan önce inşaat alanı ıslak bez ile silinir veya vakumlanır.",
    "Çalışmanın yapıldığı bölgede havalandırma sistem izolasyonu kaldırılır."
  ],
  'Sınıf III': [
    "Bitmiş proje temizlik elemanı tarafından tamamen temizlenmedikçe bariyerler kaldırılmaz",
    "İnşaat ile ilişkili kir ve enkazın yayılımını en aza indirgemek için bariyer materyalleri dikkatlice kaldırılır.",
    "Çalışma bölgesi vakumlanır.",
    "Dezenfektanlarla ıslak temizliği yapılır.",
    "Çalışmanın yapıldığı bölgede havalandırma sistem izolasyonu kaldırılır."
  ],
  'Sınıf IV': [
    "Bitmiş proje temizlik elemanı tarafından tamamen temizlenmedikçe bariyerler kaldırılmaz",
    "İnşaat ile ilişkili kir ve enkazın yayılımını en aza indirgemek için bariyer materyalleri dikkatlice kaldırılır.",
    "İnşaat atığı transport edilmeden önce kapağı kapalı konteynırlarla taşınır.",
    "Çalışma bölgesi vakumlanır.",
    "Dezenfektanlarla ıslak temizliği yapılır.",
    "Çalışmanın yapıldığı bölgede havalandırma sistem izolasyonu kaldırılır."
  ]
};

interface QuestionRow {
  id: string;
  text: string;
  answer: 'U' | 'UD' | 'KD' | null;
  note: string;
}

interface Props {
  projectId: string;
  project: any;
}

export function BuildHandoverInfectionForm({ projectId, project }: Props) {
  const queryClient = useQueryClient();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [notes, setNotes] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const { data: formData, isLoading } = useQuery({
    queryKey: ['buildHandoverInfection', projectId],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects/${projectId}/handover-infection`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error();
      }
      return res.json();
    },
    enabled: !!projectId
  });

  useEffect(() => {
    if (formData) {
      if (formData.inspectionDate) {
        setDate(new Date(formData.inspectionDate).toISOString().split('T')[0]);
      }
      if (formData.checklistData) {
        setQuestions(formData.checklistData);
      }
      setNotes(formData.notes || '');
    } else if (project) {
      // Sınıflara göre sorular kümülatif olarak getirilir
      const icraClass = project.icraClass || 'Sınıf I';
      
      let defaultQuestions: string[] = [];
      if (icraClass === 'Sınıf I') {
        defaultQuestions = [...QUESTIONS_BY_CLASS['Sınıf I']];
      } else if (icraClass === 'Sınıf II') {
        defaultQuestions = [...QUESTIONS_BY_CLASS['Sınıf I'], ...QUESTIONS_BY_CLASS['Sınıf II']];
      } else if (icraClass === 'Sınıf III') {
        defaultQuestions = [...QUESTIONS_BY_CLASS['Sınıf I'], ...QUESTIONS_BY_CLASS['Sınıf II'], ...QUESTIONS_BY_CLASS['Sınıf III']];
      } else if (icraClass === 'Sınıf IV') {
        defaultQuestions = [...QUESTIONS_BY_CLASS['Sınıf I'], ...QUESTIONS_BY_CLASS['Sınıf II'], ...QUESTIONS_BY_CLASS['Sınıf III'], ...QUESTIONS_BY_CLASS['Sınıf IV']];
      }

      setQuestions(defaultQuestions.map((q, i) => ({
        id: `default-${i}`,
        text: q,
        answer: null,
        note: ''
      })));
    }
  }, [formData, project]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/build-management/projects/${projectId}/handover-infection`, payload);
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      toast.success('Enfeksiyon Teslim Alma Formu başarıyla kaydedildi.');
      queryClient.invalidateQueries({ queryKey: ['buildHandoverInfection', projectId] });
      queryClient.invalidateQueries({ queryKey: ['buildProject', projectId] });
    },
    onError: () => toast.error('Kaydedilirken hata oluştu.')
  });

  const handleSave = () => {
    mutation.mutate({
      inspectionDate: new Date(date).toISOString(),
      inspector: `${currentUser.firstName} ${currentUser.lastName}`,
      checklistData: questions,
      notes
    });
  };

  const handleAnswer = (qId: string, answer: 'U' | 'UD' | 'KD') => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, answer } : q));
  };

  const handleNoteChange = (qId: string, note: string) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, note } : q));
  };

  const handleAddQuestion = () => {
    setQuestions(prev => [...prev, {
      id: `custom-${Date.now()}`,
      text: 'Yeni Soru/Madde...',
      answer: null,
      note: ''
    }]);
  };

  const handleRemoveQuestion = (qId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== qId));
  };

  const startEditing = (q: QuestionRow) => {
    setEditingId(q.id);
    setEditingText(q.text);
  };

  const saveEditing = (qId: string) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, text: editingText } : q));
    setEditingId(null);
  };

  if (isLoading) return <div>Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-[#2c3135] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tarih</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-48" />
        </div>
        {formData && (
          <Button variant="outline" onClick={() => setPrintModalOpen(true)}>
            <Printer className="w-4 h-4 mr-2" />
            Yazdır / PDF
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <th className="p-3 text-sm font-bold text-slate-700 dark:text-slate-300 w-12 text-center">No</th>
              <th className="p-3 text-sm font-bold text-slate-700 dark:text-slate-300">Kontrol Edilecek Hususlar</th>
              <th className="p-3 text-sm font-bold text-slate-700 dark:text-slate-300 w-16 text-center">U</th>
              <th className="p-3 text-sm font-bold text-slate-700 dark:text-slate-300 w-16 text-center">UD</th>
              <th className="p-3 text-sm font-bold text-slate-700 dark:text-slate-300 w-16 text-center">KD</th>
              <th className="p-3 text-sm font-bold text-slate-700 dark:text-slate-300 w-64">Açıklama</th>
              <th className="p-3 text-sm font-bold text-slate-700 dark:text-slate-300 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, i) => (
              <tr key={q.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-3 text-center font-medium">{i + 1}</td>
                <td className="p-3">
                  {editingId === q.id ? (
                    <div className="flex flex-col gap-2">
                      <Textarea 
                        value={editingText} 
                        onChange={e => setEditingText(e.target.value)} 
                        className="min-h-[60px]"
                      />
                      <Button size="sm" onClick={() => saveEditing(q.id)} className="w-fit">Kaydet</Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm">{q.text}</span>
                      <Button variant="ghost" size="icon" onClick={() => startEditing(q)} className="h-6 w-6 text-slate-400 hover:text-blue-600 shrink-0">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </td>
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleAnswer(q.id, 'U')}
                    className={`w-6 h-6 rounded-full border ${q.answer === 'U' ? 'bg-green-500 border-green-600 shadow-inner' : 'bg-white border-slate-300'} transition-all`}
                  ></button>
                </td>
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleAnswer(q.id, 'UD')}
                    className={`w-6 h-6 rounded-full border ${q.answer === 'UD' ? 'bg-red-500 border-red-600 shadow-inner' : 'bg-white border-slate-300'} transition-all`}
                  ></button>
                </td>
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleAnswer(q.id, 'KD')}
                    className={`w-6 h-6 rounded-full border ${q.answer === 'KD' ? 'bg-slate-500 border-slate-600 shadow-inner' : 'bg-white border-slate-300'} transition-all`}
                  ></button>
                </td>
                <td className="p-3">
                  <Input 
                    placeholder="Açıklama..." 
                    value={q.note || ''} 
                    onChange={e => handleNoteChange(q.id, e.target.value)}
                    className="text-sm h-8"
                  />
                </td>
                <td className="p-3 text-center">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleRemoveQuestion(q.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4">
          <Button variant="outline" onClick={handleAddQuestion} className="w-full border-dashed">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Madde Ekle
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mt-6">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Genel Notlar</label>
        <Textarea 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Varsa denetime dair genel notlarınızı buraya girebilirsiniz..."
          className="min-h-[100px]"
        />
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button onClick={handleSave} disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {mutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>

      {printModalOpen && formData && project && (
        <BuildHandoverInfectionPrintModal 
          open={printModalOpen} 
          onOpenChange={setPrintModalOpen}
          project={project}
          inspection={formData}
        />
      )}
    </div>
  );
}
