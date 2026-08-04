import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, Upload } from 'lucide-react';
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
          {submission.status === 'TAMAMLANDI' ? (
            <>
              {user?.role === 'ADMIN' && (
                <Button variant="outline" onClick={() => handleSave('TASLAK')} className="border-amber-500 text-amber-600 hover:bg-amber-50">
                  Tesise Geri Gönder (Yeniden Aç)
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleSave('TASLAK')}>
                <Save className="w-4 h-4 mr-2" /> Kaydet
              </Button>
              <Button 
                onClick={() => handleSave('TAMAMLANDI')} 
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Onaya Gönder
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

      <div className="space-y-8">
        {template.sections.map((section: any) => (
          <div key={section.id} className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2 flex items-center gap-2">
              <span className="text-primary">📂</span> {section.title}
            </h2>
            
            {section.items.map((item: any) => {
              const currentAnswer = answers.find(a => a.itemId === item.id) || {};
              
              return (
                <Card key={item.id} className={currentAnswer.scaleOptionId ? 'border-primary/50' : ''}>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex gap-3">
                      <span className="font-bold text-muted-foreground">{item.itemNo}.</span>
                      <p className="text-sm font-medium flex-1">{item.questionText}</p>
                      <span className="text-xs font-semibold bg-secondary px-2 py-1 rounded h-fit">TW: {item.weight}</span>
                    </div>

                    <div className="pl-6 grid grid-cols-2 md:grid-cols-4 gap-2">
                      {template.scaleSet?.options?.map((s: any) => (
                        <Button
                          key={s.id}
                          type="button"
                          variant={currentAnswer.scaleOptionId === s.id ? 'default' : 'outline'}
                          className={`justify-start ${currentAnswer.scaleOptionId === s.id ? 'ring-2 ring-offset-1' : ''}`}
                          style={{
                            borderColor: s.color,
                            backgroundColor: currentAnswer.scaleOptionId === s.id ? s.color : 'transparent',
                            color: currentAnswer.scaleOptionId === s.id ? '#fff' : 'inherit'
                          }}
                          onClick={() => handleAnswerChange(item.id, s.id, s.multiplier)}
                          disabled={submission.status === 'TAMAMLANDI'}
                        >
                          {s.label}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant={currentAnswer.notApplicable ? 'default' : 'outline'}
                        className={`justify-start ${currentAnswer.notApplicable ? 'ring-2 ring-offset-1 bg-slate-500 hover:bg-slate-600 text-white border-slate-500' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                        onClick={() => handleAnswerChange(item.id, null, null)}
                        disabled={submission.status === 'TAMAMLANDI'}
                      >
                        Kapsam Dışı
                      </Button>
                    </div>

                    <div className="pl-6 space-y-4">
                      {(() => {
                        const selectedOption = template.scaleSet?.options?.find((o: any) => o.id === currentAnswer.scaleOptionId);
                        const requiresExplanation = selectedOption?.requiresExplanation;
                        const requiresAttachment = selectedOption?.requiresAttachment;

                        return (
                          <>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1 block">
                                Açıklama / Not {requiresExplanation && <span className="text-red-500">*</span>}
                              </Label>
                              <Textarea 
                                placeholder="Bu madde için not ekleyin..." 
                                className="min-h-[60px] text-sm"
                                value={currentAnswer.note || ''}
                                onChange={(e) => {
                                  const newAnswers = [...answers];
                                  const idx = newAnswers.findIndex(a => a.itemId === item.id);
                                  if (idx >= 0) {
                                    newAnswers[idx].note = e.target.value;
                                    setAnswers(newAnswers);
                                  }
                                }}
                                disabled={submission.status === 'TAMAMLANDI'}
                              />
                            </div>
                            
                            {(requiresAttachment || (currentAnswer.attachments && currentAnswer.attachments.length > 0) || currentAnswer.scaleOptionId) && (
                              <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">
                                  Dosyalar / Görseller (Maks 10) {requiresAttachment && <span className="text-red-500">*</span>}
                                </Label>
                                <div className="flex flex-col gap-2">
                                  <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*,.pdf,.doc,.docx"
                                    disabled={submission.status === 'TAMAMLANDI'}
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
                                        setAnswers(newAnswers);
                                      }
                                    }}
                                  />
                                  {currentAnswer.attachments && currentAnswer.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {currentAnswer.attachments.map((att: any, aIdx: number) => {
                                        const urlStr = typeof att === 'string' ? att : att.filePath;
                                        const fullUrl = urlStr?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${urlStr}` : urlStr;
                                        
                                        return (
                                          <div key={aIdx} className="relative border rounded p-1">
                                            <div 
                                              className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80"
                                              onClick={() => setPreviewImage(fullUrl)}
                                            >
                                              {fullUrl?.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                                <img src={fullUrl} alt="Eklenti" className="w-full h-full object-cover" />
                                              ) : (
                                                <span className="text-[10px] text-center break-all px-1">{urlStr?.split('/').pop()}</span>
                                              )}
                                            </div>
                                            {submission.status !== 'TAMAMLANDI' && (
                                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 absolute -top-2 -right-2 bg-red-500 text-white rounded-full hover:bg-red-600" onClick={(e) => {
                                                e.stopPropagation();
                                                const newAnswers = [...answers];
                                                const idx = newAnswers.findIndex(a => a.itemId === item.id);
                                                if (idx >= 0) {
                                                  newAnswers[idx].attachments = newAnswers[idx].attachments.filter((_: any, i: number) => i !== aIdx);
                                                  setAnswers(newAnswers);
                                                }
                                              }}>×</Button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}
      </div>
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
