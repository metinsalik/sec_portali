import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from './layout/AppLayout';
import IsgKurulHome from '../pages/isg-kurul/IsgKurulHome';

export default function IsgKurulHomeWrapper() {
  const [searchParams] = useSearchParams();
  const isSingle = searchParams.get('single') === 'true';

  if (isSingle) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 overflow-y-auto">
        <IsgKurulHome />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <IsgKurulHome />
      </AppLayout>
    </ProtectedRoute>
  );
}
