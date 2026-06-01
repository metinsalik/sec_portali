import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function TeamOverview() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Ekip Özeti</h1>
        <p className="text-muted-foreground mt-1">Ekip üyelerinin iş dağılımını ve performansını inceleyin.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-500" />
            Performans Analizi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            <p>Yeterli veri bulunmamaktadır. Ekip performansı hesaplanamıyor.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
