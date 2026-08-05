import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, Upload, FileText } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';

const getGradeAndColor = (percentScore: number | undefined | null) => {
  if (percentScore === undefined || percentScore === null) return { grade: '-', color: 'text-gray-500 bg-gray-50' };
  if (percentScore >= 90) return { grade: 'A', color: 'text-emerald-700 bg-emerald-100 border border-emerald-200' };
  if (percentScore >= 80) return { grade: 'B', color: 'text-blue-700 bg-blue-100 border border-blue-200' };
  if (percentScore >= 70) return { grade: 'C', color: 'text-yellow-700 bg-yellow-100 border border-yellow-200' };
  if (percentScore >= 60) return { grade: 'D', color: 'text-orange-700 bg-orange-100 border border-orange-200' };
  if (percentScore >= 50) return { grade: 'E', color: 'text-red-700 bg-red-100 border border-red-200' };
  return { grade: 'F', color: 'text-red-900 bg-red-200 border border-red-300 font-bold' };
};

export default function SubmissionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [submission, setSubmission] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [templates, setTemplates] = useState<any[]>([]);
  const [setupData, setSetupData] = useState({ 
    templateId: new URLSearchParams(window.location.search).get('templateId') || '', 
    auditDate: new Date().toISOString().split('T')[0] 
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (id === 'new') {
      api.get('/checklists/templates').then(async (res) => {
        const data = await res.json();
        setTemplates(data.filter((t: any) => t.status === 'YAYINDA' || t.isActive !== false));
      }).catch(err => console.error(err));
    } else if (id) {
      api.get(`/checklists/submissions/${id}`).then(async (res) => {
        const data = await res.json();
        setSubmission(data);
        if (data.answers) {
          setAnswers(data.answers);
        }
      }).catch(err => console.error(err));
    }
  }, [id]);

  const handleCreateSubmission = async () => {
    if (!setupData.templateId) {
      toast.error('Lütfen bir kontrol listesi seçin.');
      return;
    }
    setIsCreating(true);
    try {
      const payload = {
        templateId: setupData.templateId,
        facilityId: user?.facilityId,
        auditDate: setupData.auditDate,
        auditTimeStart: '08:00',
        auditTimeEnd: '17:00',
        auditTeam: []
      };
      const response = await api.post('/checklists/submissions', payload);
      const data = await response.json();
      navigate(`/checklists/submissions/${data.id}`, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error('Oluşturulamadı.');
    } finally {
      setIsCreating(false);
    }
  };

  if (id === 'new') {
    return (
      <div className="container mx-auto p-6 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Yeni Denetim Başlat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Kontrol Listesi Şablonu</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={setupData.templateId}
                onChange={e => setSetupData({...setupData, templateId: e.target.value})}
              >
                <option value="">Şablon Seçiniz...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Denetim Tarihi</Label>
              <input 
                type="date"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={setupData.auditDate}
                onChange={e => setSetupData({...setupData, auditDate: e.target.value})}
              />
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate(-1)}>İptal</Button>
              <Button onClick={handleCreateSubmission} disabled={isCreating}>
                {isCreating ? 'Başlatılıyor...' : 'Başlat'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!submission) return <div className="p-6">Yükleniyor...</div>;

  const template = submission.template;

  const isViewMode = submission.status === 'TAMAMLANDI' && searchParams.get('mode') !== 'edit';
  
  // Calculate score
  let earnedScore = 0;
  let maxScore = 0;

  answers.forEach(a => {
    if (a.notApplicable) return; // Skip NA
    if (a.earnedScore) earnedScore += a.earnedScore;
    const item = template.sections.flatMap((s: any) => s.items).find((i: any) => i.id === a.itemId);
    if (item) maxScore += item.weight;
  });

  const percentScore = maxScore > 0 ? (earnedScore / maxScore) * 100 : 0;

  const handleAnswerChange = (itemId: string, scaleOptionId: string | null, multiplier: number | null) => {
    const item = template.sections.flatMap((s: any) => s.items).find((i: any) => i.id === itemId);
    const newAnswers = [...answers];
    const existingIdx = newAnswers.findIndex(a => a.itemId === itemId);
    
    const ans = {
      itemId,
      scaleOptionId,
      notApplicable: multiplier === null,
      earnedScore: multiplier !== null ? (item.weight * multiplier) : 0
    };

    if (existingIdx >= 0) {
      newAnswers[existingIdx] = { ...newAnswers[existingIdx], ...ans };
    } else {
      newAnswers.push(ans);
    }
    setAnswers(newAnswers);
  };

  const handleSave = async (status: string) => {
    if (status === 'TAMAMLANDI') {
      const validationResult = validateSubmission();
      if (!validationResult.isValid) {
        toast.error(`Eksik alanlar var:\n${validationResult.errors.join('\n')}`);
        return;
      }
    }
    
    try {
      await api.put(`/checklists/submissions/${id}`, {
        status,
        answers,
        totalScore: earnedScore,
        maxScore,
        percentScore
      });
      toast.success(status === 'TAMAMLANDI' ? 'Denetim onaya gönderildi!' : 'İlerleme kaydedildi.');
      navigate('/checklists/submissions');
    } catch (error) {
      console.error('Error saving submission', error);
      toast.error('Kaydedilirken hata oluştu.');
    }
  };

  // Validation Logic
  const validateSubmission = () => {
    const errors: string[] = [];
    template.sections.forEach((section: any) => {
      section.items.forEach((item: any) => {
        const currentAnswer = answers.find(a => a.itemId === item.id);
        if (!currentAnswer) {
          errors.push(`- Soru yanıtlanmadı: Soru No ${item.itemNo}`);
          return;
        }
        if (currentAnswer.notApplicable) return;
        if (!currentAnswer.scaleOptionId) {
          errors.push(`- Seçenek seçilmedi: Soru No ${item.itemNo}`);
          return;
        }
        
        const selectedOption = template.scaleSet?.options?.find((o: any) => o.id === currentAnswer.scaleOptionId);
        if (selectedOption?.requiresExplanation && (!currentAnswer.note || currentAnswer.note.trim() === '')) {
          errors.push(`- Açıklama zorunlu: Soru No ${item.itemNo}`);
        }
        if (selectedOption?.requiresAttachment && (!currentAnswer.attachments || currentAnswer.attachments.length === 0)) {
          errors.push(`- Ek dosya/görsel zorunlu: Soru No ${item.itemNo}`);
        }
      });
    });
    return { isValid: errors.length === 0, errors };
  };

  const getOptionStats = () => {
    const stats: Record<string, { count: number; color: string; label: string; id: string | null }> = {};
    
    template.scaleSet?.options?.forEach((opt: any) => {
      stats[opt.id] = { count: 0, color: opt.color, label: opt.label, id: opt.id };
    });
    stats['na'] = { count: 0, color: '#64748b', label: 'Kapsam Dışı', id: 'na' };
    stats['unanswered'] = { count: 0, color: '#94a3b8', label: 'Yanıtlanmamış', id: 'unanswered' };

    template.sections.forEach((sec: any) => {
      sec.items.forEach((item: any) => {
        const ans = answers.find(a => a.itemId === item.id);
        if (!ans) {
          stats['unanswered'].count++;
        } else if (ans.notApplicable) {
          stats['na'].count++;
        } else if (ans.scaleOptionId && stats[ans.scaleOptionId]) {
          stats[ans.scaleOptionId].count++;
        } else {
          stats['unanswered'].count++;
        }
      });
    });

    return Object.values(stats).filter(s => s.count > 0 || (s.id !== 'unanswered' && s.id !== 'na'));
  };

  const getGroupedItems = () => {
    const groupedItems: Record<string, any[]> = {};
    template.scaleSet?.options?.forEach((opt: any) => { groupedItems[opt.id] = []; });
    groupedItems['na'] = [];
    groupedItems['unanswered'] = [];

    template.sections.forEach((sec: any) => {
      sec.items.forEach((item: any) => {
        const ans = answers.find(a => a.itemId === item.id);
        const itemWithSec = { ...item, sectionTitle: sec.title };
        if (!ans) {
          groupedItems['unanswered'].push(itemWithSec);
        } else if (ans.notApplicable) {
          groupedItems['na'].push(itemWithSec);
        } else if (ans.scaleOptionId && groupedItems[ans.scaleOptionId]) {
          groupedItems[ans.scaleOptionId].push(itemWithSec);
        } else {
           groupedItems['unanswered'].push(itemWithSec);
        }
      });
    });
    return groupedItems;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex justify-between items-center sticky top-0 bg-background/95 backdrop-blur py-4 z-10 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/checklists/submissions')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{template.title}</h1>
            <p className="text-sm text-muted-foreground">Tesis: {submission.facility?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isViewMode ? (
            <Button onClick={() => navigate(`/checklists/submissions/${id}?mode=edit`)} className="bg-blue-600 hover:bg-blue-700">
              Düzenle
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleSave('TASLAK')}>
                <Save className="w-4 h-4 mr-2" /> Kaydet
              </Button>
              <Button 
                onClick={() => handleSave('TAMAMLANDI')} 
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Onayla & Tamamla
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4 sticky top-[88px] z-10 shadow-sm flex flex-col gap-2">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">İlerleme Skoru</span>
          <div className="flex items-center gap-4">
            <span className="font-bold">{earnedScore} / {maxScore} (%{percentScore.toFixed(1)})</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getGradeAndColor(percentScore).color}`}>
              Harf Notu: {getGradeAndColor(percentScore).grade}
            </span>
          </div>
        </div>
        <Progress value={percentScore} className="h-2" />
      </div>

      {isViewMode ? (
        <div className="space-y-8">
          {/* Executive Summary Header */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Denetim Sonuç Raporu</h1>
              <p className="text-sm text-slate-500 mt-1">Bu formun doldurulma özetini aşağıda inceleyebilirsiniz.</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {getOptionStats().map(stat => (
                <div key={stat.id} className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 min-w-[100px]">
                  <span className="text-2xl font-semibold text-slate-800 dark:text-slate-200">{stat.count}</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grouped Items List */}
          <div className="space-y-8">
            {Object.entries(getGroupedItems()).map(([optId, items]) => {
              if (items.length === 0) return null;
              const stat = getOptionStats().find(s => s.id === optId);
              return (
                <div key={optId} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stat?.color || '#94a3b8' }} />
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                      {stat?.label}
                    </h2>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full font-medium ml-2">
                      {items.length}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {items.map(item => {
                      const currentAnswer = answers.find(a => a.itemId === item.id) || {};
                      
                      return (
                        <div key={item.id} className="group relative bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-800/60 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col lg:flex-row gap-6">
                          {/* Left Accent Bar */}
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300" style={{ backgroundColor: stat?.color || '#94a3b8' }} />
                          
                          {/* Left Side: Question */}
                          <div className="flex-1 lg:w-1/2 flex gap-4 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 pb-6 lg:pb-0 lg:pr-6">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-500 shrink-0 mt-0.5">
                              {item.itemNo}
                            </div>
                            <div className="flex-1">
                              <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                                {item.sectionTitle}
                              </div>
                              <p className="text-lg font-semibold leading-relaxed text-slate-800 dark:text-slate-200">
                                {item.questionText}
                              </p>
                              {item.config?.description && (
                                <div className="mt-3 flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100/50 dark:border-blue-900/30">
                                  <div className="shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs mt-0.5">i</div>
                                  <p className="leading-relaxed">{item.config.description}</p>
                                </div>
                              )}
                              {item.config?.imageUrl && (
                                <div className="mt-3">
                                  <img 
                                    src={item.config.imageUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${item.config.imageUrl}` : item.config.imageUrl} 
                                    alt="Soru Görseli" 
                                    className="rounded-lg max-h-48 object-cover border border-slate-200 dark:border-slate-800 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                                    onClick={() => setPreviewImage(item.config.imageUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${item.config.imageUrl}` : item.config.imageUrl)}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Right Side: Answer, Notes, Photos */}
                          <div className="flex-1 lg:w-1/2 flex flex-col gap-5">
                            {/* Answer Badge & Score */}
                            <div className="flex items-center justify-between">
                              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm" style={{ borderColor: `${stat?.color}40`, backgroundColor: `${stat?.color}10` }}>
                                <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: stat?.color }} />
                                <span className="text-sm font-bold" style={{ color: stat?.color }}>{stat?.label}</span>
                              </div>
                              {currentAnswer.earnedScore !== undefined && (
                                <div className="text-sm font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-lg">
                                  Skor: <span className="text-slate-700 dark:text-slate-300">{currentAnswer.earnedScore}</span>
                                </div>
                              )}
                            </div>

                            {/* Note Box */}
                            {currentAnswer.note && (
                              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 p-4 rounded-xl relative mt-2">
                                <div className="absolute -top-3 left-4 bg-white dark:bg-slate-950 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
                                  Açıklama
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap pt-2 text-sm leading-relaxed">
                                  {currentAnswer.note}
                                </p>
                              </div>
                            )}

                            {/* Attachments Gallery */}
                            {currentAnswer.attachments && currentAnswer.attachments.length > 0 && (
                              <div className="pt-2">
                                {(() => {
                                  const images = currentAnswer.attachments.filter((att: any) => {
                                    const url = typeof att === 'string' ? att : att.filePath;
                                    return url?.match(/\.(jpeg|jpg|gif|png)$/i);
                                  });
                                  const docs = currentAnswer.attachments.filter((att: any) => {
                                    const url = typeof att === 'string' ? att : att.filePath;
                                    return !url?.match(/\.(jpeg|jpg|gif|png)$/i);
                                  });

                                  return (
                                    <div className="flex flex-col gap-3">
                                      {images.length > 0 && (
                                        <div className="flex flex-wrap gap-3">
                                          {images.map((img: any, idx: number) => {
                                            const urlStr = typeof img === 'string' ? img : img.filePath;
                                            const fullUrl = urlStr?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${urlStr}` : urlStr;
                                            return (
                                              <div 
                                                key={idx}
                                                className="group/img relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
                                                onClick={() => setPreviewImage(fullUrl)}
                                              >
                                                <img src={fullUrl} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" alt="Görsel" />
                                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                                  <span className="opacity-0 group-hover/img:opacity-100 text-white font-bold bg-black/60 px-2 py-1 rounded text-xs backdrop-blur-sm transition-opacity duration-300">Büyüt</span>
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}

                                      {docs.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {docs.map((doc: any, idx: number) => {
                                            const urlStr = typeof doc === 'string' ? doc : doc.filePath;
                                            const fullUrl = urlStr?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${urlStr}` : urlStr;
                                            return (
                                              <a 
                                                key={idx}
                                                href={fullUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-primary/50 hover:shadow-sm hover:text-primary transition-all duration-300"
                                              >
                                                <FileText className="w-4 h-4" />
                                                <span className="truncate max-w-[200px]">{urlStr.split('/').pop()}</span>
                                              </a>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
        {template.sections.map((section: any) => (
          <div key={section.id} className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2 flex items-center gap-2">
              <span className="text-primary">📂</span> {section.title}
            </h2>
            
            {section.items.map((item: any) => {
              const currentAnswer = answers.find(a => a.itemId === item.id) || {};
              const selectedOption = template.scaleSet?.options?.find((o: any) => o.id === currentAnswer.scaleOptionId);
              const requiresExplanation = selectedOption?.requiresExplanation;
              const requiresAttachment = selectedOption?.requiresAttachment;

              if (isViewMode) {
                return (
                  <div key={item.id} className="border rounded-xl p-5 bg-white dark:bg-slate-950 shadow-sm relative overflow-hidden">
                    {/* Left Border Accent based on selected option color */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: selectedOption?.color || (currentAnswer.notApplicable ? '#64748b' : '#e2e8f0') }} />
                    
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <span className="font-bold text-muted-foreground mt-0.5 min-w-[24px]">{item.itemNo}.</span>
                          <p className="text-base font-medium leading-relaxed">{item.questionText}</p>
                        </div>
                        
                        <div className="mt-4 pl-9 space-y-4">
                          {currentAnswer.note && (
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl relative">
                              <span className="absolute -top-2.5 left-4 bg-slate-50 dark:bg-slate-900 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-slate-200 dark:border-slate-800 rounded-full">Açıklama / Not</span>
                              <p className="text-sm text-foreground whitespace-pre-wrap pt-1">{currentAnswer.note}</p>
                            </div>
                          )}

                          {currentAnswer.attachments && currentAnswer.attachments.length > 0 && (
                            <div className="pt-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Ekler / Görseller</span>
                              <div className="flex flex-wrap gap-3">
                                {currentAnswer.attachments.map((att: any, aIdx: number) => {
                                  const urlStr = typeof att === 'string' ? att : att.filePath;
                                  const fullUrl = urlStr?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${urlStr}` : urlStr;
                                  const isImage = fullUrl?.match(/\.(jpeg|jpg|gif|png)$/i);
                                  
                                  return (
                                    <div 
                                      key={aIdx} 
                                      className="group relative w-20 h-20 md:w-24 md:h-24 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary transition-all shadow-sm"
                                      onClick={() => setPreviewImage(fullUrl)}
                                    >
                                      {isImage ? (
                                        <>
                                          <img src={fullUrl} alt="Eklenti" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        </>
                                      ) : (
                                        <div className="flex items-center justify-center h-full p-2">
                                          <span className="text-[10px] text-center break-all font-medium text-slate-600 dark:text-slate-300 line-clamp-3">
                                            {urlStr?.split('/').pop()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="md:w-[220px] shrink-0 flex flex-col items-end gap-2 md:pl-4 md:border-l border-slate-100 dark:border-slate-800">
                        {currentAnswer.notApplicable ? (
                          <div className="px-4 py-2 w-full text-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-slate-700">
                            Kapsam Dışı
                          </div>
                        ) : (
                          <div 
                            className="px-4 py-2 w-full text-center rounded-lg font-bold text-sm shadow-sm text-white" 
                            style={{ backgroundColor: selectedOption?.color || '#3b82f6' }}
                          >
                            {selectedOption?.label || 'Bilinmiyor'}
                          </div>
                        )}

                        {!currentAnswer.notApplicable && currentAnswer.earnedScore !== undefined && (
                          <div className="flex items-center justify-between w-full mt-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 border border-slate-100 dark:border-slate-800">
                            <span className="text-xs font-semibold text-muted-foreground">Puan:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {currentAnswer.earnedScore.toFixed(1)} / {item.weight}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // EDIT MODE UI
              return (
                <div key={item.id} className={`relative bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-sm border ${currentAnswer.scaleOptionId ? 'border-primary/40 shadow-primary/5' : 'border-slate-200/60 dark:border-slate-800/60'} hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col gap-6`}>
                  {/* Left Border Accent based on selected option color */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300" style={{ backgroundColor: selectedOption?.color || (currentAnswer.notApplicable ? '#64748b' : 'transparent') }} />
                  
                  <div className="flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-500 shrink-0 mt-0.5">
                      {item.itemNo}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-lg font-semibold leading-relaxed text-slate-800 dark:text-slate-200">
                        {item.questionText}
                      </p>
                      {item.config?.description && (
                        <div className="mt-3 flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100/50 dark:border-blue-900/30">
                          <div className="shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs mt-0.5">i</div>
                          <p className="leading-relaxed">{item.config.description}</p>
                        </div>
                      )}
                      {item.config?.imageUrl && (
                        <div className="mt-3">
                          <img 
                            src={item.config.imageUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${item.config.imageUrl}` : item.config.imageUrl} 
                            alt="Soru Görseli" 
                            className="rounded-lg max-h-48 object-cover border border-slate-200 dark:border-slate-800 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                            onClick={() => setPreviewImage(item.config.imageUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${item.config.imageUrl}` : item.config.imageUrl)}
                          />
                        </div>
                      )}
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>Ağırlık: {item.weight}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pl-14 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {template.scaleSet?.options?.map((s: any) => {
                      const isSelected = currentAnswer.scaleOptionId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 overflow-hidden ${isSelected ? 'shadow-sm transform scale-[1.02]' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                          style={{
                            borderColor: isSelected ? s.color : 'var(--border)',
                            backgroundColor: isSelected ? `${s.color}15` : 'transparent',
                          }}
                          onClick={() => handleAnswerChange(item.id, s.id, s.multiplier)}
                          disabled={isViewMode}
                        >
                          {isSelected && <div className="absolute inset-0 opacity-10" style={{ backgroundColor: s.color }} />}
                          <span className={`w-3 h-3 rounded-full shadow-sm transition-transform duration-200 ${isSelected ? 'scale-110' : 'scale-100'}`} style={{ backgroundColor: s.color }} />
                          <span className={`text-sm font-bold tracking-wide transition-colors ${isSelected ? '' : 'text-slate-600 dark:text-slate-400'}`} style={{ color: isSelected ? s.color : undefined }}>
                            {s.label}
                          </span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 overflow-hidden ${currentAnswer.notApplicable ? 'border-slate-500 bg-slate-500/10 shadow-sm transform scale-[1.02]' : 'border-border hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                      onClick={() => handleAnswerChange(item.id, null, null)}
                      disabled={isViewMode}
                    >
                      <span className={`w-3 h-3 rounded-full shadow-sm transition-transform duration-200 ${currentAnswer.notApplicable ? 'scale-110 bg-slate-600' : 'scale-100 bg-slate-300'}`} />
                      <span className={`text-sm font-bold tracking-wide transition-colors ${currentAnswer.notApplicable ? 'text-slate-700 dark:text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>
                        Kapsam Dışı
                      </span>
                    </button>
                  </div>

                  <div className="pl-14 flex flex-col gap-5 mt-2">
                    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 focus-within:border-primary/40 focus-within:bg-white dark:focus-within:bg-slate-950 transition-colors">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        Açıklama / Not {requiresExplanation && <span className="text-red-500 text-sm">*</span>}
                      </Label>
                      <Textarea 
                        placeholder="Bu madde için not ekleyin..." 
                        className="min-h-[80px] text-sm resize-y bg-transparent border-none shadow-none focus-visible:ring-0 p-0 placeholder:text-slate-400"
                        value={currentAnswer.note || ''}
                        onChange={(e) => {
                          const newAnswers = [...answers];
                          const idx = newAnswers.findIndex(a => a.itemId === item.id);
                          if (idx >= 0) {
                            newAnswers[idx].note = e.target.value;
                          } else {
                            newAnswers.push({
                              itemId: item.id,
                              scaleOptionId: null,
                              notApplicable: false,
                              earnedScore: 0,
                              note: e.target.value
                            });
                          }
                          setAnswers(newAnswers);
                        }}
                      />
                    </div>
                    
                    {(requiresAttachment || (currentAnswer.attachments && currentAnswer.attachments.length > 0) || currentAnswer.scaleOptionId) && (
                      <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 transition-colors">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          Dosyalar / Görseller {requiresAttachment && <span className="text-red-500 text-sm">*</span>}
                          <span className="text-[10px] font-medium text-slate-400 normal-case ml-auto">Maks 10 dosya</span>
                        </Label>
                        <div className="flex flex-col gap-4">
                          <label className="flex items-center justify-center w-full h-24 px-4 transition bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl appearance-none cursor-pointer hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900 focus:outline-none">
                            <span className="flex items-center space-x-2">
                              <Upload className="w-5 h-5 text-slate-400" />
                              <span className="font-medium text-slate-500">
                                {isUploading ? 'Yükleniyor...' : 'Dosyaları sürükleyin veya seçmek için tıklayın'}
                              </span>
                            </span>
                            <input 
                              type="file" 
                              className="hidden"
                              multiple 
                              accept="image/*,.pdf,.doc,.docx"
                              onChange={async (e) => {
                                if (!e.target.files?.length) return;
                                const files = Array.from(e.target.files).slice(0, 10);
                                setIsUploading(true);
                                const uploadedPaths = [];
                                for (const file of files) {
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  try {
                                    const uploadRes = await api.customFetch('/checklists/submissions/upload', {
                                      method: 'POST',
                                      body: formData
                                    });
                                    if (uploadRes.ok) {
                                      const { url } = await uploadRes.json();
                                      uploadedPaths.push(url);
                                    }
                                  } catch (err) {
                                    console.error('Upload failed', err);
                                  }
                                }
                                setIsUploading(false);

                                const newAnswers = [...answers];
                                const idx = newAnswers.findIndex(a => a.itemId === item.id);
                                if (idx >= 0) {
                                  newAnswers[idx].attachments = [...(newAnswers[idx].attachments || []), ...uploadedPaths].slice(0, 10);
                                } else {
                                  newAnswers.push({
                                    itemId: item.id,
                                    scaleOptionId: null,
                                    notApplicable: false,
                                    earnedScore: 0,
                                    attachments: uploadedPaths.slice(0, 10)
                                  });
                                }
                                setAnswers(newAnswers);
                              }}
                            />
                          </label>
                          {currentAnswer.attachments && currentAnswer.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-3">
                              {currentAnswer.attachments.map((att: any, aIdx: number) => {
                                const urlStr = typeof att === 'string' ? att : att.filePath;
                                const fullUrl = urlStr?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${urlStr}` : urlStr;
                                const isImage = fullUrl?.match(/\.(jpeg|jpg|gif|png)$/i);
                                
                                return (
                                  <div key={aIdx} className="group relative w-24 h-24 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div 
                                      className="w-full h-full flex items-center justify-center cursor-pointer"
                                      onClick={() => setPreviewImage(fullUrl)}
                                    >
                                      {isImage ? (
                                        <>
                                          <img src={fullUrl} alt="Eklenti" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                                        </>
                                      ) : (
                                        <div className="flex flex-col items-center justify-center p-2 text-slate-400 group-hover:text-primary transition-colors">
                                          <FileText className="w-6 h-6 mb-1" />
                                          <span className="text-[10px] text-center break-all font-medium line-clamp-2 px-1">{urlStr?.split('/').pop()}</span>
                                        </div>
                                      )}
                                    </div>
                                    <button 
                                      className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-white/90 dark:bg-slate-800/90 hover:bg-red-500 hover:text-white text-slate-600 rounded-full shadow-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 group-hover:scale-100 focus:outline-none" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newAnswers = [...answers];
                                        const idx = newAnswers.findIndex(a => a.itemId === item.id);
                                        if (idx >= 0) {
                                          newAnswers[idx].attachments = newAnswers[idx].attachments.filter((_: any, i: number) => i !== aIdx);
                                          setAnswers(newAnswers);
                                        }
                                      }}
                                    >
                                      <span className="text-sm leading-none font-bold">&times;</span>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      )}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl w-full h-[80vh] flex items-center justify-center p-0 border-none bg-black/90">
          {previewImage && previewImage.match(/\.(jpeg|jpg|gif|png)$/i) ? (
            <img src={previewImage} alt="Önizleme" className="max-w-full max-h-full object-contain" />
          ) : (
            <iframe src={previewImage || ''} className="w-full h-full bg-white" title="Önizleme" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
