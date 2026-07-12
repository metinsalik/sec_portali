export interface CreateWfTaskDto {
  title: string;
  description?: string;
  planId?: string;
  assigneeId: string;
  followerId: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category?: string;
  labels?: string[];
  startDate: Date;
  dueDate: Date;
  estimateHours?: number;
  creatorId?: string;
  blockNote?: string;
  checklist?: { 
    text: string; 
    order: number;
    requireEvidence?: boolean;
    requireDescription?: boolean;
  }[];
  status?: 'TODO' | 'DOING' | 'REVIEW' | 'DONE' | 'BLOCKED';
  recurrence?: string;
  recurrenceEndDate?: Date;
}

export interface UpdateWfTaskDto extends Partial<CreateWfTaskDto> {
  status?: 'TODO' | 'DOING' | 'REVIEW' | 'DONE' | 'BLOCKED';
}

export interface CreateWfPlanDto {
  title: string;
  goal?: string;
  categoryId: string;
  ownerId?: string;
  startDate: Date;
  dueDate: Date;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface UpdateWfPlanDto extends Partial<CreateWfPlanDto> {
  status?: 'TODO' | 'DOING' | 'REVIEW' | 'DONE' | 'BLOCKED';
}

export interface ChecklistStepUpdateDto {
  done: boolean;
  evidence?: string;
}

export interface DueChangeRequestDto {
  requestedDue: Date;
  reason: string;
}
