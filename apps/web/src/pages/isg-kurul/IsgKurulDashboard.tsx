import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, Banknote } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API = import.meta.env.VITE_API_URL || '';

const COLORS = {
  'Devam Ediyor': '#3b82f6', // blue-500
  'Tamamlandı': '#22c55e',   // green-500
  'İptal Edildi': '#8b5cf6', // violet-500
  'Başlamadı': '#64748b',    // slate-500
  'Sürekli Takip': '#f59e0b',// amber-500
  'Belirsiz': '#ef4444'      // red-500
};

const PRIORITY_COLORS: Record<string, string> = {
  'Kritik': '#dc2626', // red-600
  'Yüksek Riskli': '#f97316', // orange-500
  'Riskli': '#fbbf24', // amber-400
  'Orta': '#22c55e', // green-500
  'Düşük': '#15803d', // green-700
  'Belirtilmedi': '#f1f5f9'
};

const PRIORITY_WEIGHTS: Record<string, number> = {
  'Kritik': 5,
  'Yüksek Riskli': 4,
  'Riskli': 3,
  'Orta': 2,
  'Düşük': 1,
};

export default function IsgKurulDashboard({ isPublic = false }: { isPublic?: boolean }) {
  const activeFacilityId = localStorage.getItem('activeFacilityId') || '';
  const [searchParams, setSearchParams] = useSearchParams();
  const urlAgeBucket = searchParams.get('ageBucket') || 'all';
  const urlFacilityId = searchParams.get('facility') || 'all';

  const [publicFacilityId, setPublicFacilityId] = useState('all');
  const effectiveFacilityId = isPublic ? publicFacilityId : activeFacilityId;
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // Filters state
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('all');
  const [meetingId, setMeetingId] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [departmentId, setDepartmentId] = useState('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'overdue' | 'next30' | 'undefinedTerm' | 'closed'>('all');
  
  // Public dialog state
  const [selectedPublicDecision, setSelectedPublicDecision] = useState<any>(null);

  // Queries
  const { data: publicData, isLoading: publicLoading } = useQuery({
    queryKey: ['public-dashboard', effectiveFacilityId],
    queryFn: async () => {
      const url = effectiveFacilityId && effectiveFacilityId !== 'all' 
        ? `${API}/api/public/isg-kurul/dashboard?facilityId=${effectiveFacilityId}`
        : `${API}/api/public/isg-kurul/dashboard`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Veriler yüklenemedi');
      return res.json();
    },
    enabled: isPublic
  });

  const { data: authMeetings = [] } = useQuery({
    queryKey: ['ohs-board-meetings', effectiveFacilityId],
    queryFn: async () => {
      if (!effectiveFacilityId) return [];
      const res = await fetch(`${API}/api/operations/board?facilityId=${effectiveFacilityId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Toplantılar yüklenemedi');
      return res.json();
    },
    enabled: !isPublic && !!effectiveFacilityId
  });

  const { data: authCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/settings/definitions/categories`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !isPublic
  });

  const { data: authDepartments = [] } = useQuery<any[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/settings/definitions/departments`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !isPublic
  });

  const { data: authFacilities = [] } = useQuery<any[]>({
    queryKey: ['settings-facilities'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/settings/facilities`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !isPublic
  });

  const meetings = isPublic ? (publicData?.meetings || []) : authMeetings;
  const categories = isPublic ? (publicData?.categories || []) : authCategories;
  const departments = isPublic ? (publicData?.departments || []) : authDepartments;
  const facilities = isPublic ? (publicData?.facilities || []) : authFacilities;

  // Unique Years & Filtered Meetings
  const allDecisionsUnfiltered = useMemo(() => {
    let list: any[] = [];
    meetings.forEach((m: any) => {
      if (m.decisions) {
        m.decisions.forEach((d: any) => {
          list.push({
            ...d,
            meetingId: m.id,
            meetingDate: new Date(m.meetingDate),
            meetingNo: m.meetingNo,
            year: new Date(m.meetingDate).getFullYear().toString()
          });
        });
      }
    });
    return list;
  }, [meetings]);

  const uniqueYears = Array.from(new Set(meetings.map((m: any) => new Date(m.meetingDate).getFullYear().toString()))).sort((a,b) => b.localeCompare(a));
  const meetingsForSelectedYear = useMemo(() => {
    let mtgs = year === 'all' ? meetings : meetings.filter((m: any) => new Date(m.meetingDate).getFullYear().toString() === year);
    return mtgs.sort((a,b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());
  }, [meetings, year]);

  // Apply Filters
  const decisionsWithoutTimeFilter = useMemo(() => {
    return allDecisionsUnfiltered.filter(d => {
      const matchSearch = search ? (d.decisionText?.toLowerCase() || '').includes(search.toLowerCase()) || (d.decisionNumber || '').includes(search) : true;
      const matchYear = year !== 'all' ? d.year === year : true;
      const matchMeeting = meetingId !== 'all' ? d.meetingId === meetingId : true;
      const matchCategory = categoryId !== 'all' ? d.categoryId?.toString() === categoryId : true;
      const matchStatus = status !== 'all' ? d.status === status : true;
      const matchPriority = priority !== 'all' ? d.priority === priority : true;
      const matchDepartment = departmentId !== 'all' ? d.departmentId?.toString() === departmentId : true;
      
      return matchSearch && matchYear && matchMeeting && matchCategory && matchStatus && matchPriority && matchDepartment;
    });
  }, [allDecisionsUnfiltered, search, year, meetingId, categoryId, status, priority, departmentId]);

  // Apply Time Filters
  const filteredDecisions = useMemo(() => {
    return decisionsWithoutTimeFilter.filter(d => {
      let matchTime = true;
      if (timeFilter !== 'all') {
        const isClosed = d.status === 'Tamamlandı' || d.status === 'İptal Edildi';
        if (timeFilter === 'closed') {
          matchTime = isClosed;
        } else if (!isClosed) {
          const now = new Date();
          if (timeFilter === 'overdue') {
            matchTime = d.dueDateType === 'DATE' && d.dueDate && new Date(d.dueDate) < now;
          } else if (timeFilter === 'next30') {
            if (d.dueDateType === 'DATE' && d.dueDate) {
              const diffDays = Math.ceil((new Date(d.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              matchTime = diffDays >= 0 && diffDays <= 30;
            } else {
              matchTime = false;
            }
          } else if (timeFilter === 'undefinedTerm') {
            matchTime = d.dueDateType !== 'DATE' || !d.dueDate;
          }
        } else {
          matchTime = false; // if it's closed and we're looking for overdue/next30, it doesn't match
        }
      }

      return matchTime;
    });
  }, [decisionsWithoutTimeFilter, timeFilter]);

  const badgeCounts = useMemo(() => {
    const total = decisionsWithoutTimeFilter.length;
    const openList = decisionsWithoutTimeFilter.filter(d => d.status !== 'Tamamlandı' && d.status !== 'İptal Edildi');
    const now = new Date();
    
    const overdue = openList.filter(d => d.dueDateType === 'DATE' && d.dueDate && new Date(d.dueDate) < now).length;
    const next30Days = openList.filter(d => {
      if (d.dueDateType !== 'DATE' || !d.dueDate) return false;
      const diffTime = new Date(d.dueDate).getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }).length;
    
    const undefinedTerm = openList.filter(d => d.dueDateType !== 'DATE' || !d.dueDate).length;
    
    return { total, overdue, next30Days, undefinedTerm };
  }, [decisionsWithoutTimeFilter]);

  // Handle Chart Clicks
  const onPieClick = (data: any, type: 'status' | 'priority') => {
    if (data && data.name) {
      if (type === 'status') {
        setStatus(data.name === status ? 'all' : data.name);
      } else {
        setPriority(data.name === priority ? 'all' : data.name);
      }
    }
  };

  // Compute KPIs
  const kpis = useMemo(() => {
    const total = filteredDecisions.length;
    const completed = filteredDecisions.filter(d => d.status === 'Tamamlandı').length;
    const canceled = filteredDecisions.filter(d => d.status === 'İptal Edildi').length;
    const closed = completed + canceled;
    const openList = filteredDecisions.filter(d => d.status !== 'Tamamlandı' && d.status !== 'İptal Edildi');
    
    const now = new Date();
    const overdue = openList.filter(d => d.dueDateType === 'DATE' && d.dueDate && new Date(d.dueDate) < now).length;
    const next30Days = openList.filter(d => {
      if (d.dueDateType !== 'DATE' || !d.dueDate) return false;
      const diffTime = new Date(d.dueDate).getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }).length;
    
    const undefinedTerm = openList.filter(d => d.dueDateType !== 'DATE' || !d.dueDate).length;
    const completionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    return { total, open: openList.length, overdue, completionRate, closed, undefinedTerm, next30Days };
  }, [filteredDecisions]);

  // Chart Data: Status Distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredDecisions.forEach(d => {
      counts[d.status] = (counts[d.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filteredDecisions]);

  // Chart Data: Priority Distribution
  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredDecisions.forEach(d => {
      const p = d.priority || 'Belirtilmedi';
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => (PRIORITY_WEIGHTS[b.name] || 0) - (PRIORITY_WEIGHTS[a.name] || 0));
  }, [filteredDecisions]);

  // Chart Data: Monthly Flow
  const monthlyData = useMemo(() => {
    const counts: Record<string, { name: string, Açık: number, Kapalı: number, total: number }> = {};
    filteredDecisions.forEach(d => {
      const dDate = new Date(d.meetingDate);
      const monthKey = `${dDate.getFullYear().toString().slice(2)}-${(dDate.getMonth()+1).toString().padStart(2, '0')}`;
      if (!counts[monthKey]) counts[monthKey] = { name: monthKey, Açık: 0, Kapalı: 0, total: 0 };
      counts[monthKey].Açık += (d.status !== 'Tamamlandı' && d.status !== 'İptal Edildi' ? 1 : 0);
      counts[monthKey].Kapalı += (d.status === 'Tamamlandı' || d.status === 'İptal Edildi' ? 1 : 0);
      counts[monthKey].total += 1;
    });
    return Object.entries(counts).map(([name, data]) => ({ name, ...data })).sort((a,b) => a.name.localeCompare(b.name));
  }, [filteredDecisions]);

  // Open Task Age
  const openTaskAge = useMemo(() => {
    const openList = filteredDecisions.filter(d => d.status !== 'Tamamlandı' && d.status !== 'İptal Edildi');
    const now = new Date().getTime();
    let r0_30 = 0, r31_60 = 0, r61_90 = 0, r91_180 = 0, r180plus = 0;
    
    openList.forEach(d => {
      const diffTime = now - new Date(d.meetingDate).getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) r0_30++;
      else if (diffDays <= 60) r31_60++;
      else if (diffDays <= 90) r61_90++;
      else if (diffDays <= 180) r91_180++;
      else r180plus++;
    });
    
    return [
      { id: '0-30', label: '0-30 Gün', count: r0_30, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', active: 'ring-2 ring-emerald-500 bg-emerald-100' },
      { id: '31-60', label: '31-60 Gün', count: r31_60, color: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100', active: 'ring-2 ring-yellow-500 bg-yellow-100' },
      { id: '61-90', label: '61-90 Gün', count: r61_90, color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100', active: 'ring-2 ring-orange-500 bg-orange-100' },
      { id: '91-180', label: '91-180 Gün', count: r91_180, color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100', active: 'ring-2 ring-red-500 bg-red-100' },
      { id: '180+', label: '180+ Gün', count: r180plus, color: 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 font-bold', active: 'ring-2 ring-rose-600 bg-rose-200' }
    ];
  }, [filteredDecisions]);

  // Final Filtered Decisions (Applies URL filters)
  const finalFilteredDecisions = useMemo(() => {
    return filteredDecisions.filter(d => {
      const isClosed = d.status === 'Tamamlandı' || d.status === 'İptal Edildi';
      
      // Age Bucket Filter
      if (urlAgeBucket !== 'all' && !isClosed) {
        const diffTime = new Date().getTime() - new Date(d.meetingDate).getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (urlAgeBucket === '0-30' && diffDays > 30) return false;
        if (urlAgeBucket === '31-60' && (diffDays <= 30 || diffDays > 60)) return false;
        if (urlAgeBucket === '61-90' && (diffDays <= 60 || diffDays > 90)) return false;
        if (urlAgeBucket === '91-180' && (diffDays <= 90 || diffDays > 180)) return false;
        if (urlAgeBucket === '180+' && diffDays <= 180) return false;
      }
      
      // Facility Filter
      if (urlFacilityId !== 'all') {
        const meeting = meetings.find((m: any) => m.id === d.meetingId);
        if (meeting?.facilityId !== urlFacilityId) return false;
      }
      
      return true;
    });
  }, [filteredDecisions, urlAgeBucket, urlFacilityId, meetings]);

  // Distribution by facility for the current filters (including time filter via KPIs)
  const facilityDistribution = useMemo(() => {
    // First, filter by the age bucket but NOT by the specific facility
    const bucketDecisions = filteredDecisions.filter(d => {
      const isClosed = d.status === 'Tamamlandı' || d.status === 'İptal Edildi';
      if (isClosed) return false;
      if (urlAgeBucket !== 'all') {
        const diffTime = new Date().getTime() - new Date(d.meetingDate).getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (urlAgeBucket === '0-30' && diffDays > 30) return false;
        if (urlAgeBucket === '31-60' && (diffDays <= 30 || diffDays > 60)) return false;
        if (urlAgeBucket === '61-90' && (diffDays <= 60 || diffDays > 90)) return false;
        if (urlAgeBucket === '91-180' && (diffDays <= 90 || diffDays > 180)) return false;
        if (urlAgeBucket === '180+' && diffDays <= 180) return false;
      }
      return true;
    });

    const dist: Record<string, number> = {};
    bucketDecisions.forEach(d => {
      const meeting = meetings.find((m: any) => m.id === d.meetingId);
      const facilityId = meeting?.facilityId;
      if (facilityId) {
        dist[facilityId] = (dist[facilityId] || 0) + 1;
      }
    });

    return Object.entries(dist).map(([fId, count]) => {
      const f = facilities.find((f: any) => f.id === fId);
      return {
        id: fId,
        name: f?.shortName || f?.name || 'Bilinmiyor',
        count
      };
    }).sort((a, b) => b.count - a.count);
  }, [filteredDecisions, urlAgeBucket, meetings, facilities]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* Top Search Bar */}
      <div className="bg-white p-4 rounded-lg border shadow-sm mb-4">
        <Input 
          placeholder="Karar, numarası, sorumlu, toplantı veya kelime ara..." 
          className="w-full bg-slate-50 h-11 text-base"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>



      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-lg border shadow-sm flex flex-wrap gap-3 items-center mb-6">
        {isPublic && (
          <Select value={publicFacilityId} onValueChange={setPublicFacilityId}>
            <SelectTrigger className="w-[180px] bg-slate-50 h-9 text-sm">
              <SelectValue placeholder="Tüm Tesisler">
                {publicFacilityId === 'all' ? 'Tüm Tesisler' : facilities.find((f:any) => f.id === publicFacilityId)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Tesisler</SelectItem>
              {facilities.map((f: any) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={year} onValueChange={(v) => { setYear(v); setMeetingId('all'); }}>
          <SelectTrigger className="w-[140px] bg-slate-50 h-9 text-sm">
            <SelectValue placeholder="Tüm Yıllar">{year === 'all' ? 'Tüm Yıllar' : year}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Yıllar</SelectItem>
            {uniqueYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={meetingId} onValueChange={setMeetingId}>
          <SelectTrigger className="w-[200px] bg-slate-50 h-9 text-sm">
            <SelectValue placeholder="Tüm Toplantılar">
              {meetingId === 'all' ? 'Tüm Toplantılar' : `Toplantı: ${meetings.find((m:any) => m.id === meetingId)?.meetingNo || meetingId}`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Toplantılar</SelectItem>
            {meetingsForSelectedYear.map(m => (
              <SelectItem key={m.id} value={m.id}>Toplantı: {m.meetingNo} ({new Date(m.meetingDate).toLocaleDateString('tr-TR')})</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-[220px] bg-slate-50 h-9 text-sm">
            <SelectValue placeholder="Tüm Kategoriler">
              {categoryId === 'all' ? 'Tüm Kategoriler' : (categories.find((c:any) => c.id.toString() === categoryId)?.name || categoryId)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {categories.map((c:any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px] bg-slate-50 h-9 text-sm">
            <SelectValue placeholder="Tüm Durumlar">{status === 'all' ? 'Tüm Durumlar' : status}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            {['Başlamadı', 'Devam Ediyor', 'Tamamlandı', 'İptal Edildi', 'Sürekli Takip', 'Belirsiz'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-[160px] bg-slate-50 h-9 text-sm">
            <SelectValue placeholder="Tüm Öncelikler">{priority === 'all' ? 'Tüm Öncelikler' : priority}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Öncelikler</SelectItem>
            {['Kritik', 'Yüksek Riskli', 'Riskli', 'Orta', 'Düşük'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="w-[220px] bg-slate-50 h-9 text-sm">
            <SelectValue placeholder="Tüm Sorumlu Gruplar">
              {departmentId === 'all' ? 'Tüm Sorumlu Gruplar' : (departments.find((d:any) => d.id.toString() === departmentId)?.name || departmentId)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Sorumlu Gruplar</SelectItem>
            {departments.map((d:any) => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className={`grid grid-cols-2 md:grid-cols-3 ${effectiveFacilityId === 'all' ? 'lg:grid-cols-7' : 'lg:grid-cols-6'} gap-4`}>
        {effectiveFacilityId === 'all' && (
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-bl-full -mr-8 -mt-8 opacity-60" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 relative z-10">Tesis Sayısı</p>
              <h3 className="text-3xl font-black text-slate-800 relative z-10">{new Set(meetings.map((m: any) => m.facilityId)).size}</h3>
              <p className="text-xs text-slate-500 mt-1 relative z-10">Kapsamdaki tesisler</p>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-bl-full -mr-8 -mt-8 opacity-60" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 relative z-10">Açık İş</p>
            <h3 className="text-3xl font-black text-slate-800 relative z-10">{kpis.open}</h3>
            <p className="text-xs text-slate-500 mt-1 relative z-10">%{(kpis.total ? Math.round(100 - kpis.completionRate) : 0)} karar kapanmamış</p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-slate-200 cursor-pointer transition-colors ${timeFilter === 'all' ? 'ring-2 ring-indigo-500' : 'hover:bg-slate-50'}`} onClick={() => setTimeFilter('all')}>
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100 rounded-bl-full -mr-8 -mt-8 opacity-60" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 relative z-10">Tümü</p>
            <h3 className="text-3xl font-black text-slate-800 relative z-10">{kpis.total}</h3>
            <p className="text-xs text-slate-500 mt-1 relative z-10">Toplam Kurul Kararı</p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-red-200 cursor-pointer transition-colors ${timeFilter === 'overdue' ? 'ring-2 ring-red-500 bg-red-50' : 'hover:bg-red-50/70 bg-red-50/30'}`} onClick={() => setTimeFilter('overdue')}>
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-100 rounded-bl-full -mr-8 -mt-8 opacity-60" />
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 relative z-10">Gecikmiş</p>
            <h3 className="text-3xl font-black text-red-800 relative z-10">{kpis.overdue}</h3>
            <p className="text-xs text-red-500 mt-1 relative z-10">Termini geçen kararlar</p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-amber-200 cursor-pointer transition-colors ${timeFilter === 'next30' ? 'ring-2 ring-amber-500 bg-amber-50' : 'hover:bg-amber-50/70 bg-amber-50/30'}`} onClick={() => setTimeFilter('next30')}>
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-bl-full -mr-8 -mt-8 opacity-60" />
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 relative z-10">30 Gün İçinde</p>
            <h3 className="text-3xl font-black text-amber-800 relative z-10">{kpis.next30Days}</h3>
            <p className="text-xs text-amber-600 mt-1 relative z-10">Yaklaşan terminler</p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-slate-200 cursor-pointer transition-colors ${timeFilter === 'undefinedTerm' ? 'ring-2 ring-slate-400' : 'hover:bg-slate-50'}`} onClick={() => setTimeFilter('undefinedTerm')}>
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100 rounded-bl-full -mr-8 -mt-8 opacity-60" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 relative z-10">Termin Yok</p>
            <h3 className="text-3xl font-black text-slate-800 relative z-10">{kpis.undefinedTerm}</h3>
            <p className="text-xs text-slate-500 mt-1 relative z-10">Belirsiz/Sürekli kararlar</p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-green-200 cursor-pointer transition-colors ${timeFilter === 'closed' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-green-50/70 bg-green-50/30'}`} onClick={() => setTimeFilter('closed')}>
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 rounded-bl-full -mr-8 -mt-8 opacity-60" />
            <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2 relative z-10">Kapalı</p>
            <h3 className="text-3xl font-black text-green-800 relative z-10">{kpis.closed}</h3>
            <p className="text-xs text-green-600 mt-1 relative z-10">Tamamlanan/İptal edilen</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Status, Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        
        {/* Status Distribution */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">Durum Dağılımı</CardTitle>
            <p className="text-[10px] text-muted-foreground">Filtrelemek için dilime tıklayın</p>
          </CardHeader>
          <CardContent className="p-4 flex flex-col items-center justify-center gap-4">
            <div className="w-[140px] h-[140px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value" stroke="none">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.name] || '#cbd5e1'} onClick={() => onPieClick(entry, 'status')} className="cursor-pointer hover:opacity-80 transition-opacity" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-slate-800">{kpis.total}</span>
              </div>
            </div>
            <div className="space-y-2 w-full">
              {statusData.map(s => (
                <div key={s.name} onClick={() => onPieClick(s, 'status')} className={`flex justify-between items-center text-[11px] w-full gap-2 cursor-pointer hover:bg-slate-50 p-1 -m-1 rounded transition-colors ${status === s.name ? 'ring-1 ring-blue-200 bg-blue-50/50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: (COLORS as any)[s.name] || '#cbd5e1' }} />
                    <span className="text-slate-600 font-medium truncate">{s.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">Öncelik Dağılımı</CardTitle>
            <p className="text-[10px] text-muted-foreground">Filtrelemek için dilime tıklayın</p>
          </CardHeader>
          <CardContent className="p-4 flex flex-col items-center justify-center gap-4">
            <div className="w-[140px] h-[140px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value" stroke="none">
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={(PRIORITY_COLORS as any)[entry.name] || '#cbd5e1'} onClick={() => onPieClick(entry, 'priority')} className="cursor-pointer hover:opacity-80 transition-opacity" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-slate-800">{kpis.total}</span>
              </div>
            </div>
            <div className="space-y-2 w-full">
              {priorityData.map(s => (
                <div key={s.name} onClick={() => onPieClick(s, 'priority')} className={`flex justify-between items-center text-[11px] w-full gap-2 cursor-pointer hover:bg-slate-50 p-1 -m-1 rounded transition-colors ${priority === s.name ? 'ring-1 ring-blue-200 bg-blue-50/50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: (PRIORITY_COLORS as any)[s.name] || '#cbd5e1' }} />
                    <span className="text-slate-600 font-medium truncate">{s.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Flow and Age */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        
        {/* Monthly Flow */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">Aylık Karar Akışı</CardTitle>
            <p className="text-xs text-muted-foreground">Alınan karar ve kapanan iş hacmi</p>
          </CardHeader>
          <CardContent className="p-6 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData.slice(-12)} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="Kapalı" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Açık" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    <LabelList 
                      dataKey="total" 
                      position="top" 
                      fill="#64748b"
                      fontSize={12} 
                      fontWeight="bold"
                      formatter={(val: number) => val > 0 ? val : ''} 
                    />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Open Task Age */}
        <Card className="shadow-sm relative">
          <CardHeader className="pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">Açık İş Yaşı</CardTitle>
              <p className="text-xs text-muted-foreground">Toplantı tarihinden bugüne bekleme süresi</p>
            </div>
            {urlAgeBucket !== 'all' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                onClick={() => { searchParams.delete('ageBucket'); searchParams.delete('facility'); setSearchParams(searchParams); }}
              >
                Filtreyi Temizle
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-center gap-4 h-[250px]">
            {openTaskAge.map(t => {
              const max = Math.max(...openTaskAge.map(o => o.count), 1);
              const percent = (t.count / max) * 100;
              const isDanger = t.label === '180+ Gün' && t.count > 0;
              const isActive = urlAgeBucket === t.id;
              return (
                <div 
                  key={t.id} 
                  className={`flex items-center gap-3 cursor-pointer p-1.5 -mx-1.5 rounded transition-colors ${isActive ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-slate-50'}`}
                  onClick={() => {
                    if (isActive) {
                      searchParams.delete('ageBucket');
                      searchParams.delete('facility');
                    } else {
                      searchParams.set('ageBucket', t.id);
                      searchParams.delete('facility');
                    }
                    setSearchParams(searchParams);
                  }}
                >
                  <span className={`w-[70px] text-xs font-medium shrink-0 ${isActive ? 'text-indigo-700' : 'text-slate-600'}`}>{t.label}</span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isDanger ? 'bg-red-500' : (isActive ? 'bg-indigo-500' : 'bg-slate-300')}`} 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className={`w-6 text-right text-sm font-bold ${isActive ? 'text-indigo-700' : 'text-slate-800'}`}>{t.count}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Workload Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Category Workload */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">Kategorilere Göre İş Yükü</CardTitle>
            <p className="text-xs text-muted-foreground">Açık kararların kategorilere dağılımı</p>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {categoryWorkloadData.length > 0 ? categoryWorkloadData.map(w => {
              const max = Math.max(...categoryWorkloadData.map(d => d.value), 1);
              const percent = (w.value / max) * 100;
              return (
                <div key={w.name} className="flex items-center gap-4 group">
                  <span className="w-[120px] text-xs font-medium text-slate-700 truncate cursor-help" title={w.name}>{w.name}</span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full group-hover:bg-indigo-600 transition-colors" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-4 text-right text-sm font-bold text-slate-800">{w.value}</span>
                </div>
              )
            }) : (
              <div className="text-center py-10 text-slate-400 text-sm">Açık iş yükü bulunmuyor.</div>
            )}
          </CardContent>
        </Card>

        {/* Responsible Workload */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">Sorumlu İş Yükü</CardTitle>
            <p className="text-xs text-muted-foreground">Açık kararların birim gruplarına dağılımı</p>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {workloadData.length > 0 ? workloadData.map(w => {
              const max = Math.max(...workloadData.map(d => d.value), 1);
              const percent = (w.value / max) * 100;
              return (
                <div key={w.name} className="flex items-center gap-4 group">
                  <span className="w-[120px] text-xs font-medium text-slate-700 truncate cursor-help" title={w.name}>{w.name}</span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full group-hover:bg-blue-600 transition-colors" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-4 text-right text-sm font-bold text-slate-800">{w.value}</span>
                </div>
              )
            }) : (
              <div className="text-center py-10 text-slate-400 text-sm">Açık iş yükü bulunmuyor.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tesis Bazlı Dağılım Grafiği (Sadece Yöneticiler İçin) */}
      {effectiveFacilityId === 'all' && facilityDistribution.length > 0 && (
        <Card className="shadow-sm mb-6 border-indigo-100 mt-4 relative">
          <CardHeader className="pb-2 border-b border-indigo-50/50 flex flex-row items-center justify-between bg-indigo-50/30">
            <div>
              <CardTitle className="text-base font-bold text-indigo-900">
                Tesislerin Karar Dağılımı {urlAgeBucket !== 'all' ? `(${openTaskAge.find(b => b.id === urlAgeBucket)?.label} Bekleyen)` : ''}
              </CardTitle>
              <p className="text-xs text-indigo-700/70">Toplam karar dağılımı (Adet)</p>
            </div>
            {urlFacilityId !== 'all' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-3 text-xs bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-semibold shadow-sm"
                onClick={() => { searchParams.delete('facility'); setSearchParams(searchParams); }}
              >
                Tüm Tesisleri Göster
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-6 h-[250px] bg-white">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facilityDistribution} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Bar 
                  dataKey="count" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={50} 
                  name="Karar Sayısı"
                  cursor="pointer"
                  onClick={(data: any) => {
                    if (data && data.id) {
                      if (urlFacilityId === data.id) {
                        searchParams.delete('facility');
                      } else {
                        searchParams.set('facility', data.id);
                      }
                      setSearchParams(searchParams);
                    }
                  }}
                >
                  {
                    facilityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={urlFacilityId === 'all' || urlFacilityId === entry.id ? '#4f46e5' : '#cbd5e1'} />
                    ))
                  }
                  <LabelList dataKey="count" position="top" style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Row 4: Filtered Tasks Table */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap mb-2">
            <Badge 
              variant="secondary" 
              className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${timeFilter === 'all' ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`} 
              onClick={() => setTimeFilter('all')}
            >
              Tümü - {badgeCounts.total}
            </Badge>
            <Badge 
              variant="secondary" 
              className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${timeFilter === 'closed' ? 'bg-green-600 text-white hover:bg-green-700 border-transparent' : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'}`} 
              onClick={() => setTimeFilter('closed')}
            >
              Kapalı - {kpis.closed}
            </Badge>
            <Badge 
              variant="secondary" 
              className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${timeFilter === 'overdue' ? 'bg-red-600 text-white hover:bg-red-700 border-transparent' : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'}`} 
              onClick={() => setTimeFilter('overdue')}
            >
              Gecikmiş - {badgeCounts.overdue}
            </Badge>
            <Badge 
              variant="secondary" 
              className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${timeFilter === 'next30' ? 'bg-amber-500 text-white hover:bg-amber-600 border-transparent' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'}`} 
              onClick={() => setTimeFilter('next30')}
            >
              30 Gün İçinde - {badgeCounts.next30Days}
            </Badge>
            <Badge 
              variant="secondary" 
              className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${timeFilter === 'undefinedTerm' ? 'bg-slate-600 text-white hover:bg-slate-700 border-transparent' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'}`} 
              onClick={() => setTimeFilter('undefinedTerm')}
            >
              Termin Yok - {badgeCounts.undefinedTerm}
            </Badge>
          </div>


          <Card className="shadow-sm">
            <CardHeader className="pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-800">Alınan Kararlar {status !== 'all' ? `(${status})` : ''}</CardTitle>
                <p className="text-xs text-muted-foreground">Son toplantıdan geriye doğru tarihsel sıralama</p>
              </div>
              {!isPublic && (
                <Button variant="ghost" size="sm" className="text-blue-600 text-xs font-semibold gap-1 hover:bg-blue-50" onClick={() => navigate('/isg-kurul/decisions')}>
                  Tüm Kararlar <ArrowRight className="w-3 h-3" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[11px] text-slate-500 bg-slate-50 uppercase font-semibold sticky top-0 z-10 shadow-sm">
                    <tr>
                      {effectiveFacilityId === 'all' && <th className="px-5 py-3">Tesis</th>}
                      <th className="px-5 py-3">Toplantı</th>
                      <th className="px-5 py-3">Karar</th>
                      <th className="px-5 py-3">Sorumlu</th>
                      <th className="px-5 py-3">Termin</th>
                      <th className="px-5 py-3 text-right">Durum / Öncelik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableTasks.length > 0 ? tableTasks.map(d => {
                      const dept = departments.find((dept: any) => dept.id === d.departmentId);
                      const isOverdue = d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'Tamamlandı' && d.status !== 'İptal Edildi';
                      const meeting = meetings.find((m: any) => m.id === d.meetingId);
                      const facility = facilities.find((f: any) => f.id === meeting?.facilityId);
                      
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
                      <tr key={d.id} className="hover:bg-slate-50/70 transition-colors cursor-pointer group" onClick={() => isPublic ? setSelectedPublicDecision(d) : navigate(`/isg-kurul/meetings/${d.meetingId}/decisions/${d.id}`)}>
                        {effectiveFacilityId === 'all' && (
                          <td className="px-5 py-4 align-top whitespace-nowrap">
                            <span className="text-[13px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">{facility?.shortName || facility?.name || '-'}</span>
                          </td>
                        )}
                        <td className="px-5 py-4 whitespace-nowrap align-top">
                          <span className="block font-bold text-slate-800">No: {d.meetingNo}</span>
                          <span className="text-xs text-slate-500">{new Date(d.meetingDate).toLocaleDateString('tr-TR')}</span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <p className="line-clamp-2 text-slate-700 text-[13px] leading-relaxed group-hover:text-blue-700 transition-colors" title={d.decisionText}>{d.decisionText}</p>
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
                            d.priority === 'Kritik' ? 'bg-red-600 text-white border-red-700' : 
                            d.priority === 'Yüksek Riskli' ? 'bg-orange-500 text-white border-orange-600' :
                            d.priority === 'Riskli' ? 'bg-amber-400 text-slate-900 border-amber-500' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {d.priority || 'Belirtilmedi'}
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
                        <td colSpan={effectiveFacilityId === 'all' ? 6 : 5} className="px-5 py-12 text-center text-slate-400 text-sm">Filtrelere uygun karar bulunamadı.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Public View Decision Dialog */}
      {isPublic && (
        <Dialog open={!!selectedPublicDecision} onOpenChange={(open) => !open && setSelectedPublicDecision(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">
                Karar Detayı
              </DialogTitle>
            </DialogHeader>
            {selectedPublicDecision && (
              <div className="space-y-6 mt-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-slate-900 bg-white px-2 py-1 rounded border shadow-sm">No: {selectedPublicDecision.meetingNo}</span>
                    <Badge variant="outline" className={`px-2 py-0.5 text-xs font-medium border ${
                      selectedPublicDecision.status === 'Tamamlandı' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      selectedPublicDecision.status === 'İptal Edildi' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {selectedPublicDecision.status}
                    </Badge>
                  </div>
                  <p className="text-slate-800 font-medium text-[15px] leading-relaxed">
                    {selectedPublicDecision.decisionText}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1 uppercase">Sorumlu Grup</p>
                    <p className="text-sm text-slate-800">{departments.find((dept: any) => dept.id === selectedPublicDecision.departmentId)?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1 uppercase">Kategori</p>
                    <p className="text-sm text-slate-800">{categories.find((cat: any) => cat.id === selectedPublicDecision.categoryId)?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1 uppercase">Öncelik</p>
                    <p className="text-sm text-slate-800">{selectedPublicDecision.priority || 'Belirtilmedi'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1 uppercase">Termin</p>
                    <p className="text-sm text-slate-800">
                      {selectedPublicDecision.dueDateType === 'DATE' && selectedPublicDecision.dueDate 
                        ? new Date(selectedPublicDecision.dueDate).toLocaleDateString('tr-TR') 
                        : selectedPublicDecision.periodicity || '-'}
                    </p>
                  </div>
                </div>

                {selectedPublicDecision.actions && selectedPublicDecision.actions.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="font-semibold text-slate-800 mb-3 text-sm uppercase">Aksiyonlar</h3>
                    <div className="space-y-2">
                      {selectedPublicDecision.actions.map((action: any) => (
                        <div key={action.id} className="flex gap-3 p-3 bg-white rounded-md border border-slate-200 shadow-sm">
                          <div className={`mt-0.5 w-4 h-4 rounded-full flex-shrink-0 border-2 ${
                            action.isCompleted 
                              ? 'bg-emerald-500 border-emerald-500' 
                              : 'bg-white border-slate-300'
                          }`} />
                          <div>
                            <p className={`text-sm ${action.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                              {action.actionText || action.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
