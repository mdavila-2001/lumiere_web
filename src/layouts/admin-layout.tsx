import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/sidebar';

export default function AdminLayout(): React.JSX.Element {
  const handleNewScreening = () => {
    console.log('Action triggered: Open new screening creator');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex w-full">
      <Sidebar onNewScreeningClick={handleNewScreening} />
      <main className="flex-grow pl-64 w-full text-left">
        <div className="p-8 max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
