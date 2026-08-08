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
  'Tolere Gösterilmez Risk': '#dc2626', // red-600
  'Yüksek Risk': '#f97316', // orange-500
  'Önemli Risk': '#fbbf24', // amber-400
  'Olası Risk': '#22c55e', // green-500
  'Önemsiz Risk': '#15803d', // green-700
  'Belirtilmedi': '#f1f5f9'
};

const PRIORITY_WEIGHTS: Record<string, number> = {
  'Tolere Gösterilmez Risk': 5,
  'Yüksek Risk': 4,
  'Önemli Risk': 3,
  'Olası Risk': 2,
  'Önemsiz Risk': 1,
};

const normalizePriority = (p: string) => {
  if (p === 'Kritik') return 'Tolere Gösterilmez Risk';
  if (p === 'Yüksek Riskli') return 'Yüksek Risk';
  if (p === 'Riskli') return 'Önemli Risk';
  if (p === 'Orta') return 'Olası Risk';
  if (p === 'Düşük') return 'Önemsiz Risk';
  return p || 'Belirtilmedi';
};

export default function IsgKurulDashboard({ isPublic = false }: { isPublic?: boolean }) {
  const activeFacilityId = localStorage.getItem('activeFacilityId') || '';
  const [searchParams, setSearchParams] = useSearchParams();
  const urlOpenTerminBucket = searchParams.get('openTermin') || 'all';
  const urlClosedTerminBucket = searchParams.get('closedTermin') || 'all';
  const urlFacilityId = searchParams.get('facility') || 'all';

  const [publicFacilityId, setPublicFacilityId] = useState('all');
  const effectiveFacilityId = isPublic ? publicFacilityId : activeFacilityId;
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // Filters state from URL
  const search = searchParams.get('q') || '';
  const year = searchParams.get('year') || 'all';
  const meetingId = searchParams.get('meetingId') || 'all';
  const categoryId = searchParams.get('categoryId') || 'all';
  const status = searchParams.get('status') || 'all';
  const priority = searchParams.get('priority') || 'all';
  const departmentId = searchParams.get('departmentId') || 'all';
  const timeFilter = searchParams.get('timeFilter') || 'all';

  const updateFilters = (updates: Record<string, string>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === 'all' || value === '') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      return next;
    }, { replace: true });
  };

  const updateFilter = (key: string, value: string) => {
    updateFilters({ [key]: value });
  };
  
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
      const normalizedDPriority = normalizePriority(d.priority);
      const matchPriority = priority !== 'all' ? normalizedDPriority === priority : true;
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
            matchTime = (d.status === 'Devam Ediyor' || d.status === 'Başlamadı') && d.dueDateType === 'DATE' && d.dueDate && new Date(d.dueDate) < now;
          } else if (timeFilter === 'next30') {
            if (d.dueDateType === 'DATE' && d.dueDate) {
              const diffDays = Math.ceil((new Date(d.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              matchTime = diffDays >= 0 && diffDays <= 30;
            } else {
              matchTime = false;
            }
          }
        } else {
          matchTime = false;
        }
      }

      return matchTime;
    });
  }, [decisionsWithoutTimeFilter, timeFilter]);

  const badgeCounts = useMemo(() => {
    const total = decisionsWithoutTimeFilter.length;
    const openList = decisionsWithoutTimeFilter.filter(d => d.status !== 'Tamamlandı' && d.status !== 'İptal Edildi');
    const now = new Date();
    
    const overdue = openList.filter(d => (d.status === 'Devam Ediyor' || d.status === 'Başlamadı') && d.dueDateType === 'DATE' && d.dueDate && new Date(d.dueDate) < now).length;
    const next30Days = openList.filter(d => {
      if (d.dueDateType !== 'DATE' || !d.dueDate) return false;
      const diffTime = new Date(d.dueDate).getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }).length;
    
    return { total, overdue, next30Days };
  }, [decisionsWithoutTimeFilter]);

  // Handle Chart Clicks
  const onPieClick = (data: any, type: 'status' | 'priority') => {
    if (data && data.name) {
      if (type === 'status') {
        updateFilter('status', data.name === status ? 'all' : data.name);
      } else {
        updateFilter('priority', data.name === priority ? 'all' : data.name);
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
    const overdue = openList.filter(d => (d.status === 'Devam Ediyor' || d.status === 'Başlamadı') && d.dueDateType === 'DATE' && d.dueDate && new Date(d.dueDate) < now).length;
    const next30Days = openList.filter(d => {
      if (d.dueDateType !== 'DATE' || !d.dueDate) return false;
      const diffTime = new Date(d.dueDate).getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }).length;
    
    const completionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    return { total, open: openList.length, overdue, completionRate, closed, next30Days };
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
      const p = normalizePriority(d.priority);
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => (PRIORITY_WEIGHTS[b.name] || 0) - (PRIORITY_WEIGHTS[a.name] || 0));
  }, [filteredDecisions]);

  // Helper to calculate termin performance
  const getTerminInfo = (d: any) => {
    if (!d.dueDate || d.dueDateType !== 'DATE') return { ratio: null, isPeriodic: true, hasError: false };
    
    const dueDate = new Date(d.dueDate).getTime();
    const meetingDate = new Date(d.meetingDate).getTime();
    
    if (dueDate <= meetingDate) return { ratio: null, isPeriodic: false, hasError: true };

    const plannedDuration = dueDate - meetingDate;
    const isClosed = d.status === 'Tamamlandı';
    
    if (isClosed) {
      let closedTime = d.updatedAt ? new Date(d.updatedAt).getTime() : new Date().getTime();
      if (d.actions && d.actions.length > 0) {
        closedTime = new Date(d.actions[0].createdAt).getTime();
      }
      let actualDuration = closedTime - meetingDate;
      if (actualDuration < 0) actualDuration = 0;
      return { ratio: (actualDuration / plannedDuration) * 100, isPeriodic: false, hasError: false };
    } else {
      let actualDuration = new Date().getTime() - meetingDate;
      if (actualDuration < 0) actualDuration = 0;
      return { ratio: (actualDuration / plannedDuration) * 100, isPeriodic: false, hasError: false };
    }
  };

  const getBucketInfo = (ratio: number, isOpen: boolean) => {
    if (isOpen) {
      if (ratio <= 50) return '0-50';
      if (ratio <= 75) return '51-75';
      if (ratio <= 90) return '76-90';
      if (ratio <= 100) return '91-100';
      if (ratio <= 150) return '101-150';
      if (ratio <= 200) return '151-200';
      return '200+';
    } else {
      if (ratio <= 75) return '0-75';
      if (ratio <= 100) return '76-100';
      if (ratio <= 125) return '101-125';
      if (ratio <= 150) return '126-150';
      if (ratio <= 200) return '151-200';
      return '200+';
    }
  };

  // Termin Statistics
  const terminStats = useMemo(() => {
    let openMissingTermin = 0;
    let openInvalidDate = 0;
    
    let closedOnTime = 0;
    let closedLate = 0;

    const openBuckets = {
      '0-50': { id: '0-50', label: '≤ %50', state: 'Normal', note: 'Termin süresinin ilk yarısı.', tone: '#6f7d93', count: 0 },
      '51-75': { id: '51-75', label: '%51–75', state: 'İlerleyen', note: 'Sürenin önemli bölümü kullanılmış.', tone: '#8794a8', count: 0 },
      '76-90': { id: '76-90', label: '%76–90', state: 'İzlenmeli', note: 'Termin sınırına yaklaşmaya başlamış.', tone: '#c6a54b', count: 0 },
      '91-100': { id: '91-100', label: '%91–100', state: 'Termin Yakın', note: 'Termin süresinin neredeyse tamamı kullanılmış.', tone: '#d58b3b', count: 0 },
      '101-150': { id: '101-150', label: '%101–150', state: 'Gecikmiş', note: 'Termin aşılmış.', tone: '#d7644f', count: 0 },
      '151-200': { id: '151-200', label: '%151–200', state: 'Ciddi Gecikmiş', note: 'Termin süresinin 1,5–2 katı kadar açık.', tone: '#bf4e4e', count: 0 },
      '200+': { id: '200+', label: '%200+', state: 'Kronik', note: 'Termin süresinin iki katından fazla açık.', tone: '#963e46', count: 0 }
    };

    const closedBuckets = {
      '0-75': { id: '0-75', label: '≤ %75', state: 'Erken Tamamlandı', note: "Planlanan sürenin en fazla %75'i kullanılarak kapatıldı.", tone: '#6f7d93', count: 0 },
      '76-100': { id: '76-100', label: '%76–100', state: 'Termininde', note: 'Termin süresi aşılmadan kapatıldı.', tone: '#8794a8', count: 0 },
      '101-125': { id: '101-125', label: '%101–125', state: 'Hafif Gecikmeli', note: "Planlanan sürenin %25'ine kadar aşım ile kapatıldı.", tone: '#c6a54b', count: 0 },
      '126-150': { id: '126-150', label: '%126–150', state: 'Gecikmeli', note: 'Planlanan sürenin %26–50 üzerinde kapatıldı.', tone: '#d58b3b', count: 0 },
      '151-200': { id: '151-200', label: '%151–200', state: 'Ciddi Gecikmeli', note: 'Planlanan sürenin 1,5–2 katında kapatıldı.', tone: '#d7644f', count: 0 },
      '200+': { id: '200+', label: '%200+', state: 'Çok Gecikmeli', note: 'Planlanan sürenin iki katından daha uzun sürede kapatıldı.', tone: '#963e46', count: 0 }
    };

    filteredDecisions.forEach(d => {
      const isClosed = d.status === 'Tamamlandı';
      const isCanceled = d.status === 'İptal Edildi';

      if (isCanceled) return;

      const info = getTerminInfo(d);

      if (!isClosed) {
        if (info.isPeriodic) openMissingTermin++;
        else if (info.hasError) openInvalidDate++;
        else if (info.ratio !== null) {
          const b = getBucketInfo(info.ratio, true) as keyof typeof openBuckets;
          if (openBuckets[b]) openBuckets[b].count++;
        }
      } else {
        if (info.isPeriodic || info.hasError) {
          // Closed but no proper termin info
        } else if (info.ratio !== null) {
          if (info.ratio <= 100) closedOnTime++;
          else closedLate++;
          
          const b = getBucketInfo(info.ratio, false) as keyof typeof closedBuckets;
          if (closedBuckets[b]) closedBuckets[b].count++;
        }
      }
    });

    const openArray = Object.values(openBuckets);
    const closedArray = Object.values(closedBuckets);
    
    return {
      open: openArray,
      closed: closedArray,
      openMissingTermin,
      openInvalidDate,
      closedOnTime,
      closedLate
    };
  }, [filteredDecisions]);


  // Final Filtered Decisions (Applies URL filters)
  const finalFilteredDecisions = useMemo(() => {
    return filteredDecisions.filter(d => {
      const isClosed = d.status === 'Tamamlandı';
      const isCanceled = d.status === 'İptal Edildi';
      
      // Termin Bucket Filters
      if (urlOpenTerminBucket !== 'all' && !isClosed && !isCanceled) {
        const info = getTerminInfo(d);
        if (info.ratio === null || getBucketInfo(info.ratio, true) !== urlOpenTerminBucket) return false;
      }
      if (urlClosedTerminBucket !== 'all' && isClosed) {
        const info = getTerminInfo(d);
        if (info.ratio === null || getBucketInfo(info.ratio, false) !== urlClosedTerminBucket) return false;
      }
      
      // Facility Filter
      if (urlFacilityId !== 'all') {
        const meeting = meetings.find((m: any) => m.id === d.meetingId);
        if (meeting?.facilityId !== urlFacilityId) return false;
      }
      
      return true;
    });
  }, [filteredDecisions, urlOpenTerminBucket, urlClosedTerminBucket, urlFacilityId, meetings]);

  // Distribution by facility for the current filters (including time filter via KPIs)
  const facilityDistribution = useMemo(() => {
    // First, filter by the termin buckets but NOT by the specific facility
    const bucketDecisions = filteredDecisions.filter(d => {
      const isClosed = d.status === 'Tamamlandı';
      const isCanceled = d.status === 'İptal Edildi';

      if (urlOpenTerminBucket !== 'all') {
        if (isClosed || isCanceled) return false;
        const info = getTerminInfo(d);
        if (info.ratio === null || getBucketInfo(info.ratio, true) !== urlOpenTerminBucket) return false;
      }
      if (urlClosedTerminBucket !== 'all') {
        if (!isClosed) return false;
        const info = getTerminInfo(d);
        if (info.ratio === null || getBucketInfo(info.ratio, false) !== urlClosedTerminBucket) return false;
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
  }, [filteredDecisions, urlOpenTerminBucket, urlClosedTerminBucket, meetings, facilities]);

  // Category Workload
  const categoryWorkloadData = useMemo(() => {
    const counts: Record<string, { id: string, count: number }> = {};
    finalFilteredDecisions.forEach(d => {
      const cat = categories.find((c: any) => c.id === d.categoryId);
      const catName = cat?.name || 'Bilinmiyor';
      if (!counts[catName]) counts[catName] = { id: d.categoryId?.toString() || 'all', count: 0 };
      counts[catName].count += 1;
    });
    return Object.entries(counts).map(([name, data]) => ({ name, id: data.id, value: data.count })).sort((a,b) => b.value - a.value).slice(0, 6);
  }, [finalFilteredDecisions, categories]);

  // Responsible Workload
  const workloadData = useMemo(() => {
    const counts: Record<string, number> = {};
    finalFilteredDecisions.forEach(d => {
      const dept = departments.find((dept: any) => dept.id === d.departmentId);
      const deptName = dept?.name || 'Bilinmiyor';
      counts[deptName] = (counts[deptName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 6);
  }, [finalFilteredDecisions, departments]);

  // Table Data: Sorted by Meeting Date Descending, then Priority
  const tableTasks = useMemo(() => {
    return [...finalFilteredDecisions].sort((a, b) => {
      const dateDiff = new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime();
      if (dateDiff !== 0) return dateDiff;
      const wA = PRIORITY_WEIGHTS[normalizePriority(a.priority)] || 0;
      const wB = PRIORITY_WEIGHTS[normalizePriority(b.priority)] || 0;
      return wB - wA; // High priority first if same meeting
    }).slice(0, 100); // limit to 100
  }, [finalFilteredDecisions]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* Top Search Bar */}
      <div className="bg-white p-4 rounded-lg border shadow-sm mb-4">
        <Input 
          placeholder="Karar, numarası, sorumlu, toplantı veya kelime ara..." 
          className="w-full bg-slate-50 h-11 text-base"
          value={search}
          onChange={e => updateFilter('q', e.target.value)}
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
        <Select value={year} onValueChange={(v) => updateFilters({ year: v, meetingId: 'all' })}>
          <SelectTrigger className="w-[140px] bg-slate-50 h-9 text-sm">
            <SelectValue placeholder="Tüm Yıllar">{year === 'all' ? 'Tüm Yıllar' : year}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Yıllar</SelectItem>
            {uniqueYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={meetingId} onValueChange={(v) => updateFilter('meetingId', v)}>
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

        <Select value={categoryId} onValueChange={(v) => updateFilter('categoryId', v)}>
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

        <Select value={status} onValueChange={(v) => updateFilter('status', v)}>
          <SelectTrigger className="w-[160px] bg-slate-50 h-9 text-sm">
            <SelectValue placeholder="Tüm Durumlar">{status === 'all' ? 'Tüm Durumlar' : status}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            {['Başlamadı', 'Devam Ediyor', 'Sürekli Takip', 'Tamamlandı', 'İptal Edildi', 'Belirsiz'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={(v) => updateFilter('priority', v)}>
          <SelectTrigger className="w-[160px] bg-slate-50 h-9 text-sm">
            <SelectValue placeholder="Tüm Öncelikler">{priority === 'all' ? 'Tüm Öncelikler' : priority}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Öncelikler</SelectItem>
            {['Tolere Gösterilmez Risk', 'Yüksek Risk', 'Önemli Risk', 'Olası Risk', 'Önemsiz Risk'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={departmentId} onValueChange={(v) => updateFilter('departmentId', v)}>
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
        
        {(search || year !== 'all' || meetingId !== 'all' || categoryId !== 'all' || status !== 'all' || priority !== 'all' || departmentId !== 'all' || timeFilter !== 'all') && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-600 hover:bg-red-50 hover:text-red-700 h-9 ml-auto"
            onClick={() => setSearchParams({})}
          >
            Tüm Filtreleri Temizle
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className={`grid grid-cols-2 md:grid-cols-3 ${effectiveFacilityId === 'all' ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-4`}>
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

        <Card className={`shadow-sm border-slate-200 cursor-pointer transition-colors ${timeFilter === 'all' ? 'ring-2 ring-indigo-500' : 'hover:bg-slate-50'}`} onClick={() => updateFilter('timeFilter', 'all')}>
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100 rounded-bl-full -mr-8 -mt-8 opacity-60" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 relative z-10">Tümü</p>
            <h3 className="text-3xl font-black text-slate-800 relative z-10">{kpis.total}</h3>
            <p className="text-xs text-slate-500 mt-1 relative z-10">Toplam Kurul Kararı</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-bl-full -mr-8 -mt-8 opacity-60" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 relative z-10">Açık İş</p>
            <h3 className="text-3xl font-black text-slate-800 relative z-10">{kpis.open}</h3>
            <p className="text-xs text-slate-500 mt-1 relative z-10">%{(kpis.total ? Math.round(100 - kpis.completionRate) : 0)} karar kapanmamış</p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-red-200 cursor-pointer transition-colors ${timeFilter === 'overdue' ? 'ring-2 ring-red-500 bg-red-50' : 'hover:bg-red-50/70 bg-red-50/30'}`} onClick={() => updateFilter('timeFilter', 'overdue')}>
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-100 rounded-bl-full -mr-8 -mt-8 opacity-60" />
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 relative z-10">Gecikmiş</p>
            <h3 className="text-3xl font-black text-red-800 relative z-10">{kpis.overdue}</h3>
            <p className="text-xs text-red-500 mt-1 relative z-10">Termini geçen kararlar</p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-amber-200 cursor-pointer transition-colors ${timeFilter === 'next30' ? 'ring-2 ring-amber-500 bg-amber-50' : 'hover:bg-amber-50/70 bg-amber-50/30'}`} onClick={() => updateFilter('timeFilter', 'next30')}>
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-bl-full -mr-8 -mt-8 opacity-60" />
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 relative z-10">30 Gün İçinde</p>
            <h3 className="text-3xl font-black text-amber-800 relative z-10">{kpis.next30Days}</h3>
            <p className="text-xs text-amber-600 mt-1 relative z-10">Yaklaşan terminler</p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-green-200 cursor-pointer transition-colors ${timeFilter === 'closed' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-green-50/70 bg-green-50/30'}`} onClick={() => updateFilter('timeFilter', 'closed')}>
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

      {/* Row 3: Workload and Open Termin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        
        {/* Category Workload */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">Kategorilere Göre İş Yükü</CardTitle>
            <p className="text-xs text-muted-foreground">Kararların kategorilere dağılımı</p>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {categoryWorkloadData.length > 0 ? categoryWorkloadData.map(w => {
              const max = Math.max(...categoryWorkloadData.map(d => d.value), 1);
              const percent = (w.value / max) * 100;
              return (
                <div 
                  key={w.name} 
                  className={`flex items-center gap-4 group cursor-pointer p-1.5 -mx-1.5 rounded transition-colors ${categoryId === w.id ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-slate-50'}`}
                  onClick={() => updateFilter('categoryId', categoryId === w.id ? 'all' : w.id)}
                >
                  <span className={`w-[120px] text-xs font-medium truncate ${categoryId === w.id ? 'text-indigo-700' : 'text-slate-700'}`} title={w.name}>{w.name}</span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${categoryId === w.id ? 'bg-indigo-600' : 'bg-indigo-500 group-hover:bg-indigo-600'}`} style={{ width: `${percent}%` }} />
                  </div>
                  <span className={`w-6 text-right text-sm font-bold ${categoryId === w.id ? 'text-indigo-700' : 'text-slate-800'}`}>{w.value}</span>
                </div>
              )
            }) : (
              <div className="text-center py-10 text-slate-400 text-sm">İş yükü bulunmuyor.</div>
            )}
          </CardContent>
        </Card>

        {/* Open Task Termin */}
        <Card className="shadow-sm relative border-slate-200">
          <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg font-extrabold text-slate-800 tracking-tight">Açık Kararlarda Termin Kullanımı</CardTitle>
              <p className="text-[13px] text-slate-500 mt-1">Açık kararların kendilerine tanımlanan toplam süresinin ne kadarını kullandığı.</p>
            </div>
            <div className="flex flex-col items-end text-[13px] text-slate-500 shrink-0">
              <strong className="text-[26px] leading-[1.05] text-slate-900 mb-1">
                {terminStats.open.reduce((s, d) => s + d.count, 0).toLocaleString('tr-TR')}
              </strong>
              Açık Karar
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-5 px-6 space-y-3">
              {terminStats.open.map(t => {
                const max = Math.max(...terminStats.open.map(o => o.count), 1);
                const total = terminStats.open.reduce((s, d) => s + d.count, 0) || 1;
                const percentBar = (t.count / max) * 100;
                const percentVal = (t.count / total) * 100;
                const isActive = urlOpenTerminBucket === t.id;
                
                return (
                  <div 
                    key={t.id} 
                    title={`${t.label} · ${t.state}\n${t.note}`}
                    className={`grid grid-cols-[110px_1fr_60px_60px] items-center gap-3 cursor-pointer p-1 rounded-xl transition-all min-h-[42px] ${isActive ? 'bg-slate-50 ring-2 ring-slate-200' : 'hover:bg-slate-50'}`}
                    onClick={() => {
                      if (isActive) {
                        searchParams.delete('openTermin');
                        searchParams.delete('facility');
                      } else {
                        searchParams.set('openTermin', t.id);
                        searchParams.delete('closedTermin');
                        searchParams.delete('facility');
                      }
                      setSearchParams(searchParams);
                    }}
                  >
                    <div className="text-[13px] font-[750] text-slate-800 px-1">{t.label}</div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700" 
                        style={{ width: `${percentBar}%`, backgroundColor: t.tone }}
                      />
                    </div>
                    <div className="text-right text-[13px] font-[800] text-slate-900">{t.count.toLocaleString('tr-TR')}</div>
                    <div className="text-right text-[13px] text-slate-500 pr-1">%{(percentVal).toFixed(1).replace('.',',')}</div>
                  </div>
                )
              })}
            </div>
            
            <div className="grid grid-cols-3 gap-3 px-6 pb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                <div className="text-xs text-slate-500 mb-1">Termin İçinde</div>
                <div className="text-xl font-[850] text-slate-900">%{(terminStats.open.slice(0,4).reduce((s,d)=>s+d.count,0) / (terminStats.open.reduce((s,d)=>s+d.count,0) || 1) * 100).toFixed(1).replace('.',',')}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">%100 ve altındaki açık kararlar</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                <div className="text-xs text-slate-500 mb-1">Terminini Aşmış</div>
                <div className="text-xl font-[850] text-slate-900">%{(terminStats.open.slice(4).reduce((s,d)=>s+d.count,0) / (terminStats.open.reduce((s,d)=>s+d.count,0) || 1) * 100).toFixed(1).replace('.',',')}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">%100 üzerindeki açık kararlar</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                <div className="text-xs text-slate-500 mb-1">Kronik Açık Karar</div>
                <div className="text-xl font-[850] text-slate-900">{terminStats.open[terminStats.open.length-1].count.toLocaleString('tr-TR')}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">%200+ termin kullanım oranı</div>
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex justify-between items-center text-xs text-slate-500">
              <div className="flex gap-2">
                {terminStats.openMissingTermin > 0 && <Badge variant="outline" className="font-normal bg-white text-slate-600">Periyodik Takip: <strong className="ml-1 text-slate-900">{terminStats.openMissingTermin}</strong></Badge>}
                {terminStats.openInvalidDate > 0 && <Badge variant="outline" className="font-normal bg-rose-50 text-rose-700 border-rose-200">Hatalı tarih: <strong className="ml-1 text-rose-900">{terminStats.openInvalidDate}</strong></Badge>}
              </div>
              <span>Geçen süre ÷ Planlanan süre × 100</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Closed Termin and Responsible Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Kapatılan Kararlarda Termine Uyum */}
        <Card className="shadow-sm relative border-slate-200">
          <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg font-extrabold text-slate-800 tracking-tight">Kapatılan Kararlarda Termine Uyum</CardTitle>
              <p className="text-[13px] text-slate-500 mt-1">Kapatılmış kararların termin süresi içinde tamamlanıp tamamlanmadığı.</p>
            </div>
            <div className="flex flex-col items-end text-[13px] text-slate-500 shrink-0">
              <strong className="text-[26px] leading-[1.05] text-slate-900 mb-1">
                {terminStats.closed.reduce((s, d) => s + d.count, 0).toLocaleString('tr-TR')}
              </strong>
              Kapalı Karar
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-5 px-6 space-y-3">
              {terminStats.closed.map(t => {
                const max = Math.max(...terminStats.closed.map(o => o.count), 1);
                const total = terminStats.closed.reduce((s, d) => s + d.count, 0) || 1;
                const percentBar = (t.count / max) * 100;
                const percentVal = (t.count / total) * 100;
                const isActive = urlClosedTerminBucket === t.id;
                
                return (
                  <div 
                    key={t.id} 
                    title={`${t.label} · ${t.state}\n${t.note}`}
                    className={`grid grid-cols-[110px_1fr_60px_60px] items-center gap-3 cursor-pointer p-1 rounded-xl transition-all min-h-[42px] ${isActive ? 'bg-slate-50 ring-2 ring-slate-200' : 'hover:bg-slate-50'}`}
                    onClick={() => {
                      if (isActive) {
                        searchParams.delete('closedTermin');
                        searchParams.delete('facility');
                      } else {
                        searchParams.set('closedTermin', t.id);
                        searchParams.delete('openTermin');
                        searchParams.delete('facility');
                      }
                      setSearchParams(searchParams);
                    }}
                  >
                    <div className="text-[13px] font-[750] text-slate-800 px-1">{t.label}</div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700" 
                        style={{ width: `${percentBar}%`, backgroundColor: t.tone }}
                      />
                    </div>
                    <div className="text-right text-[13px] font-[800] text-slate-900">{t.count.toLocaleString('tr-TR')}</div>
                    <div className="text-right text-[13px] text-slate-500 pr-1">%{(percentVal).toFixed(1).replace('.',',')}</div>
                  </div>
                )
              })}
            </div>
            
            <div className="grid grid-cols-3 gap-3 px-6 pb-6">
              <div className="bg-white border-[1.5px] border-slate-200 rounded-2xl p-3.5">
                <div className="text-xs text-slate-500 mb-1">Termin Uyum Oranı</div>
                <div className="text-xl font-[850] text-slate-900">%{(terminStats.closedOnTime / (terminStats.closedOnTime + terminStats.closedLate || 1) * 100).toFixed(1).replace('.',',')}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Termininde veya önce kapananlar</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                <div className="text-xs text-slate-500 mb-1">Termin Sonrası Kapanan</div>
                <div className="text-xl font-[850] text-slate-900">%{(terminStats.closedLate / (terminStats.closedOnTime + terminStats.closedLate || 1) * 100).toFixed(1).replace('.',',')}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Planlanan süreyi aşarak kapananlar</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                <div className="text-xs text-slate-500 mb-1">Ciddi Gecikmeli Kapanan</div>
                <div className="text-xl font-[850] text-slate-900">{terminStats.closed.slice(4).reduce((s,d)=>s+d.count,0).toLocaleString('tr-TR')}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">%150+ gerçekleşme oranı</div>
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex justify-between items-center text-xs text-slate-500">
              <div className="flex gap-2">
                <Badge variant="outline" className="font-normal bg-white text-slate-600">Termininde kapanan: <strong className="ml-1 text-slate-900">{terminStats.closedOnTime}</strong></Badge>
                <Badge variant="outline" className="font-normal bg-white text-slate-600">Termin sonrası: <strong className="ml-1 text-slate-900">{terminStats.closedLate}</strong></Badge>
              </div>
              <span>Gerçekleşen süre ÷ Planlanan süre × 100</span>
            </div>
          </CardContent>
        </Card>

        {/* Responsible Workload */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">Sorumlu İş Yükü</CardTitle>
            <p className="text-xs text-muted-foreground">Kararların birim gruplarına dağılımı</p>
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
              <div className="text-center py-10 text-slate-400 text-sm">İş yükü bulunmuyor.</div>
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
                Tesislerin Karar Dağılımı {urlOpenTerminBucket !== 'all' ? `(${terminStats.open.find(b => b.id === urlOpenTerminBucket)?.label} Açık)` : (urlClosedTerminBucket !== 'all' ? `(${terminStats.closed.find(b => b.id === urlClosedTerminBucket)?.label} Kapalı)` : '')}
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
              onClick={() => updateFilter('timeFilter', timeFilter === 'closed' ? 'all' : 'closed')}
            >
              Kapalı - {kpis.closed}
            </Badge>
            <Badge 
              variant="secondary" 
              className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${timeFilter === 'overdue' ? 'bg-red-600 text-white hover:bg-red-700 border-transparent' : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'}`} 
              onClick={() => updateFilter('timeFilter', timeFilter === 'overdue' ? 'all' : 'overdue')}
            >
              Gecikmiş - {badgeCounts.overdue}
            </Badge>
            <Badge 
              variant="secondary" 
              className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${timeFilter === 'next30' ? 'bg-amber-500 text-white hover:bg-amber-600 border-transparent' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'}`} 
              onClick={() => updateFilter('timeFilter', timeFilter === 'next30' ? 'all' : 'next30')}
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
