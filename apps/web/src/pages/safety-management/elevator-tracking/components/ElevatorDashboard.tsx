import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend as RechartsLegend
} from 'recharts';
import { differenceInDays, addYears } from 'date-fns';

interface ElevatorDashboardProps {
  elevators: any[];
  onFilterChange: (type: string, value: string | undefined) => void;
  onClearFilters: () => void;
  activeFilters: { brand?: string; maintenanceCompany?: string; label?: string; type?: string; isOverdue?: string };
}

// Generate unique colors for dynamic data
const generateColors = (count: number) => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  return Array.from({ length: count }).map((_, i) => colors[i % colors.length]);
};

const CustomLegend = ({ data, activeFilter, onFilterChange, type, colors }: any) => {
  const total = data.reduce((sum: number, item: any) => sum + item.value, 0);
  
  return (
    <div className="w-1/2 flex flex-col justify-center space-y-2 pl-4 text-sm overflow-y-auto max-h-[200px]">
      {data.map((entry: any, index: number) => {
        const isActive = activeFilter === (entry.filterValue || entry.name);
        const color = entry.color || colors[index];
        const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0';
        return (
          <div 
            key={index} 
            className={`flex items-center justify-between cursor-pointer p-1 rounded hover:bg-gray-100 ${isActive ? 'bg-gray-100 font-medium' : ''}`}
            onClick={() => {
              let value = entry.filterValue || entry.name;
              onFilterChange(type, isActive ? undefined : value);
            }}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></div>
              <span className="truncate" title={entry.name}>{entry.name}</span>
            </div>
            <div className="flex gap-2 text-gray-600 flex-shrink-0">
              <span className="font-semibold">{entry.value}</span>
              <span className="text-xs w-10 text-right">· {percentage}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function ElevatorDashboard({ elevators, onFilterChange, onClearFilters, activeFilters }: ElevatorDashboardProps) {
  const metrics = useMemo(() => {
    let green = 0, blue = 0, yellow = 0, red = 0, unknown = 0;
    let overdue = 0, in0to30 = 0, in31to90 = 0, noDate = 0;
    
    const facilityRiskMap: Record<string, { name: string, red: number, blue: number }> = {};
    const brandMap: Record<string, number> = {};
    const maintMap: Record<string, number> = {};
    const typeMap: Record<string, number> = {};

    elevators.forEach(e => {
      const label = e.label?.toLowerCase() || '';
      if (label.includes('yeşil')) green++;
      else if (label.includes('mavi')) blue++;
      else if (label.includes('sarı')) yellow++;
      else if (label.includes('kırmızı')) red++;
      else unknown++;

      const fName = e.facility?.name || 'Bilinmeyen Tesis';
      if (!facilityRiskMap[fName]) {
        facilityRiskMap[fName] = { name: fName, red: 0, blue: 0 };
      }
      if (label.includes('kırmızı')) facilityRiskMap[fName].red++;
      else if (label.includes('mavi')) facilityRiskMap[fName].blue++;

      const brand = e.brand || 'Bilinmeyen Marka';
      brandMap[brand] = (brandMap[brand] || 0) + 1;

      const maint = e.maintenanceCompany || 'Bilinmeyen Firma';
      maintMap[maint] = (maintMap[maint] || 0) + 1;

      const stat = e.type || 'Belirtilmedi';
      typeMap[stat] = (typeMap[stat] || 0) + 1;

      if (!e.nextInspectionDate) {
        noDate++;
      } else {
        const nextDate = new Date(e.nextInspectionDate);
        const diffDays = differenceInDays(nextDate, new Date());
        
        if (diffDays < 0) overdue++;
        else if (diffDays <= 30) in0to30++;
        else if (diffDays <= 90) in31to90++;
      }
    });

    const facilityRiskData = Object.values(facilityRiskMap)
      .sort((a, b) => (b.red + b.blue) - (a.red + a.blue))
      .slice(0, 10);

    const brands = Object.entries(brandMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const maints = Object.entries(maintMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const types = Object.entries(typeMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return {
      total: elevators.length,
      facilitiesCount: new Set(elevators.map(e => e.facilityId)).size,
      labels: [
        { name: 'Yeşil', value: green, color: '#22c55e', filterValue: 'Yeşil' },
        { name: 'Mavi', value: blue, color: '#3b82f6', filterValue: 'Mavi' },
        { name: 'Sarı', value: yellow, color: '#eab308', filterValue: 'Sarı' },
        { name: 'Kırmızı', value: red, color: '#ef4444', filterValue: 'Kırmızı' },
        { name: 'Belirsiz', value: unknown, color: '#cbd5e1', filterValue: '' }
      ].filter(l => l.value > 0),
      labelStats: { green, blue, yellow, red, unknown },
      statusData: [
        { id: 'overdue', name: 'Süresi geçmiş', count: overdue, fill: '#f97316' },
        { id: '0-30', name: '0-30 gün', count: in0to30, fill: '#3b82f6' },
        { id: '31-90', name: '31-90 gün', count: in31to90, fill: '#14b8a6' },
        { id: 'missing', name: 'Tarih yok', count: noDate, fill: '#94a3b8' },
      ],
      facilityRiskData,
      brands,
      maints,
      types,
      overdueCount: overdue
    };
  }, [elevators]);

  const brandColors = generateColors(metrics.brands.length);
  const maintColors = generateColors(metrics.maints.length);
  const typeColors = generateColors(metrics.types.length);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow text-sm z-50 relative">
          <p className="font-semibold">{payload[0].name || payload[0].payload.name}</p>
          <p>Sayı: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const handlePieClick = (type: 'brand' | 'maintenanceCompany' | 'label', entry: any) => {
    let value = entry.filterValue || entry.name;
    if (activeFilters[type] === value) {
      value = undefined; 
    }
    onFilterChange(type, value);
  };

  const totalFiltered = metrics.labels.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6 mb-8">
      <div className="flex justify-end">
        {(activeFilters.brand || activeFilters.maintenanceCompany || activeFilters.label || activeFilters.type || activeFilters.inspectionStatus) && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Filtreleri Temizle
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => onClearFilters()}><CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Toplam Tesis</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{metrics.facilitiesCount}</div></CardContent></Card>
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => onClearFilters()}><CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Toplam Asansör</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{metrics.total}</div></CardContent></Card>
        <Card className={`cursor-pointer transition-colors ${activeFilters.label === 'Yeşil' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'}`} onClick={() => onFilterChange('label', activeFilters.label === 'Yeşil' ? undefined : 'Yeşil')}><CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-green-600 uppercase tracking-wider">Yeşil Etiket</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">{metrics.labelStats.green}</div></CardContent></Card>
        <Card className={`cursor-pointer transition-colors ${activeFilters.label === 'Mavi' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`} onClick={() => onFilterChange('label', activeFilters.label === 'Mavi' ? undefined : 'Mavi')}><CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Mavi Etiket</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-blue-600">{metrics.labelStats.blue}</div></CardContent></Card>
        <Card className={`cursor-pointer transition-colors ${activeFilters.label === 'Kırmızı' ? 'ring-2 ring-red-500 bg-red-50' : 'hover:bg-gray-50'}`} onClick={() => onFilterChange('label', activeFilters.label === 'Kırmızı' ? undefined : 'Kırmızı')}><CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-red-600 uppercase tracking-wider">Kırmızı Etiket</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-red-600">{metrics.labelStats.red}</div></CardContent></Card>
        <Card className={`cursor-pointer transition-colors ${activeFilters.inspectionStatus === 'overdue' ? 'ring-2 ring-orange-500 bg-orange-50' : 'hover:bg-gray-50'}`} onClick={() => onFilterChange('inspectionStatus', activeFilters.inspectionStatus === 'overdue' ? undefined : 'overdue')}><CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Muayenesi Geçmiş</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-orange-600">{metrics.overdueCount}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Etiket Dağılımı</CardTitle>
            <CardDescription>{activeFilters.label ? `Filtre: ${activeFilters.label}` : 'Filtrelemek için dilime tıklayın'}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center h-64 p-4">
            {metrics.labels.length > 0 ? (
              <>
                <div className="w-1/2 h-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.labels}
                        cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
                        paddingAngle={2} dataKey="value"
                        onClick={(entry) => handlePieClick('label', entry)}
                        className="cursor-pointer"
                      >
                        {metrics.labels.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} opacity={(!activeFilters.label || activeFilters.label === entry.filterValue) ? 1 : 0.3} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold">{totalFiltered}</span>
                    <span className="text-xs text-gray-500">asansör</span>
                  </div>
                </div>
                <CustomLegend data={metrics.labels} activeFilter={activeFilters.label} onFilterChange={onFilterChange} type="label" colors={metrics.labels.map(l => l.color)} />
              </>
            ) : (<div className="text-gray-400 mx-auto">Veri bulunamadı</div>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asansör Firması</CardTitle>
            <CardDescription>{activeFilters.brand ? `Filtre: ${activeFilters.brand}` : 'Filtrelemek için dilime tıklayın'}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center h-64 p-4">
            {metrics.brands.length > 0 ? (
              <>
                <div className="w-1/2 h-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.brands}
                        cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
                        paddingAngle={2} dataKey="value"
                        onClick={(entry) => handlePieClick('brand', entry)}
                        className="cursor-pointer"
                      >
                        {metrics.brands.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={brandColors[index]} opacity={(!activeFilters.brand || activeFilters.brand === entry.name) ? 1 : 0.3} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold">{metrics.brands.reduce((sum, item) => sum + item.value, 0)}</span>
                    <span className="text-xs text-gray-500">asansör</span>
                  </div>
                </div>
                <CustomLegend data={metrics.brands} activeFilter={activeFilters.brand} onFilterChange={onFilterChange} type="brand" colors={brandColors} />
              </>
            ) : (<div className="text-gray-400 mx-auto">Veri bulunamadı</div>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bakım Firması</CardTitle>
            <CardDescription>{activeFilters.maintenanceCompany ? `Filtre: ${activeFilters.maintenanceCompany}` : 'Filtrelemek için dilime tıklayın'}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center h-64 p-4">
            {metrics.maints.length > 0 ? (
              <>
                <div className="w-1/2 h-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.maints}
                        cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
                        paddingAngle={2} dataKey="value"
                        onClick={(entry) => handlePieClick('maintenanceCompany', entry)}
                        className="cursor-pointer"
                      >
                        {metrics.maints.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={maintColors[index]} opacity={(!activeFilters.maintenanceCompany || activeFilters.maintenanceCompany === entry.name) ? 1 : 0.3} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold">{metrics.maints.reduce((sum, item) => sum + item.value, 0)}</span>
                    <span className="text-xs text-gray-500">asansör</span>
                  </div>
                </div>
                <CustomLegend data={metrics.maints} activeFilter={activeFilters.maintenanceCompany} onFilterChange={onFilterChange} type="maintenanceCompany" colors={maintColors} />
              </>
            ) : (<div className="text-gray-400 mx-auto">Veri bulunamadı</div>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tür Dağılımı</CardTitle>
            <CardDescription>{activeFilters.type ? `Filtre: ${activeFilters.type}` : 'Filtrelemek için dilime tıklayın'}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center h-64 p-4">
            {metrics.types.length > 0 ? (
              <>
                <div className="w-1/2 h-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.types}
                        cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
                        paddingAngle={2} dataKey="value"
                        onClick={(entry) => handlePieClick('type', entry)}
                        className="cursor-pointer"
                      >
                        {metrics.types.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={typeColors[index]} opacity={(!activeFilters.type || activeFilters.type === entry.name) ? 1 : 0.3} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold">{metrics.types.reduce((sum, item) => sum + item.value, 0)}</span>
                    <span className="text-xs text-gray-500">asansör</span>
                  </div>
                </div>
                <CustomLegend data={metrics.types} activeFilter={activeFilters.type} onFilterChange={onFilterChange} type="type" colors={typeColors} />
              </>
            ) : (<div className="text-gray-400 mx-auto">Veri bulunamadı</div>)}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col h-[380px]">
          <CardHeader className="pb-4">
            <CardTitle>Muayene Durumu</CardTitle>
            <CardDescription>Asansörlerin periyodik kontrol takvimi</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-4 h-full">
              {metrics.statusData.map((stat, i) => (
                <div 
                  key={i} 
                  className={`rounded-xl p-4 flex flex-col justify-between border cursor-pointer transition-all duration-200 ${activeFilters.inspectionStatus === stat.id ? 'ring-2 shadow-md' : 'hover:bg-gray-50'}`} 
                  style={{ 
                    backgroundColor: activeFilters.inspectionStatus === stat.id ? `${stat.fill}20` : `${stat.fill}10`, 
                    borderColor: activeFilters.inspectionStatus === stat.id ? stat.fill : `${stat.fill}30` 
                  }}
                  onClick={() => onFilterChange('inspectionStatus', activeFilters.inspectionStatus === stat.id ? undefined : stat.id)}
                >
                  <div className="text-sm font-medium" style={{ color: stat.fill }}>{stat.name}</div>
                  <div className="text-4xl font-bold mt-2 text-gray-800">{stat.count}</div>
                  <div className="text-xs text-gray-500 mt-2">Toplamın %{metrics.total > 0 ? ((stat.count / metrics.total) * 100).toFixed(1) : 0}'i</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex flex-col h-[380px]">
          <CardHeader className="pb-4">
            <CardTitle>Etiket Riski Yüksek Tesisler</CardTitle>
            <CardDescription>Kırmızı ve Mavi etiketli asansör yoğunluğu</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {metrics.facilityRiskData.length > 0 ? (
              <div className="space-y-5">
                {metrics.facilityRiskData.map((facility, i) => {
                  const totalRedBlue = facility.red + facility.blue;
                  const redPercent = totalRedBlue > 0 ? (facility.red / totalRedBlue) * 100 : 0;
                  const bluePercent = totalRedBlue > 0 ? (facility.blue / totalRedBlue) * 100 : 0;
                  
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-end text-sm">
                        <span className="font-semibold text-gray-700 truncate mr-4">{facility.name}</span>
                        <div className="flex gap-3 text-xs font-medium shrink-0">
                          <span className="text-red-500">{facility.red} Kırmızı</span>
                          <span className="text-blue-500">{facility.blue} Mavi</span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                        {facility.red > 0 && <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${redPercent}%` }}></div>}
                        {facility.blue > 0 && <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${bluePercent}%` }}></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Veri bulunamadı</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
