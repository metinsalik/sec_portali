import React, { useState } from 'react';
import RenovationReportList from './RenovationReportList';
import RenovationReportWizard from './RenovationReportWizard';
import RenovationReportDetail from './RenovationReportDetail';

export default function RenovationReportPage() {
  const [currentView, setCurrentView] = useState<'LIST' | 'WIZARD' | 'DETAIL'>('LIST');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const handleCreateNew = () => {
    setSelectedReportId(null);
    setCurrentView('WIZARD');
  };

  const handleEdit = (id: string) => {
    setSelectedReportId(id);
    setCurrentView('WIZARD');
  };

  const handleView = (id: string) => {
    setSelectedReportId(id);
    setCurrentView('DETAIL');
  };

  const handleBackToList = () => {
    setCurrentView('LIST');
    setSelectedReportId(null);
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {currentView === 'LIST' && (
        <RenovationReportList 
          onCreateNew={handleCreateNew} 
          onEdit={handleEdit} 
          onView={handleView} 
        />
      )}
      {currentView === 'WIZARD' && (
        <RenovationReportWizard 
          reportId={selectedReportId} 
          onCancel={handleBackToList}
          onComplete={handleBackToList}
        />
      )}
      {currentView === 'DETAIL' && selectedReportId && (
        <RenovationReportDetail 
          reportId={selectedReportId} 
          onBack={handleBackToList} 
        />
      )}
    </div>
  );
}
