/**
 * Script CLI para seedear categorías default a un usuario específico (por email).
 * Uso:
 *   npx tsx src/seed/index.ts <email>
 *
 * Normalmente NO se corre a mano: en el primer login vía Google el seed
 * se dispara automáticamente para el usuario nuevo.
 */
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { seedDefaultCategoriesForUser } from './defaultCategories';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Uso: tsx src/seed/index.ts <email>');
    process.exit(1);
  }

  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.error(`No existe usuario con email ${email}. Hacé login primero desde la app.`);
    await disconnectDB();
    process.exit(1);
  }

  const created = await seedDefaultCategoriesForUser(user._id.toString());
  console.log(`[seed] categorías creadas para ${email}: ${created}`);
  await disconnectDB();
}

main().catch((err) => {
  console.error('[seed] error', err);
  process.exit(1);
});
