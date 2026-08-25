import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from './layout/AppLayout';
import IsgKurulAnalytics from '../pages/isg-kurul/IsgKurulAnalytics';

export default function IsgKurulAnalyticsWrapper() {
  const [searchParams] = useSearchParams();
  const isSingle = searchParams.get('single') === 'true';

  if (isSingle) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 overflow-y-auto">
        <IsgKurulAnalytics isPublic={true} />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <IsgKurulAnalytics isPublic={false} />
      </AppLayout>
    </ProtectedRoute>
  );
}
