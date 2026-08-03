
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Edit, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BoardList() {
  const navigate = useNavigate();
  const [selectedFacility, setSelectedFacility] = useState<string>('');

  const { data: facilities = [] } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => (await api.get('/settings/facilities')).json()
  });

  const { data: meetings = [], refetch } = useQuery({
    queryKey: ['board-meetings', selectedFacility],
    queryFn: async () => (await api.get(`/operations/board?facilityId=${selectedFacility}`)).json(),
    enabled: !!selectedFacility
  });

  const handleDelete = async (id: string) => {
    if (confirm('Emin misiniz?')) {
      await api.delete(`/operations/board/${id}`);
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">İSG Kurulları</h1>
          <p className="text-sm text-muted-foreground">Kurul kararları ve takibi</p>
        </div>
        <Button onClick={() => navigate('/operations/board/new')} disabled={!selectedFacility}>
          <Plus className="w-4 h-4 mr-2" /> Yeni Toplantı Ekle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tesis Seçimi</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedFacility} onValueChange={setSelectedFacility}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Tesis seçiniz..." />
            </SelectTrigger>
            <SelectContent>
              {facilities.map((f: any) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedFacility && (
        <Card>
          <CardHeader>
            <CardTitle>Kurul Toplantıları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {meetings.map((meeting: any) => (
                <div key={meeting.id} className="border p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Toplantı No: {meeting.meetingNo}</h3>
                    <p className="text-sm text-muted-foreground">Tarih: {new Date(meeting.meetingDate).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">Karar Sayısı: {meeting.decisions.length}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`/operations/board/${meeting.id}/edit`)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" onClick={() => handleDelete(meeting.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {meetings.length === 0 && <p className="text-muted-foreground">Henüz kayıt yok.</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
