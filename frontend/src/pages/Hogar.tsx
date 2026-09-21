import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, UserPlus, Trash2, LogOut, Home as HomeIcon, Crown, ChevronRight } from 'lucide-react';
import {
  useHouseholds,
  useCreateHousehold,
  useInviteMember,
  useRemoveMember,
  useLeaveHousehold,
  useDeleteHousehold,
} from '@/hooks/useHouseholds';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Household, HouseholdMember } from '@/lib/types';

/**
 * V1 de Hogar. Foco en gestión:
 * - Empty state si no tiene ninguno
 * - Lista de hogares donde es miembro
 * - Para cada uno: nombre, miembros (avatars), botón invitar (owner), salir/borrar
 *
 * El dashboard financiero por hogar (movimientos, summary, charts scoped) va en
 * la siguiente fase — accesible tocando el hogar (por ahora placeholder).
 */
export function Hogar() {
  const { data: households = [], isLoading } = useHouseholds();
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hogares</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus size={16} />
          Nuevo
        </Button>
      </div>

      <p className="text-sm text-slate-500">
        Compartí gastos con otras personas. Cada hogar tiene sus propios movimientos y fijos,
        visibles solo para sus miembros.
      </p>

      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : households.length === 0 ? (
        <EmptyState onCreate={() => setCreating(true)} />
      ) : (
        <ul className="space-y-3">
          {households.map((h) => (
            <HouseholdCard key={h._id} household={h} />
          ))}
        </ul>
      )}

      <CreateHouseholdModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 text-center space-y-3">
      <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900 mx-auto flex items-center justify-center">
        <HomeIcon size={22} className="text-brand-600 dark:text-brand-400" />
      </div>
      <div>
        <div className="font-semibold">Sin hogares aún</div>
        <div className="text-sm text-slate-500 mt-1">
          Creá uno y sumá gente para compartir gastos, o esperá que te inviten (verás una campanita
          arriba si te llega una invitación).
        </div>
      </div>
      <Button onClick={onCreate}>
        <Plus size={16} />
        Crear hogar
      </Button>
    </div>
  );
}

function HouseholdCard({ household }: { household: Household }) {
  const [inviting, setInviting] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removingMember, setRemovingMember] = useState<HouseholdMember | null>(null);

  const leaveMut = useLeaveHousehold();
  const deleteMut = useDeleteHousehold();
  const removeMut = useRemoveMember();

  return (
    <li className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
      <Link
        to={`/hogar/${household._id}`}
        className="flex items-center justify-between gap-2 -m-1 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
      >
        <div>
          <div className="font-semibold text-lg">{household.name}</div>
          <div className="text-xs text-slate-500">
            {household.members.length} miembro{household.members.length !== 1 ? 's' : ''}
            {household.isOwner && ' · sos el dueño'}
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-400" />
      </Link>
      {household.isOwner && (
        <Button size="sm" variant="secondary" onClick={() => setInviting(true)}>
          <UserPlus size={14} />
          Invitar
        </Button>
      )}

      <ul className="space-y-1">
        {household.members.map((m) => (
          <li key={m._id} className="flex items-center gap-2 text-sm">
            {m.picture ? (
              <img
                src={m.picture}
                alt={m.name}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-semibold">
                {m.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="flex-1 truncate">
              {m.name}
              {m._id === household.ownerId && (
                <Crown size={12} className="inline ml-1 text-amber-500" />
              )}
            </span>
            <span className="text-xs text-slate-400 truncate max-w-[40%]">{m.email}</span>
            {household.isOwner && m._id !== household.ownerId && (
              <button
                onClick={() => setRemovingMember(m)}
                className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-red-500"
                aria-label="Quitar miembro"
              >
                <Trash2 size={12} />
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
        {household.isOwner ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            className="!text-red-600"
          >
            <Trash2 size={14} />
            Borrar hogar
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirmLeave(true)}>
            <LogOut size={14} />
            Salir del hogar
          </Button>
        )}
      </div>

      <InviteModal
        open={inviting}
        onClose={() => setInviting(false)}
        householdId={household._id}
        householdName={household.name}
      />

      <ConfirmDialog
        open={confirmLeave}
        title="¿Salir del hogar?"
        message={`Vas a dejar de ver los movimientos de ${household.name}. Los movimientos que vos cargaste se mantienen visibles para el resto.`}
        danger
        confirmLabel="Salir"
        loading={leaveMut.isPending}
        onConfirm={async () => {
          await leaveMut.mutateAsync(household._id);
          setConfirmLeave(false);
        }}
        onCancel={() => setConfirmLeave(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="¿Borrar hogar?"
        message={`Se elimina el hogar ${household.name}. Los movimientos asociados no se borran (siguen viéndose como del hogar, pero nadie tendrá acceso).`}
        danger
        confirmLabel="Borrar"
        loading={deleteMut.isPending}
        onConfirm={async () => {
          await deleteMut.mutateAsync(household._id);
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={!!removingMember}
        title="¿Quitar miembro?"
        message={
          removingMember
            ? `Vas a quitar a ${removingMember.name}. Los movimientos que cargó se mantienen en el hogar.`
            : ''
        }
        danger
        confirmLabel="Quitar"
        loading={removeMut.isPending}
        onConfirm={async () => {
          if (removingMember) {
            await removeMut.mutateAsync({ id: household._id, memberId: removingMember._id });
            setRemovingMember(null);
          }
        }}
        onCancel={() => setRemovingMember(null)}
      />
    </li>
  );
}

function InviteModal({
  open,
  onClose,
  householdId,
  householdName,
}: {
  open: boolean;
  onClose: () => void;
  householdId: string;
  householdName: string;
}) {
  const [email, setEmail] = useState('');
  const inviteMut = useInviteMember();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await inviteMut.mutateAsync({ id: householdId, email: email.trim() });
      setEmail('');
      onClose();
    } catch {
      /* error handled by hook toast */
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Invitar a ${householdName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email del usuario"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="alguien@gmail.com"
          hint="La persona ya tiene que haber ingresado al menos una vez a la app con su cuenta de Google."
          autoFocus
        />
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={inviteMut.isPending} type="button">
            Cancelar
          </Button>
          <Button type="submit" fullWidth loading={inviteMut.isPending}>
            Enviar invitación
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CreateHouseholdModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const createMut = useCreateHousehold();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createMut.mutateAsync(name.trim());
      setName('');
      onClose();
    } catch {
      /* handled by hook */
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuevo hogar">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Casa Palermo, Alquiler compa..."
          maxLength={50}
          autoFocus
        />
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={createMut.isPending} type="button">
            Cancelar
          </Button>
          <Button type="submit" fullWidth loading={createMut.isPending}>
            Crear
          </Button>
        </div>
      </form>
    </Modal>
  );
}
