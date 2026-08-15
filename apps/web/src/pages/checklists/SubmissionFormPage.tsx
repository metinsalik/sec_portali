import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, Upload, Send, XCircle, Activity, MessageSquare, Paperclip, ChevronRight, Info } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const getGradeAndColor = (percentScore: number | undefined | null) => {
  if (percentScore === undefined || percentScore === null || isNaN(percentScore)) return { grade: '-', color: 'text-slate-400 bg-slate-50' };
  if (percentScore >= 90) return { grade: 'A', color: 'text-emerald-700 bg-emerald-50' };
  if (percentScore >= 80) return { grade: 'B', color: 'text-blue-700 bg-blue-50' };
  if (percentScore >= 70) return { grade: 'C', color: 'text-amber-700 bg-amber-50' };
  if (percentScore >= 60) return { grade: 'D', color: 'text-orange-700 bg-orange-50' };
  if (percentScore >= 50) return { grade: 'E', color: 'text-rose-700 bg-rose-50' };
  return { grade: 'F', color: 'text-red-700 bg-red-100 font-bold' };
};

export default function SubmissionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [submission, setSubmission] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  
  // Track which questions have expanded their notes/attachments section
  const [expandedExtras, setExpandedExtras] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id && id !== 'new') {
      api.get(`/checklists/submissions/${id}`).then(async (res) => {
        const data = await res.json();
        setSubmission(data);
        if (data.answers) {
          setAnswers(data.answers);
        }
      }).catch(err => {
        console.error(err);
        toast.error('Denetim yüklenemedi.');
      });
    }
  }, [id]);

  const { earnedScore, maxScore, percentScore } = useMemo(() => {
    if (!submission?.template?.sections) return { earnedScore: 0, maxScore: 0, percentScore: 0 };
    let earned = 0;
    let max = 0;
    submission.template.sections.forEach((sec: any) => {
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
  }, [answers, submission]);

  if (id === 'new') return <div className="p-6 text-sm text-slate-500">Yeni denetim başlatma sayfası ayrı ele alınmaktadır...</div>;
  if (!submission) return <div className="flex h-[50vh] items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div></div>;

  const template = submission.template;
  const isViewMode = (submission.status === 'TAMAMLANDI' || submission.status === 'ONAY_BEKLIYOR' || submission.status === 'ONAYLANDI') && searchParams.get('mode') !== 'edit';
  const hasManagerRole = user?.role === 'admin' || user?.role === 'specialist' || user?.isAdmin;

  const handleAnswerChange = (itemId: string, scaleOptionId: string | null, multiplier: number | null) => {
    if (isViewMode) return;
    const item = template.sections.flatMap((s: any) => s.items).find((i: any) => i.id === itemId);
    const newAnswers = [...answers];
    const existingIdx = newAnswers.findIndex(a => a.itemId === itemId);
    const weight = Number(item.weight) || 0;
    const mult = Number(multiplier) || 0;
    const calculatedEarnedScore = multiplier !== null ? (weight * mult) : 0;

    const ans = { itemId, scaleOptionId, notApplicable: multiplier === null, earnedScore: calculatedEarnedScore };
    if (existingIdx >= 0) newAnswers[existingIdx] = { ...newAnswers[existingIdx], ...ans };
    else newAnswers.push(ans);
    setAnswers(newAnswers);
  };

  const validateSubmission = () => {
    const errors: string[] = [];
    template.sections.forEach((section: any) => {
      section.items.forEach((item: any) => {
        const currentAnswer = answers.find(a => a.itemId === item.id);
        if (!currentAnswer) { errors.push(`Soru yanıtlanmadı: ${item.itemNo}`); return; }
        if (currentAnswer.notApplicable) return;
        if (!currentAnswer.scaleOptionId) { errors.push(`Seçenek seçilmedi: ${item.itemNo}`); return; }
        
        const selectedOption = template.scaleSet?.options?.find((o: any) => o.id === currentAnswer.scaleOptionId);
        if (selectedOption?.requiresExplanation && (!currentAnswer.note || currentAnswer.note.trim() === '')) {
          errors.push(`Açıklama zorunlu: ${item.itemNo}`);
        }
        if (selectedOption?.requiresAttachment && (!currentAnswer.attachments || currentAnswer.attachments.length === 0)) {
          errors.push(`Görsel zorunlu: ${item.itemNo}`);
        }
      });
    });
    return { isValid: errors.length === 0, errors };
  };

  const handleSave = async (status: string) => {
    if (status === 'ONAY_BEKLIYOR' || status === 'TAMAMLANDI') {
      const validationResult = validateSubmission();
      if (!validationResult.isValid) {
        toast.error(`Eksik alanlar var:\n- ${validationResult.errors.join('\n- ')}`);
        return;
      }
    }
    try {
      await api.put(`/checklists/submissions/${id}`, { status, answers, totalScore: earnedScore, maxScore, percentScore });
      if (status === 'ONAY_BEKLIYOR') toast.success('Denetim onaya gönderildi!');
      else if (status === 'TAMAMLANDI') toast.success('Denetim onaylandı!');
      else toast.success('İlerleme kaydedildi.');
      navigate('/checklists/submissions');
    } catch (error) { toast.error('Hata oluştu.'); }
  };

  const toggleExtras = (itemId: string) => {
    setExpandedExtras(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      
      {/* COMPACT & GLASSY HEADER */}
      <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-slate-200/60 shadow-sm transition-all duration-300">
        <div className="container mx-auto max-w-5xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/checklists/submissions')} className="text-slate-400 hover:text-slate-900 transition-colors p-1 -ml-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none mb-1 line-clamp-1">{template.title}</h1>
              <p className="text-xs text-slate-500 font-medium">{submission.facility?.name} • {submission.conductedBy?.fullName || 'Bilinmiyor'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">İlerleme</span>
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
            <div className="hidden sm:flex items-center gap-2 border-l pl-6">
              {isViewMode ? (
                hasManagerRole && submission.status === 'ONAY_BEKLIYOR' ? (
                  <>
                    <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 h-8 text-xs font-semibold" onClick={() => handleSave('BEKLEYEN')}>Reddet</Button>
                    <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800 h-8 text-xs font-semibold" onClick={() => handleSave('TAMAMLANDI')}>Onayla</Button>
                  </>
                ) : (
                  hasManagerRole && <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate(`/checklists/submissions/${id}?mode=edit`)}>Düzenle</Button>
                )
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="text-slate-600 h-8 text-xs font-semibold" onClick={() => handleSave('BEKLEYEN')}>Taslak</Button>
                  <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700 h-8 text-xs font-semibold" onClick={() => handleSave('ONAY_BEKLIYOR')}>
                    <Send className="w-3.5 h-3.5 mr-1.5" /> Onaya Gönder
                  </Button>
                </>
              )}
            </div>
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
                const requiresExplanation = selectedOption?.requiresExplanation;
                const requiresAttachment = selectedOption?.requiresAttachment;
                
                // Has note or attachment currently?
                const hasNote = !!currentAnswer.note;
                const hasAttachment = currentAnswer.attachments && currentAnswer.attachments.length > 0;
                const shouldForceExpand = (requiresExplanation && !hasNote) || (requiresAttachment && !hasAttachment);
                // Eğer görüntüleme (View Mode) modundaysak notları ve resimleri açık bırak, rapor gibi görünsün.
                const isExpanded = expandedExtras[item.id] || shouldForceExpand || hasNote || hasAttachment || isViewMode;

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
                              disabled={isViewMode}
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
                          disabled={isViewMode}
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

                      {/* Small Actions Bar (Only if an option is selected and not N/A) */}
                      {!currentAnswer.notApplicable && currentAnswer.scaleOptionId && !isViewMode && (
                        <div className="flex items-center gap-3 mt-1">
                          <button
                            onClick={() => toggleExtras(item.id)}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors bg-white border px-2.5 py-1.5 rounded-md shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {hasNote || hasAttachment ? 'Notlar & Dosyalar' : 'Not veya Dosya Ekle'}
                            {(requiresExplanation || requiresAttachment) && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ml-1" />}
                          </button>
                        </div>
                      )}

                      {/* EXPANDABLE EXTRAS AREA (Notes & Images) */}
                      {!currentAnswer.notApplicable && currentAnswer.scaleOptionId && isExpanded && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 animate-in slide-in-from-top-2 fade-in-50 duration-200">
                          
                          {/* NOTE AREA */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              Değerlendirme Notu
                              {requiresExplanation && <span className="text-rose-500 lowercase font-normal tracking-normal">*Zorunlu</span>}
                            </label>
                            {isViewMode ? (
                              <div className="text-sm bg-white p-3 rounded-xl border border-slate-200 min-h-[80px] shadow-sm text-slate-700 leading-relaxed">
                                {currentAnswer.note || <span className="text-slate-400 italic">Not girilmemiş.</span>}
                              </div>
                            ) : (
                              <Textarea 
                                placeholder="İsteğe bağlı detaylı açıklama..."
                                className="bg-white border-slate-200 shadow-sm rounded-xl min-h-[80px] text-sm resize-none focus-visible:ring-1"
                                value={currentAnswer.note || ''}
                                onChange={(e) => {
                                  const newAnswers = [...answers];
                                  const idx = newAnswers.findIndex(a => a.itemId === item.id);
                                  if (idx >= 0) newAnswers[idx].note = e.target.value;
                                  setAnswers(newAnswers);
                                }}
                              />
                            )}
                          </div>

                          {/* ATTACHMENT AREA */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              Kanıt Dosyaları
                              {requiresAttachment && <span className="text-rose-500 lowercase font-normal tracking-normal">*Zorunlu</span>}
                            </label>
                            
                            <div className="flex flex-wrap gap-2">
                              {/* Upload Button */}
                              {!isViewMode && (
                                <label className="w-20 h-20 bg-white border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
                                  {isUploading[item.id] ? (
                                    <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                  ) : (
                                    <>
                                      <Upload className="w-5 h-5 mb-1" />
                                      <span className="text-[9px] font-medium">Yükle</span>
                                    </>
                                  )}
                                  <input 
                                    type="file" className="hidden" multiple accept="image/*"
                                    onChange={async (e) => {
                                      if (!e.target.files?.length) return;
                                      setIsUploading(prev => ({...prev, [item.id]: true}));
                                      const uploadedPaths = [];
                                      for (const file of Array.from(e.target.files).slice(0, 3)) {
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        try {
                                          const uploadRes = await api.customFetch('/checklists/submissions/upload', { method: 'POST', body: formData });
                                          if (uploadRes.ok) uploadedPaths.push((await uploadRes.json()).url);
                                        } catch (err) {}
                                      }
                                      setIsUploading(prev => ({...prev, [item.id]: false}));
                                      const newAnswers = [...answers];
                                      const idx = newAnswers.findIndex(a => a.itemId === item.id);
                                      if (idx >= 0) newAnswers[idx].attachments = [...(newAnswers[idx].attachments || []), ...uploadedPaths].slice(0, 10);
                                      setAnswers(newAnswers);
                                    }}
                                  />
                                </label>
                              )}

                              {/* Images */}
                              {currentAnswer.attachments?.map((att: any, aIdx: number) => {
                                const urlStr = typeof att === 'string' ? att : att.filePath;
                                const fullUrl = urlStr?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${urlStr}` : urlStr;
                                return (
                                  <div key={aIdx} className="relative group w-20 h-20 rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-slate-50 shrink-0">
                                    <img src={fullUrl} alt="Kanıt" className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" onClick={() => setPreviewImage(fullUrl)} />
                                    {!isViewMode && (
                                      <button 
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newAnswers = [...answers];
                                          const idx = newAnswers.findIndex(a => a.itemId === item.id);
                                          newAnswers[idx].attachments = newAnswers[idx].attachments.filter((_:any, i:number) => i !== aIdx);
                                          setAnswers(newAnswers);
                                        }}
                                      >
                                        &times;
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
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

      {/* MOBILE FLOATING ACTION BAR */}
      {!isViewMode && (
        <div className="fixed sm:hidden bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 flex gap-3">
          <Button variant="outline" className="flex-1 text-xs" onClick={() => handleSave('BEKLEYEN')}>Taslak</Button>
          <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs" onClick={() => handleSave('ONAY_BEKLIYOR')}>
             <Send className="w-3.5 h-3.5 mr-1.5" /> Onaya Gönder
          </Button>
        </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl w-full p-1 bg-transparent border-none shadow-2xl">
          <img src={previewImage || ''} alt="Büyük Önizleme" className="w-full h-auto max-h-[85vh] object-contain rounded-xl" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
