export interface FacilityOption {
  id: string;
  name: string;
  shortName: string;
  city: string;
  recordCount: number;
}

export type RiskScoreType = 'Kritik' | 'Yüksek' | 'Önemli' | 'Olası' | 'Önemsiz';
export type RecordStatusType = 'Tamamlandı' | 'Devam Ediyor' | 'Başlamadı' | 'İptal Edildi';

export interface ImprovementFileAttachment {
  url: string;
  name: string;
  type: string;
  size?: number;
  originalSize?: number;
  uploadedAt: string;
}

export interface ActionTemplateField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number';
  placeholder?: string;
  required?: boolean;
}

export interface ImprovementActionTemplate {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  suggestedStatus?: string;
  progressWeight?: number; // Eklenmesi gereken ilerleme yüzdesi (+10, +20 vb. veya 100)
  fields: ActionTemplateField[];
  sentenceTemplate: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface ImprovementRecordHistory {
  id: string;
  recordId: string;
  previousNote?: string | null;
  newNote: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  progress?: number | null;        // Bu işlem sonrası güncel yüzde (0-100)
  progressAdded?: number | null;   // Bu işlemde eklenen yüzde (+10, +20 vb.)
  stepType?: string | null;
  stepTitle?: string | null;
  stepFields?: Record<string, any> | null;
  evidencePhotos?: ImprovementFileAttachment[] | null;
  documents?: ImprovementFileAttachment[] | null;
  changedBy: string;
  changedByName?: string | null;
  createdAt: string;
}

export interface ImprovementRecord {
  id: string;
  facilityId: string;
  facility?: {
    id: string;
    name: string;
    shortName: string;
  };
  moduleGroup: string; // 'DENETIMLER' | 'ELEKTRIK' | 'MEKANIK' | 'YANGIN'
  sheetType: string;
  rowNo?: number | null;
  location?: string | null;
  equipment?: string | null;
  equipmentNo?: string | null;
  equipmentName?: string | null;
  finding: string;
  riskScore?: RiskScoreType | string | null;
  assignedTo?: string | null;
  status: RecordStatusType | string;
  progress?: number; // İlerleme Yüzdesi (0 - 100)
  actionPlan?: string | null;
  currentNote?: string | null;
  auditName?: string | null;
  category?: string | null;
  recordDate?: string | null;
  dueDate?: string | null; // Termin Tarihi
  applicationType?: string | null;

  // Yeni Eklenen Sütunlar (Excel Takip Tablosu Güncellemesi)
  technicalManagerDesc?: string | null; // Teknik Müdür Açıklaması
  discoveryNotes?: string | null;       // Yapılan Keşif Notları
  estimatedBudget?: number | null;      // Tahmini Bütçe
  actualBudget?: number | null;         // Gerçekleşen Bütçe
  currency?: string | null;             // 'TRY' | 'USD' | 'EUR'

  // Fotoğraf ve Doküman Ekleri
  findingPhotos?: ImprovementFileAttachment[] | null;
  documents?: ImprovementFileAttachment[] | null;

  // Periyodik Kontrol ve Standart Not Bağlantısı
  periodicReportId?: string | null;
  standardNoteCode?: string | null;

