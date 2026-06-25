import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';

export default function AdminLayout(): React.JSX.Element {
  const handleNewScreening = (): void => {
    window.location.href = '/admin/showtimes';
  };

  return (
    <div className="min-h-screen bg-[#111319] text-[#e2e2eb] font-sans flex w-full">
      <Sidebar onNewScreeningClick={handleNewScreening} />

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <main className="flex-grow p-8 w-full flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
