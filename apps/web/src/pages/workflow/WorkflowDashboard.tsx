import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, AlertCircle, CheckCircle2, Clock, MessageCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function WorkflowDashboard() {
  const { user, refreshUser } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectTelegram = async () => {
    try {
      setIsConnecting(true);
      const res = await api.get('/settings/telegram/connect');
      const data = await res.json();
      
      if (data.alreadyConnected) {
        toast.info('Telegram hesabınız zaten bağlı.');
        setTimeout(() => window.location.reload(), 1500);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Bağlantı kodu üretilemedi');
      }
      
      // Refresh user state slightly later to check if connected (optional polling, but user will see it next time)
      
      // Open telegram
      window.open(data.link, '_blank');
      toast.success('Telegram açılıyor... Lütfen bot ekranında BAŞLAT (START) düğmesine basın.');
    } catch (error: any) {
      toast.error(error.message || 'Telegram bağlantısı sırasında bir hata oluştu');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">İş Takibi Özeti</h1>
        <p className="text-slate-500 dark:text-slate-400">Görevlerin genel durumu ve içgörüler.</p>
      </div>

      {user && (
        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 animate-in fade-in zoom-in duration-500">
          <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between w-full">
            <div>
              <AlertTitle className="text-blue-800 dark:text-blue-300 font-semibold text-base">
                {user.hasTelegram ? 'Telegram Bildirimleri Aktif' : 'Telegram Bildirimlerini Etkinleştirin'}
              </AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-400 mt-1">
                {user.hasTelegram 
                  ? 'Hesabınız Telegram ile eşleştirilmiş durumda. Bildirimleri Telegram üzerinden alabilirsiniz.' 
                  : 'Size atanan görevlerden, durum değişikliklerinden ve yaklaşan terminlerden anında haberdar olmak için hesabınızı Telegram ile eşleştirin.'}
              </AlertDescription>
            </div>
            <Button 
              onClick={handleConnectTelegram} 
              disabled={isConnecting}
              variant={user.hasTelegram ? "outline" : "default"}
              className={user.hasTelegram ? "shrink-0 border-blue-600 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900" : "shrink-0 bg-blue-600 hover:bg-blue-700 text-white"}
            >
              {isConnecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
              {user.hasTelegram ? 'Yeniden Bağla' : 'Telegram\'ı Bağla'}
            </Button>
          </div>
        </Alert>
      )}

      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI Cards Placeholder */}
        {[
          { title: 'Açık Görevler', value: '12', icon: Activity, color: 'text-blue-500' },
          { title: 'Gecikmiş', value: '3', icon: Clock, color: 'text-red-500' },
          { title: 'Bloke', value: '1', icon: AlertCircle, color: 'text-orange-500' },
          { title: 'Tamamlanan', value: '24', icon: CheckCircle2, color: 'text-emerald-500' },
        ].map((kpi, idx) => (
          <Card key={idx} className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
