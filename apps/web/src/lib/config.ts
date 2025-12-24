// Admin configuration
// Add admin email addresses here
export const ADMIN_EMAILS = [
  'itskritix@gmail.com',
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}
