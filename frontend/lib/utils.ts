import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine class names and intelligently merge Tailwind utility classes.
 *
 * This helper:
 * - Accepts the same inputs as `clsx` (strings, objects, arrays, falsy values).
 * - Uses `clsx` to resolve inputs into a single string.
 * - Uses `twMerge` to dedupe/resolve conflicting Tailwind utility classes.
 *
 * @example
 * cn('px-2', isActive && 'bg-blue-500', { 'text-sm': size === 'sm' });
 *
 * @param inputs - class values (strings, arrays, objects, etc.)
 * @returns merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  // Resolve inputs via clsx (returns string | number | null | undefined)
  const resolved = clsx(...inputs);

  // Defensive stringify (clsx normally returns a string; this ensures a string always)
  const classString = typeof resolved === 'string' ? resolved : String(resolved ?? '');

  // twMerge will dedupe conflicting Tailwind utilities (preferred order: later wins)
  return twMerge(classString);
}

// Named + default export for ergonomics across codebases
export default cn;
