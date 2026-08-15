import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { toast } from 'sonner';

export default function FireDoorInspectionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState<Record<string, { answer: string; comment?: string; photoUrl?: string }>>({});
  const [notes, setNotes] = useState('');

  const { data: door, isLoading: doorLoading } = useQuery({
    queryKey: ['fireDoor', id],
    queryFn: async () => {
      const res = await api.get(`/safety-management/fire-doors/doors/${id}`);
      return res.json();
    },
  });

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['fireDoorQuestionGroups'],
    queryFn: async () => {
      const res = await api.get('/safety-management/fire-doors/settings/question-groups');
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/safety-management/fire-doors/doors/${id}/inspections`, payload);
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Denetim kaydedildi. Harf Notu: ${data.grade}`);
      queryClient.invalidateQueries({ queryKey: ['fireDoor', id] });
      queryClient.invalidateQueries({ queryKey: ['fireDoorInspections', id] });
      navigate(`/safety-management/fire-doors/${id}`);
    },
    onError: () => {
      toast.error('Denetim kaydedilirken bir hata oluştu.');
    }
  });

  if (doorLoading || groupsLoading) return <div className="p-6">Yükleniyor...</div>;
  if (!door) return <div className="p-6">Kapı bulunamadı.</div>;

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
        ...prev,
        [questionId]: { ...prev[questionId], answer: value }
    }));
  };

  const handleCommentChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
        ...prev,
        [questionId]: { ...prev[questionId], comment: value }
    }));
  };

  const handleSubmit = () => {
    const items = Object.entries(answers).map(([questionId, data]) => ({
        questionId,
        answer: data.answer,
        comment: data.comment,
        photoUrl: data.photoUrl,
    }));

    if (items.length === 0) {
        toast.error('Lütfen en az bir soruyu yanıtlayın.');
        return;
    }

    submitMutation.mutate({ items, notes });
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yeni Denetim</h1>
          <p className="text-muted-foreground">
            Kapı: {door.doorNo || door.id}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {groups?.map((group: any) => (
            <Card key={group.id}>
                <CardHeader>
                    <CardTitle>{group.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {group.questions?.map((q: any) => (
                        <div key={q.id} className="p-4 border rounded-lg bg-slate-50/50">
                            <Label className="text-base font-semibold block mb-4">{q.text}</Label>
                            
                            <RadioGroup 
                                className="flex flex-col sm:flex-row gap-4 mb-4"
                                value={answers[q.id]?.answer}
                                onValueChange={(val) => handleAnswerChange(q.id, val)}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="PASS" id={`${q.id}-pass`} />
                                    <Label htmlFor={`${q.id}-pass`} className="text-green-700 font-medium">Karşılıyor</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="PARTIAL" id={`${q.id}-partial`} />
                                    <Label htmlFor={`${q.id}-partial`} className="text-yellow-700 font-medium">Kısmen Karşılıyor</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="FAIL" id={`${q.id}-fail`} />
                                    <Label htmlFor={`${q.id}-fail`} className="text-red-700 font-medium">Karşılamıyor</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="NA" id={`${q.id}-na`} />
                                    <Label htmlFor={`${q.id}-na`} className="text-slate-500 font-medium">Kapsam Dışı</Label>
                                </div>
                            </RadioGroup>

                            {/* Show comment box if they select something */}
                            {answers[q.id]?.answer && (
                                <div className="mt-4 space-y-2">
                                    <Label className="text-xs text-muted-foreground">
                                        Açıklama (Opsiyonel) {['PARTIAL', 'FAIL'].includes(answers[q.id]?.answer) ? '- Önerilir' : ''}
                                    </Label>
                                    <Textarea 
                                        placeholder="Gözlemleriniz..." 
                                        value={answers[q.id]?.comment || ''}
                                        onChange={(e) => handleCommentChange(q.id, e.target.value)}
                                        className="bg-white"
                                    />
                                    {/* Upload button can be added here later */}
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
        ))}

        <Card>
            <CardHeader>
                <CardTitle>Genel Değerlendirme</CardTitle>
            </CardHeader>
            <CardContent>
                <Label>Denetim Notları (Opsiyonel)</Label>
                <Textarea 
                    className="mt-2"
                    placeholder="Kapı ile ilgili genel notlar..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate(-1)}>İptal</Button>
            <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
                {submitMutation.isPending ? 'Kaydediliyor...' : 'Denetimi Tamamla'}
            </Button>
        </div>
      </div>
    </div>
  );
}
