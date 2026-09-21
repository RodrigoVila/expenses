import { Category, type CategoryType } from '../models/Category';

interface DefaultCategory {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
}

/**
 * Categorías predefinidas que se cargan en el primer signup de cada usuario.
 * `icon` usa nombres de lucide-react en kebab-case.
 */
export const defaultCategories: DefaultCategory[] = [
  // ---- Gastos ----
  { name: 'Supermercado',        icon: 'shopping-cart', color: '#10B981', type: 'expense' },
  { name: 'Automóvil',           icon: 'car',           color: '#3B82F6', type: 'expense' },
  { name: 'Alquiler & Expensas', icon: 'home',          color: '#8B5CF6', type: 'expense' },
  { name: 'Servicios',           icon: 'plug',          color: '#EAB308', type: 'expense' },
  { name: 'Salidas',             icon: 'beer',          color: '#F97316', type: 'expense' },
  { name: 'Delivery',            icon: 'pizza',         color: '#EF4444', type: 'expense' },
  { name: 'Transporte',          icon: 'bus',           color: '#06B6D4', type: 'expense' },
  { name: 'Salud',               icon: 'heart-pulse',   color: '#F43F5E', type: 'expense' },
  { name: 'Suscripciones',       icon: 'repeat',        color: '#0EA5E9', type: 'expense' },
  { name: 'Ropa',                icon: 'shirt',         color: '#A855F7', type: 'expense' },
  { name: 'Regalos',             icon: 'gift',          color: '#EC4899', type: 'expense' },
  { name: 'Impuestos',           icon: 'flag',          color: '#64748B', type: 'expense' },
  { name: 'Educación',           icon: 'graduation-cap',color: '#6366F1', type: 'expense' },
  { name: 'Viajes',              icon: 'plane',         color: '#14B8A6', type: 'expense' },
  { name: 'Extras',              icon: 'star',          color: '#F59E0B', type: 'expense' },

  // ---- Ingresos ----
  { name: 'Sueldo',           icon: 'briefcase',   color: '#22C55E', type: 'income' },
  { name: 'Freelance',        icon: 'laptop',      color: '#0EA5E9', type: 'income' },
  { name: 'Inversiones',      icon: 'trending-up', color: '#16A34A', type: 'income' },
  { name: 'Ingresos varios',  icon: 'banknote',    color: '#84CC16', type: 'income' },
];

/**
 * Seedea las categorías default para un usuario específico. Idempotente:
 * si ya tiene una con ese nombre y isDefault=true, la saltea.
 */
export async function seedDefaultCategoriesForUser(userId: string): Promise<number> {
  let created = 0;
  for (const cat of defaultCategories) {
    const exists = await Category.findOne({ userId, name: cat.name, isDefault: true });
    if (exists) continue;
    await Category.create({ ...cat, userId, isDefault: true });
    created++;
  }
  return created;
}
