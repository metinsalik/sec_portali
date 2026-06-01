import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreHorizontal } from 'lucide-react';

type TaskStatus = 'BEKLIYOR' | 'DEVAM' | 'TAMAMLANDI' | 'YARIM_KALDI' | 'IPTAL';

const STATUS_COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'BEKLIYOR', title: 'Bekliyor', color: 'border-slate-500' },
  { id: 'DEVAM', title: 'Devam Ediyor', color: 'border-blue-500' },
  { id: 'TAMAMLANDI', title: 'Tamamlandı', color: 'border-emerald-500' },
  { id: 'YARIM_KALDI', title: 'Yarım Kaldı', color: 'border-amber-500' },
  { id: 'IPTAL', title: 'İptal Edildi', color: 'border-red-500' }
];

export default function BoardView() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/workflow/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/workflow/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">İşler yükleniyor...</div>;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">İş Panosu</h1>
          <p className="text-muted-foreground mt-1">Sürükle bırak mantığıyla işleri yönetin.</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" /> İş Oluştur
        </Button>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map(col => (
          <div key={col.id} className="min-w-[300px] max-w-[300px] flex flex-col bg-muted/30 rounded-xl p-3 border">
            <div className={`flex justify-between items-center mb-3 border-l-4 ${col.color} pl-2`}>
              <h3 className="font-semibold">{col.title}</h3>
              <Badge variant="secondary">{tasks.filter(t => t.status === col.id).length}</Badge>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {tasks.filter(t => t.status === col.id).map(task => (
                <Card key={task.id} className="cursor-grab hover:shadow-md transition-shadow">
                  <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between space-y-0">
                    <CardTitle className="text-sm font-medium leading-tight">{task.title}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant={task.priority === 'HIGH' ? 'destructive' : 'outline'} className="text-[10px]">
                        {task.priority}
                      </Badge>
                      <div className="flex gap-1">
                        {STATUS_COLUMNS.filter(c => c.id !== task.status).slice(0, 2).map(c => (
                          <Button key={c.id} variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleStatusChange(task.id, c.id)}>
                            {c.title.split(' ')[0]}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {tasks.filter(t => t.status === col.id).length === 0 && (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-muted rounded-lg text-sm text-muted-foreground">
                  İş Yok
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
