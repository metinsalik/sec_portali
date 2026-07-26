import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

export default function SubmissionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);

  useEffect(() => {
    if (id && id !== 'new') {
      api.get(`/checklists/submissions/${id}`).then(async (res) => {
        const data = await res.json();
        setSubmission(data);
        if (data.answers) {
          setAnswers(data.answers);
        }
      }).catch(err => console.error(err));
    }
  }, [id]);

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
    try {
      await api.put(`/checklists/submissions/${id}`, {
        status,
        answers,
        totalScore: earnedScore,
        maxScore,
        percentScore
      });
      navigate('/checklists/submissions');
    } catch (error) {
      console.error('Error saving submission', error);
      alert('Kaydedilirken hata oluştu.');
    }
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
          <Button variant="outline" onClick={() => handleSave('TASLAK')}>
            <Save className="w-4 h-4 mr-2" /> Taslak Kaydet
          </Button>
          <Button onClick={() => handleSave('TAMAMLANDI')} className="bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle className="w-4 h-4 mr-2" /> Denetimi Bitir
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4 sticky top-[88px] z-10 shadow-sm">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">İlerleme Skoru</span>
          <span className="font-bold">{earnedScore} / {maxScore} (%{percentScore.toFixed(1)})</span>
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
                        >
                          {s.label}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant={currentAnswer.notApplicable ? 'default' : 'outline'}
                        className={`justify-start ${currentAnswer.notApplicable ? 'ring-2 ring-offset-1 bg-slate-500 hover:bg-slate-600 text-white border-slate-500' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                        onClick={() => handleAnswerChange(item.id, null, null)}
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
                                    onChange={async (e) => {
                                      if (!e.target.files?.length) return;
                                      const files = Array.from(e.target.files).slice(0, 10);
                                      // Pseudo-upload for demonstration, assuming the API returns URLs
                                      // In real implementation, you'd upload them to `/upload` or similar.
                                      const uploadedPaths = files.map(f => URL.createObjectURL(f)); // MOCK URL

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
                                      {currentAnswer.attachments.map((att: any, aIdx: number) => (
                                        <div key={aIdx} className="relative border rounded p-1">
                                          <span className="text-xs">{typeof att === 'string' ? att.split('/').pop() : att.filePath?.split('/').pop()}</span>
                                          <Button variant="ghost" size="sm" className="h-4 w-4 p-0 absolute -top-2 -right-2 bg-red-500 text-white rounded-full" onClick={() => {
                                            const newAnswers = [...answers];
                                            const idx = newAnswers.findIndex(a => a.itemId === item.id);
                                            if (idx >= 0) {
                                              newAnswers[idx].attachments = newAnswers[idx].attachments.filter((_: any, i: number) => i !== aIdx);
                                              setAnswers(newAnswers);
                                            }
                                          }}>×</Button>
                                        </div>
                                      ))}
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
    </div>
  );
}
