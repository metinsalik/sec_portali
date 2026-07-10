import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkflowTasks, useUpdateTaskStatus } from '@/hooks/useWorkflow';
import { Loader2, Plus, Search, LayoutList, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TaskFormModal } from '@/components/workflow/TaskFormModal';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { io, Socket } from 'socket.io-client';

const STATUS_COLUMNS = [
  { id: 'TODO', label: 'Bekliyor', color: 'bg-slate-100 dark:bg-slate-800' },
  { id: 'DOING', label: 'Devam Ediyor', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'REVIEW', label: 'Kontrolde', color: 'bg-purple-50 dark:bg-purple-900/20' },
  { id: 'BLOCKED', label: 'Bloke Edildi', color: 'bg-red-50 dark:bg-red-900/20' },
  { id: 'DONE', label: 'Tamamlandı', color: 'bg-green-50 dark:bg-green-900/20' },
];

const PRIORITY_COLORS = {
  LOW: 'text-sky-500 bg-sky-500/10',
  MEDIUM: 'text-slate-500 bg-slate-500/10',
  HIGH: 'text-orange-500 bg-orange-500/10',
  CRITICAL: 'text-red-500 bg-red-500/10',
};

export default function WorkflowTasksPage({ planId }: { planId?: string }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: tasks, isLoading, error } = useWorkflowTasks(
    planId ? { planId } : { assigneeId: user?.username || '' }
  );
  const { mutate: updateStatus } = useUpdateTaskStatus();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3005', {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('task_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'tasks'] });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [queryClient]);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      updateStatus({ id, status });
    }
    setDraggedTaskId(null);
  };

  if (isLoading) {
    return <div className="p-6 flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Görevler yüklenirken bir hata oluştu.</div>;
  }

  const tasksByStatus = (status: string) => tasks?.filter(t => t.status === status) || [];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto h-[calc(100vh-6rem)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {!planId && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">İş Panosu</h1>
            <p className="text-slate-500 dark:text-slate-400">Görevlerinizi sürükle bırak yöntemiyle yönetin.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-8">
                <LayoutList className="w-4 h-4 mr-2" /> Liste
              </Button>
              <Button variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('kanban')} className="h-8">
                <LayoutDashboard className="w-4 h-4 mr-2" /> Pano
              </Button>
            </div>
            <Button className="shrink-0 flex items-center gap-2 h-10" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" /> Yeni Görev
            </Button>
          </div>
        </div>
      )}

      {planId && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shrink-0 gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input placeholder="Görev ara..." className="pl-9 w-[250px] h-9" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-8">
                <LayoutList className="w-4 h-4 mr-2" /> Liste
              </Button>
              <Button variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('kanban')} className="h-8">
                <LayoutDashboard className="w-4 h-4 mr-2" /> Pano
              </Button>
            </div>
            <Button className="h-9" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Görev
            </Button>
          </div>
        </div>
      )}

      <TaskFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} planId={planId} />

      {viewMode === 'kanban' ? (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 snap-x">
          {STATUS_COLUMNS.map(column => (
            <div 
              key={column.id}
              className={`flex-shrink-0 w-[300px] sm:w-[350px] flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 snap-center transition-colors ${column.color}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="p-4 font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50">
                {column.label}
                <span className="text-xs py-1 px-2 rounded-full bg-black/5 dark:bg-white/10">
                  {tasksByStatus(column.id).length}
                </span>
              </div>
              
              <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto min-h-[150px]">
                {tasksByStatus(column.id).map(task => (
                  <Card 
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => navigate('/workflow/tasks/' + task.id)}
                    className={`p-4 cursor-grab active:cursor-grabbing hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm hover:shadow-md ${draggedTaskId === task.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex flex-col gap-2 pointer-events-none">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm line-clamp-2 text-slate-900 dark:text-slate-100">
                            {task.title}
                          </h3>
                        </div>
                        {task.recurrence && (
                          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-800 w-fit">
                            <Clock className="w-3 h-3 mr-1" />
                            Periyodik: {getRecurrenceText(task.recurrence)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wider ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}`}>
                          {task.priority === 'LOW' ? 'Düşük' : task.priority === 'MEDIUM' ? 'Orta' : task.priority === 'HIGH' ? 'Yüksek' : 'Kritik'}
                        </span>
                        {task.chatMessages && task.chatMessages.length > 0 && task.chatMessages[0].senderId !== user?.username && (
                          <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded-full animate-pulse">
                            Yanıt Bekliyor
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 font-medium">
                          %{task.progress}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300" title={task.creatorId}>
                            {task.creatorId.substring(0,2).toUpperCase()}
                          </div>
                        </div>
                        <div className="text-slate-400">
                          {new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
            ) : (
        <div className="flex-1 overflow-y-auto space-y-8 pb-8">
          {STATUS_COLUMNS.map(column => {
            const columnTasks = tasksByStatus(column.id);
            if (columnTasks.length === 0) return null;
            return (
              <div key={column.id} className="bg-white dark:bg-slate-900 rounded-xl border overflow-hidden">
                <div className={`px-6 py-3 font-semibold text-slate-800 dark:text-slate-200 border-b flex items-center gap-2 ${column.color}`}>
                  {column.label} 
                  <span className="bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full text-xs">{columnTasks.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b hidden md:table-header-group">
                      <tr>
                        <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-300 w-1/3">Görev Başlığı</th>
                        <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-300">Öncelik</th>
                        <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-300">İlerleme</th>
                        <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-300">Görevi Yapan</th>
                        <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-300">Bitiş Tarihi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {columnTasks.map((task) => (
                        <tr 
                          key={task.id} 
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer flex flex-col md:table-row"
                          onClick={() => navigate('/workflow/tasks/' + task.id)}
                        >
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              {task.title}
                              {task.recurrence && (
                                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {getRecurrenceText(task.recurrence)}
                                </span>
                              )}
                              {task.chatMessages && task.chatMessages.length > 0 && task.chatMessages[0].senderId !== user?.username && (
                                <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded-full animate-pulse">
                                  Yanıt Bekliyor
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-2 md:py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}`}>
                              {task.priority === 'LOW' ? 'Düşük' : task.priority === 'MEDIUM' ? 'Orta' : task.priority === 'HIGH' ? 'Yüksek' : 'Kritik'}
                            </span>
                          </td>
                          <td className="px-6 py-2 md:py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-full max-w-[100px] bg-slate-200 rounded-full h-1.5 dark:bg-slate-700 hidden md:block">
                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${task.progress}%` }}></div>
                              </div>
                              <span className="text-xs text-slate-500 font-medium">%{task.progress}</span>
                            </div>
                          </td>
                          <td className="px-6 py-2 md:py-4 text-slate-500">
                            {task.creator?.fullName || task.creator?.username || task.creatorId}
                          </td>
                          <td className="px-6 py-2 md:py-4 text-slate-500">
                            {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          {tasks?.length === 0 && (
            <div className="text-center py-12 text-slate-500">Görev bulunamadı.</div>
          )}
        </div>
      )}
    </div>
  );
}