  sourceFileName?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  histories?: ImprovementRecordHistory[];
}

export interface ImprovementPeriodicReport {
  id: string;
  facilityId: string;
  facility?: {
    id: string;
    name: string;
    shortName: string;
  };
  moduleGroup: string;
  sheetType: string;
  reportNo?: string | null;
  reportDate?: string | null;
  isgKatipId?: string | null;
  actionType: string;
  startDate?: string | null;
  endDate?: string | null;
  inspectionDate?: string | null;
  nextInspectionDate?: string | null;
  firmName?: string | null;
  inspectorName?: string | null;
  result: 'Uygun' | 'Uygun Değil' | string;
  notes?: string | null;
  documents?: ImprovementFileAttachment[] | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  _count?: {
    records: number;
  };
}

export interface PeriodicControlSummaryItem {
  facility: {
    id: string;
    name: string;
    shortName: string;
  };
  report: ImprovementPeriodicReport | null;
  openCount: number;
  openCriticalCount: number;
  isOverdue: boolean;
  daysRemaining: number | null;
}

export interface GroundingStandardNote {
  code: string;
  title: string;
  text: string;
  defectLevel: 'Uygun' | 'Ağır Kusur' | 'Yetersiz';
  isHeavyDefect: boolean;
  recommendedRisk: 'Kritik' | 'Yüksek' | 'Önemli' | 'Olası' | 'Önemsiz';
  recommendedActionPlan: string;
}

export const GROUNDING_STANDARD_NOTES: GroundingStandardNote[] = [
  {
    code: 'Not-1',
    title: 'Not-1: Uygun',
    text: 'Uygun.',
    defectLevel: 'Uygun',
    isHeavyDefect: false,
    recommendedRisk: 'Önemsiz',
    recommendedActionPlan: 'Periyodik kontrol sonuçları uygun bulunmuştur. Rutin takip sürdürülecektir.',
  },
  {
    code: 'Not-2',
    title: 'Not-2: Güvenlik şartı sağlanamadığından uygun değildir (Ağır kusur)',
    text: 'Güvenlik şartı sağlanamadığından uygun değildir. (Ağır kusur)',
    defectLevel: 'Ağır Kusur',
    isHeavyDefect: true,
    recommendedRisk: 'Kritik',
    recommendedActionPlan: 'Elektrik tesisatı güvenlik şartları incelenerek can ve mal güvenliğini tehdit eden kusurlar acilen giderilecektir.',
  },
  {
    code: 'Not-3',
    title: 'Not-3: Topraklama bağlantısı yok kontrol edilmelidir (Ağır kusur)',
    text: 'Topraklama bağlantısı yok kontrol edilmelidir. (Ağır kusur)',
    defectLevel: 'Ağır Kusur',
    isHeavyDefect: true,
    recommendedRisk: 'Kritik',
    recommendedActionPlan: 'İlgili ekipman/priz noktasına koruma topraklama iletkeni çekilerek bağlantı sürekliliği sağlanacaktır.',
  },
  {
    code: 'Not-4',
    title: 'Not-4: Artık akım anahtarı (RCD) faal ve uygun',
    text: 'Artık akım anahtarı kullanıldığı ve faal olduğu için uygundur.',
    defectLevel: 'Uygun',
    isHeavyDefect: false,
    recommendedRisk: 'Önemsiz',
    recommendedActionPlan: 'RCD koruma anahtarı faaldir, periyodik testleri düzenli sürdürülecektir.',
  },
  {
    code: 'Not-5',
    title: 'Not-5: 32 A prizlerde 30 mA RCD zorunluluğu (Ağır kusur)',
    text: 'TT veya TN (TN-S veya TN-CS’nin S bölümü) şebeke sistemlerinde 32 A’e kadar genel kullanım priz tesisatlarında, 32 A’e kadar seyyar cihaz prizlerinde 30 mA artık akım cihazı RCD kullanımı zorunludur. 32 A’in üzerindeki devrelerde ise, doğal kaçak akımların kaçınılmaz olduğu durumlarda, uygun seçilmiş kaçak akım koruma cihazları (RCD), diğer elektrik çarpmasına karşı koruma önlemleriyle birlikte kullanılmalıdır. Doğal kaçakların bulunduğu bölümlere ilişkin teknik detay ve sebepler periyodik kontrol raporunun ilgili bölümlerinde belirtilmelidir. (Ağır kusur)',
    defectLevel: 'Ağır Kusur',
    isHeavyDefect: true,
    recommendedRisk: 'Kritik',
    recommendedActionPlan: '32 A priz linyelerine 30 mA kaçak akım koruma şalteri (RCD) tesis edilecek ve açma akımı/zamanı doğrulanacaktır.',
  },
  {
    code: 'Not-6',
    title: 'Not-6: 32 A üzeri devrelerde kaçak akım tahkiki eksik (Ağır kusur)',
    text: '32 A üzerindeki devrelerde dolaylı dokunmaya karşı önlemler yanında doğal kaçak akım tahkiki yapılmadığından yetersizdir. (Ağır kusur)',
    defectLevel: 'Ağır Kusur',
    isHeavyDefect: true,
    recommendedRisk: 'Kritik',
    recommendedActionPlan: '32 A üzerindeki devrelerde doğal kaçak akım ölçüm ve tahkiki tamamlanarak koruma önlemleri revize edilecektir.',
  },
  {
    code: 'Not-7',
    title: 'Not-7: RCD selektif/gecikmeli tip değil (Yetersiz)',
    text: 'Son tüketim noktasını besleyen panodan bir önceki panoda kullanılan RCD gecikmeli tip (selektif veya gecikme ayarlı) olmadığından yetersizdir.',
    defectLevel: 'Yetersiz',
    isHeavyDefect: false,
    recommendedRisk: 'Yüksek',
    recommendedActionPlan: 'Üst besleme panosundaki kaçak akım koruma cihazı selektif/gecikmeli (S tipi) RCD ile değiştirilecektir.',
  },
  {
    code: 'Not-8',
    title: 'Not-8: Nötr-toprak gerilimi yüksek, ölçüm yapılamadı (Ağır kusur)',
    text: 'Nötr-toprak geriliminin yüksek olması nedeniyle ölçüm yapılamamıştır. (Ağır kusur)',
    defectLevel: 'Ağır Kusur',
    isHeavyDefect: true,
    recommendedRisk: 'Kritik',
    recommendedActionPlan: 'Nötr hattındaki dengesizlik, harmonik ve gevşek bağlantılar tespit edilerek nötr-toprak gerilimi izin verilen sınırlara indirilecektir.',
  },
  {
    code: 'Not-9',
    title: 'Not-9: PE ve N iletkenlerinin köprü dışı birleştirilmesi uygun değil (Ağır kusur)',
    text: 'TN-S ve TN-CS topraklama sistem tipini belirleyen PEN köprüsü dışında PE ve N iletkenlerinin birleştirilmesi uygun değildir. (Ağır kusur)',
    defectLevel: 'Ağır Kusur',
    isHeavyDefect: true,
    recommendedRisk: 'Kritik',
    recommendedActionPlan: 'Tesisattaki uygunsuz PE ve N kısa devre/birleşme noktaları tespit edilip ayrılarak bağımsız iletken hatları sağlanacaktır.',
  },
  {
    code: 'Not-10',
    title: 'Not-10: Prizde sıfırlama (Nötr-Toprak birleşikliği) yapılmış (Ağır kusur)',
    text: 'Priz üzerinde Nötr-Toprak birleşikliği (sıfırlama yapıldığı) tespit edildiğinden yetersiz. Tesis topraklama tipi TT ise sıfırlama yapılamaz. TN ise PEN iletken kesiti <10 mm2 olamayacağından 2,5 mm2 prizde sıfırlama yapılamaz. (Ağır kusur)',
    defectLevel: 'Ağır Kusur',
    isHeavyDefect: true,
    recommendedRisk: 'Kritik',
    recommendedActionPlan: 'Prizdeki nötr-toprak sıfırlama köprüsü ivedilikle sökülecek, panodan bağımsız koruma topraklama iletkeni çekilecektir.',
  },
  {
    code: 'Not-11',
    title: 'Not-11: Pano gövde-kapak topraklama köprüsü yok (Ağır kusur)',
    text: 'Pano gövde–kapak köprüsü olmadığından yetersizdir. (Ağır kusur)',
    defectLevel: 'Ağır Kusur',
    isHeavyDefect: true,
    recommendedRisk: 'Yüksek',
    recommendedActionPlan: 'Pano kapağı ile metal gövde arasına sarı-yeşil esnek bakır topraklama örgüsü (köprüsü) takılacaktır.',
  },
];

export interface DashboardStats {
  summary: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    cancelled: number;
    open: number;
    completionPercentage: number;
    weightedCompletionPercentage?: number;
    avgInProgressProgress?: number;
    totalProgressSum?: number;
    inProgressBrackets?: {
      nearCompletion: number;
      inExecution: number;
      earlyStage: number;
    };
    openCritical: number;
    openHigh: number;
    critical?: number;
    unspecifiedStatus?: number;
    missingAssignee?: number;
    risks: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      negligible: number;
    };
  };
  statusDistribution?: Record<string, number>;
  riskDistribution?: Record<string, number>;
  modules?: Record<string, {
    key: string;
    label: string;
    path: string;
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    cancelled: number;
    progressSum: number;
    completionPercentage: number;
    weightedCompletionPercentage: number;
    avgInProgressProgress: number;
    inProgressBrackets: {
      nearCompletion: number;
      inExecution: number;
      earlyStage: number;
    };
  }>;
  sheets: Record<string, {
    total: number;
    completed: number;
    open: number;
    inProgress: number;
    notStarted: number;
    openStatus?: number;
    cancelled?: number;
    openHighCritical?: number;
    critical?: number;
    durumEksik?: number;
    missingAssignee?: number;
    completionPercentage?: number;
    weightedCompletionPercentage?: number;
    avgInProgressProgress?: number;
    inProgressBrackets?: {
      nearCompletion: number;
      inExecution: number;
      earlyStage: number;
    };
  }>;
  hospitals: Array<{
    hospitalId: string;
    hospitalName: string;
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    openStatus?: number;
    cancelled: number;
    open: number;
    openHighCritical?: number;
    completionPercentage?: number;
    weightedCompletionPercentage?: number;
    sheets?: Record<string, {
      total: number;
      completed: number;
      inProgress: number;
      notStarted: number;
      openStatus?: number;
      cancelled: number;
      open: number;
      openHighCritical?: number;
      completionPercentage?: number;
      weightedCompletionPercentage?: number;
    }>;
  }>;
  hospitalComparison?: Array<{
    hospitalId: string;
    hospitalName: string;
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    openStatus?: number;
    cancelled: number;
    open: number;
    openHighCritical?: number;
    completionPercentage?: number;
    weightedCompletionPercentage?: number;
  }>;
  categories: Record<string, number>;
}

