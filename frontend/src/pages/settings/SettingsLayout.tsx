import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Building2, Users, Settings2, Database } from 'lucide-react';

const SettingsLayout = () => {
  const navItems = [
    { title: 'Tesis Yönetimi', icon: <Building2 className="w-4 h-4" />, path: 'facilities' },
    { title: 'Kullanıcı Yönetimi', icon: <Users className="w-4 h-4" />, path: 'users' },
    { title: 'Parametreler', icon: <Settings2 className="w-4 h-4" />, path: 'parameters' },
    { title: 'Tanımlar', icon: <Database className="w-4 h-4" />, path: 'definitions' },
  ];

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sistem Ayarları</h1>
        <p className="text-slate-500 mt-1">Uygulama genelindeki tesis, kullanıcı ve parametre ayarlarını buradan yönetebilirsiniz.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              {item.icon}
              {item.title}
            </NavLink>
          ))}
        </aside>

        <main className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SettingsLayout;
