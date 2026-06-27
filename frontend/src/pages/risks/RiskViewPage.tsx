import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Pencil, Activity, Clock, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const API = import.meta.env.VITE_API_URL || '';

const fieldNames: Record<string, string> = {
  status: 'Durum',
  dueDate: 'Termin Tarihi',
  actionDate: 'İyileştirme Tarihi',
  actionsTaken: 'İyileştirme Açıklaması',
  initialScore: 'Mevcut Risk Skoru',
  finalScore: 'İyileştirme Sonrası Skor',
  detectionDate: 'Tespit Tarihi',
  improvementResponsible: 'İyileştirme Sorumlusu',
  subCategory: 'Alt Kategori',
  riskCategory: 'Ana Kategori',
  legislation: 'İlgili Mevzuat',
  firstActionPlan: 'Alınacak Önlemler',
  initialProb: 'Olasılık (P)',
  initialFreq: 'Frekans (F)',
  initialSev: 'Şiddet (S)',
  finalProb: 'Sonrası Olasılık (P)',
  finalFreq: 'Sonrası Frekans (F)',
  finalSev: 'Sonrası Şiddet (S)',
  effectivenessMethod: 'Etkinlik Ölçüm Yöntemi',
  controlResponsible: 'Kontrol Sorumlusu',
  controlResult: 'Kontrol Sonucu',
  description: 'Tehlike Tanımı',
  dueDatePeriod: 'Termin Periyodu'
};

const statusNames: Record<string, string> = {
  ACIK_TEHLIKE: 'Açık Tehlike',
  ILK_MUDAHALE_EDILDI: 'İlk Müdahale Edildi',
  TAKIP_SURECINDE: 'Takip Sürecinde',
  KAPATILDI_GUVENLI: 'Kapatıldı (Güvenli)'
};

const formatLogValue = (key: string, val: any) => {
  if (!val) return '-';
  if (key === 'status') return statusNames[val as string] || val;
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return new Date(val).toLocaleDateString('tr-TR');
  }
  return String(val);
};