export interface SheetDefinition {
  key: string;
  name: string;
  path: string;
  moduleGroup?: string;
}

// 1. DENETİMLER GRUBU
export const AUDIT_SHEETS: SheetDefinition[] = [
  { key: 'HASTANE_IC_DENETIMLERI', name: 'Hastane İç Denetimleri', path: 'hastane-ic', moduleGroup: 'DENETIMLER' },
  { key: 'MERKEZI_DENETIMLER', name: 'Merkezi Denetimler', path: 'merkezi', moduleGroup: 'DENETIMLER' },
  { key: 'SAGLIK_DENETIMLERI', name: 'Sağlık Denetimleri', path: 'saglik', moduleGroup: 'DENETIMLER' },
  { key: 'ITFAIYE_YANGIN_DENETIMLERI', name: 'İtfaiye/Yangın Komisyonu Denetimleri', path: 'itfaiye-yangin', moduleGroup: 'DENETIMLER' },
];

// 2. ELEKTRİK EMNİYET RAPORU GRUBU
export const ELECTRICAL_SHEETS: SheetDefinition[] = [
  { key: 'ELEKTRIK_PK', name: 'Elektrik PK', path: 'elektrik-pk', moduleGroup: 'ELEKTRIK' },
  { key: 'TOPRAKLAMA_PK', name: 'Topraklama PK', path: 'topraklama-pk', moduleGroup: 'ELEKTRIK' },
  { key: 'PARATONER_PK', name: 'Paratoner PK', path: 'paratoner-pk', moduleGroup: 'ELEKTRIK' },
  { key: 'JENERATOR_PK', name: 'Jeneratör PK & Bakım', path: 'jenerator-pk', moduleGroup: 'ELEKTRIK' },
  { key: 'ELEKTRIK_PANO_KONTROLLERI', name: 'Elektrik Pano Kontrolleri', path: 'pano-kontrol', moduleGroup: 'ELEKTRIK' },
  { key: 'TRAFO', name: 'Trafo PK & Bakım', path: 'trafo', moduleGroup: 'ELEKTRIK' },
  { key: 'UPS', name: 'UPS PK & Bakım', path: 'ups', moduleGroup: 'ELEKTRIK' },
];

