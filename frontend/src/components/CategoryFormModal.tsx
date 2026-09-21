import { Modal } from '@/components/ui/Modal';
import {
  CategoryForm,
  categoryToFormValues,
  type CategoryFormValues,
} from '@/components/forms/CategoryForm';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories';
import type { Category } from '@/lib/types';

interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
}

export function CategoryFormModal({ open, onClose, category }: CategoryFormModalProps) {
  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const isEdit = !!category;

  const handleSubmit = async (values: CategoryFormValues) => {
    try {
      if (isEdit && category) {
        await updateMut.mutateAsync({ id: category._id, input: values });
      } else {
        await createMut.mutateAsync(values);
      }
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar categoría' : 'Nueva categoría'}>
      <CategoryForm
        initial={category ? categoryToFormValues(category) : undefined}
        submitting={createMut.isPending || updateMut.isPending}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
}
