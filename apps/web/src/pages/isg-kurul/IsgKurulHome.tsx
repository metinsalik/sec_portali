import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, Clock, AlertCircle, ArrowRight, Activity, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const API = import.meta.env.VITE_API_URL || '';

export default function IsgKurulHome() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { user } = useAuth();
  const hasAdminAccess = user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management');

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(localStorage.getItem('activeFacilityId') || '');

  useEffect(() => {
    const handleFacilityChange = () => setSelectedFacilityId(localStorage.getItem('activeFacilityId') || '');
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  // Toplantıları çek
  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ['ohs-board-meetings', selectedFacilityId],
    queryFn: async () => {
      if (!selectedFacilityId || selectedFacilityId === 'all') return [];
      const res = await fetch(`${API}/api/operations/board?facilityId=${selectedFacilityId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Toplantılar yüklenemedi');
      return res.json();
    },
    enabled: !!selectedFacilityId && selectedFacilityId !== 'all'
  });

  // Kullanıcının departman kimliği (Gerçek sistemde authContext'ten veya board/members'dan alınmalı)
  // Şimdilik demo veya admin değilse departman id'sini bulmak için tüm kararları gezip "Bana Atananlar" bulacağız
  const { data: userMemberInfo } = useQuery({
    queryKey: ['my-member-info', selectedFacilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/operations/board/members?facilityId=${selectedFacilityId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      const members = await res.json();
      // user.name ile eşleşen member'ı bul
      return members.find((m: any) => m.name === user?.name) || null;
    },
    enabled: !!selectedFacilityId && selectedFacilityId !== 'all'
  });

  if (!selectedFacilityId || selectedFacilityId === 'all') {
    return (
      <div className="p-6 h-[80vh] flex flex-col items-center justify-center">
        <div className="bg-blue-50 text-blue-800 p-8 rounded-2xl max-w-md text-center shadow-sm border border-blue-100">
          <Activity className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          <h2 className="text-xl font-bold mb-2">Tesis Seçiniz</h2>
          <p className="text-blue-700">İSG Kurul Yönetimi operasyonel panelini görüntülemek için lütfen sol üst menüden bir tesis seçin.</p>
        </div>
      </div>
    );
  }

  const upcomingMeetings = meetings.filter((m: any) => ['Taslak', 'Planlandı', 'Çağrı Gönderildi'].includes(m.status || 'Taslak'));
  const pendingApprovalMeetings = meetings.filter((m: any) => m.status === 'Onaya Gönderildi');

  // Bütün toplantıların kararlarını topla
  const allDecisions = meetings.flatMap((m: any) => 
    (m.decisions || []).map((d: any) => ({ ...d, meetingNo: m.meetingNo, meetingId: m.id, meetingDate: m.meetingDate, facilityId: m.facilityId }))
  );

  // Bana/Birimime atanan ve devam eden kararlar
  const myPendingDecisions = allDecisions.filter((d: any) => {
    const isPending = d.status === 'Devam Ediyor' || d.status === 'Sürekli Takip';
    if (!isPending) return false;
    // Eğer admine atanan her şey (ya da şimdilik admin her şeyi görebilir)
    if (hasAdminAccess) return true;
    // Eğer üye bilgisi varsa, kendi departmanını filtrele
    if (userMemberInfo && userMemberInfo.departmentId) {
      return d.responsibleIds?.includes(String(userMemberInfo.departmentId));
    }
    return false;
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Kurul Ana Sayfası</h1>
          <p className="text-muted-foreground mt-1">İSG Kurul toplantılarınız ve operasyonel görevleriniz.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate('/isg-kurul/meetings')}>
            <Calendar className="w-4 h-4" /> Tüm Toplantılar
          </Button>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/isg-kurul/analytics')}>
            <Activity className="w-4 h-4" /> Raporlar & Analiz
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Yaklaşan Toplantılar */}
        <Card className="col-span-1 border-slate-200 shadow-sm bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Yaklaşan Toplantılar
              <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700">{upcomingMeetings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {meetingsLoading ? (
              <div className="p-4 space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
            ) : upcomingMeetings.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingMeetings.slice(0, 5).map((m: any) => (
                  <div key={m.id} className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => navigate(`/isg-kurul/meetings/${m.id}`)}>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{m.meetingNo || 'No Yok'} Toplantısı</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(m.meetingDate).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                    <Badge className={m.status === 'Taslak' ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-amber-100 text-amber-700 border-amber-200'} variant="outline">
                      {m.status || 'Taslak'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p>Planlanmış toplantı bulunmuyor.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Onay Bekleyen Toplantılar */}
        <Card className="col-span-1 border-slate-200 shadow-sm bg-gradient-to-b from-white to-red-50/30 dark:from-slate-900 dark:to-red-900/10">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Onay Bekleyenler
              <Badge variant="secondary" className="ml-auto bg-red-100 text-red-700">{pendingApprovalMeetings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {meetingsLoading ? (
               <div className="p-4 space-y-3"><Skeleton className="h-16 w-full" /></div>
            ) : pendingApprovalMeetings.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingApprovalMeetings.slice(0, 5).map((m: any) => (
                  <div key={m.id} className="p-4 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => navigate(`/isg-kurul/meetings/${m.id}`)}>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{m.meetingNo || 'No Yok'} Toplantısı</div>
                      <div className="text-sm text-red-600/80 flex items-center gap-1 mt-1 font-medium">
                        Onayınıza Sunuldu
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p>Onay bekleyen toplantı yok.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aksiyon Akışı / Bana Atananlar */}
        <Card className="col-span-1 md:col-span-3 lg:col-span-1 border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Bekleyen Kararlarım
              <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-700">{myPendingDecisions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[500px] overflow-y-auto">
            {meetingsLoading ? (
               <div className="p-4 space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
            ) : myPendingDecisions.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {myPendingDecisions.map((d: any) => (
                  <div key={d.id} className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-slate-100 text-slate-600 font-mono text-xs">{d.decisionNumber || '-'}</Badge>
                      <Badge className={d.status === 'Sürekli Takip' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : 'bg-blue-100 text-blue-700 hover:bg-blue-100'} variant="secondary">
                        {d.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-3 mb-3">
                      {d.decisionText || 'Karar metni yok'}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                       <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Term: {d.deadline ? new Date(d.deadline).toLocaleDateString('tr-TR') : 'Belirtilmedi'}
                       </span>
                       <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => navigate(`/isg-kurul/meetings/${d.meetingId}`)}>
                         Detay <ArrowRight className="w-3 h-3 ml-1" />
                       </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-400 opacity-50" />
                <p className="font-medium text-slate-600 dark:text-slate-300">Tebrikler!</p>
                <p className="text-sm mt-1">Bekleyen bir kararınız bulunmuyor.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
      </div>

      {/* Son Alınan Tüm Kararlar Tablosu (Analytics'ten getirildi) */}
      <Card className="mt-8 shadow-sm">
        <CardHeader className="pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-800">Tesisin Tüm Kurul Kararları</CardTitle>
            <p className="text-xs text-muted-foreground">Son toplantıdan geriye doğru tarihsel sıralama</p>
          </div>
          <Button variant="ghost" size="sm" className="text-blue-600 text-xs font-semibold gap-1 hover:bg-blue-50" onClick={() => navigate('/isg-kurul/decisions')}>
            Tüm Kararlar <ArrowRight className="w-3 h-3" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            {meetingsLoading ? (
              <div className="p-4 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            ) : allDecisions.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] text-slate-500 bg-slate-50 uppercase font-semibold sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-5 py-3">Toplantı</th>
                    <th className="px-5 py-3">Karar</th>
                    <th className="px-5 py-3">Termin</th>
                    <th className="px-5 py-3 text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allDecisions.sort((a: any, b: any) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime()).map((d: any) => {
                    const isOverdue = d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'Tamamlandı' && d.status !== 'İptal Edildi';
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/70 transition-colors cursor-pointer group" onClick={() => navigate(`/isg-kurul/meetings/${d.meetingId}`)}>
                        <td className="px-5 py-4 whitespace-nowrap align-top">
                          <span className="block font-bold text-slate-800">No: {d.meetingNo}</span>
                          <span className="text-xs text-slate-500">{new Date(d.meetingDate).toLocaleDateString('tr-TR')}</span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <p className="line-clamp-2 text-slate-700 text-[13px] leading-relaxed group-hover:text-blue-700 transition-colors" title={d.decisionText}>{d.decisionText}</p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap align-top">
                          <span className={`text-[13px] ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-700'}`}>
                            {d.dueDateType === 'DATE' && d.dueDate ? new Date(d.dueDate).toLocaleDateString('tr-TR') : d.periodicity || '-'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap align-top space-y-1.5 flex flex-col items-end">
                          <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border block w-max ${isOverdue ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                            {isOverdue ? `Gecikmiş - ${d.status}` : d.status}
                          </Badge>
                          <Badge variant="outline" className={`rounded-full px-2 py-0.5 text-[10px] font-medium border block w-max ${
                            d.priority === 'CRITICAL' ? 'bg-red-600 text-white border-red-700' : 
                            d.priority === 'HIGH' ? 'bg-red-100 text-red-700 border-red-200' : 
                            d.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                            'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}>
                            {d.priority === 'CRITICAL' ? 'Tolere Gösterilmez Risk' : 
                             d.priority === 'HIGH' ? 'Önemli Risk' : 
                             d.priority === 'MEDIUM' ? 'Dikkate Değer Risk' : 'Kabul Edilebilir Risk'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-10 text-center text-muted-foreground flex flex-col items-center justify-center">
                <CheckCircle2 className="w-12 h-12 mb-4 text-slate-300" />
                <p>Bu tesise ait hiçbir kurul kararı bulunmuyor.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
