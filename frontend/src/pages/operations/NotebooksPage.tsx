import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function NotebooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tespit & Öneri Defteri</h1>
        <p className="text-sm text-muted-foreground">İş sağlığı ve güvenliği tespit ve öneri kayıtları</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Tespit & Öneri Defteri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Bu modül yakında hazır olacak.</p>
        </CardContent>
      </Card>
    </div>
  );
}