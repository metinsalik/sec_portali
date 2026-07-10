import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Building2, AlertTriangle, ShieldCheck, Activity, ChevronRight, ArrowUpRight, ClipboardCheck, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const API = import.meta.env.VITE_API_URL || '';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  ACIK_TEHLIKE:       { label: 'Açık Tehlike',     color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-900/20' },
  ILK_MUDAHALE_EDILDI:{ label: 'İlk Müdahale',     color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  TAKIP_SURECINDE:    { label: 'Takip Sürecinde',  color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
  KAPATILDI_GUVENLI: { label: 'Kapatıldı',         color: 'text-emerald-600',bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
};

export default function RiskDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  const { data: facilities = [], isLoading } = useQuery({
    queryKey: ['risk-facilities'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/facilities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Tesisler alınamadı');
      return res.json();
    },
  });

  const totalRisks  = facilities.reduce((s: number, f: any) => s + (f.riskStats?.total || 0), 0);
  const totalAcik   = facilities.reduce((s: number, f: any) => s + (f.riskStats?.acik || 0), 0);
  const totalTakip  = facilities.reduce((s: number, f: any) => s + (f.riskStats?.takip || 0), 0);
  const totalKapali = facilities.reduce((s: number, f: any) => s + (f.riskStats?.kapali || 0), 0);

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Risk Yaşam Döngüsü</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Tesis bazlı risk değerlendirme ve 4 aşamalı takip sistemi
          </p>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Risk',       value: totalRisks,  icon: Activity,      color: 'text-slate-600',   bg: 'bg-slate-100 dark:bg-slate-800' },
          { label: 'Açık Tehlike',      value: totalAcik,   icon: AlertTriangle, color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Takip Sürecinde',   value: totalTakip,  icon: Clock,         color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Kapatıldı (Güvenli)', value: totalKapali, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="overflow-hidden">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold">{isLoading ? '—' : value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tesis Listesi */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Tesisler
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : facilities.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Henüz tesis atanmamış.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {facilities.map((facility: any) => (
              <Card
                key={facility.id}
                className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/40"
                onClick={() => navigate(`/risks/facility/${facility.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base truncate">{facility.name}</h3>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {facility.dangerClass}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {facility.city} · {facility.riskDepartments?.length || 0} departman
                      </p>

                      {/* İlerleme çubukları */}
                      <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                        {facility.riskStats?.total > 0 ? (
                          <>
                            {facility.riskStats.acik > 0 && (
                              <div
                                className="bg-red-500 rounded-full"
                                style={{ width: `${(facility.riskStats.acik / facility.riskStats.total) * 100}%` }}
                              />
                            )}
                            {facility.riskStats.mudahale > 0 && (
                              <div
                                className="bg-orange-500 rounded-full"
                                style={{ width: `${(facility.riskStats.mudahale / facility.riskStats.total) * 100}%` }}
                              />
                            )}
                            {facility.riskStats.takip > 0 && (
                              <div
                                className="bg-blue-500 rounded-full"
                                style={{ width: `${(facility.riskStats.takip / facility.riskStats.total) * 100}%` }}
                              />
                            )}
                            {facility.riskStats.kapali > 0 && (
                              <div
                                className="bg-emerald-500 rounded-full"
                                style={{ width: `${(facility.riskStats.kapali / facility.riskStats.total) * 100}%` }}
                              />
                            )}
                          </>
                        ) : (
                          <div className="flex-1 bg-muted rounded-full" />
                        )}
                      </div>

                      {/* Sayılar */}
                      <div className="flex gap-4 mt-2">
                        {Object.entries(statusConfig).map(([key, cfg]) => {
                          const count = facility.riskStats?.[key === 'ACIK_TEHLIKE' ? 'acik' : key === 'ILK_MUDAHALE_EDILDI' ? 'mudahale' : key === 'TAKIP_SURECINDE' ? 'takip' : 'kapali'] || 0;
                          return (
                            <span key={key} className={`text-xs font-medium ${cfg.color}`}>
                              {count} {cfg.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors ml-4 shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
