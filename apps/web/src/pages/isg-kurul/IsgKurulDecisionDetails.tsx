import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Gavel, Calendar, Building, Tag, Flag, CheckCircle2, Clock, FileText, AlertCircle, MessageSquare, ChevronRight, Banknote, Plus, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const API = import.meta.env.VITE_API_URL || '';

const normalizePriority = (p: string) => {
  if (p === 'Kritik') return 'Tolere Gösterilmez Risk';
  if (p === 'Yüksek Riskli') return 'Yüksek Risk';
  if (p === 'Riskli') return 'Önemli Risk';
  if (p === 'Orta') return 'Olası Risk';
  if (p === 'Düşük') return 'Önemsiz Risk';
  return p || 'Belirtilmedi';
};

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

const getPriorityColor = (p: string) => {
  switch (p) {
    case 'Tolere Gösterilmez Risk': return 'bg-red-600 text-white border-red-700';
    case 'Yüksek Risk': return 'bg-red-400 text-white border-red-500';
    case 'Önemli Risk': return 'bg-orange-400 text-white border-orange-500';
    case 'Olası Risk': return 'bg-amber-400 text-white border-amber-500';
    case 'Önemsiz Risk': return 'bg-green-500 text-white border-green-600';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

export default function IsgKurulDecisionDetails() {
  const { id, decisionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');
  const { user } = useAuth();
  const isManager = user?.isManagement || user?.isAdmin || user?.roles?.some(r => ['management', 'admin', 'manager', 'yönetici'].includes(r.toLowerCase()));

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionText, setActionText] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [newPriority, setNewPriority] = useState<string>('');
  const [newBudget, setNewBudget] = useState<string>('');

  const [isReopenDialogOpen, setIsReopenDialogOpen] = useState(false);
  const [reopenText, setReopenText] = useState('');
  const [reopenStatus, setReopenStatus] = useState('Devam Ediyor');

  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editActionText, setEditActionText] = useState('');
  const [editStatus, setEditStatus] = useState<string>('');
  const [editPriority, setEditPriority] = useState<string>('');
  const [editBudget, setEditBudget] = useState<string>('');
  const [editDueDate, setEditDueDate] = useState<string>('');

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

  // Fetch Facilities to get the name
  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['settings-facilities'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/settings/facilities`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    }
  });

  // Create Action Mutation
  const addActionMutation = useMutation({
    mutationFn: async ({ decId, text, status, dueDate, priority }: { decId: string, text: string, status?: string, dueDate?: string, priority?: string }) => {
      const payload: any = { actionText: text };
      if (status) payload.newStatus = status;
      if (priority) payload.newPriority = priority;
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
      setIsDialogOpen(false);
      setIsReopenDialogOpen(false);
      setActionText('');
      setReopenText('');
      setNewStatus('');
      setNewDueDate('');
      setNewPriority('');
      setNewBudget('');
    }
  });

  const editActionMutation = useMutation({
    mutationFn: async ({ actionId, text, status, dueDate, priority, budget }: { actionId: string, text: string, status?: string, dueDate?: string, priority?: string, budget?: string }) => {
      const payload: any = { actionText: text };
      if (status) payload.newStatus = status;
      if (priority) payload.newPriority = priority;
      if (dueDate) {
        payload.newDueDate = dueDate;
        payload.newDueDateType = 'DATE';
      }

      const res = await fetch(`${API}/api/operations/board/actions/${actionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Aksiyon güncellenemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ohs-board-meeting-details', id] });
      toast.success('Aksiyon başarıyla güncellendi');
      setEditingActionId(null);
      setEditActionText('');
      setEditStatus('');
      setEditPriority('');
      setEditBudget('');
      setEditDueDate('');
    }
  });

  const deleteActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const res = await fetch(`${API}/api/operations/board/actions/${actionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Aksiyon silinemedi');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ohs-board-meeting-details', id] });
      toast.success('Aksiyon silindi');
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

  const facility = facilities.find((f: any) => f.id === meeting.facilityId);

  const latestBudget = (() => {
    if (!activeViewDecision.actions) return null;
    for (const a of activeViewDecision.actions) {
      const match = a.actionText.match(/\[Tahmini Bütçe:\s*(.*?)\]/);
      if (match) return match[1];
    }
    return null;
  })();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-full shrink-0 bg-white shadow-sm mt-1">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        
        <div className="flex-1 bg-white rounded-xl border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white border-transparent gap-1.5 py-1 px-3 shadow-sm text-xs font-semibold">
                  <Gavel className="w-3.5 h-3.5" />
                  İSG Kurul Kararı
                </Badge>
                {facility && (
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 gap-1.5 py-1 px-3 text-xs">
                    <Building className="w-3 h-3" />
                    {facility.shortName || facility.name}
                  </Badge>
                )}
                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 gap-1.5 py-1 px-3 text-xs">
                  <Calendar className="w-3 h-3" />
                  {new Date(meeting.meetingDate).toLocaleDateString('tr-TR')} Tarihli Toplantı
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Karar No: {activeViewDecision.decisionNumber}
                </h1>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Badge className={`border px-3 py-1 text-sm font-semibold shadow-sm ${getStatusColor(activeViewDecision.status)}`} variant="outline">
                {activeViewDecision.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <div className="bg-slate-50/50 border-b px-5 py-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-800">Karar İçeriği</h3>
            </div>
            <CardContent className="p-0">
              <div className="p-5">
                <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {activeViewDecision.decisionText}
                </div>
              </div>
              
              {activeViewDecision.remarks && (
                <div className="p-5 bg-amber-50/50 border-t border-amber-100">
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-2 text-amber-800">
                    <AlertCircle className="w-4 h-4" />
                    Değerlendirme & Açıklama
                  </h4>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-amber-900/90 pl-6 border-l-2 border-amber-300">
                    {activeViewDecision.remarks}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action History Timeline */}
          <Card className="shadow-sm border-slate-200">
            <div className="bg-slate-50/50 border-b px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <h3 className="font-semibold text-slate-800">Aksiyon Geçmişi ve Yorumlar</h3>
                <Badge variant="secondary" className="rounded-full bg-slate-200 text-slate-700 font-bold ml-1">{activeViewDecision.actions?.length || 0}</Badge>
              </div>
              {!['Tamamlandı', 'İptal Edildi'].includes(activeViewDecision.status) && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm rounded-full px-4">
                      <Plus className="w-4 h-4" />
                      Aksiyon / Güncelleme Ekle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-indigo-900">
                        <Send className="w-4 h-4 text-indigo-600" />
                        Yeni Aksiyon & Durum Güncellemesi
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Durum Güncelle (Opsiyonel)</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger className="bg-white border-slate-200 shadow-sm"><SelectValue placeholder="Değiştirme" /></SelectTrigger>
                          <SelectContent>
                            {['Başlamadı', 'Devam Ediyor', 'Tamamlandı', 'İptal Edildi', 'Sürekli Takip', 'Belirsiz'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Kritiklik (Opsiyonel)</Label>
                        <Select value={newPriority} onValueChange={setNewPriority}>
                          <SelectTrigger className="bg-white border-slate-200 shadow-sm"><SelectValue placeholder="Değiştirme" /></SelectTrigger>
                          <SelectContent>
                          {['Tolere Gösterilmez Risk', 'Yüksek Risk', 'Önemli Risk', 'Olası Risk', 'Önemsiz Risk'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Yeni Termin (Opsiyonel)</Label>
                        <Input type="date" className="bg-white border-slate-200 shadow-sm text-sm" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Tahmini Bütçe (Opsiyonel)</Label>
                        <Select value={newBudget} onValueChange={setNewBudget}>
                          <SelectTrigger className="bg-white border-slate-200 shadow-sm"><SelectValue placeholder="Belirtilmedi" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bütçe Gerektirmez">Bütçe Gerektirmez</SelectItem>
                            <SelectItem value="0 - 10.000 ₺">0 - 10.000 ₺</SelectItem>
                            <SelectItem value="10.000 - 50.000 ₺">10.000 - 50.000 ₺</SelectItem>
                            <SelectItem value="50.000 - 100.000 ₺">50.000 - 100.000 ₺</SelectItem>
                            <SelectItem value="100.000 - 250.000 ₺">100.000 - 250.000 ₺</SelectItem>
                            <SelectItem value="250.000 - 500.000 ₺">250.000 - 500.000 ₺</SelectItem>
                            <SelectItem value="500.000 ₺ ve Üzeri">500.000 ₺ ve Üzeri</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Aksiyon Notu (Zorunlu)</Label>
                      <Textarea 
                        placeholder="Yapılan çalışmaları, güncellemeleri veya notlarınızı buraya yazın..." 
                        value={actionText}
                        onChange={(e) => setActionText(e.target.value)}
                        className="bg-white resize-none h-28 border-slate-200 shadow-sm focus-visible:ring-indigo-500"
                      />
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button 
                        disabled={!actionText || addActionMutation.isPending}
                        onClick={() => {
                          const finalActionText = newBudget ? `[Tahmini Bütçe: ${newBudget}]\n\n${actionText}` : actionText;
                          addActionMutation.mutate({ 
                            decId: activeViewDecision.id, 
                            text: finalActionText, 
                            status: newStatus, 
                            dueDate: newDueDate,
                            priority: newPriority
                          });
                        }}
                        className="px-8 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm w-full sm:w-auto"
                      >
                        <Send className="w-4 h-4" /> 
                        <span>Gönder ve Kaydet</span>
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            <CardContent className="p-6">
              
              {activeViewDecision.status === 'Tamamlandı' && (
                <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-full shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-900">Bu Karar Tamamlandı</h4>
                      <p className="text-sm text-green-800 mt-1">
                        Tamamlanma Tarihi: <strong>{activeViewDecision.dueDate ? new Date(activeViewDecision.dueDate).toLocaleDateString('tr-TR') : 'Belirtilmedi'}</strong>
                      </p>
                    </div>
                  </div>
                  
                  {isManager && (
                    <Dialog open={isReopenDialogOpen} onOpenChange={setIsReopenDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="bg-white border-green-300 text-green-800 hover:bg-green-100 mt-3 sm:mt-0">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Kararı Yeniden Aç
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-amber-700 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Kararı Yeniden Aç
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">Yeni Durum</Label>
                            <Select value={reopenStatus} onValueChange={setReopenStatus}>
                              <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {['Devam Ediyor', 'Başlamadı', 'Sürekli Takip'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">Yeniden Açma Gerekçesi (Zorunlu)</Label>
                            <Textarea 
                              placeholder="Kararı neden tekrar açtığınızı belirtin..." 
                              value={reopenText}
                              onChange={(e) => setReopenText(e.target.value)}
                              className="bg-white resize-none h-28 focus-visible:ring-amber-500"
                            />
                          </div>
                          <div className="flex justify-end pt-2">
                            <Button 
                              disabled={!reopenText || addActionMutation.isPending}
                              onClick={() => {
                                addActionMutation.mutate({ 
                                  decId: activeViewDecision.id, 
                                  text: reopenText, 
                                  status: reopenStatus 
                                });
                              }}
                              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                            >
                              Kararı Aç ve Bildir
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              )}

              <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
                {activeViewDecision.actions?.length > 0 ? (
                  activeViewDecision.actions.map((action: any, idx: number) => {
                    const displayActionText = action.actionText.replace(/\[Tahmini Bütçe: .*?\]\n\n?/, '');
                    return (
                      <div key={action.id} className="relative">
                        <div className="absolute -left-[35px] bg-white border-2 border-indigo-100 rounded-full w-6 h-6 flex items-center justify-center top-0 shadow-sm">
                          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
                        </div>
                        
                        <div className="bg-white border rounded-lg shadow-sm overflow-hidden transition-shadow hover:shadow-md">
                          <div className="px-4 py-3 bg-slate-50/80 border-b flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700">{action.createdBy}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-500 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(action.createdAt).toLocaleString('tr-TR')}
                              </span>
                              
                              {/* Edit / Delete Buttons */}
                              {(action.createdBy === user?.fullName || action.createdBy === user?.username || isManager) && (
                                <div className="flex items-center gap-2 border-l pl-3 ml-1">
                                  <button onClick={() => {
                                      setEditingActionId(action.id);
                                      setEditActionText(action.actionText);
                                      // Extract budget from action text if it exists
                                      const budgetMatch = action.actionText.match(/\[Tahmini Bütçe: (.*?)\]/);
                                      if (budgetMatch) {
                                        setEditBudget(budgetMatch[1]);
                                        setEditActionText(action.actionText.replace(/\[Tahmini Bütçe: .*?\]\n\n/, ''));
                                      } else {
                                        setEditBudget('');
                                      }
                                      setEditStatus('');
                                      setEditPriority('');
                                      setEditDueDate('');
                                  }} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Düzenle">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => {
                                      if(window.confirm('Bu aksiyonu silmek istediğinize emin misiniz?')) {
                                          deleteActionMutation.mutate(action.id);
                                      }
                                  }} className="text-slate-400 hover:text-red-600 transition-colors" title="Sil">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {editingActionId === action.id ? (
                               <div className="space-y-4 p-4 border border-indigo-100 rounded-lg bg-indigo-50/30">
                                 <h4 className="text-sm font-semibold text-indigo-900 mb-2">Aksiyonu Düzenle</h4>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   <div className="space-y-1.5">
                                     <Label className="text-xs font-semibold text-slate-600">Durum Güncelle (Opsiyonel)</Label>
                                     <Select value={editStatus} onValueChange={setEditStatus}>
                                       <SelectTrigger className="bg-white"><SelectValue placeholder="Değiştirme" /></SelectTrigger>
                                       <SelectContent>
                                         {['Başlamadı', 'Devam Ediyor', 'Tamamlandı', 'İptal Edildi', 'Sürekli Takip', 'Belirsiz'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                       </SelectContent>
                                     </Select>
                                   </div>
                                   <div className="space-y-1.5">
                                     <Label className="text-xs font-semibold text-slate-600">Öncelik (Opsiyonel)</Label>
                                     <Select value={editPriority} onValueChange={setEditPriority}>
                                       <SelectTrigger className="bg-white"><SelectValue placeholder="Değiştirme" /></SelectTrigger>
                                       <SelectContent>
                                         {['Tolere Gösterilmez Risk', 'Yüksek Risk', 'Önemli Risk', 'Olası Risk', 'Önemsiz Risk'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                       </SelectContent>
                                     </Select>
                                   </div>
                                   <div className="space-y-1.5">
                                     <Label className="text-xs font-semibold text-slate-600">Tahmini Bütçe (Opsiyonel)</Label>
                                     <Select value={editBudget} onValueChange={setEditBudget}>
                                       <SelectTrigger className="bg-white"><SelectValue placeholder="Belirtilmedi" /></SelectTrigger>
                                       <SelectContent>
                                         {['Masrafsız', 'Düşük (0 - 5.000 TL)', 'Orta (5.000 - 20.000 TL)', 'Yüksek (20.000 - 50.000 TL)', 'Çok Yüksek (50.000 TL+)'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                       </SelectContent>
                                     </Select>
                                   </div>
                                   <div className="space-y-1.5">
                                     <Label className="text-xs font-semibold text-slate-600">Yeni Termin (Opsiyonel)</Label>
                                     <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="bg-white" />
                                   </div>
                                 </div>
                                 <div className="space-y-1.5">
                                   <Label className="text-xs font-semibold text-slate-600">Aksiyon Notu (Zorunlu)</Label>
                                   <Textarea 
                                     value={editActionText} 
                                     onChange={(e) => setEditActionText(e.target.value)} 
                                     className="min-h-[100px] text-sm bg-white" 
                                   />
                                 </div>
                                 <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="outline" size="sm" onClick={() => setEditingActionId(null)}>İptal</Button>
                                    <Button 
                                      size="sm" 
                                      onClick={() => {
                                        const finalActionText = editBudget ? `[Tahmini Bütçe: ${editBudget}]\n\n${editActionText}` : editActionText;
                                        editActionMutation.mutate({ 
                                          actionId: action.id, 
                                          text: finalActionText,
                                          status: editStatus,
                                          priority: editPriority,
                                          budget: editBudget,
                                          dueDate: editDueDate
                                        });
                                      }} 
                                      disabled={editActionMutation.isPending || !editActionText.trim()}
                                    >
                                      Kaydet
                                    </Button>
                                 </div>
                               </div>
                            ) : (
                                displayActionText
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-muted-foreground text-sm flex flex-col items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-slate-200" />
                    <p>Bu karar için henüz aksiyon veya açıklama girilmemiş.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Meta Data Grid */}
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200 sticky top-6">
            <CardHeader className="bg-slate-50/50 border-b px-5 py-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-500" />
                Karar Özellikleri
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                
                {latestBudget && (
                  <div className="p-4 hover:bg-slate-50/50 transition-colors bg-green-50/30">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Tahmini Bütçe</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 gap-1.5 px-2.5 py-1 text-sm font-bold shadow-sm">
                      <Banknote className="w-4 h-4" />
                      {latestBudget}
                    </Badge>
                  </div>
                )}

                <div className="p-4 hover:bg-slate-50/50 transition-colors">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Sorumlu Departman</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <Building className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-semibold text-sm text-slate-700">{activeViewDecision.department?.name}</span>
                  </div>
                </div>
                
                <div className="p-4 hover:bg-slate-50/50 transition-colors">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Kategori</span>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm text-slate-800">{activeViewDecision.category?.name}</span>
                    {activeViewDecision.subCategory && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" />
                        {activeViewDecision.subCategory.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 hover:bg-slate-50/50 transition-colors">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Kritiklik Seviyesi</span>
                  <Badge className={`border px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(normalizePriority(activeViewDecision.priority))}`} variant="outline">
                    <Flag className="w-3 h-3 mr-1.5 inline-block" />
                    {normalizePriority(activeViewDecision.priority)}
                  </Badge>
                </div>

                <div className="p-4 hover:bg-slate-50/50 transition-colors">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Termin Bilgisi</span>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded w-max">
                      {activeViewDecision.dueDateType === 'DATE' ? 'Belirli Tarih' : 'Periyodik Takip'}
                    </span>
                    {activeViewDecision.dueDateType === 'DATE' ? (
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {activeViewDecision.dueDate ? new Date(activeViewDecision.dueDate).toLocaleDateString('tr-TR') : 'Termin atanmamış'}
                      </span>
                    ) : (
                      <span className="font-bold text-slate-700">{activeViewDecision.periodicity || '-'}</span>
                    )}
                  </div>
                </div>
                
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
