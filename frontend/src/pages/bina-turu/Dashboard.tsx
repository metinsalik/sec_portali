import React from 'react';
import DetayliAnaliz from '@/components/bina-turu/DetayliAnaliz';

const Dashboard = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Tüm Zamanlar Bina Turu Analizi</h1>
        <p className="text-slate-500">Geçmişten günümüze tüm yıllara ve dönemlere ait kümülatif uygunluk detayları.</p>
      </div>

      {/* year parametresi gönderilmezse tüm turları alır */}
      <DetayliAnaliz />
    </div>
  );
};

export default Dashboard;
