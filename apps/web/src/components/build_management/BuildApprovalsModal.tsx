import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BuildApprovals } from './BuildApprovals';

interface BuildApprovalsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
}

export function BuildApprovalsModal({ open, onOpenChange, project }: BuildApprovalsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Onaylar ve İzinler</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-900">
           <BuildApprovals project={project} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
