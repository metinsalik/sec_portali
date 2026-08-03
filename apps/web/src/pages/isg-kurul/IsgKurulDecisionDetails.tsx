import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const API = import.meta.env.VITE_API_URL || '';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Tamamlandı': return 'bg-green-100 text-green-800 border-green-200';
    case 'Devam Ediyor': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Sürekli Takip': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'İptal Edildi': return 'bg-gray-200 text-gray-800 border-gray-300';
    case 'Başlamadı':
    case 'Belirsiz':
    default: return 'bg-amber-100 text-amber-800 border-amber-200';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Kritik': return 'bg-red-600 text-white border-red-700';
    case 'Yüksek Riskli': return 'bg-red-400 text-white border-red-500';
    case 'Riskli': return 'bg-orange-400 text-white border-orange-500';
    case 'Orta': return 'bg-amber-400 text-white border-amber-500';
    case 'Düşük': return 'bg-green-500 text-white border-green-600';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

export default function IsgKurulDecisionDetails() {
  const { id, decisionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');

  const [actionText, setActionText] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>('');

  // Fetch Meeting Details
  const { data: meeting, isLoading } = useQuery({
    queryKey: ['ohs-board-meeting-details', id],
    queryFn: async () => {
      const res = await fetch(`${API}/api/operations/board/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Toplantı detayları yüklenemedi');
      return res.json();
    },
    enabled: !!id
  });

  // Create Action Mutation
  const addActionMutation = useMutation({
    mutationFn: async ({ decId, text, status, dueDate }: { decId: string, text: string, status?: string, dueDate?: string }) => {
      const payload: any = { actionText: text };
      if (status) payload.newStatus = status;
      if (dueDate) {
        payload.newDueDate = dueDate;
        payload.newDueDateType = 'DATE';
      }

      const res = await fetch(`${API}/api/operations/board/decisions/${decId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Aksiyon eklenemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ohs-board-meeting-details', id] });
      toast.success('Aksiyon başarıyla eklendi');
      setActionText('');
      setNewStatus('');
      setNewDueDate('');
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!meeting) return <div className="p-6">Toplantı bulunamadı.</div>;

  const activeViewDecision = meeting.decisions?.find((d: any) => d.id === decisionId);

  if (!activeViewDecision) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-600 gap-2 hover:bg-slate-100">
          <ArrowLeft className="w-4 h-4" /> Geri
        </Button>
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            <p>Karar bulunamadı.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Karar No: {activeViewDecision.decisionNumber}</h1>
            <Badge className={`border ${getStatusColor(activeViewDecision.status)}`} variant="outline">
              {activeViewDecision.status}
            </Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg border">
            <div>
              <span className="text-xs text-muted-foreground block">Kategori</span>
              <span className="font-semibold text-sm">{activeViewDecision.category?.name}</span>
              {activeViewDecision.subCategory && <span className="block text-xs text-muted-foreground mt-1">↳ {activeViewDecision.subCategory.name}</span>}
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Sorumlu Departman</span>
              <span className="font-semibold text-sm">{activeViewDecision.department?.name}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Kritiklik Seviyesi</span>
              <Badge className={`mt-1 border ${getPriorityColor(activeViewDecision.priority)}`} variant="outline">
                {activeViewDecision.priority}
              </Badge>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Termin Tipi</span>
              <span className="font-semibold text-sm mb-1 block">{activeViewDecision.dueDateType === 'DATE' ? 'Belirli Tarih' : 'Periyodik'}</span>
              {activeViewDecision.dueDateType === 'DATE' ? (
                <span className="font-semibold text-sm">{activeViewDecision.dueDate ? new Date(activeViewDecision.dueDate).toLocaleDateString('tr-TR') : '-'}</span>
              ) : (
                <span className="font-semibold text-sm">{activeViewDecision.periodicity || '-'}</span>
              )}
            </div>
          </div>

          {/* Text Blocks */}
          <div>
            <h4 className="text-sm font-bold border-b pb-2 mb-3">Alınan Karar Metni</h4>
            <p className="text-sm leading-relaxed whitespace-pre-wrap bg-white p-4 border rounded-md">{activeViewDecision.decisionText}</p>
          </div>

          {activeViewDecision.remarks && (
            <div>
              <h4 className="text-sm font-bold border-b pb-2 mb-3">Sonuç / Açıklama / Değerlendirme</h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap bg-amber-50/50 p-4 border border-amber-100 rounded-md text-amber-900">{activeViewDecision.remarks}</p>
            </div>
          )}

          {/* Actions Section */}
          <div className="pt-6 border-t mt-8">
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              Aksiyon Geçmişi ve Yorumlar
              <Badge variant="secondary" className="rounded-full">{activeViewDecision.actions?.length || 0}</Badge>
            </h4>
            
            {/* Action List */}
            <div className="space-y-4 mb-6">
              {activeViewDecision.actions?.length > 0 ? (
                activeViewDecision.actions.map((action: any) => (
                  <div key={action.id} className="bg-slate-50 p-4 rounded-lg border flex flex-col gap-2">
                    <p className="text-sm whitespace-pre-wrap">{action.actionText}</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-2 pt-2 border-t border-slate-200 border-dashed">
                      <span className="font-medium text-primary">{action.createdBy}</span>
                      <span>{new Date(action.createdAt).toLocaleString('tr-TR')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground text-sm bg-slate-50/50">
                  Bu karar için henüz aksiyon veya açıklama girilmemiş.
                </div>
              )}
            </div>

            {/* Add Action Input */}
            {['Tamamlandı', 'İptal Edildi'].includes(activeViewDecision.status) ? (
              <div className="bg-slate-50 p-6 rounded-lg border mt-6 text-center text-muted-foreground border-dashed">
                Bu karar <strong>{activeViewDecision.status}</strong> durumunda olduğu için yeni aksiyon girişi veya durum güncellemesi yapılamaz. Karar kapatılmıştır.
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-lg border mt-6">
                <h5 className="font-semibold text-sm mb-3">Yeni Aksiyon / Durum Güncellemesi</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Yeni Durum (İsteğe Bağlı)</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Durum Seçin" /></SelectTrigger>
                      <SelectContent>
                        {['Başlamadı', 'Devam Ediyor', 'Tamamlandı', 'İptal Edildi', 'Sürekli Takip', 'Belirsiz'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Yeni Termin Tarihi (İsteğe Bağlı)</Label>
                    <Input type="date" className="bg-white" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Textarea 
                    placeholder="Bu karara yeni bir aksiyon notu ekleyin..." 
                    value={actionText}
                    onChange={(e) => setActionText(e.target.value)}
                    className="bg-white resize-none h-20"
                  />
                  <Button 
                    disabled={!actionText || addActionMutation.isPending}
                    onClick={() => addActionMutation.mutate({ decId: activeViewDecision.id, text: actionText, status: newStatus, dueDate: newDueDate })}
                    className="h-20 px-6 gap-2"
                  >
                    <Send className="w-4 h-4" /> Kaydet
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
