export interface RenovationReportCheck {
  id: string;
  field: string; // İnceleme Alanı
  scope: string; // Kontrol Kapsamı
  status: 'UYGUN' | 'UYGUN_DEGIL' | 'DEGERLENDIRILMEDI';
}

export interface RenovationReportTest {
  id: string;
  installation: string; // Tesisat
  control: string; // Kontrol
  status: 'RAPOR_GORULEMEDI' | 'UYGUN' | 'UYGUN_DEGIL';
  description: string; // Açıklama
}

export interface RenovationReportCertificate {
  id: string;
  area: string; // Tesisat/Alan
  control: string; // Kontrol
  status: 'SERTIFIKA_GORULEMEDI' | 'UYGUN' | 'UYGUN_DEGIL';
  description: string; // Açıklama
}

export type RiskLevel = 'COK_YUKSEK' | 'YUKSEK' | 'ORTA';

export interface RenovationReportFinding {
  id: string;
  no: string; // A-001, Y-001 vb.
  categoryName: string; // Altyapı Sistemleri vb.
  riskLevel: RiskLevel;
  category: string; // Tespit Kategorisi
  definition: string; // Tespit Tanımı
  findingText: string; // Tespit
  riskText: string; // Risk
  suggestionText: string; // Öneri
  images: string[]; // Fotoğraf URL'leri
}

export interface RenovationReportEvaluation {
  decision: 'KABUL_EDILDI' | 'KISMI_KABUL' | 'GECICI_KABUL' | 'REDDEDILDI';
  signatures: {
    teknikHizmetler: { name: string; date: string };
    idariIsler: { name: string; date: string };
    sec: { name: string; date: string };
    dizayn: { name: string; date: string };
    hastaneIdari: { name: string; date: string };
    yuklenici: { name: string; date: string };
  };
}

export interface RenovationReportFindingsData {
  intros: Record<string, string>;
  items: RenovationReportFinding[];
}

export interface RenovationReport {
  id: string;
  facilityId: string;
  projectName: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  controlledBy: string | null;
  assessmentDate: string | null;
  reportDate: string | null;
  status: 'DRAFT' | 'COMPLETED';
  
  checks: RenovationReportCheck[];
  tests: RenovationReportTest[];
  certificates: RenovationReportCertificate[];
  findings: RenovationReportFindingsData;
  evaluation: RenovationReportEvaluation;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type RenovationReportInput = Omit<RenovationReport, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>;
