import { useState } from 'react';
import { Outlet, useMatch } from 'react-router-dom';
import { Wallet, Repeat, Tag } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { FAB, type FabAction } from './FAB';
import { TransactionFormModal } from './TransactionFormModal';
import { RecurringFormModal } from './RecurringFormModal';
import { CategoryFormModal } from './CategoryFormModal';
import { UserMenu } from './UserMenu';
import { NotificationBell } from './NotificationBell';

export function Layout() {
  const [openTx, setOpenTx] = useState(false);
  const [openFijo, setOpenFijo] = useState(false);
  const [openCat, setOpenCat] = useState(false);

  // Detecta si estamos dentro de un hogar (/hogar/:id) para scopear los FABs.
  const inHouseholdMatch = useMatch('/hogar/:id');
  const scopedHouseholdId = inHouseholdMatch?.params.id ?? null;

  // En scope hogar, no ofrecemos crear categoría (son personales).
  const actions: FabAction[] = scopedHouseholdId
    ? [
        {
          label: 'Nuevo fijo del hogar',
          icon: <Repeat size={18} />,
          onClick: () => setOpenFijo(true),
          colorClass: 'bg-amber-600 hover:bg-amber-700',
        },
        {
          label: 'Nuevo movimiento del hogar',
          icon: <Wallet size={18} />,
          onClick: () => setOpenTx(true),
          colorClass: 'bg-emerald-600 hover:bg-emerald-700',
        },
      ]
    : [
        {
          label: 'Nueva categoría',
          icon: <Tag size={18} />,
          onClick: () => setOpenCat(true),
          colorClass: 'bg-purple-600 hover:bg-purple-700',
        },
        {
          label: 'Nuevo fijo',
          icon: <Repeat size={18} />,
          onClick: () => setOpenFijo(true),
          colorClass: 'bg-amber-600 hover:bg-amber-700',
        },
        {
          label: 'Nuevo movimiento',
          icon: <Wallet size={18} />,
          onClick: () => setOpenTx(true),
          colorClass: 'bg-emerald-600 hover:bg-emerald-700',
        },
      ];

  return (
    <div className="min-h-svh flex flex-col">
      <header className="sticky top-0 z-20 backdrop-blur bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-md px-4 py-2 flex items-center justify-between">
          <div className="font-semibold text-brand-600 dark:text-brand-500">Expenses</div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-md px-4 pt-4 pb-24">
        <Outlet />
      </main>
      <FAB actions={actions} />
      <TransactionFormModal
        open={openTx}
        onClose={() => setOpenTx(false)}
        householdId={scopedHouseholdId}
      />
      <RecurringFormModal
        open={openFijo}
        onClose={() => setOpenFijo(false)}
        householdId={scopedHouseholdId}
      />
      <CategoryFormModal open={openCat} onClose={() => setOpenCat(false)} />
      <BottomNav />
    </div>
  );
}
