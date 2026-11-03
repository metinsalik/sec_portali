import React from 'react';
import { 
  Settings, 
  ShieldAlert, 
  AlertTriangle, 
  BookOpen, 
  Flame, 
  Skull, 
  Construction, 
  Building, 
  Users, 
  ArrowUpDown, 
  Zap, 
  ClipboardCheck, 
  FileText,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ModulesStepProps {
  data: any;
  update: (data: any) => void;
}

const AVAILABLE_MODULES = [
  { 
    code: 'RISKS', 
    name: 'Saha Risk Analizi & Değerlendirme', 
    desc: 'Birim, kategori ve tehlike bazlı risk değerlendirme ve aksiyon matrisi.',
    icon: ShieldAlert,
    color: 'text-amber-500 bg-amber-500/10'
  },
  { 
    code: 'INCIDENTS', 
    name: 'Olay & Kaza Bildirimleri', 
    desc: 'İş kazaları, ramak kala olayları ve acil durum vaka kayıtları.',
    icon: AlertTriangle,
    color: 'text-rose-500 bg-rose-500/10'
  },
  { 
    code: 'ISG_DEFTER', 
    name: 'İSG Onaylı Defteri', 
    desc: 'Bakanlık onaylı defter sayfaları, tespit kayıtları ve noter onay takibi.',
    icon: BookOpen,
    color: 'text-blue-500 bg-blue-500/10'
  },
  { 
    code: 'FIRE_EQUIPMENT', 
    name: 'Yangın Güvenliği & Ekipman Yönetimi', 
    desc: 'Yangın tüpleri, dolapları, hidrant, algılama ve periyodik saha kontrolleri.',
    icon: Flame,
    color: 'text-orange-500 bg-orange-500/10'
  },
  { 
    code: 'FM200_TRACKING', 
    name: 'FM-200 Gazlı Yangın Söndürme', 
    desc: 'Sistem odaları, gazlı söndürme tüpleri basınç/ağırlık ve oda sızdırmazlık takibi.',
    icon: Flame,
    color: 'text-emerald-500 bg-emerald-500/10'
  },
  { 
    code: 'HAZMAT', 
    name: 'Tehlikeli Kimyasal Maddeler (HAZMAT)', 
    desc: 'Kimyasal envanteri, SDS/GBF güvenlik kartları ve dökülme kiti denetimleri.',
    icon: Skull,
    color: 'text-purple-500 bg-purple-500/10'
  },
  { 
    code: 'BUILD_MANAGEMENT', 
    name: 'İnşaat, ICRA ve Renovasyon', 
    desc: 'Hastane içi tadilatlar, ICRA enfeksiyon kontrolü, sıcak çalışma izinleri.',
    icon: Construction,
    color: 'text-yellow-600 bg-yellow-500/10'
  },
  { 
    code: 'BUILDING_TOUR', 
    name: 'Bina Turu & Saha Denetimleri', 
    desc: 'Rutin saha turları, bina turu soru setleri ve uygunsuzluk takip döngüsü.',
    icon: Building,
    color: 'text-teal-500 bg-teal-500/10'
  },
  { 
    code: 'ISG_KURUL', 
    name: 'İSG Kurul Yönetimi', 
    desc: 'Kurul üyeleri, aylık kurul toplantı gündemleri ve aksiyon kararları takibi.',
    icon: Users,
    color: 'text-indigo-500 bg-indigo-500/10'
  },
  { 
    code: 'ELEVATOR_TRACKING', 
    name: 'Asansör Periyodik Takip', 
    desc: 'Kırmızı/Sarı/Yeşil etiket takibi, A tipi muayene kuruluşu periyodik denetimleri.',
    icon: ArrowUpDown,
    color: 'text-cyan-500 bg-cyan-500/10'
  },
  { 
    code: 'ELECTRIC_INFRASTRUCTURE', 
    name: 'Elektrik & Termal Pano Denetimi', 
    desc: 'Termal kamera ile trafo ve pano sıcaklık ölçümleri, topraklama ölçüm raporları.',
    icon: Zap,
    color: 'text-amber-600 bg-amber-500/10'
  },
  { 
    code: 'IMPROVEMENTS_TRACKING', 
    name: 'İyileştirme ve Aksiyon Takip', 
    desc: 'Tüm modüllerden gelen bulguların konsolide aksiyon havuzu ve takibi.',
    icon: ClipboardCheck,
    color: 'text-emerald-600 bg-emerald-500/10'
  }
];

export default function ModulesStep({ data, update }: ModulesStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="pb-3 border-b border-border/60">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          5. Modül Kullanım İzinleri & Entegrasyonlar
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Bu tesis için merkezi kurumsal lisans kapsamında aktif olan operasyonel modüller ve yetkiler.
        </p>
      </div>

      <div className="flex items-start gap-3 p-3.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-foreground">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-primary">
            Kurumsal Standart Modül Paketi
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Tesis kurulumu tamamlandığında aşağıdaki tüm İSG ve Güvenlik modülleri bu tesis için otomatik olarak yetkilendirilir.
            Kullanıcı bazlı modül erişim kısıtlamalarını <strong className="text-foreground">Ayarlar &gt; Kullanıcılar</strong> menüsünden yönetebilirsiniz.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {AVAILABLE_MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <div 
              key={mod.code}
              className="p-3.5 rounded-lg border border-border/60 bg-card hover:bg-muted/10 transition-colors shadow-2xs space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${mod.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Aktif
                  </Badge>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground leading-tight">{mod.name}</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{mod.desc}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-mono">
                KOD: {mod.code}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
