import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, CheckCircle, FileText } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function SubmissionListPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchSubmissions(user.facilityId);
    }
  }, [user]);

  const fetchSubmissions = async (facilityId?: string) => {
    try {
      const endpoint = facilityId ? `/checklists/submissions?facilityId=${facilityId}` : '/checklists/submissions';
      const response = await api.get(endpoint);
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TASLAK': return 'text-amber-500 bg-amber-50';
      case 'BEKLEYEN': return 'text-blue-500 bg-blue-50';
      case 'TAMAMLANDI': return 'text-emerald-500 bg-emerald-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saha Denetimleri</h1>
          <p className="text-muted-foreground">Tesisinize ait doldurulmuş kontrol listeleri.</p>
        </div>
        <Button onClick={() => navigate('/checklists/submissions/new')} className="gap-2">
          <Plus className="w-4 h-4" />
          Yeni Denetim Başlat
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map((sub) => (
          <Card key={sub.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold leading-tight">
                {sub.template?.title}
              </CardTitle>
              <div className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(sub.status)}`}>
                {sub.status}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground mt-2">
                <div className="flex justify-between">
                  <span>Tarih:</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(sub.auditDate), 'dd MMM yyyy', { locale: tr })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Denetçi:</span>
                  <span className="font-medium text-foreground">{sub.conductedBy?.fullName}</span>
                </div>
                {sub.status === 'TAMAMLANDI' && (
                  <div className="flex justify-between">
                    <span>Skor:</span>
                    <span className="font-medium text-foreground">
                      {sub.totalScore} / {sub.maxScore} (%{sub.percentScore?.toFixed(1)})
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => navigate(`/checklists/submissions/${sub.id}`)}>
                  {sub.status === 'TASLAK' ? (
                    <><Edit className="w-4 h-4 mr-2" /> Devam Et</>
                  ) : (
                    <><Eye className="w-4 h-4 mr-2" /> Görüntüle</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {submissions.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            Bu tesise ait henüz bir denetim bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}
// Import Edit icon separately to prevent error if it was missing above
import { Edit } from 'lucide-react';
