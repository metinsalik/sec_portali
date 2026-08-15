import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Activity, Edit2, Info } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const getGradeAndColor = (percentScore: number | undefined | null) => {
  if (percentScore === undefined || percentScore === null || isNaN(percentScore)) return { grade: '-', color: 'text-slate-400 bg-slate-50' };
  if (percentScore >= 90) return { grade: 'A', color: 'text-emerald-700 bg-emerald-50' };
  if (percentScore >= 80) return { grade: 'B', color: 'text-blue-700 bg-blue-50' };
  if (percentScore >= 70) return { grade: 'C', color: 'text-amber-700 bg-amber-50' };
  if (percentScore >= 60) return { grade: 'D', color: 'text-orange-700 bg-orange-50' };
  if (percentScore >= 50) return { grade: 'E', color: 'text-rose-700 bg-rose-50' };
  return { grade: 'F', color: 'text-red-700 bg-red-100 font-bold' };
};

export default function TemplatePreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchTemplateDetails();
    }
  }, [id]);

  const fetchTemplateDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/checklists/templates/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTemplate(data);
      }
    } catch (error) {
      console.error('Error fetching template details for preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const { earnedScore, maxScore, percentScore } = useMemo(() => {
    if (!template?.sections) return { earnedScore: 0, maxScore: 0, percentScore: 0 };
    
    let earned = 0;
    let max = 0;

    template.sections.forEach((sec: any) => {
      sec.items.forEach((item: any) => {
        const ans = answers.find(a => a.itemId === item.id);
        if (!ans || ans.notApplicable) return;
        
        max += Number(item.weight) || 0;
        if (ans.earnedScore !== undefined && ans.earnedScore !== null) {
          earned += Number(ans.earnedScore);
        }
      });
    });

    const percent = max > 0 ? (earned / max) * 100 : 0;
    return { earnedScore: earned, maxScore: max, percentScore: percent };
  }, [answers, template]);

  const handleAnswerChange = (itemId: string, scaleOptionId: string | null, multiplier: number | null) => {
    const item = template.sections.flatMap((s: any) => s.items).find((i: any) => i.id === itemId);
    const newAnswers = [...answers];
    const existingIdx = newAnswers.findIndex(a => a.itemId === itemId);
    
    const weight = Number(item.weight) || 0;
    const mult = Number(multiplier) || 0;
    const calculatedEarnedScore = multiplier !== null ? (weight * mult) : 0;

    const ans = {
      itemId,
      scaleOptionId,
      notApplicable: multiplier === null,
      earnedScore: calculatedEarnedScore
    };

    if (existingIdx >= 0) {
      newAnswers[existingIdx] = { ...newAnswers[existingIdx], ...ans };
    } else {
      newAnswers.push(ans);
    }
    setAnswers(newAnswers);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-500 text-sm">
        Şablon bulunamadı.
      </div>
    );
  }

  const canEdit = user?.role === 'admin' || user?.role === 'specialist';

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      
      {/* SIMULATION WARNING */}
      <div className="bg-indigo-600 text-white text-center text-xs font-semibold py-1.5 shadow-sm">
        Bu bir Önizleme / Simülasyon sayfasıdır. Girdiğiniz veriler kaydedilmez.
      </div>

      {/* COMPACT & GLASSY HEADER */}
      <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-slate-200/60 shadow-sm transition-all duration-300">
        <div className="container mx-auto max-w-5xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-900 transition-colors p-1 -ml-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none line-clamp-1">{template.title}</h1>
                <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500 py-0">V{template.version}</Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium">Önizleme Modu</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Simülasyon</span>
              <div className="w-32 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-slate-900 rounded-full transition-all duration-500" style={{ width: `${Math.min(percentScore, 100)}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="text-right">
                <div className="text-lg font-black tracking-tighter text-slate-900">{earnedScore}<span className="text-slate-400 text-sm font-semibold ml-0.5">/{maxScore}</span></div>
               </div>
               <div className={cn("w-8 h-8 rounded flex items-center justify-center font-bold text-sm", getGradeAndColor(percentScore).color)}>
                  {getGradeAndColor(percentScore).grade}
               </div>
            </div>
            
            {canEdit && (
              <div className="hidden sm:flex items-center gap-2 border-l pl-6">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate(`/checklists/templates/${id}/edit`)}>
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                  Düzenle
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN FORM AREA */}
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-12">
        {template.sections.map((section: any, sIdx: number) => (
          <div key={section.id} className="space-y-4">
            
            {/* Minimal Section Header */}
            <div className="flex items-center gap-4 mb-2">
              <span className="text-sm font-bold text-slate-400 tracking-widest uppercase">Bölüm {sIdx + 1}</span>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{section.title}</h2>
            </div>
            
            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
              {/* Soruları itemNo'ya göre sıralıyoruz */}
              {[...section.items].sort((a, b) => a.itemNo - b.itemNo).map((item: any) => {
                const currentAnswer = answers.find(a => a.itemId === item.id) || {};
                const selectedOption = template.scaleSet?.options?.find((o: any) => o.id === currentAnswer.scaleOptionId);

                return (
                  <div key={item.id} className={cn(
                    "p-6 flex flex-col md:flex-row gap-8 transition-colors duration-200 hover:bg-slate-50/50",
                    currentAnswer.notApplicable ? "bg-slate-50/50 opacity-70" : ""
                  )}>
                    
                    {/* LEFT: Question Text & Badges */}
                    <div className="md:w-5/12 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <span className={cn(
                          "w-6 h-6 rounded shrink-0 flex items-center justify-center text-xs font-bold font-mono mt-0.5",
                          selectedOption || currentAnswer.notApplicable ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                        )}>{item.itemNo}</span>
                        <h3 className={cn(
                          "text-sm font-semibold leading-snug",
                          currentAnswer.notApplicable ? "text-slate-500 line-through decoration-slate-300" : "text-slate-800"
                        )}>{item.questionText}</h3>
                      </div>
                      
                      {/* Sub-info / Description */}
                      {item.config?.description && (
                        <div className="ml-9 flex items-start gap-1.5 text-xs text-slate-500 bg-slate-100/50 p-2 rounded-md">
                          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <p>{item.config.description}</p>
                        </div>
                      )}

                      {/* Soru Görseli (Eğer soruda bilgi resmi varsa) */}
                      {item.config?.imageUrl && (
                        <div className="ml-9 mt-1">
                          <img 
                            src={item.config.imageUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${item.config.imageUrl}` : item.config.imageUrl} 
                            alt="Soru Referansı" 
                            className="h-24 w-auto object-contain rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 shadow-sm transition-opacity"
                            onClick={() => setPreviewImage(item.config.imageUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${item.config.imageUrl}` : item.config.imageUrl)}
                          />
                        </div>
                      )}

                      {/* Score Badge */}
                      <div className="ml-9 flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] font-medium px-1.5 py-0 bg-slate-100 text-slate-500 shadow-none border-none">
                          Ağırlık: {item.weight}
                        </Badge>
                        {selectedOption && (
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-bold px-1.5 py-0 border-none shadow-none",
                            currentAnswer.earnedScore > 0 ? "bg-emerald-500/10 text-emerald-700" :
                            currentAnswer.earnedScore < 0 ? "bg-rose-500/10 text-rose-700" :
                            "bg-slate-200/50 text-slate-700"
                          )}>
                            {currentAnswer.earnedScore > 0 ? '+' : ''}{currentAnswer.earnedScore} Puan
                          </Badge>
                        )}
                        {currentAnswer.notApplicable && (
                          <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0 bg-slate-200/50 text-slate-500 border-none">Kapsam Dışı</Badge>
                        )}
                      </div>
                    </div>

                    {/* RIGHT: Segmented Options & Action Areas */}
                    <div className="md:w-7/12 flex flex-col gap-4">
                      
                      {/* Segmented Control Options */}
                      <div className="flex flex-wrap gap-1.5 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200/50 w-fit">
                        {template.scaleSet?.options?.map((opt: any) => {
                          const isSelected = currentAnswer.scaleOptionId === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleAnswerChange(item.id, opt.id, opt.multiplier)}
                              className={cn(
                                "relative px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ease-out",
                                isSelected 
                                  ? "shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] text-white" 
                                  : "text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-50 disabled:hover:bg-transparent"
                              )}
                              style={isSelected ? { backgroundColor: opt.color || '#3b82f6' } : {}}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                        
                        {/* Not Applicable Toggle */}
                        <button
                          onClick={() => handleAnswerChange(item.id, null, null)}
                          className={cn(
                            "px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ease-out",
                            currentAnswer.notApplicable
                              ? "bg-slate-700 text-white shadow-sm"
                              : "text-slate-500 hover:bg-white hover:text-slate-700"
                          )}
                        >
                          Kapsam Dışı
                        </button>
                      </div>
                      
                      {/* Note about extras being disabled in simulation */}
                      {selectedOption && !currentAnswer.notApplicable && (
                        <div className="text-[10px] text-slate-400 font-medium italic px-2">
                          * Önizleme modunda fotoğraf veya not eklenemez.
                        </div>
                      )}

                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* IMAGE PREVIEW MODAL */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl w-full p-1 bg-transparent border-none shadow-2xl">
          <img src={previewImage || ''} alt="Büyük Önizleme" className="w-full h-auto max-h-[85vh] object-contain rounded-xl" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
