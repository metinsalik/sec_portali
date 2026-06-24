import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BuildHandoverOHSPrintModal } from '@/components/build_management/BuildHandoverOHSPrintModal';
import { ArrowLeft, CheckCircle2, Edit2, Plus, Printer, Trash2 } from 'lucide-react';

const DEFAULT_QUESTIONS = [
  "Hasta odalarında aydınlatma sistemi eksiksiz ve çalışır durumda olmalıdır.",
  "Hasta odalarında havalandırma/iklimlendirme sistemi eksiksiz ve çalışır durumda olmalıdır.",
  "Hasta odalarında havalandırma/iklimlendirme termostat ve kontrol panelleri eksiksiz ve çalışır olmalıdır.",
  "Hasta odalarında televizyon vb. cihazlar eksiksiz ve çalışır durumda olmalıdır.",
  "Hasta odalarında su armatürleri eksiksiz ve çalışır durumda olmalıdır.",
  "Hasta odalarında lavabo giderleri, sifon vb. eksiksiz ve çalışır durumda olmalıdır.",
  "Hasta odalarında hasta başı panelleri uygun ve çalışır durumda olmalıdır.",
  "Hasta odalarında mobilyalar, eşyalar vb. malzemelerde hasar, deformasyon, yapısal bozukluk olmamalıdır.",
  "Hasta odalarında tavan, duvar veya zeminlerde hasar, deformasyon, yapısal bozukluk olmamalıdır.",
  "Engelli hasta odalarında tutunma barları mevcut olmalıdır.",
  "Engelli hasta odalarında çarpma bantları mevcut olmalıdır.",
  "Engelli hasta odalarındaki wc lerde engelli kullanımına uygun düzenlemeler yapılmış olmalıdır.",
  "Anons sistemleri gerekli tüm alanlarda eksiksiz ve çalışır durumda olmalıdır.",
  "Hemşire çağrı sistemi gerekli tüm alanlarda eksiksiz ve çalışır durumda olmalıdır.",
  "İç haberleşme sistemi gerekli tüm alanlarda eksiksiz ve çalışır durumda olmalıdır.",
  "Havalandırma/iklimlendirme sistemleri her alanda eksiksiz ve çalışır durumda olmalıdır.",
  "Havalandırma/iklimlendirme termostat ve kontrol panelleri eksiksiz ve çalışır olmalıdır.",
  "TV ve ekranlar gerekli alanlarda eksiksiz ve çalışır durumda olmalıdır.",
  "Medikal Gaz Sistemi aktif olmalı, medikal gaz panelleri uygun ve çalışır şekilde bulunmalıdır.",
  "Alanının tamamını kapsayan uygun nitelikli Yangın Algılama ve Alarm Sistemi bulunuyor olmalıdır.",
  "Yangın algılama ve alarm sistemi aktif ve test edilmiş olmalıdır.",
  "Yangın kapıları eksiksiz, uygun ve işlevsel halde olmalıdır.",
  "Manyetik kapı tutucuları uygun ve çalışabilir durumda olmalıdır.",
  "Sulu söndürme sistemleri hazır ve çalışabilir durumda olmalıdır.",
  "Otomatik söndürme sistemleri hazır ve çalışabilir durumda olmalıdır.",
  "Acil durum aydınlatma sistemleri eksiksiz ve aktif halde olmalıdır.",
  "Alanda kompartımanlar arası geçişler ve gerekli diğer bölümlerde yangının ve dumanın yayılmasına yönelik pasif önlemler alınmış olmalıdır.",
  "Alanda yangın durumunda duman yönetimi için gerekli sistemler uygun ve çalışabilir şekilde bulunmalıdır.",
  "Alanda acil durumlarda güvenli çıkışlara yönlendiren, uygun nitelikte acil çıkış yönlendirmeleri bulunmalıdır.",
  "Kartlı geçiş sistemleri eksiksiz ve aktif halde olmalıdır.",
  "Manyetik kilitler uygun ve çalışabilir durumda olmalıdır.",
  "Otomatik kapılar uygun nitelikte ve çalışabilir durumda olmalıdır.",
  "Şaft kapakları uygun şekilde monte edilmiş olmalı, açma kapama mekanizmaları doğru ve işlevsel şekilde çalışıyor olmalıdır.",
  "Şaftlarda duman sızdırmazlık koşulları sağlanmış olmalıdır.",
  "Şaftlarda yer alan mekanik veya elektrik bileşenleri doğru ve güvenli şekilde tesis edilmiş olmalıdır.",
  "Ortak alanlarda tavan, duvar veya zeminlerde hasar, deformasyon, yapısal bozukluk olmamalıdır.",
  "Ortak alanlardaki mobilyalar, eşyalar vb. malzemelerde hasar, deformasyon, yapısal bozukluk olmamalıdır.",
  "Teknik alanlarda tavan, duvar veya zeminlerde hasar, deformasyon, yapısal bozukluk olmamalıdır.",
  "Teknik alanlardaki mobilyalar, eşyalar vb. malzemelerde hasar, deformasyon, yapısal bozukluk olmamalıdır.",
  "Destek alanlarda tavan, duvar veya zeminlerde hasar, deformasyon, yapısal bozukluk olmamalıdır.",
  "Destek alanlardaki mobilyalar, eşyalar vb. malzemelerde hasar, deformasyon, yapısal bozukluk olmamalıdır.",
  "Tüm alanlar temizlenmiş, inşaat atıklarından ve gereksiz malzemelerden arındırılmış olmalıdır."
];

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

export function BuildHandoverOHSForm({ projectId, project }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [notes, setNotes] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const { data: formData, isLoading } = useQuery({
    queryKey: ['buildHandoverOHS', projectId],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects/${projectId}/handover-ohs`);
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
    } else {
      setQuestions(DEFAULT_QUESTIONS.map((q, i) => ({
        id: `default-${i}`,
        text: q,
        answer: null,
        note: ''
      })));
    }
  }, [formData]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/build-management/projects/${projectId}/handover-ohs`, payload);
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      toast.success('Teslim Alma İSG Formu başarıyla kaydedildi.');
      queryClient.invalidateQueries({ queryKey: ['buildHandoverOHS', projectId] });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#011d2b] dark:text-[#cbe6fa]">
            İSG Teslim Alma Kontrol Listesi
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {project?.name}
          </p>
        </div>
        {formData && (
          <Button variant="outline" onClick={() => setPrintModalOpen(true)}>
            <Printer className="w-4 h-4 mr-2" />
            Yazdır / PDF
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tarih</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
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

        <div className="mt-8">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Genel Notlar</label>
          <Textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Varsa denetime dair genel notlarınızı buraya girebilirsiniz..."
            className="min-h-[100px]"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#2c3135] p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex justify-end gap-3 sticky bottom-6 z-10">
        <Button variant="outline" onClick={() => navigate(`/build-management/project/${id}`)}>
          İptal
        </Button>
        <Button onClick={handleSave} disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {mutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>

      {printModalOpen && formData && project && (
        <BuildHandoverOHSPrintModal 
          open={printModalOpen} 
          onOpenChange={setPrintModalOpen}
          project={project}
          inspection={formData}
        />
      )}
    </div>
  );
}
