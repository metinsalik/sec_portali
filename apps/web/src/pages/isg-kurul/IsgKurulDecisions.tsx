import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Banknote, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const normalizePriority = (p: string) => {
  if (p === 'Kritik') return 'Tolere Gösterilmez Risk';
  if (p === 'Yüksek Riskli') return 'Yüksek Risk';
  if (p === 'Riskli') return 'Önemli Risk';
  if (p === 'Orta') return 'Olası Risk';
  if (p === 'Düşük') return 'Önemsiz Risk';
  return p || 'Belirtilmedi';
};

const API = import.meta.env.VITE_API_URL || '';

export default function IsgKurulDecisions() {
  const selectedFacilityId = localStorage.getItem('activeFacilityId') || '';
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const [search, setSearch] = useState('');

  // Queries
  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['ohs-board-meetings', selectedFacilityId],
    queryFn: async () => {
      if (!selectedFacilityId) return [];
      const res = await fetch(`${API}/api/operations/board?facilityId=${selectedFacilityId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Toplantılar yüklenemedi');
      return res.json();
    },
    enabled: !!selectedFacilityId
  });

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/settings/definitions/departments`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    }
  });

  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['settings-facilities'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/settings/facilities`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    }
  });

  const allDecisions = useMemo(() => {
    let list: any[] = [];
    meetings.forEach((m: any) => {
      if (m.decisions) {
        m.decisions.forEach((d: any) => {
          list.push({
            ...d,
            meetingId: m.id,
            meetingDate: new Date(m.meetingDate),
            meetingNo: m.meetingNo,
            facilityId: m.facilityId
          });
        });
      }
    });
    return list.sort((a, b) => b.meetingDate.getTime() - a.meetingDate.getTime());
  }, [meetings]);

  const filteredDecisions = useMemo(() => {
    return allDecisions.filter(d => {
      const matchSearch = search ? 
        (d.decisionText?.toLowerCase() || '').includes(search.toLowerCase()) || 
        (d.decisionNumber || '').includes(search) : true;
      return matchSearch;
    });
  }, [allDecisions, search]);

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
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tüm Kurul Kararları</h1>
          <p className="text-muted-foreground mt-1">Alınan tüm kararların listesi.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Karar metni veya numarası ile ara..." 
            className="w-full bg-slate-50 h-10 pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-slate-500 bg-slate-50 uppercase font-semibold sticky top-0 z-10 shadow-sm border-b">
                <tr>
                  {selectedFacilityId === 'all' && <th className="px-5 py-3">Tesis</th>}
                  <th className="px-5 py-3">Toplantı</th>
                  <th className="px-5 py-3">Karar Numarası</th>
                  <th className="px-5 py-3">Karar</th>
                  <th className="px-5 py-3">Sorumlu</th>
                  <th className="px-5 py-3">Termin</th>
                  <th className="px-5 py-3 text-right">Durum / Öncelik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">Yükleniyor...</td>
                  </tr>
                ) : filteredDecisions.length > 0 ? filteredDecisions.map(d => {
                  const dept = departments.find((dept: any) => dept.id === d.departmentId);
                  const isOverdue = d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'Tamamlandı' && d.status !== 'İptal Edildi';
                  const facility = facilities.find((f: any) => f.id === d.facilityId);
                  
                  let budget = null;
                  if (d.actions) {
                    for (const a of d.actions) {
                      const match = a.actionText?.match(/\[Tahmini Bütçe:\s*(.*?)\]/);
                      if (match) {
                        budget = match[1];
                        break;
                      }
                    }
                  }
                  
                  return (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors cursor-pointer group" onClick={() => navigate(`/isg-kurul/meetings/${d.meetingId}/decisions/${d.id}`)}>
                    {selectedFacilityId === 'all' && (
                      <td className="px-5 py-4 align-top whitespace-nowrap">
                        <span className="text-[13px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">{facility?.shortName || facility?.name || '-'}</span>
                      </td>
                    )}
                    <td className="px-5 py-4 whitespace-nowrap align-top">
                      <span className="block font-bold text-slate-800">No: {d.meetingNo}</span>
                      <span className="text-xs text-slate-500">{new Date(d.meetingDate).toLocaleDateString('tr-TR')}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap align-top font-medium">
                      {d.decisionNumber || '-'}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="line-clamp-3 text-slate-700 text-[13px] leading-relaxed group-hover:text-blue-700 transition-colors" title={d.decisionText}>{d.decisionText}</p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className="text-slate-600 text-[13px] leading-tight block w-32">{dept?.name || '-'}</span>
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
                        normalizePriority(d.priority) === 'Tolere Gösterilmez Risk' ? 'bg-red-600 text-white border-red-700' : 
                        normalizePriority(d.priority) === 'Yüksek Risk' ? 'bg-orange-500 text-white border-orange-600' :
                        normalizePriority(d.priority) === 'Önemli Risk' ? 'bg-amber-400 text-slate-900 border-amber-500' :
                        normalizePriority(d.priority) === 'Olası Risk' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        normalizePriority(d.priority) === 'Önemsiz Risk' ? 'bg-green-500 text-white border-green-600' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {normalizePriority(d.priority)}
                      </Badge>
                      {budget && (
                        <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] font-medium border border-green-200 bg-green-50 text-green-700 flex items-center gap-1 w-max">
                          <Banknote className="w-3 h-3" />
                          {budget}
                        </Badge>
                      )}
                    </td>
                  </tr>
                )
                }) : (
                  <tr>
                    <td colSpan={selectedFacilityId === 'all' ? 7 : 6} className="px-5 py-12 text-center text-slate-400 text-sm">Filtrelere uygun karar bulunamadı.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
