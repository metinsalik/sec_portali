import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function BoardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">İSG Kurul</h1>
        <p className="text-sm text-muted-foreground">İş sağlığı ve güvenliği kurul kayıtları</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            İSG Kurul Kayıtları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Bu modül yakında hazır olacak.</p>
        </CardContent>
      </Card>
    </div>
  );
}