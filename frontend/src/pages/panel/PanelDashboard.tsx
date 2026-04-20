import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Building2, Users, AlertTriangle, 
  ShieldAlert, TrendingUp, Wallet, Gavel, 
  UserPlus, UserMinus, Activity, MapPin
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { EmployeeTrendChart } from '@/components/panel/dashboard/TrendChart';
import { CityDistribution } from '@/components/panel/dashboard/CityDistribution';
import { TurkeyMapSection } from '@/components/panel/dashboard/TurkeyMap';
import { CertificateRenewalDialog, ResourceGapDialog, CityDetailDialog } from '@/components/panel/dashboard/DashboardDialogs';
import { QuickAssignModal } from '@/components/panel/assignments/QuickAssignModal';

interface DashboardData {
  kpis: {
    totalFacilities: number;
    totalEmployees: number;
    averageComplianceScore: number;
    monthlyOsgbCost: number;
    monthlyPenaltyRisk: number;
    cumulativePenaltyRisk2026: number;
  };
  upcomingCertificates: any[];
  resourceGaps: {
    specialists: any[];
    doctors: any[];
    dsp: any[];
  };
  cityDistribution: Record<string, number>;
  cityDetails: Record<string, any>;
  employeeTrend: any[];
}

export default function PanelDashboard() {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignType, setAssignType] = useState<'IGU' | 'Hekim' | 'DSP' | 'Vekil'>('IGU');
  const [selectedFacility, setSelectedFacility] = useState<any>(null);

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['panel-dashboard'],
    queryFn: async () => {
      const res = await api.get('/panel/dashboard');
      if (!res.ok) throw new Error('Dashboard verileri yüklenemedi.');
      return res.json();
    },
  });

  const handleCityClick = (cityName: string) => {
    setSelectedCity(cityName);
    setActiveDialog('city-detail');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const kpi = data?.kpis;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Yönetim Paneli
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Portföy genel durumu ve uyumluluk metrikleri
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Son Güncelleme</p>
            <p className="text-sm font-semibold">{new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <Badge variant="outline" className="h-10 px-4 gap-2 border-primary/20 bg-primary/5 text-primary">
            <TrendingUp className="w-4 h-4" />
            2026 Q2 Aktif
          </Badge>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Toplam Tesis" 
          value={kpi?.totalFacilities || 0} 
          icon={Building2} 
          description="Aktif hizmet verilen tesis sayısı"
        />
        <KPICard 
          title="Toplam Çalışan" 
          value={kpi?.totalEmployees.toLocaleString('tr-TR') || 0} 
          icon={Users} 
          description="Tüm tesislerdeki toplam personel"
        />
        <KPICard 
          title="Ortalama Uyum Skoru" 
          value={`%${kpi?.averageComplianceScore.toFixed(1) || 0}`} 
          icon={ShieldAlert} 
          description="Yasal atama yükümlülüğü karşılama oranı"
          trend={kpi?.averageComplianceScore && kpi.averageComplianceScore > 80 ? "positive" : "negative"}
        />
        <Card className="relative overflow-hidden cursor-pointer hover:shadow-md transition-all border-orange-200 dark:border-orange-900/50 bg-orange-50/30 dark:bg-orange-950/10 group" onClick={() => setActiveDialog('certs')}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Sertifika Yenileme</p>
                <div className="text-3xl font-bold">{data?.upcomingCertificates.length || 0}</div>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Yenileme süresi yaklaşan profesyoneller</p>
          </CardContent>
        </Card>
      </div>

      {/* Resource Gaps Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Kaynak Planlama ve Uyarılar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard 
            title="Eksik Uzman" 
            value={data?.resourceGaps.specialists.length || 0} 
            icon={UserMinus} 
            description="Eksik ataması olan tesisler"
            trend={data?.resourceGaps.specialists.length === 0 ? "positive" : "negative"}
            onClick={() => setActiveDialog('gap-igu')}
            interactive
          />
          <KPICard 
            title="Eksik Hekim" 
            value={data?.resourceGaps.doctors.length || 0} 
            icon={UserMinus} 
            description="Eksik ataması olan tesisler"
            trend={data?.resourceGaps.doctors.length === 0 ? "positive" : "negative"}
            onClick={() => setActiveDialog('gap-hekim')}
            interactive
          />
          <KPICard 
            title="Eksik DSP" 
            value={data?.resourceGaps.dsp.length || 0} 
            icon={UserMinus} 
            description="Eksik ataması olan tesisler"
            trend={data?.resourceGaps.dsp.length === 0 ? "positive" : "negative"}
            onClick={() => setActiveDialog('gap-dsp')}
            interactive
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
           <EmployeeTrendChart data={data?.employeeTrend || []} />
        </div>
        
        <FinancialCard 
          title="Aylık OSGB Maliyeti" 
          value={kpi?.monthlyOsgbCost || 0} 
          icon={Wallet} 
          color="blue"
        />
        <FinancialCard 
          title="Aylık Ceza Riski" 
          value={kpi?.monthlyPenaltyRisk || 0} 
          icon={Gavel} 
          color="red"
          description="Eksik atamalardan kaynaklı aylık risk"
        />
        <FinancialCard 
          title="2026 Kümülatif Risk" 
          value={kpi?.cumulativePenaltyRisk2026 || 0} 
          icon={Activity} 
          color="purple"
          description="Yıllık tahmini toplam ceza riski"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
         <CityDistribution data={data?.cityDistribution || {}} />
         <TurkeyMapSection 
           cityData={data?.cityDistribution || {}} 
           onCityClick={handleCityClick}
         />
      </div>

      {/* Dialogs */}
      <CertificateRenewalDialog 
        open={activeDialog === 'certs'} 
        onOpenChange={(open) => !open && setActiveDialog(null)}
        data={data?.upcomingCertificates || []}
      />
      <ResourceGapDialog 
        open={activeDialog === 'gap-igu'} 
        onOpenChange={(open) => !open && setActiveDialog(null)}
        title="Eksik İSG Uzmanı Listesi"
        data={data?.resourceGaps.specialists || []}
        type="IGU"
        onAssign={(f, t) => {
          setSelectedFacility({ id: f.facilityId, name: f.facilityName, dangerClass: f.dangerClass, compliance: f });
          setAssignType(t);
          setAssignModalOpen(true);
        }}
      />
      <ResourceGapDialog 
        open={activeDialog === 'gap-hekim'} 
        onOpenChange={(open) => !open && setActiveDialog(null)}
        title="Eksik İşyeri Hekimi Listesi"
        data={data?.resourceGaps.doctors || []}
        type="Hekim"
        onAssign={(f, t) => {
          setSelectedFacility({ id: f.facilityId, name: f.facilityName, dangerClass: f.dangerClass, compliance: f });
          setAssignType(t);
          setAssignModalOpen(true);
        }}
      />
      <ResourceGapDialog 
        open={activeDialog === 'gap-dsp'} 
        onOpenChange={(open) => !open && setActiveDialog(null)}
        title="Eksik DSP Listesi"
        data={data?.resourceGaps.dsp || []}
        type="DSP"
        onAssign={(f, t) => {
          setSelectedFacility({ id: f.facilityId, name: f.facilityName, dangerClass: f.dangerClass, compliance: f });
          setAssignType(t);
          setAssignModalOpen(true);
        }}
      />
      <CityDetailDialog 
        open={activeDialog === 'city-detail'} 
        onOpenChange={(open) => !open && setActiveDialog(null)}
        cityName={selectedCity || ''}
        data={data?.cityDetails[selectedCity || '']}
      />

      <QuickAssignModal 
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        facility={selectedFacility}
        type={assignType}
      />
    </div>
  );
}

function KPICard({ title, value, icon: Icon, description, trend, onClick, interactive }: any) {
  return (
    <Card 
      className={`relative overflow-hidden group transition-all ${interactive ? 'cursor-pointer hover:border-primary/50 hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-3xl font-bold tracking-tight">{value}</div>
          </div>
          <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
            <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
          </div>
        </div>
        {description && (
          <div className="flex items-center gap-2 mt-4">
            <p className="text-xs text-muted-foreground">{description}</p>
            {trend && (
              <Badge variant={trend === 'positive' ? 'success' : 'destructive'} className="text-[10px] h-4 px-1">
                {trend === 'positive' ? 'Uyumlu' : 'Eksik'}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FinancialCard({ title, value, icon: Icon, color, description }: any) {
  const colorClasses: any = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30",
    red: "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30",
    purple: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30",
  };

  return (
    <Card className={`border-l-4 ${colorClasses[color]} bg-card`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${colorClasses[color]} bg-opacity-50`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
              {value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
            </p>
            {description && <p className="text-[10px] text-muted-foreground mt-1">{description}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
