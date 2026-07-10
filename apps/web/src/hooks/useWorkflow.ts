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
