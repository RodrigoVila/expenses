import clsx, { type ClassValue } from 'clsx';

/** Alias corto para combinar clases con clsx. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(...inputs);
}
