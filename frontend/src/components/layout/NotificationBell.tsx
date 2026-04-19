import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Bell, CheckCircle2, Info, AlertTriangle, 
  XCircle, Clock, ChevronRight, Archive, CheckCheck
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

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

export function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      if (!res.ok) throw new Error('Bildirimler alınamadı');
      return res.json();
    },
    refetchInterval: 30000, // 30 saniyede bir kontrol et
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
    }
  });

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) {
      readMutation.mutate(n.id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Bell className="w-[18px] h-[18px] text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden shadow-2xl border-border/50">
        <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Bildirimler</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-[11px] px-2 hover:bg-background"
              onClick={() => readAllMutation.mutate()}
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Hepsini Oku
            </Button>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-muted-foreground opacity-20" />
              </div>
              <p className="text-xs text-muted-foreground">Henüz bildiriminiz yok</p>
            </div>
          ) : (
            notifications.slice(0, 8).map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={cn(
                  "w-full flex items-start gap-3 p-4 text-left transition-colors border-b last:border-0 hover:bg-muted/50",
                  !n.isRead && "bg-primary/5"
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {n.module}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: tr })}
                    </span>
                  </div>
                  <h4 className={cn("text-xs font-semibold leading-tight mb-1", !n.isRead ? "text-foreground" : "text-muted-foreground")}>
                    {n.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-normal">
                    {n.message}
                  </p>
                </div>
                {!n.isRead && (
                  <div className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
              </button>
            ))
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />
        <Button 
          variant="ghost" 
          className="w-full rounded-none h-11 text-xs font-medium text-primary hover:bg-muted"
          onClick={() => navigate('/notifications')}
        >
          Tümünü Gör
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
