import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useIRSC } from '../context/IRSCContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Building2, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

const RISK_COLORS = {
  'Tolere Edilemez': '#8B0000',
  'Yüksek Risk': '#EF4444',
  'Önemli Risk': '#F97316',
  'Olası Risk': '#EAB308',
  'Önemsiz': '#22C55E',
};

export default function TrackingDashboard() {
  const { setCurrentView, facilities, audits = [] } = useIRSC();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isManager = user?.isAdmin || user?.roles.includes('admin') || user?.roles.includes('management') || user?.roles.includes('safety');

  // Calculate Analytics Data
  const { totalAudits, totalFindings, riskDistribution, facilityStats, latestAudits, fStats } = useMemo(() => {
    let findingsCount = 0;
    const riskCounts: Record<string, number> = {
      'Tolere Edilemez': 0,
      'Yüksek Risk': 0,
      'Önemli Risk': 0,
      'Olası Risk': 0,
      'Önemsiz': 0,
    };
    const fStats: Record<string, { total: number, open: number, closed: number }> = {};

    facilities.forEach(f => {
      fStats[f.id] = { total: 0, open: 0, closed: 0 };
    });

    // Group audits by facility to find the latest published audit for KPIs, or track unique finding IDs if they are carried over.
    // Assuming findings that are carried over keep the same ID or we only count findings from the LATEST published audit per facility.
    // The requirement says: "son rapordaki bulgu ve açık işlerin oraya gelmesi lazım." -> Only the LATEST published report's findings should count towards KPIs for that facility.
    
    // Find latest published audit per facility
    const latestAudits: Record<string, any> = {};
    
    audits.filter(a => a.status === 'PUBLISHED').forEach(audit => {
      const facId = audit.meta.locationId;
      if (facId) {
        if (!latestAudits[facId] || audit.id > latestAudits[facId].id) {
          latestAudits[facId] = audit; // Simplified latest check using ID or timestamp
        }
      }
    });

    Object.values(latestAudits).forEach((audit: any) => {
      const facId = audit.meta.locationId;
      audit.findings.forEach((finding: any) => {
        findingsCount++;
        if (riskCounts[finding.risk] !== undefined) {
          riskCounts[finding.risk]++;
        }
        if (facId && fStats[facId]) {
          fStats[facId].total++;
          if (finding.status === 'OPEN') fStats[facId].open++;
          else fStats[facId].closed++;
        }
      });
    });

    const pieData = Object.keys(riskCounts)
      .filter(k => riskCounts[k] > 0)
      .map(k => ({ name: k, value: riskCounts[k] }));

    const barData = facilities
      .filter(f => fStats[f.id] && fStats[f.id].total > 0)
      .map(f => ({
        name: f.name,
        Açık: fStats[f.id].open,
        Kapalı: fStats[f.id].closed
      }));

    return {
      totalAudits: audits.filter(a => a.status === 'PUBLISHED').length,
      totalFindings: findingsCount,
      riskDistribution: pieData,
      facilityStats: barData,
      latestAudits,
      fStats
    };
  }, [audits, facilities]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Merkez Yönetim Paneli</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentView('LIBRARY')}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Denetim Kütüphanesi
          </button>
          {isManager && (
            <button 
              onClick={() => navigate('/renovation-report/settings')}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Modül Ayarları
            </button>
          )}
          {isManager && (
            <button 
              onClick={() => setCurrentView('WORKSPACE')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm"
            >
              ＋ Yeni Denetim Başlat
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between dark:bg-slate-800 dark:border-slate-700">
          <div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Yayınlanan Denetimler</div>
            <div className="text-3xl font-bold text-slate-900 mt-1 dark:text-white">{totalAudits}</div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg dark:bg-blue-900/50 dark:text-blue-400">
            <Building2 size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between dark:bg-slate-800 dark:border-slate-700">
          <div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Toplam Bulgu (Tüm Tesisler)</div>
            <div className="text-3xl font-bold text-slate-900 mt-1 dark:text-white">{totalFindings}</div>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg dark:bg-orange-900/50 dark:text-orange-400">
            <AlertTriangle size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between dark:bg-slate-800 dark:border-slate-700">
          <div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Kapatılan Aksiyonlar</div>
            <div className="text-3xl font-bold text-slate-900 mt-1 dark:text-white">
              {facilityStats.reduce((sum, f) => sum + f.Kapalı, 0)}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg dark:bg-emerald-900/50 dark:text-emerald-400">
            <CheckCircle2 size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between dark:bg-slate-800 dark:border-slate-700">
          <div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">İyileştirme Oranı</div>
            <div className="text-3xl font-bold text-slate-900 mt-1 dark:text-white">
              {totalFindings > 0 
                ? Math.round((facilityStats.reduce((sum, f) => sum + f.Kapalı, 0) / totalFindings) * 100) 
                : 0}%
            </div>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg dark:bg-purple-900/50 dark:text-purple-400">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 h-[400px] flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-6 dark:text-white">Risk Seviyesi Dağılımı (Finne Kinney)</h3>
          <div className="flex-1 w-full relative">
            {riskDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} Bulgu`, 'Adet']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">Henüz yayınlanmış denetim bulgusu yok.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 h-[400px] flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-6 dark:text-white">Tesislere Göre Bulgu Durumu</h3>
          <div className="flex-1 w-full">
            {facilityStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={facilityStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                  <Legend verticalAlign="top" height={36}/>
                  <Bar dataKey="Açık" stackId="a" fill="#EF4444" radius={[0, 0, 4, 4]} maxBarSize={40} />
                  <Bar dataKey="Kapalı" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">Henüz yayınlanmış denetim bulgusu yok.</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-white">
          Tesis Takip Listesi
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium">Lokasyon</th>
                <th className="px-6 py-3 font-medium">Son Denetim</th>
                <th className="px-6 py-3 font-medium">Durum</th>
                <th className="px-6 py-3 font-medium">Bulgu Özeti</th>
                <th className="px-6 py-3 font-medium text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {facilities.map((fac) => (
                <tr key={fac.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{fac.name}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {latestAudits[fac.id] ? new Date(parseInt(latestAudits[fac.id].id.split('_')[1])).toLocaleDateString('tr-TR') : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const pubCount = audits.filter(a => a.meta.locationId === fac.id && a.status === 'PUBLISHED').length;
                      const draftCount = audits.filter(a => a.meta.locationId === fac.id && a.status === 'DRAFT').length;
                      if (pubCount === 0 && draftCount === 0) return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">Başlamadı</span>;
                      if (draftCount > 0) return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400">{draftCount} Taslak</span>;
                      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400">Aktif</span>;
                    })()}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {fStats[fac.id]?.total > 0 ? (
                      <div className="flex gap-2 text-xs">
                        <span className="text-red-500 font-semibold">{fStats[fac.id].open} Açık</span>
                        <span className="text-emerald-600 font-semibold">{fStats[fac.id].closed} Kapalı</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (window as any)._irsc_selectedFacilityId = fac.id; // temporary pass
                        setCurrentView('CONSOLE');
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      İncele →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
