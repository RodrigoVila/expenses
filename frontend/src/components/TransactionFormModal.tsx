import { Modal } from '@/components/ui/Modal';
import {
  TransactionForm,
  transactionToFormValues,
  type TransactionFormValues,
} from '@/components/forms/TransactionForm';
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import type { Transaction } from '@/lib/types';

interface TransactionFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Si viene, es modo edición. */
  transaction?: Transaction | null;
}

export function TransactionFormModal({
  open,
  onClose,
  transaction,
}: TransactionFormModalProps) {
  const createMut = useCreateTransaction();
  const updateMut = useUpdateTransaction();
  const isEdit = !!transaction;

  const handleSubmit = async (values: TransactionFormValues) => {
    try {
      const payload = {
        amount: values.amount,
        type: values.type,
        categoryId: values.categoryId,
        description: values.description,
        date: new Date(values.date).toISOString(),
        currency: values.currency,
      };
      if (isEdit && transaction) {
        await updateMut.mutateAsync({ id: transaction._id, input: payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      // El error queda en el hook; podríamos mostrar un toast. Por ahora silent.
      console.error(err);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar movimiento' : 'Nuevo movimiento'}
    >
      <TransactionForm
        initial={transaction ? transactionToFormValues(transaction) : undefined}
        submitting={createMut.isPending || updateMut.isPending}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
}
