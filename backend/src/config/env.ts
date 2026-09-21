import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  MONGODB_URI: required('MONGODB_URI'),
  PORT: Number(process.env.PORT ?? 3001),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  JWT_SECRET: required('JWT_SECRET'),
  GOOGLE_CLIENT_ID: required('GOOGLE_CLIENT_ID'),
  ADMIN_EMAILS: (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
} as const;

export function isAdminEmail(email: string): boolean {
  return env.ADMIN_EMAILS.includes(email.toLowerCase());
}
