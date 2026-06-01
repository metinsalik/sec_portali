import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function WorkflowSettings() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Modül Ayarları</h1>
        <p className="text-muted-foreground mt-1">İş Takip modülü için departman, rol ve bildirim ayarları.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-500" />
            Genel Ayarlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            <p>Ayarlar paneli yapım aşamasındadır.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
