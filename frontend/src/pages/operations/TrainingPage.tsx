import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function TrainingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Eğitim Takibi</h1>
        <p className="text-sm text-muted-foreground">Verilen eğitimlerin kayıt ve takibi</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Eğitim Takibi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Bu modül yakında hazır olacak.</p>
        </CardContent>
      </Card>
    </div>
  );
}