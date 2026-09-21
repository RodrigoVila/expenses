import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { FAB } from './FAB';
import { TransactionFormModal } from './TransactionFormModal';
import { UserMenu } from './UserMenu';

export function Layout() {
  const [addOpen, setAddOpen] = useState(false);
  return (
    <div className="min-h-svh flex flex-col">
      <header className="sticky top-0 z-20 backdrop-blur bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-md px-4 py-2 flex items-center justify-between">
          <div className="font-semibold text-brand-600 dark:text-brand-500">Expenses</div>
          <UserMenu />
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-md px-4 pt-4 pb-24">
        <Outlet />
      </main>
      <FAB onClick={() => setAddOpen(true)} label="Nuevo movimiento" />
      <TransactionFormModal open={addOpen} onClose={() => setAddOpen(false)} />
      <BottomNav />
    </div>
  );
}
