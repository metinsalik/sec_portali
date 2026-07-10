import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { 
  ArrowLeft, Clock, MessageSquare, AlertTriangle, CheckCircle2, 
  Loader2, Paperclip, CalendarIcon, UploadCloud, XCircle, Trash2, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDistanceToNow, isPast, differenceInSeconds } from 'date-fns';
import { tr } from 'date-fns/locale';

function ChecklistDescriptionEditor({ 
  initialValue, 
  onSave 
}: { 
  initialValue: string; 
  onSave: (val: string) => void;
}) {
  const [val, setVal] = useState(initialValue);
  const isChanged = val !== initialValue;

  return (
    <div className="flex flex-col gap-2">
      <Textarea 
        value={val} 
        onChange={(e) => setVal(e.target.value)}
        placeholder="Açıklama giriniz..." 
        className="min-h-[60px] bg-white" 
      />
      {isChanged && (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setVal(initialValue)}>İptal</Button>
          <Button size="sm" onClick={() => onSave(val)}>Güncelle</Button>
        </div>
      )}
    </div>
  );
}

const getActionTranslation = (action: string) => {
  const map: Record<string, string> = {
    'STATUS_CHANGE': 'Durum Değişikliği',
    'COMMENT_ADD': 'Yorum Eklendi',
    'EVIDENCE_ADD': 'Kanıt Eklendi',
    'STEP_ADD': 'Adım Eklendi',
    'STEP_UPDATE': 'Adım Güncellendi',
    'STEP_DELETE': 'Adım Silindi',
    'STEP_TOGGLE': 'Adım Durumu Değişti',
    'REJECT': 'Görev İade Edildi'
  };
  return map[action] || action;
};

const getStatusTranslation = (status: string) => {
  const map: Record<string, string> = {
    'TODO': 'Bekliyor',
    'DOING': 'Yapılıyor',
    'REVIEW': 'Kontrolde',
    'DONE': 'Tamamlandı',
    'BLOCKED': 'Bloke Edildi'
  };
  return map[status] || status;
};

const formatDetailText = (detail: string) => {
  if (!detail) return '';
  let formatted = detail;
  const statusRegex = /(TODO|DOING|REVIEW|DONE|BLOCKED)/g;
  formatted = formatted.replace(statusRegex, (match) => getStatusTranslation(match));
  return formatted;
};

