import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Bell, CheckCircle2, Info, AlertTriangle, 
  XCircle, Filter, Search, CheckCheck, Trash2,
  ChevronRight, Calendar, Tag, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  module: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export default function NotificationPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      if (!res.ok) throw new Error('Bildirimler alınamadı');
      return res.json();
    },
  });

  const readMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.put(`/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const readAllMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Tüm bildirimler okundu olarak işaretlendi');
    }
  });

  const filteredNotifications = notifications.filter(n => {
    const matchesStatus = filter === 'all' || (filter === 'unread' ? !n.isRead : n.isRead);
    const matchesModule = moduleFilter === 'all' || n.module === moduleFilter;
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                         n.message.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesModule && matchesSearch;
  });

  const modules = Array.from(new Set(notifications.map(n => n.module)));

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bildirimler</h1>
          <p className="text-muted-foreground">Sistem ve modül bazlı tüm bildirimlerinizi buradan yönetebilirsiniz.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => readAllMutation.mutate()}
            disabled={!notifications.some(n => !n.isRead)}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Hepsini Okundu İşaretle
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Bildirimlerde ara..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex p-1 bg-muted rounded-lg border">
                <Button 
                  variant={filter === 'all' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="h-8 text-xs"
                  onClick={() => setFilter('all')}
                >
                  Tümü
                </Button>
                <Button 
                  variant={filter === 'unread' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="h-8 text-xs"
                  onClick={() => setFilter('unread')}
                >
                  Okunmamış
                </Button>
                <Button 
                  variant={filter === 'read' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="h-8 text-xs"
                  onClick={() => setFilter('read')}
                >
                  Okunmuş
                </Button>
              </div>
              
              <select 
                className="h-10 px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
              >
                <option value="all">Tüm Modüller</option>
                {modules.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Yükleniyor...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-xl">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-lg font-semibold">Bildirim Bulunamadı</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  Arama kriterlerinize uygun herhangi bir bildirim bulunmuyor.
                </p>
              </div>
            ) : (
              <div className="divide-y border rounded-xl overflow-hidden">
                {filteredNotifications.map((n) => (
                  <div 
                    key={n.id}
                    className={cn(
                      "group flex items-start gap-4 p-5 transition-all hover:bg-muted/30",
                      !n.isRead && "bg-primary/5"
                    )}
                  >
                    <div className="mt-1 shrink-0 p-2 rounded-lg bg-background border shadow-sm">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">
                          {n.module}
                        </Badge>
                        <div className="flex items-center text-[11px] text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(n.createdAt), 'd MMMM yyyy, HH:mm', { locale: tr })}
                        </div>
                      </div>
                      <h3 className={cn("text-base font-semibold mb-1", !n.isRead ? "text-foreground" : "text-muted-foreground")}>
                        {n.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {n.message}
                      </p>
                      
                      <div className="mt-4 flex items-center gap-3">
                        {n.link && (
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => window.location.href = n.link!}>
                            Detayı Gör
                            <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        )}
                        {!n.isRead && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 text-xs text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => readMutation.mutate(n.id)}
                          >
                            Okundu İşaretle
                          </Button>
                        )}
                      </div>
                    </div>
                    {!n.isRead && (
                      <div className="mt-2 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
