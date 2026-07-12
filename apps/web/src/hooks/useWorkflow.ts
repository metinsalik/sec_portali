import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface WorkflowTask {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'DOING' | 'REVIEW' | 'DONE' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigneeId: string;
  followerId: string;
  dueDate: string;
  progress: number;
}

export const useWorkflowTasks = (filters?: Record<string, string>) => {
  return useQuery({
    queryKey: ['workflow', 'tasks', filters],
    queryFn: async () => {
      const qs = new URLSearchParams(filters || {}).toString();
      const res = await api.get(`/workflow/tasks?${qs}`);
      return res.json() as Promise<WorkflowTask[]>;
    },
  });
};

export const useWorkflowAlerts = () => {
  return useQuery({
    queryKey: ['workflow', 'alerts'],
    queryFn: async () => {
      const res = await api.get('/workflow/alerts');
      return res.json();
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/workflow/tasks/${id}/status`, { status });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Statü güncellenirken bir hata oluştu');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'tasks'] });
    },
  });
};

export const useWorkflowDashboardStats = () => {
  return useQuery({
    queryKey: ['workflow', 'dashboard', 'stats'],
    queryFn: async () => {
      const res = await api.get('/workflow/dashboard/stats');
      if (!res.ok) throw new Error('Stats fetch failed');
      return res.json();
    }
  });
};

export interface WorkflowUser {
  username: string;
  fullName: string;
  email: string | null;
  workflowRole: string;
}

export const useWorkflowRoles = () => {
  return useQuery({
    queryKey: ['workflow', 'roles'],
    queryFn: async () => {
      const res = await api.get('/workflow/settings/roles');
      if (!res.ok) throw new Error('Kullanıcı rolleri getirilemedi');
      return res.json() as Promise<WorkflowUser[]>;
    },
  });
};

export const useUpdateWorkflowRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await api.put(`/workflow/settings/roles/${userId}`, { role });
      if (!res.ok) throw new Error('Rol güncellenemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'roles'] });
    },
  });
};

export const useCreatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/workflow/plans', data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Oluşturulamadı');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-plans'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-plans-all'] });
    },
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/workflow/plans/${id}`, data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Güncellenemedi');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-plans'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-plans-all'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-plan', variables.id] });
    },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/workflow/plans/${id}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Silinemedi');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-plans'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-plans-all'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/workflow/tasks/${id}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Silinemedi');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'tasks'] });
    },
  });
};

export const useUnblockTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resolutionNote }: { id: string; resolutionNote: string }) => {
      const res = await api.post(`/workflow/tasks/${id}/unblock`, { resolutionNote });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Engel kaldırılamadı');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-task', variables.id] });
    },
  });
};
