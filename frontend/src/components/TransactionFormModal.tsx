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
  /** Si viene, el movimiento se asocia al hogar en vez de personal. */
  householdId?: string | null;
}

export function TransactionFormModal({
  open,
  onClose,
  transaction,
  householdId,
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
        arsAmount: values.arsAmount,
        exchangeRate: values.exchangeRate,
        rateSource: values.rateSource,
        householdId: householdId ?? transaction?.householdId ?? null,
      };
      if (isEdit && transaction) {
        await updateMut.mutateAsync({ id: transaction._id, input: payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const titlePrefix = householdId ? 'del hogar' : '';
  const title = isEdit
    ? `Editar movimiento ${titlePrefix}`.trim()
    : `Nuevo movimiento ${titlePrefix}`.trim();

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <TransactionForm
        initial={transaction ? transactionToFormValues(transaction) : undefined}
        submitting={createMut.isPending || updateMut.isPending}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
}
