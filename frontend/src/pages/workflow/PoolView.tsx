import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users2, Search } from 'lucide-react';

export default function PoolView() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">İş Havuzu</h1>
          <p className="text-muted-foreground mt-1">Kimseye atanmamış işleri görüntüleyin ve üzerinize alın.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users2 className="h-5 w-5 text-emerald-500" />
            Sahipsiz İşler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            <Search className="h-8 w-8 mb-4 opacity-50" />
            <p>Şu an havuzda bekleyen iş bulunmamaktadır.</p>
            <Button variant="outline" className="mt-4">İş Oluştur ve Havuza At</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
