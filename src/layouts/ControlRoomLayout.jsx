import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';

export const ControlRoomLayout = () => {
  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default ControlRoomLayout;