// 3. MEKANİK EMNİYET RAPORU GRUBU
export const MECHANICAL_SHEETS: SheetDefinition[] = [
  { key: 'KAZANLAR', name: 'Kazanlar', path: 'kazanlar', moduleGroup: 'MEKANIK' },
  { key: 'CHILLERLER', name: 'Chillerler', path: 'chillerler', moduleGroup: 'MEKANIK' },
  { key: 'KLIMA_SANTRALLERI', name: 'Klima Santralleri', path: 'klima-santralleri', moduleGroup: 'MEKANIK' },
];

// 4. YANGIN SİSTEMLERİ EMNİYET RAPORU GRUBU
export const FIRE_SYSTEMS_SHEETS: SheetDefinition[] = [
  { key: 'SULU_SONDURME_PK_BAKIM', name: 'Sulu Söndürme PK & Bakım', path: 'sulu-sondurme-pk-bakim', moduleGroup: 'YANGIN' },
  { key: 'GAZLI_SONDURME_PK_BAKIM', name: 'Gazlı Söndürme PK & Bakım', path: 'gazli-sondurme-pk-bakim', moduleGroup: 'YANGIN' },
  { key: 'BASINCLANDIRMA_PK_BAKIM', name: 'Basınçlandırma Sistemleri PK & Bakım', path: 'basinclandirma-pk-bakim', moduleGroup: 'YANGIN' },
  { key: 'YANGIN_ALGILAMA_PK_BAKIM', name: 'Yangın Algılama ve Uyarı Sistemleri PK & Bakım', path: 'yangin-algilama-pk-bakim', moduleGroup: 'YANGIN' },
];