export const STATUS_MAP: Record<string, { label: string, color: string, bg: string, border: string }> = {
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
  const cfg = STATUS_MAP[status] || STATUS_MAP['ACIK_TEHLIKE'];
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
  const location = useLocation();
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
          <Button variant="ghost" size="sm" onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              navigate(location.state?.from || `/risks/department/${departmentId}`);
            }
          }} className="h-8 px-2 -ml-2">
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
              <Activity className="w-4 h-4" /> 1. Bölüm: Genel Bilgiler
            </h3>
            <div className="bg-card border rounded-xl p-5 space-y-4 text-sm shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-3 border-b">
                <div><span className="text-muted-foreground block text-xs mb-1">Tespit Tarihi</span><span className="font-medium">{risk.detectionDate ? new Date(risk.detectionDate).toLocaleDateString('tr-TR') : '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">Risk Kategorisi</span><span className="font-medium">{risk.riskCategory || '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">Alt Risk Kategorisi</span><span className="font-medium">{risk.subCategory || '-'}</span></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-3 border-b">
                <div><span className="text-muted-foreground block text-xs mb-1">Bölüm</span><span className="font-medium">{risk.department?.name || '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">Alan</span><span className="font-medium">{risk.area || '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">Faaliyet (Yapılan İş)</span><span className="font-medium">{risk.activity || '-'}</span></div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> 2. Bölüm: Mevcut Durum Değerlendirmesi
            </h3>
            <div className="bg-card border rounded-xl p-5 space-y-4 text-sm shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b">
                <div><span className="text-muted-foreground block text-xs mb-1">Tehlike</span><span className="font-medium">{risk.hazard || '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">Risk (Olası Tehlikeli Olay)</span><span className="font-medium">{risk.riskDescription || '-'}</span></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b">
                <div><span className="text-muted-foreground block text-xs mb-1">Sonuç/ Olası Etki Zarar</span><span className="font-medium">{risk.impactDamage || '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">Riskten Etkilenecek Kişiler</span><span className="font-medium">{risk.affectedPeople || '-'}</span></div>
              </div>
              <div className="pb-3 border-b">
                <span className="text-muted-foreground block text-xs mb-1">Mevcut Durum Açıklaması</span>
                <span className="font-medium block">{risk.initialCondition || '-'}</span>
              </div>
              <div className="pb-3 border-b">
                <span className="text-muted-foreground block text-xs mb-2">Mevcut Durum Görseli</span>
                {risk.initialImage ? (
                  <img src={risk.initialImage} alt="Mevcut Durum" className="w-full h-64 object-cover rounded-xl border bg-muted/10 shadow-sm" />
                ) : (
                  <div className="w-full h-40 bg-muted/30 border border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center">
                    <ShieldCheck className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <h4 className="text-lg font-bold text-muted-foreground/60">
                      {risk.department?.facility?.name || 'Tesis Adı'} - {risk.department?.name || 'İlgili Bölüm'}
                    </h4>
                    <p className="text-xs text-muted-foreground/40 mt-1">Görsel Eklenmedi</p>
                  </div>
                )}
              </div>
              <div className="bg-muted/50 border rounded-xl p-5 mt-2">
                <span className="text-sm font-bold text-foreground mb-4 block">Mevcut Risk Skoru</span>
                <div className="flex flex-wrap items-center gap-8">
                  <div><span className="text-muted-foreground block text-xs mb-1">Olasılık (P)</span><span className="font-medium">{risk.initialProb}</span></div>
                  <div><span className="text-muted-foreground block text-xs mb-1">Frekans (F)</span><span className="font-medium">{risk.initialFreq}</span></div>
                  <div><span className="text-muted-foreground block text-xs mb-1">Şiddet (S)</span><span className="font-medium">{risk.initialSev}</span></div>
                  <div className="ml-auto flex items-center gap-4">
                    <div><span className="text-muted-foreground block text-xs mb-1">Risk Puanı</span><span className="font-bold text-xl">{risk.initialScore}</span></div>
                    <div><span className="text-muted-foreground block text-xs mb-1">Risk Seviyesi</span><LevelBadge level={risk.initialLevel} /></div>
                  </div>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs mb-1 mt-2">İlgili Mevzuat</span>
                <span className="font-medium block">{risk.legislation || '-'}</span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" /> 3. Bölüm: İyileştirme Planı / Uygulama
            </h3>
            <div className="bg-card border rounded-xl p-5 space-y-4 text-sm shadow-sm">
              <div className="pb-3 border-b">
                <span className="text-muted-foreground block text-xs mb-1">Alınacak Önlemler / İyileştirici Faaliyet</span>
                <span className="font-medium block">{risk.firstActionPlan || risk.actionsTaken || '-'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-3 border-b">
                <div><span className="text-muted-foreground block text-xs mb-1">İyileştirme Sorumlusu</span><span className="font-medium">{risk.improvementResponsible || '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">Termin Tarihi</span><span className="font-medium">{risk.dueDate ? new Date(risk.dueDate).toLocaleDateString('tr-TR') : '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">Termin Periyodu</span><span className="font-medium">{risk.dueDatePeriod || 'Belli bir tarih'}</span></div>
              </div>
              <div className="pb-3 border-b">
                <span className="text-muted-foreground block text-xs mb-1">İyileştirme Açıklaması</span>
                <span className="font-medium block">{risk.actionsTaken || '-'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b">
                <div><span className="text-muted-foreground block text-xs mb-1">İyileştirme Tamamlanma Tarihi</span><span className="font-medium">{risk.actionDate ? new Date(risk.actionDate).toLocaleDateString('tr-TR') : '-'}</span></div>
                <div>
                  <span className="text-muted-foreground block text-xs mb-2">İyileştirme Sonrası Görseli</span>
                  {risk.actionImage ? (
                    <img src={risk.actionImage} alt="İyileştirme" className="h-20 object-contain rounded border bg-muted/30" />
                  ) : <span className="font-medium text-muted-foreground">-</span>}
                </div>
              </div>

              <div className={`border rounded-xl p-5 mt-2 ${risk.finalScore ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-muted/30'}`}>
                <span className="text-sm font-bold text-foreground mb-4 block">İyileştirme Sonrası Risk Skoru</span>
                {risk.finalScore ? (
                  <div className="flex flex-wrap items-center gap-8">
                    <div><span className="text-muted-foreground block text-xs mb-1">Olasılık (P)</span><span className="font-medium">{risk.finalProb}</span></div>
                    <div><span className="text-muted-foreground block text-xs mb-1">Frekans (F)</span><span className="font-medium">{risk.finalFreq}</span></div>
                    <div><span className="text-muted-foreground block text-xs mb-1">Şiddet (S)</span><span className="font-medium">{risk.finalSev}</span></div>
                    <div className="ml-auto flex items-center gap-4">
                      <div><span className="text-muted-foreground block text-xs mb-1">Risk Puanı</span><span className="font-bold text-xl text-emerald-600">{risk.finalScore}</span></div>
                      <div><span className="text-muted-foreground block text-xs mb-1">Risk Seviyesi</span><LevelBadge level={risk.finalLevel} /></div>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">İyileştirme skoru girilmemiş.</span>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> 4. Bölüm: İyileştirme Etkinlik Ölçümü
            </h3>
            <div className="bg-card border rounded-xl p-5 space-y-4 text-sm shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b">
                <div><span className="text-muted-foreground block text-xs mb-1">Etkinlik Ölçüm Yöntemi</span><span className="font-medium">{risk.effectivenessMethod || '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">İyileştirme Kontrol Sorumlusu</span><span className="font-medium">{risk.controlResponsible || '-'}</span></div>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs mb-1">Sonuç</span>
                <span className="font-medium block">{risk.controlResult || '-'}</span>
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
                                <span className="font-semibold text-muted-foreground">{fieldNames[key] || key}:</span>
                                <span className="line-through text-muted-foreground/70">{formatLogValue(key, val.old)}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="text-emerald-600 font-medium">{formatLogValue(key, val.new)}</span>
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
