import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';

export const MainLayout = () => {
  return (
    <div className="min-h-screen bg-stage-bg text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
