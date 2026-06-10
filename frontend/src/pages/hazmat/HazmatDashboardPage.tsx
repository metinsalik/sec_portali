import React from 'react';

export default function HazmatDashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tehlikeli Madde Yönetimi (HazMat)</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Tehlikeli Maddeler</h2>
          <p className="text-gray-600 mb-4">Tesisinizdeki tehlikeli maddeleri yönetin.</p>
          <a href="/hazmat/materials" className="text-blue-600 hover:underline">Listeye Git</a>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Departmanlar</h2>
          <p className="text-gray-600 mb-4">Departmanlara atanmış tehlikeli maddeler.</p>
          <a href="/hazmat/departments" className="text-blue-600 hover:underline">Departmanları Görüntüle</a>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Ayarlar</h2>
          <p className="text-gray-600 mb-4">Birimler, etiketler ve KKD tanımları.</p>
          <a href="/hazmat/settings/units" className="text-blue-600 hover:underline">Ayarlara Git</a>
        </div>
      </div>
    </div>
  );
}
