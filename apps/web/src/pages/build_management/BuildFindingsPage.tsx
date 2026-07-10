import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const OHS_QUESTIONS = [
  "Çalışma alanı yetkisiz girişe karşı kapatıldı mı?",
  "Yalnızca önceden bildirilen ve evrakları eksiksiz olan kişiler mi çalıştırılıyor?",
  "Yetkilendirilen alan ve iş dışında herhangi bir çalışma yapılıyor mu?",
  "Çalışanların KKD'leri işe uygun ve eksiksiz şekilde kullanılıyor mu?",
  "Alanda uyarı/ikaz levhaları uygun mu? Eksiksiz şekilde bulunuyor mu?",
  "Çalışma alanında yangın söndürme cihazları kullanıma hazır şekilde bulunuyor mu?",
  "El aletleri çalışma için uygun mu? Güvenli şekilde muhafaza ediliyor ve kullanılıyor mu?",
  "Elektrikli el aletleri çalışma için uygun mu? Güvenli şekilde muhafaza ediliyor ve kullanılıyor mu?",
  "Taşıma - istifleme aletleri uygun mu? Güvenli şekilde muhafaza ediliyor ve kullanılıyor mu?",
  "Tehlikeli maddeler çalışma için uygun mu? Güvenli şekilde muhafaza ediliyor ve kullanılıyor mu?",
  "Aydınlatma uygun ve yeterli mi? Aydınlatma sistemleri çalışıyor mu?",
  "Sıcaklık ve nem uygun mu? Havalandırma yeterli mi?",
  "Gürültü koşulları uygun mu?",
  "Altyapı Sistemlerini korumaya yönelik önlemler alınmış ve yetkisiz müdahaleden kaçınılıyor mu?",
  "Düşmeye neden olacak boşluklara yönelik tedbirler alınmış mı? Bu tedbirler uygulanıyor mu?",
  "İstifleme alanlarında malzeme düşmesi / devrilmesi gibi durumlara karşı önlemler alınmış mı?",
  "Acil Kaçış Yolları ve Acil Çıkışlar yabancı malzemeden arındırılmış ve kullanılabilir durumda mı?",
  "Atıklar belirlenen alanlarda düzenli şekilde depolanıyor mu?"
];

export default function BuildFindingsPage() {
  const facilityId = localStorage.getItem('activeFacilityId');

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['buildProjects', facilityId],
    queryFn: async () => {
      const res = await api.get('/build-management/projects');
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!facilityId
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#011d2b] dark:text-[#cbe6fa]">Bulgu Takibi ve Geçmişi</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Saha denetimlerinden elde edilen bulguların açılış/kapanış tarihçesini izleyin.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#2c3135] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <span className="material-symbols-outlined mr-2 text-slate-500">history</span>
          Projelerdeki Tüm Bulgular ve Geçmişleri
        </h3>
        
        {isLoadingProjects ? (
          <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
        ) : (
          <div className="space-y-6">
            {projects.map((project: any) => (
              <ProjectFindingsSection key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectFindingsSection({ project }: { project: any }) {
  const { data: findings = [], isLoading } = useQuery({
    queryKey: ['buildFindings', project.id],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects/${project.id}/findings`);
      return res.json();
    }
  });

  if (isLoading) return null;
  
  // Sadece içerisinde en az 1 aksiyon (log) olan bulguları listele
  const activeFindings = findings.filter((f: any) => f.actions && f.actions.length > 0);
  if (activeFindings.length === 0) return null;

  // En son aksiyon (en yakın tarih) en üstte olacak şekilde bulguları sırala
  const sortedFindings = [...activeFindings].sort((a: any, b: any) => {
    const aLatest = Math.max(...a.actions.map((act: any) => new Date(act.createdAt).getTime()));
    const bLatest = Math.max(...b.actions.map((act: any) => new Date(act.createdAt).getTime()));
    return bLatest - aLatest;
  });

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-[#202427]">
      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-4 flex items-center">
        <span className="material-symbols-outlined mr-2 text-blue-500">domain</span>
        {project.name}
      </h4>
      <div className="space-y-4">
        {sortedFindings.map((finding: any) => (
          <FindingAccordionItem key={finding.id} finding={finding} />
        ))}
      </div>
    </div>
  );
}

function FindingAccordionItem({ finding }: { finding: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const questionText = finding.sourceType === 'İSG Denetimi' && finding.sourceRef
    ? OHS_QUESTIONS[Number(finding.sourceRef) - 1]
    : '';

  // Geçmiş aksiyonları günümüze yakın tarihten geçmişe doğru sırala (Yeniden eskiye)
  const sortedActions = [...finding.actions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // En güncel log en üstte olduğu için [0] indeksini kontrol ediyoruz
  const isCurrentlyOpen = sortedActions[0]?.status === 'Açık';

  return (
    <div className={`bg-white dark:bg-[#2c3135] rounded-md border shadow-sm overflow-hidden transition-all duration-200 ${isCurrentlyOpen ? 'border-orange-200 dark:border-orange-900/50' : 'border-slate-200 dark:border-slate-700'}`}>
      
      {/* Header (Always Visible) */}
      <div 
        className={`p-4 cursor-pointer flex justify-between items-center ${isCurrentlyOpen ? 'hover:bg-orange-50 dark:hover:bg-orange-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 w-2 h-10 rounded-full ${isCurrentlyOpen ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {finding.sourceType} {finding.sourceRef ? `- Soru ${finding.sourceRef}` : ''}
            </p>
            {questionText && (
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">"{questionText}"</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-xs font-bold px-2 py-1 rounded ${isCurrentlyOpen ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
            {isCurrentlyOpen ? 'Açık (Uygunsuz)' : 'Kapalı (Uygun)'}
          </span>
          <span className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </div>
      </div>

      {/* Expanded Content (Timeline) */}
      {isExpanded && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-[#25292c]">
          <h5 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">Yaşam Döngüsü (Geçmiş)</h5>
          <div className="pl-2 space-y-3 relative before:absolute before:inset-0 before:ml-4 before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
            {sortedActions.map((action: any) => (
              <div key={action.id} className="relative flex items-center justify-between">
                <div className="ml-8 w-full bg-white dark:bg-[#2c3135] p-3 rounded-lg border border-slate-200 dark:border-slate-600 text-sm shadow-sm relative">
                   <div className="absolute top-1/2 -translate-y-1/2 -left-[27px] w-3 h-3 rounded-full border-2 border-white dark:border-[#25292c] bg-slate-400 z-10"></div>
                   
                   <div className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                     <span className="material-symbols-outlined text-[16px] mr-1 text-red-500">warning</span>
                     {new Date(action.createdAt).toLocaleDateString('tr-TR')} - Uygunsuzluk Tespit Edildi (Açıldı)
                   </div>
                   <p className="text-slate-500 text-xs ml-5">{action.description}</p>

                   {action.status === 'Kapatıldı' && action.closedAt && (
                     <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                       <span className="material-symbols-outlined text-[16px] mr-1">check_circle</span>
                       {new Date(action.closedAt).toLocaleDateString('tr-TR')} - Uygun Olarak İşaretlendi (Kapatıldı)
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
