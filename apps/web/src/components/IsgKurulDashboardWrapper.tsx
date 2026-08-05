import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from './layout/AppLayout';
import IsgKurulDashboard from '../pages/isg-kurul/IsgKurulDashboard';

export default function IsgKurulDashboardWrapper() {
  const [searchParams] = useSearchParams();
  const isSingle = searchParams.get('single') === 'true';

  if (isSingle) {
    // Public/Anonymous view with no layout
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 overflow-y-auto">
        <IsgKurulDashboard isPublic={true} />
      </div>
    );
  }

  // Normal authenticated view with sidebar layout
  return (
    <ProtectedRoute>
      <AppLayout>
        <IsgKurulDashboard isPublic={false} />
      </AppLayout>
    </ProtectedRoute>
  );
}
