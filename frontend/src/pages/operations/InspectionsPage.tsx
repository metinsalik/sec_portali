import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export default function InspectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ölçüm & Kontrol</h1>
        <p className="text-sm text-muted-foreground">Çalışma ortamı ölçüm ve kontrol sonuçları</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Ölçüm & Kontrol
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Bu modül yakında hazır olacak.</p>
        </CardContent>
      </Card>
    </div>
  );
}