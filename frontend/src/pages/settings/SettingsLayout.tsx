import { Outlet } from 'react-router-dom';

const SettingsLayout = () => {
  return (
    <div className="flex flex-col space-y-6">
      <Outlet />
    </div>
  );
};

export default SettingsLayout;