// EXCEL EŞLEŞTİRME VE NORMALİZASYON SÖZLÜĞÜ
export const SHEET_MAP: Record<string, { sheetType: string; moduleGroup: string; label: string }> = {
  // Denetimler (Excel'deki Denetimler sekmesi Merkezi Denetimler olarak kaydedilir)
  'Denetimler': { sheetType: 'MERKEZI_DENETIMLER', moduleGroup: 'DENETIMLER', label: 'Merkezi Denetimler' },
  'Hastane İç Denetimleri': { sheetType: 'HASTANE_IC_DENETIMLERI', moduleGroup: 'DENETIMLER', label: 'Hastane İç Denetimleri' },
  'Hastane Ic Denetimleri': { sheetType: 'HASTANE_IC_DENETIMLERI', moduleGroup: 'DENETIMLER', label: 'Hastane İç Denetimleri' },
  'Merkezi Denetimler': { sheetType: 'MERKEZI_DENETIMLER', moduleGroup: 'DENETIMLER', label: 'Merkezi Denetimler' },
  'Sağlık Denetimleri': { sheetType: 'SAGLIK_DENETIMLERI', moduleGroup: 'DENETIMLER', label: 'Sağlık Denetimleri' },
  'Saglik Denetimleri': { sheetType: 'SAGLIK_DENETIMLERI', moduleGroup: 'DENETIMLER', label: 'Sağlık Denetimleri' },
  'İtfaiye/Yangın Komisyonu Denetimleri': { sheetType: 'ITFAIYE_YANGIN_DENETIMLERI', moduleGroup: 'DENETIMLER', label: 'İtfaiye/Yangın Komisyonu Denetimleri' },
  'İtfaiye Yangın Komisyonu Denetimleri': { sheetType: 'ITFAIYE_YANGIN_DENETIMLERI', moduleGroup: 'DENETIMLER', label: 'İtfaiye/Yangın Komisyonu Denetimleri' },
  'Itfaiye Yangin Komisyonu Denetimleri': { sheetType: 'ITFAIYE_YANGIN_DENETIMLERI', moduleGroup: 'DENETIMLER', label: 'İtfaiye/Yangın Komisyonu Denetimleri' },
  'İtfaiye Denetimleri': { sheetType: 'ITFAIYE_YANGIN_DENETIMLERI', moduleGroup: 'DENETIMLER', label: 'İtfaiye/Yangın Komisyonu Denetimleri' },

  // Elektrik Emniyet Raporu
  'Elektrik PK': { sheetType: 'ELEKTRIK_PK', moduleGroup: 'ELEKTRIK', label: 'Elektrik PK' },
  'Topraklama PK': { sheetType: 'TOPRAKLAMA_PK', moduleGroup: 'ELEKTRIK', label: 'Topraklama PK' },
  'Paratoner PK': { sheetType: 'PARATONER_PK', moduleGroup: 'ELEKTRIK', label: 'Paratoner PK' },
  'Jeneratör PK': { sheetType: 'JENERATOR_PK', moduleGroup: 'ELEKTRIK', label: 'Jeneratör PK & Bakım' },
  'Jenerator PK': { sheetType: 'JENERATOR_PK', moduleGroup: 'ELEKTRIK', label: 'Jeneratör PK & Bakım' },
  'Jeneratör PK & Bakım': { sheetType: 'JENERATOR_PK', moduleGroup: 'ELEKTRIK', label: 'Jeneratör PK & Bakım' },
  'Elektrik Pano Kontrolleri': { sheetType: 'ELEKTRIK_PANO_KONTROLLERI', moduleGroup: 'ELEKTRIK', label: 'Elektrik Pano Kontrolleri' },
  'Elektrik Pano Kontolleri': { sheetType: 'ELEKTRIK_PANO_KONTROLLERI', moduleGroup: 'ELEKTRIK', label: 'Elektrik Pano Kontrolleri' },
  'Pano Kontrolleri': { sheetType: 'ELEKTRIK_PANO_KONTROLLERI', moduleGroup: 'ELEKTRIK', label: 'Elektrik Pano Kontrolleri' },
  'Enerji Analiz Raporu': { sheetType: 'ELEKTRIK_PANO_KONTROLLERI', moduleGroup: 'ELEKTRIK', label: 'Elektrik Pano Kontrolleri' },
  'Trafo': { sheetType: 'TRAFO', moduleGroup: 'ELEKTRIK', label: 'Trafo PK & Bakım' },
  'Trafo PK & Bakım': { sheetType: 'TRAFO', moduleGroup: 'ELEKTRIK', label: 'Trafo PK & Bakım' },
  'UPS': { sheetType: 'UPS', moduleGroup: 'ELEKTRIK', label: 'UPS PK & Bakım' },
  'UPS PK & Bakım': { sheetType: 'UPS', moduleGroup: 'ELEKTRIK', label: 'UPS PK & Bakım' },

  // Mekanik Emniyet Raporu
  'Kazanlar': { sheetType: 'KAZANLAR', moduleGroup: 'MEKANIK', label: 'Kazanlar' },
  'Chillerler': { sheetType: 'CHILLERLER', moduleGroup: 'MEKANIK', label: 'Chillerler' },
  'Klima Santralleri': { sheetType: 'KLIMA_SANTRALLERI', moduleGroup: 'MEKANIK', label: 'Klima Santralleri' },

  // Yangın Sistemleri Emniyet Raporu
  'Sulu Söndürme PK & Bakım': { sheetType: 'SULU_SONDURME_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Sulu Söndürme PK & Bakım' },
  'Sulu Söndürme PK': { sheetType: 'SULU_SONDURME_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Sulu Söndürme PK & Bakım' },
  'Sulu Söndürme': { sheetType: 'SULU_SONDURME_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Sulu Söndürme PK & Bakım' },
  'Gazlı Söndürme PK & Bakım': { sheetType: 'GAZLI_SONDURME_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Gazlı Söndürme PK & Bakım' },
  'Gazlı Söndürme PK': { sheetType: 'GAZLI_SONDURME_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Gazlı Söndürme PK & Bakım' },
  'Gazlı Söndürme': { sheetType: 'GAZLI_SONDURME_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Gazlı Söndürme PK & Bakım' },
  'Basınçlandırma Sistemleri PK & Bakım': { sheetType: 'BASINCLANDIRMA_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Basınçlandırma Sistemleri PK & Bakım' },
  'Basınçlandırma Sistemleri': { sheetType: 'BASINCLANDIRMA_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Basınçlandırma Sistemleri PK & Bakım' },
  'Yangın Algılama ve Uyarı Sistemleri PK & Bakım': { sheetType: 'YANGIN_ALGILAMA_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Yangın Algılama ve Uyarı Sistemleri PK & Bakım' },
  'Yangın Algılama ve Uyarı Sistemleri': { sheetType: 'YANGIN_ALGILAMA_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Yangın Algılama ve Uyarı Sistemleri PK & Bakım' },
  'Yangın Algılama': { sheetType: 'YANGIN_ALGILAMA_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Yangın Algılama ve Uyarı Sistemleri PK & Bakım' },
};

