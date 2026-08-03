
export interface OhsBoardDecision {
  id?: string;
  meetingId?: string;
  decisionText: string;
  categoryId: number;
  departmentId: number;
  responsibleName?: string | null;
  status: string; // 'Başlamadı' | 'Devam Ediyor' | 'Tamamlandı' | 'İptal Edildi'
  deadlineDate?: string | null;
  completionDate?: string | null;
  resultExplanation?: string | null;
  previousDecisionId?: string | null;
}

export interface OhsBoardMeeting {
  id?: string;
  facilityId: string;
  meetingDate: string;
  meetingNo: string;
  decisions: OhsBoardDecision[];
}
