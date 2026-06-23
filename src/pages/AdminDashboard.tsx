import * as React from 'react';

export default function AdminDashboard(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg p-8 shadow-xl text-center">
        <h1 className="text-2xl font-bold text-amber-500 mb-2">Admin Dashboard Page Placeholder</h1>
        <p className="text-zinc-400 text-sm">Main administration and metrics dashboard.</p>
      </div>
    </main>
  );
}