export function getModuleGroup(sheetType: string): string {
  if (['DENETIMLER', 'HASTANE_IC_DENETIMLERI', 'MERKEZI_DENETIMLER', 'SAGLIK_DENETIMLERI', 'ITFAIYE_YANGIN_DENETIMLERI'].includes(sheetType)) {
    return 'DENETIMLER';
  }
  if (['KAZANLAR', 'CHILLERLER', 'KLIMA_SANTRALLERI'].includes(sheetType)) {
    return 'MEKANIK';
  }
  if (['SULU_SONDURME_PK_BAKIM', 'GAZLI_SONDURME_PK_BAKIM', 'BASINCLANDIRMA_PK_BAKIM', 'YANGIN_ALGILAMA_PK_BAKIM'].includes(sheetType)) {
    return 'YANGIN';
  }
  return 'ELEKTRIK';
}

export function getSheetLabel(sType?: string): string {
  switch (sType) {
    case 'DENETIMLER': return 'Denetimler';
    case 'HASTANE_IC_DENETIMLERI': return 'Hastane İç Denetimleri';
    case 'MERKEZI_DENETIMLER': return 'Merkezi Denetimler';
    case 'SAGLIK_DENETIMLERI': return 'Sağlık Denetimleri';
    case 'ITFAIYE_YANGIN_DENETIMLERI': return 'İtfaiye/Yangın Komisyonu Denetimleri';
    case 'ELEKTRIK_PK': return 'Elektrik PK';
    case 'TOPRAKLAMA_PK': return 'Topraklama PK';
    case 'PARATONER_PK': return 'Paratoner PK';
    case 'JENERATOR_PK': return 'Jeneratör PK & Bakım';
    case 'ELEKTRIK_PANO_KONTROLLERI': return 'Elektrik Pano Kontrolleri';
    case 'TRAFO': return 'Trafo PK & Bakım';
    case 'UPS': return 'UPS PK & Bakım';
    case 'KAZANLAR': return 'Kazanlar';
    case 'CHILLERLER': return 'Chillerler';
    case 'KLIMA_SANTRALLERI': return 'Klima Santralleri';
    case 'SULU_SONDURME_PK_BAKIM': return 'Sulu Söndürme PK & Bakım';
    case 'GAZLI_SONDURME_PK_BAKIM': return 'Gazlı Söndürme PK & Bakım';
    case 'BASINCLANDIRMA_PK_BAKIM': return 'Basınçlandırma Sistemleri PK & Bakım';
    case 'YANGIN_ALGILAMA_PK_BAKIM': return 'Yangın Algılama ve Uyarı Sistemleri PK & Bakım';
    default: return sType || '-';
  }
}

export function formatCurrency(amount?: number | null, currency?: string | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '-';
  const rawCurr = String(currency || 'TRY').toUpperCase().trim();
  const currCode = (rawCurr === 'USD' || rawCurr === '$') ? 'USD' 
    : (rawCurr === 'EUR' || rawCurr === '€') ? 'EUR' 
    : 'TRY';

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Bozulmuş veya ISO-8859-1 ile çözülmüş Türkçe karakterli dosya adlarını
 * (örn: MP-YÄ±ldÄ±z... -> MP-Yıldız...) temiz Türkçe metne dönüştürür.
 */
export function formatAttachmentName(name?: string): string {
  if (!name) return 'Belge';
  try {
    if (/[\u00C0-\u00FF]/.test(name)) {
      return decodeURIComponent(escape(name));
    }
  } catch {
    // fallback to original name
  }
  return name;
}



