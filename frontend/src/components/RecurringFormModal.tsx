import { Modal } from '@/components/ui/Modal';
import {
  RecurringForm,
  recurringToFormValues,
  type RecurringFormValues,
} from '@/components/forms/RecurringForm';
import { useCreateRecurring, useUpdateRecurring } from '@/hooks/useRecurring';
import type { RecurringTransaction } from '@/lib/types';

interface RecurringFormModalProps {
  open: boolean;
  onClose: () => void;
  recurring?: RecurringTransaction | null;
  householdId?: string | null;
}

export function RecurringFormModal({
  open,
  onClose,
  recurring,
  householdId,
}: RecurringFormModalProps) {
  const createMut = useCreateRecurring();
  const updateMut = useUpdateRecurring();
  const isEdit = !!recurring;

  const handleSubmit = async (values: RecurringFormValues) => {
    try {
      if (isEdit && recurring) {
        await updateMut.mutateAsync({ id: recurring._id, input: values });
      } else {
        await createMut.mutateAsync({
          ...values,
          startDate: new Date().toISOString(),
          householdId: householdId ?? null,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const titlePrefix = householdId ? 'del hogar' : '';
  const title = isEdit
    ? `Editar fijo ${titlePrefix}`.trim()
    : `Nuevo fijo ${titlePrefix}`.trim();

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <RecurringForm
        initial={recurring ? recurringToFormValues(recurring) : undefined}
        submitting={createMut.isPending || updateMut.isPending}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
}
