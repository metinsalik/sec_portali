import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useWorkflowAlerts } from '@/hooks/useWorkflow';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function WorkflowAlertsPage() {
  const { data, isLoading } = useWorkflowAlerts();
  const queryClient = useQueryClient();

  const [activeDialog, setActiveDialog] = useState<{ type: string, taskId: string } | null>(null);
  const [commentText, setCommentText] = useState('');

  const respondToDueRequest = useMutation({
    mutationFn: async ({ reqId, taskId, approve }: { reqId: string, taskId: string, approve: boolean }) => {
      const res = await api.patch(`/workflow/tasks/${taskId}/due-requests/${reqId}`, { approve });
      if (!res.ok) throw new Error('Talep yanıtlanamadı');
    },
    onSuccess: () => {
      toast.success('Talep yanıtlandı');
      queryClient.invalidateQueries({ queryKey: ['workflow', 'alerts'] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const respondToTransferRequest = useMutation({
    mutationFn: async ({ reqId, taskId, approve }: { reqId: string, taskId: string, approve: boolean }) => {
      const res = await api.patch(`/workflow/tasks/${taskId}/transfer/${reqId}`, { approve });
      if (!res.ok) throw new Error('Devir talebi yanıtlanamadı');
    },
    onSuccess: () => {
      toast.success('Devir talebi yanıtlandı');
      queryClient.invalidateQueries({ queryKey: ['workflow', 'alerts'] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status, message }: { taskId: string, status: string, message?: string }) => {
      if (message) {
        await api.post(`/workflow/tasks/${taskId}/comments`, { body: message });
      }
      const res = await api.patch(`/workflow/tasks/${taskId}/status`, { status });
      if (!res.ok) throw new Error('Durum güncellenemedi');
    },
    onSuccess: () => {
      toast.success('İşlem başarılı');
      setActiveDialog(null);
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['workflow', 'alerts'] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  if (isLoading) {
    return <div className="p-6 text-center text-slate-500">Yükleniyor...</div>;
  }

  const { blockedTasks = [], reviewTasks = [], dueRequests = [], transferRequests = [] } = data || {};
  const hasAlerts = blockedTasks.length > 0 || reviewTasks.length > 0 || dueRequests.length > 0 || transferRequests.length > 0;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Uyarılar & Talepler</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Sorumlusu olduğunuz görevlerdeki aksaklıkları ve onay bekleyen talepleri buradan yönetebilirsiniz.</p>
      </div>

      {!hasAlerts && (
        <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center flex flex-col items-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
          <p className="text-lg font-medium text-slate-900 dark:text-slate-100">Şu an her şey yolunda</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Bekleyen bir uyarı veya talep bulunmuyor.</p>
        </div>
      )}

      {/* BLOCKED TASKS */}
      {blockedTasks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-bold">Engellenen Görevler</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {blockedTasks.map((task: any) => (
              <div key={task.id} className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 p-4 rounded-xl shadow-sm">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{task.title}</h3>
                <p className="text-sm text-slate-500 mt-1">Takip: {task.assignee?.fullName || task.assignee?.username}</p>
                <div className="mt-3 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">Engel Notu:</p>
                  <p className="text-sm text-red-600 dark:text-red-300">{task.blockNote || 'Belirtilmemiş'}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => setActiveDialog({ type: 'UNBLOCK', taskId: task.id })} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Yanıtla ve Devam Ettir
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link target="_blank" to={`/workflow/tasks/${task.id}`}>Görevi İncele</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* REVIEW TASKS */}
      {reviewTasks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <CheckCircle className="w-5 h-5" />
            <h2 className="text-lg font-bold">Kontrol Bekleyen Görevler</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {reviewTasks.map((task: any) => (
              <div key={task.id} className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl shadow-sm">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{task.title}</h3>
                <p className="text-sm text-slate-500 mt-1">Takip: {task.assignee?.fullName || task.assignee?.username}</p>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <Button onClick={() => updateTaskStatus.mutate({ taskId: task.id, status: 'DONE' })} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Görev Tamamlandı
                  </Button>
                  <Button onClick={() => setActiveDialog({ type: 'REVIEW_REJECT', taskId: task.id })} size="sm" variant="destructive">
                    <XCircle className="w-4 h-4 mr-2" />
                    Eksikler Var
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link target="_blank" to={`/workflow/tasks/${task.id}`}>Görevi İncele</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DUE REQUESTS */}
      {dueRequests.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500">
            <Clock className="w-5 h-5" />
            <h2 className="text-lg font-bold">Termin Uzatma Talepleri</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {dueRequests.map((req: any) => (
              <div key={req.id} className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 p-4 rounded-xl shadow-sm">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{req.task?.title}</h3>
                <p className="text-sm text-slate-500 mt-1">Talep Eden: {req.requestedBy?.fullName || req.requestedBy?.username}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-500 block text-xs">Mevcut Termin</span>
                    <span className="font-medium">{format(new Date(req.oldDue), 'dd MMM yyyy', { locale: tr })}</span>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-900/30">
                    <span className="text-blue-600 dark:text-blue-400 block text-xs">İstenen Termin</span>
                    <span className="font-medium text-blue-700 dark:text-blue-300">{format(new Date(req.requestedDue), 'dd MMM yyyy', { locale: tr })}</span>
                  </div>
                </div>
                {req.reason && (
                  <div className="mt-3 text-sm bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                    <span className="font-medium block text-slate-700 dark:text-slate-300">Gerekçe:</span>
                    <p className="text-slate-600 dark:text-slate-400">{req.reason}</p>
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => respondToDueRequest.mutate({ reqId: req.id, taskId: req.task.id, approve: true })} size="sm" className="bg-emerald-600 hover:bg-emerald-700 flex-1">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Kabul Et
                  </Button>
                  <Button onClick={() => respondToDueRequest.mutate({ reqId: req.id, taskId: req.task.id, approve: false })} size="sm" variant="destructive" className="flex-1">
                    <XCircle className="w-4 h-4 mr-2" />
                    Reddet
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TRANSFER REQUESTS */}
      {transferRequests.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-500">
            <MessageSquare className="w-5 h-5" />
            <h2 className="text-lg font-bold">Görev Devir Talepleri</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {transferRequests.map((req: any) => (
              <div key={req.id} className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/50 p-4 rounded-xl shadow-sm">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{req.task?.title}</h3>
                <p className="text-sm text-slate-500 mt-1">Devreden Kişi: {req.requestedByUser?.fullName || req.requestedByUser?.username}</p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => respondToTransferRequest.mutate({ reqId: req.id, taskId: req.taskId, approve: true })} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Kabul Et
                  </Button>
                  <Button onClick={() => respondToTransferRequest.mutate({ reqId: req.id, taskId: req.taskId, approve: false })} size="sm" variant="destructive">
                    <XCircle className="w-4 h-4 mr-2" />
                    Reddet
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link target="_blank" to={`/workflow/tasks/${req.taskId}`}>Görevi İncele</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DIALOGS */}
      {activeDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4">
              {activeDialog.type === 'UNBLOCK' ? 'Engel İçin Açıklama (Çözüm)' : 'Eksikler Neler?'}
            </h3>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder={activeDialog.type === 'UNBLOCK' ? 'Sorunun nasıl çözüleceğini/çözüldüğünü belirtin...' : 'Nelerin düzeltilmesi gerektiğini yazın...'}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setActiveDialog(null); setCommentText(''); }}>İptal</Button>
              <Button 
                onClick={() => {
                  if(!commentText.trim()) return toast.error('Lütfen bir açıklama girin');
                  updateTaskStatus.mutate({ taskId: activeDialog.taskId, status: 'DOING', message: commentText });
                }}
              >
                {activeDialog.type === 'UNBLOCK' ? 'Gönder ve Devam Ettir' : 'Mesajı Gönder ve İade Et'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