export default function WorkflowTaskDetailsPage() {
  const { id: taskId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { openChat, isChatOpen, activeTaskId } = useChat();
  const [socket, setSocket] = useState<Socket | null>(null);

  // Modals state
  const [isDueRequestOpen, setIsDueRequestOpen] = useState(false);
  const [dueRequestData, setDueRequestData] = useState({ date: '', reason: '' });
  
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockNote, setBlockNote] = useState('');

  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null);
  const [uploadEvidenceData, setUploadEvidenceData] = useState<{ stepId: string; file: File | null; name: string } | null>(null);
  
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [stepEditData, setStepEditData] = useState({ text: '', requireEvidence: false, requireDescription: false });
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStepData, setNewStepData] = useState({ text: '', requireEvidence: false, requireDescription: false });

  
  // Timer state
  const [now, setNow] = useState(new Date());

  // Description edit state
  const [editingDescId, setEditingDescId] = useState<string | null>(null);
  const [descValue, setDescValue] = useState('');

  // Transfer state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');

  // Check if current task's chat is open globally
  const isThisTaskChatOpen = isChatOpen && activeTaskId === taskId;

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Task
  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['workflow-task', taskId],
    queryFn: async () => {
      const res = await api.get(`/workflow/tasks/${taskId}`);
      if (!res.ok) throw new Error('Görev yüklenemedi');
      return res.json();
    },
    enabled: !!taskId,
  });

  // Fetch workflow users for transfer
  const { data: workflowUsers } = useQuery({
    queryKey: ['workflow', 'users'],
    queryFn: async () => {
      const res = await api.get('/workflow/users');
      return res.json();
    }
  });

  const canTransfer = task && (user?.username === task.creatorId || user?.username === task.assigneeId || user?.workflowRole === 'ADMIN');

  useEffect(() => {
    if (!taskId) return;
    
    // Connect socket
    const newSocket = io(import.meta.env.VITE_API_URL || '', { path: '/socket.io' });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('joinTask', taskId);
    });

    newSocket.on('task_updated', (updatedTaskId) => {
      if (updatedTaskId === taskId) {
        queryClient.invalidateQueries({ queryKey: ['workflow-task', taskId] });
      }
    });

    return () => {
      newSocket.emit('leaveTask', taskId);
      newSocket.disconnect();
    };
  }, [taskId, queryClient]);

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Lütfen bir iade nedeni girin.');
      return;
    }
    try {
      await api.post(`/workflow/tasks/${taskId}/reject`, { reason: rejectReason, stepId: rejectStepId || undefined });
      queryClient.invalidateQueries({ queryKey: ['wf-task', taskId] });
      toast.success('Görev iade edildi.');
      setIsRejectModalOpen(false);
      setRejectReason('');
      setRejectStepId('');
    } catch (error: any) {
      toast.error('Görev iade edilirken hata oluştu: ' + error.message);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      const res = await api.patch(`/workflow/tasks/${taskId}/status`, { status });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Görev durumu güncellendi');
      queryClient.invalidateQueries({ queryKey: ['workflow-task', taskId] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDueRequest = async () => {
    if (!dueRequestData.date || !dueRequestData.reason) {
      toast.error('Lütfen yeni tarih ve gerekçe giriniz');
      return;
    }
    
    try {
      await api.post(`/workflow/tasks/${taskId}/due-requests`, {
        requestedDue: new Date(dueRequestData.date).toISOString(),
        reason: dueRequestData.reason
      });
      toast.success('Termin değişikliği talebi gönderildi');
      setIsDueRequestOpen(false);
      setDueRequestData({ date: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['workflow-task', taskId] });
    } catch (err: any) {
      toast.error('Hata: ' + (err.message || 'Bilinmeyen bir hata oluştu'));
    }
  };

  const handleTransferTask = async () => {
    if (!transferTargetId) {
      toast.error('Lütfen devredilecek kişiyi seçin');
      return;
    }
    try {
      await api.post(`/workflow/tasks/${taskId}/transfer`, {
        targetUserId: transferTargetId
      });
      toast.success('Görev devir talebi başarıyla gönderildi');
      setIsTransferModalOpen(false);
      setTransferTargetId('');
      queryClient.invalidateQueries({ queryKey: ['workflow-task', taskId] });
    } catch (err: any) {
      toast.error('Hata: ' + (err.message || 'Bilinmeyen hata'));
    }
  };

  const handleBlockNote = async () => {
    try {
      const res = await api.put(`/workflow/tasks/${taskId}`, { blockNote });
      if (!res.ok) throw new Error(await res.text());
      handleStatusChange('BLOCKED');
      toast.success('Engel bildirildi');
      setIsBlockModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleChecklistToggle = async (stepId: string, currentDone: boolean, requireEvidence: boolean, evidence: string | null) => {
    if (!currentDone && requireEvidence && !evidence) {
      toast.error('Bu adımı tamamlamak için önce kanıt yüklemelisiniz.');
      return;
    }
    
    try {
      const res = await api.patch(`/workflow/tasks/${taskId}/checklist/${stepId}`, {
        done: !currentDone,
      });
      if (!res.ok) throw new Error(await res.text());
      queryClient.invalidateQueries({ queryKey: ['workflow-task', taskId] });
    } catch (err: any) {
      toast.error('Adım güncellenemedi: ' + err.message);
    }
  };

  const handleSaveDescription = async (stepId: string, value: string) => {
    try {
      const res = await api.patch(`/workflow/tasks/${taskId}/checklist/${stepId}`, {
        description: value
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Açıklama kaydedildi');
      setEditingDescId(null);
      queryClient.invalidateQueries({ queryKey: ['workflow-task', taskId] });
    } catch (err: any) {
      toast.error('Açıklama kaydedilemedi: ' + err.message);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadEvidenceData || !uploadEvidenceData.file) return;
    const { stepId, file, name } = uploadEvidenceData;

    setUploadingStepId(stepId);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await api.customFetch(`/workflow/tasks/${taskId}/checklist/${stepId}/upload`, {
        method: 'POST',
        body: formData
      });
      if (!uploadRes.ok) throw new Error('Dosya yüklenemedi');
      const { url } = await uploadRes.json();

      const step = task.checklist?.find((s: any) => s.id === stepId);
      const existingEvs = step?.evidence ? step.evidence.split(',') : [];
      const existingNames = step?.evidenceName ? step.evidenceName.split(',') : [];
      existingEvs.push(url);
      existingNames.push(name || 'Kanıt');

      const updateRes = await api.patch(`/workflow/tasks/${taskId}/checklist/${stepId}`, {
        done: true,
        evidence: existingEvs.join(','),
        evidenceName: existingNames.join(',')
      });
      
      if (!updateRes.ok) throw new Error('Kanıt kaydedilemedi');
      toast.success('Kanıt başarıyla yüklendi');
      setUploadEvidenceData(null);
      queryClient.invalidateQueries({ queryKey: ['workflow-task', taskId] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingStepId(null);
    }
  };

  const handleAddStep = async () => {
    if (!newStepData.text) {
      toast.error('Adım metni zorunludur');
      return;
    }
    try {
      const res = await api.post(`/workflow/tasks/${taskId}/checklist`, newStepData);
      if (!res.ok) throw new Error(await res.text());
      toast.success('Adım eklendi');
      setIsAddingStep(false);
      setNewStepData({ text: '', requireEvidence: false, requireDescription: false });
      queryClient.invalidateQueries({ queryKey: ['workflow-task', taskId] });
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    }
  };

  const handleUpdateStepDefinition = async (stepId: string) => {
    if (!stepEditData.text) {
      toast.error('Adım metni zorunludur');
      return;
    }
    try {
      const res = await api.put(`/workflow/tasks/${taskId}/checklist/${stepId}`, stepEditData);
      if (!res.ok) throw new Error(await res.text());
      toast.success('Adım güncellendi');
      setEditingStep(null);
      queryClient.invalidateQueries({ queryKey: ['workflow-task', taskId] });
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Bu adımı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await api.customFetch(`/workflow/tasks/${taskId}/checklist/${stepId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Adım silindi');
      queryClient.invalidateQueries({ queryKey: ['workflow-task', taskId] });
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    }
  };


  if (taskLoading) {
    return <div className="p-6 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!task) {
    return <div className="p-6 text-red-500">Görev bulunamadı</div>;
  }

  const getDueTimeText = () => {
    if (!task.dueDate) return '';
    const date = new Date(task.dueDate);
    if (isPast(date)) {
      return `Termin geçti (${formatDistanceToNow(date, { locale: tr })} önce)`;
    }
    
    const diff = differenceInSeconds(date, now);
    if (diff <= 0) return 'Süre doldu';
    
    const d = Math.floor(diff / (3600*24));
    const h = Math.floor(diff % (3600*24) / 3600);
    const m = Math.floor(diff % 3600 / 60);
    const s = Math.floor(diff % 60);
    
    let text = 'Kalan: ';
    if (d > 0) text += `${d}g `;
    if (h > 0) text += `${h}sa `;
    if (m > 0) text += `${m}dk `;
    text += `${s}sn`;
    return text;
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-slate-50 dark:bg-slate-900">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{task.title}</h1>
              {task.recurrence && (
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                  <Clock className="w-3 h-3 mr-1" />
                  Periyodik: {getRecurrenceText(task.recurrence)}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">Görevi Yapan: {task.creator?.fullName || task.creator?.username} • Sorumlu (Görevi takip eden): {task.assignee?.fullName || task.assignee?.username}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {canTransfer && (
              <Button variant="outline" onClick={() => setIsTransferModalOpen(true)}>
                Görevi Devret
              </Button>
            )}
            <Button variant={isThisTaskChatOpen ? "secondary" : "outline"} onClick={() => isThisTaskChatOpen ? openChat(undefined) : openChat(taskId)} className="relative">
              <MessageSquare className="w-4 h-4 mr-2" />
              Sohbeti Aç
              {!isThisTaskChatOpen && task?.chatMessages?.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="bg-white dark:bg-slate-800 border rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium">
            <Clock className={`w-4 h-4 ${isPast(new Date(task.dueDate)) ? 'text-red-500' : 'text-amber-500'}`} />
            <span className={isPast(new Date(task.dueDate)) ? 'text-red-500' : ''}>
              {getDueTimeText()}
            </span>
          </div>

          {task.status === 'TODO' && (
            <Button onClick={() => handleStatusChange('DOING')} className="bg-blue-600 hover:bg-blue-700 text-white">
              Görevi Başlat
            </Button>
          )}
          
          {task.status === 'DOING' && (user?.username === task.assigneeId) && (
            <Button onClick={() => handleStatusChange('REVIEW')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Onaya Gönder (Tamamla)
            </Button>
          )}
          
          {task.status === 'REVIEW' && (user?.username === task.creatorId || user?.username === task.followerId || user?.isAdmin) && (
            <div className="flex gap-2">
              <Button onClick={() => handleStatusChange('DONE')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Görevi Onayla (Bitir)
              </Button>
              <Button onClick={() => setIsRejectModalOpen(true)} variant="destructive">
                <XCircle className="w-4 h-4 mr-2" />
                Görevi İade Et (Eksik Bildir)
              </Button>
            </div>
          )}

          <select 
            value={task.status} 
            onChange={(e) => handleStatusChange(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          >
            <option value="TODO">Bekliyor</option>
            <option value="DOING">Devam Ediyor</option>
            <option value="REVIEW">Kontrolde</option>
            { (user?.username === task.creatorId || user?.username === task.followerId || user?.isAdmin) && (
              <option value="DONE">Tamamlandı</option>
            )}
            <option value="BLOCKED">Bloke Edildi</option>
          </select>

          <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => setIsDueRequestOpen(true)}>
            <CalendarIcon className="w-4 h-4 mr-2" /> Termin Düzeltme İste
          </Button>
          
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setIsBlockModalOpen(true)}>
            <AlertTriangle className="w-4 h-4 mr-2" /> Engel Bildir
          </Button>
        </div>

        {task.blockNote && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h3 className="text-red-800 font-bold text-sm flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4" /> Görev Engellendi
            </h3>
            <p className="text-red-700 text-sm">{task.blockNote}</p>
            <Button variant="link" className="text-red-800 p-0 h-auto mt-2 text-xs" onClick={() => handleStatusChange('DOING')}>
              Engeli Kaldır
            </Button>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 border rounded-lg p-5">
          <h3 className="font-semibold text-lg mb-3">Açıklama</h3>
          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{task.description || 'Açıklama bulunmuyor.'}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Kontrol Adımları</h3>
            <span className="text-sm font-medium px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md">
              % {task.progress} Tamamlandı
            </span>
          </div>

          <div className="space-y-3">
            {task.checklist?.sort((a: any, b: any) => a.order - b.order).map((step: any, index: number) => (
              <div key={step.id} className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg shadow-sm group">
                {editingStep === step.id ? (
                  <div className="flex flex-col gap-3 p-2 bg-white dark:bg-slate-800 rounded border">
                    <Input 
                      value={stepEditData.text} 
                      onChange={(e) => setStepEditData({ ...stepEditData, text: e.target.value })} 
                      placeholder="Adım açıklaması..."
                    />
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={stepEditData.requireEvidence} onCheckedChange={(c) => setStepEditData({ ...stepEditData, requireEvidence: !!c })} />
                        Kanıt İste
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={stepEditData.requireDescription} onCheckedChange={(c) => setStepEditData({ ...stepEditData, requireDescription: !!c })} />
                        Açıklama İste
                      </label>
                    </div>
                    <div className="flex gap-2 justify-end mt-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditingStep(null)}>İptal</Button>
                      <Button size="sm" onClick={() => handleUpdateStepDefinition(step.id)}>Kaydet</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={step.done} 
                      onCheckedChange={() => handleChecklistToggle(step.id, step.done, step.requireEvidence, step.evidence)} 
                      disabled={step.requireEvidence && !step.evidence && !step.done}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-sm ${step.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                          <span className="font-semibold text-slate-400 mr-1">{index + 1}.</span> {step.text}
                        </p>
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600" onClick={() => { setEditingStep(step.id); setStepEditData({ text: step.text, requireEvidence: step.requireEvidence, requireDescription: step.requireDescription }); }}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-600" onClick={() => handleDeleteStep(step.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex flex-wrap gap-3">
                        {step.requireEvidence && (
                          <Button size="sm" variant="outline" className="text-blue-600 bg-blue-50 border-blue-200 h-7 text-xs px-2" onClick={() => setUploadEvidenceData({ stepId: step.id, file: null, name: '' })}>
                            <UploadCloud className="w-3 h-3 mr-1" /> {step.evidence ? 'Yeni Kanıt Ekle' : 'Kanıt Yükle'}
                          </Button>
                        )}
                        {step.evidence && step.evidence.split(',').map((url: string, i: number) => {
                          const names = step.evidenceName ? step.evidenceName.split(',') : [];
                          const displayName = names[i] || 'Yüklü Kanıt';
                          return (
                            <a key={i} href={(import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + url} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded hover:bg-green-100">
                              <Paperclip className="w-3 h-3" /> {displayName}
                            </a>
                          );
                        })}
                      </div>
                      {step.requireDescription && (
                        <div className="mt-3 text-sm text-slate-600 w-full max-w-lg">
                          <span className="font-semibold block mb-1">Açıklama</span>
                          <ChecklistDescriptionEditor 
                            initialValue={step.description || ''} 
                            onSave={(val) => handleSaveDescription(step.id, val)} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                )}
              </div>
            ))}
            
            {false ? (
              <div className="flex flex-col gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border shadow-sm mt-4">
                <h4 className="font-semibold text-sm">Yeni Adım Ekle</h4>
                <Input 
                  value={newStepData.text} 
                  onChange={(e) => setNewStepData({ ...newStepData, text: e.target.value })} 
                  placeholder="Adım açıklaması..."
                />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={newStepData.requireEvidence} onCheckedChange={(c) => setNewStepData({ ...newStepData, requireEvidence: !!c })} />
                    Kanıt İste
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={newStepData.requireDescription} onCheckedChange={(c) => setNewStepData({ ...newStepData, requireDescription: !!c })} />
                    Açıklama İste
                  </label>
                </div>
                <div className="flex gap-2 justify-end mt-2">
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingStep(false)}>İptal</Button>
                  <Button size="sm" onClick={handleAddStep}>Adım Ekle</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full border-dashed text-slate-500 mt-2" onClick={() => setIsAddingStep(true)} className="hidden w-full border-dashed text-slate-500 mt-2">
                <Plus className="w-4 h-4 mr-2" /> Yeni Adım Ekle
              </Button>
            )}
          </div>
        </div>

        
      </div>
      
      {/* Right Sidebar - Activity Log */}
      <div className="w-full lg:w-96 border-l bg-white dark:bg-slate-900 overflow-y-auto p-6 flex flex-col shrink-0">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-slate-400" />
          İşlem Geçmişi
        </h2>
        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6">
          {(() => {
            const timeline: any[] = [];
            if (task.createdAt) timeline.push({ type: 'created', date: new Date(task.createdAt), title: 'Görev Oluşturuldu' });
            if (task.activityLogs) task.activityLogs.forEach((l: any) => timeline.push({ type: 'log', date: new Date(l.createdAt), title: getActionTranslation(l.action), desc: formatDetailText(l.detail), user: l.actor?.fullName || l.actor?.username }));
            if (task.comments) task.comments.forEach((c: any) => timeline.push({ type: 'comment', date: new Date(c.createdAt), title: 'Yorum Yapıldı', desc: c.body, user: c.author?.fullName || c.author?.username }));
            if (task.dueHistories) task.dueHistories.forEach((d: any) => timeline.push({ type: 'due', date: new Date(d.createdAt), title: 'Termin Değişti', desc: `${new Date(d.oldDue).toLocaleDateString('tr-TR')} -> ${new Date(d.newDue).toLocaleDateString('tr-TR')}`, user: d.changedBy?.fullName || d.changedBy?.username }));
            if (task.transferRequests) task.transferRequests.filter((t: any) => t.status === 'APPROVED').forEach((t: any) => timeline.push({ type: 'transfer', date: new Date(t.updatedAt), title: 'Görev Devredildi', desc: `${t.requestedByUser?.fullName || t.requestedByUser?.username} tarafından kabul edildi`, user: t.targetUser?.fullName || t.targetUser?.username }));
            
            if (timeline.length === 0) return <p className="text-sm text-slate-500 italic pl-4">Kayıt bulunmuyor.</p>;

            return timeline.sort((a, b) => b.date.getTime() - a.date.getTime()).map((item, i) => (
              <div key={i} className="relative pl-6">
                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-primary" />
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{item.title}</span>
                  <span className="text-[10px] text-slate-500">{item.date.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                {item.user && <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.user}</div>}
                {item.desc && <div className="text-sm text-slate-500 mt-1 p-2 bg-slate-50 dark:bg-slate-800 rounded">{item.desc}</div>}
              </div>
            ));
          })()}
        </div>      </div>

      {/* Modals */}
      <Dialog open={!!uploadEvidenceData} onOpenChange={(open) => !open && setUploadEvidenceData(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kanıt Yükle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Belge Adı (İsteğe Bağlı)</label>
              <Input 
                placeholder="Örn: Fatura Görüntüsü" 
                value={uploadEvidenceData?.name || ''} 
                onChange={e => setUploadEvidenceData(prev => prev ? {...prev, name: e.target.value} : null)} 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Dosya Seçin</label>
              <Input type="file" onChange={e => setUploadEvidenceData(prev => prev ? {...prev, file: e.target.files?.[0] || null} : null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadEvidenceData(null)}>İptal</Button>
            <Button onClick={handleFileUpload} disabled={!uploadEvidenceData?.file || uploadingStepId === uploadEvidenceData?.stepId}>
              {uploadingStepId === uploadEvidenceData?.stepId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />} Yükle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDueRequestOpen} onOpenChange={setIsDueRequestOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Termin Düzeltme Talebi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Yeni Talep Edilen Tarih</label>
              <Input type="datetime-local" value={dueRequestData.date} onChange={(e) => setDueRequestData({ ...dueRequestData, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Gerekçe / Neden</label>
              <Textarea placeholder="Lütfen neden termin tarihinin uzatılması gerektiğini açıklayın..." value={dueRequestData.reason} onChange={(e) => setDueRequestData({ ...dueRequestData, reason: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDueRequestOpen(false)}>İptal</Button>
            <Button onClick={handleDueRequest} disabled={!dueRequestData.date || !dueRequestData.reason}>Talebi İlet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBlockModalOpen} onOpenChange={setIsBlockModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Engel Bildir</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">Görevin ilerlemesini engelleyen durumu açıklayın. Görev durumu otomatik olarak "Bloke Edildi" yapılacaktır.</p>
            <Textarea 
              placeholder="Örn: Müşteriden onay bekleniyor..." 
              value={blockNote} 
              onChange={(e) => setBlockNote(e.target.value)} 
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockModalOpen(false)}>İptal</Button>
            <Button variant="destructive" onClick={handleBlockNote} disabled={!blockNote.trim()}>Engeli Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Görevi Devret</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Devredilecek Kişi</label>
              <select 
                value={transferTargetId} 
                onChange={e => setTransferTargetId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Seçiniz...</option>
                {workflowUsers?.filter((u: any) => u.username !== task.creatorId).map((u: any) => (
                  <option key={u.username} value={u.username}>{u.fullName || u.username} ({u.workflowRole})</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferModalOpen(false)}>İptal</Button>
            <Button onClick={handleTransferTask} disabled={!transferTargetId}>Talep Gönder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
