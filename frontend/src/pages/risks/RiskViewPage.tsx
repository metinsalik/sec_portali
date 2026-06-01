import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Activity, Clock, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const API = import.meta.env.VITE_API_URL || '';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ACIK_TEHLIKE:        { label: 'Açık Tehlike',    color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-900/20',       border: 'border-red-200 dark:border-red-800' },
  ILK_MUDAHALE_EDILDI: { label: 'İlk Müdahale',    color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
  TAKIP_SURECINDE:     { label: 'Takip Sürecinde', color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20',     border: 'border-blue-200 dark:border-blue-800' },
  KAPATILDI_GUVENLI:   { label: 'Kapatıldı ✓',    color: 'text-emerald-600',bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
};

const LEVEL_BADGE: Record<string, string> = {
  'Tolere Gösterilmez Risk': 'bg-red-900 text-red-100 border-red-950 dark:bg-red-950 dark:text-red-200',
  'Yüksek Risk':             'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  'Önemli Risk':             'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  'Olası Risk':              'bg-amber-100 text-amber-800 border-amber-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  'Önemsiz Risk':            'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['ACIK_TEHLIKE'];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function LevelBadge({ level }: { level: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${LEVEL_BADGE[level] || 'bg-muted text-muted-foreground border-border'}`}>
      {level}
    </span>
  );
}

export default function RiskViewPage() {
  const { departmentId, riskId } = useParams<{ departmentId: string; riskId: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const { data: risk, isLoading } = useQuery({
    queryKey: ['risk-detail-view', riskId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/lifecycle/${riskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Risk detayları alınamadı');
      return res.json();
    },
    enabled: !!riskId
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!risk) return <div className="text-muted-foreground">Risk bulunamadı.</div>;

  const departmentCode = risk.department?.code || 'GEN';
  const riskCode = `${departmentCode}-${String(risk.riskNo).padStart(3, '0')}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/risks/department/${departmentId}`)} className="h-8 px-2 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Geri
          </Button>
          <div className="h-5 w-px bg-border" />
          <span className="font-mono text-sm font-bold px-2 py-1 bg-primary/10 text-primary rounded">
            {riskCode}
          </span>
          <h1 className="text-xl font-bold truncate max-w-lg">{risk.hazard}</h1>
          <StatusBadge status={risk.status} />
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate(`/risks/department/${departmentId}/edit/${risk.id}`)}>
          <Pencil className="w-4 h-4 mr-1.5" /> Düzenle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sol Kolon - Temel Bilgiler ve Skorlar */}
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" /> Temel Bilgiler
            </h3>
            <div className="bg-card border rounded-xl p-5 space-y-4 text-sm shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-3 border-b">
                <span className="text-muted-foreground">Kategori</span>
                <span className="sm:col-span-2 font-medium">{risk.riskCategory} {risk.subCategory && `> ${risk.subCategory}`}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-3 border-b">
                <span className="text-muted-foreground">Alan / Faaliyet</span>
                <span className="sm:col-span-2 font-medium">{risk.area} / {risk.activity}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-3 border-b">
                <span className="text-muted-foreground">Risk (Tehlike Açıklaması)</span>
                <span className="sm:col-span-2 font-medium text-foreground">{risk.riskDescription || '-'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-3 border-b">
                <span className="text-muted-foreground">Olası Etki/Zarar</span>
                <span className="sm:col-span-2 font-medium">{risk.impactDamage || '-'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span className="text-muted-foreground">Etkilenecekler</span>
                <span className="sm:col-span-2 font-medium">{risk.affectedPeople || '-'}</span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Risk Skorları
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted/50 border rounded-xl p-5 flex flex-col items-center justify-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">İlk Tespit Skoru</span>
                <div className="text-4xl font-extrabold">{risk.initialScore}</div>
                <LevelBadge level={risk.initialLevel} />
              </div>

              <div className={`border rounded-xl p-5 flex flex-col items-center justify-center gap-2 ${risk.finalScore ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-card border-dashed'}`}>
                <span className={`text-sm font-medium ${risk.finalScore ? 'text-emerald-800 dark:text-emerald-300' : 'text-muted-foreground'}`}>İyileştirme Sonrası Skor</span>
                {risk.finalScore ? (
                  <>
                    <div className="text-4xl font-extrabold text-emerald-600">{risk.finalScore}</div>
                    <LevelBadge level={risk.finalLevel} />
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground/60 italic mt-2">Henüz girilmedi</span>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Sağ Kolon - Yaşam Döngüsü (Audit Logs) */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4" /> İşlem Geçmişi
          </h3>
          
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[600px]">
            <div className="p-4 border-b bg-muted/30">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Risk Yaşam Döngüsü</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 relative">
              <div className="absolute left-6 top-4 bottom-4 w-px bg-border/80"></div>
              
              <div className="space-y-6">
                {risk.auditLogs && risk.auditLogs.length > 0 ? (
                  risk.auditLogs.map((log: any) => (
                    <div key={log.id} className="relative pl-8">
                      <div className="absolute left-[-1.5px] top-1.5 w-3 h-3 rounded-full bg-background border-2 border-primary ring-4 ring-card"></div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-sm text-foreground">{log.action}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {new Date(log.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" /> {log.username}
                        </p>
                        
                        {log.details && <p className="text-xs mt-1.5 leading-relaxed">{log.details}</p>}
                        
                        {/* Changed Fields if present */}
                        {log.changedFields && Object.keys(log.changedFields).length > 0 && (
                          <div className="mt-2 bg-muted/40 rounded-md p-2 text-[11px] space-y-1 border border-border/50">
                            {Object.entries(log.changedFields).map(([key, val]: any) => (
                              <div key={key} className="flex gap-1.5 flex-wrap">
                                <span className="font-semibold text-muted-foreground">{key}:</span>
                                <span className="line-through text-muted-foreground/70">{String(val.old || '-')}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="text-emerald-600 font-medium">{String(val.new || '-')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground italic pl-6">Henüz işlem geçmişi yok.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
