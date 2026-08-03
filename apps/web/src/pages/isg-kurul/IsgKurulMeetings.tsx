import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Users, Calendar, ArrowRight, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '';

export default function IsgKurulMeetings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const selectedFacilityId = localStorage.getItem('activeFacilityId') || '';

  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingNo, setMeetingNo] = useState('');
  
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch Meetings
  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['ohs-board-meetings', selectedFacilityId, selectedYear],
    queryFn: async () => {
      if (!selectedFacilityId) return [];
      const res = await fetch(`${API}/api/operations/board?facilityId=${selectedFacilityId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Toplantılar yüklenemedi');
      const data = await res.json();
      // Filter by selected year
      return data.filter((m: any) => new Date(m.meetingDate).getFullYear().toString() === selectedYear);
    },
    enabled: !!selectedFacilityId
  });

  // Create Meeting Mutation
  const createMeetingMutation = useMutation({
    mutationFn: async (newMeeting: any) => {
      const res = await fetch(`${API}/api/operations/board`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newMeeting)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Oluşturulamadı');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ohs-board-meetings'] });
      toast.success('Toplantı başarıyla oluşturuldu');
      setIsAddDialogOpen(false);
      setMeetingDate('');
      setMeetingNo('');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  // Delete Meeting Mutation
  const deleteMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API}/api/operations/board/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Silinemedi');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ohs-board-meetings'] });
      toast.success('Toplantı silindi');
      setDeleteId(null);
    },
    onError: (error) => toast.error(error.message)
  });

  const handleCreateMeeting = () => {
    if (!meetingDate || !meetingNo) {
      toast.error('Lütfen tarih ve toplantı numarası giriniz.');
      return;
    }

    // Önceki toplantıdaki açık kararları bul
    let openDecisions: any[] = [];
    if (meetings && meetings.length > 0) {
      // Toplantıları tarihe göre sırala
      const sorted = [...meetings].sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());
      const lastMeeting = sorted[0];
      if (lastMeeting.decisions) {
        // Tamamlandı veya İptal Edildi dışındaki açık kararlar
        openDecisions = lastMeeting.decisions
          .filter((d: any) => d.status !== 'Tamamlandı' && d.status !== 'İptal Edildi')
          .map((d: any) => {
             // Sadece temel bilgileri kopyala, ID ve aksiyon geçmişini sıfırla ki yeni bir kayıt gibi olsun
             const { id, decisionNumber, actions, meetingId, createdAt, updatedAt, ...rest } = d;
             return { ...rest, remarks: 'Önceki toplantıdan aktarıldı.' };
          });
      }
    }

    createMeetingMutation.mutate({
      facilityId: selectedFacilityId,
      meetingDate,
      meetingNo,
      decisions: openDecisions
    });
  };

  if (!selectedFacilityId) {
    return (
      <div className="p-6">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-6">
            <p className="text-amber-800 font-medium">Lütfen sol menüden bir tesis seçiniz.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">İSG Kurul Toplantıları</h1>
          <p className="text-muted-foreground mt-1">Aylık kurul toplantılarını ve kararlarını yönetin.</p>
        </div>
        <div className="flex gap-3">
          <select 
            className="flex h-10 w-28 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + 1 - i).map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Yeni Toplantı
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : meetings.length === 0 ? (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Bu tesise ait {selectedYear} yılında henüz bir Kurul Toplantısı bulunmamaktadır.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map((meeting: any) => {
            const date = new Date(meeting.meetingDate).toLocaleDateString('tr-TR');
            const totalDecisions = meeting.decisions?.length || 0;
            const completedDecisions = meeting.decisions?.filter((d: any) => d.status === 'Tamamlandı').length || 0;
            const openDecisions = totalDecisions - completedDecisions;

            return (
              <Card key={meeting.id} className="group hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Toplantı No: {meeting.meetingNo}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5" /> {date}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 -mr-2 -mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(meeting.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">Toplam Karar</span>
                      <span className="font-semibold">{totalDecisions}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">Açık/Devam Eden</span>
                      <span className="font-semibold text-amber-600">{openDecisions}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">Tamamlanan</span>
                      <span className="font-semibold text-green-600">{completedDecisions}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full gap-2" 
                    variant="outline"
                    onClick={() => navigate(`/isg-kurul/meetings/${meeting.id}`)}
                  >
                    Kararları Görüntüle <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Kurul Toplantısı</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Toplantı Numarası</label>
              <Input 
                placeholder="Örn: 2026/01" 
                value={meetingNo} 
                onChange={(e) => setMeetingNo(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Toplantı Tarihi</label>
              <Input 
                type="date" 
                value={meetingDate} 
                onChange={(e) => setMeetingDate(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>İptal</Button>
            <Button onClick={handleCreateMeeting} disabled={createMeetingMutation.isPending}>
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Toplantıyı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu toplantıyı ve içindeki <strong>tüm kararları ile aksiyonlarını</strong> kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMeetingMutation.mutate(deleteId)}
            >
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
