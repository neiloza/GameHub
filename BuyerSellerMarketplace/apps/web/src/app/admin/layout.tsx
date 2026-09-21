import { AdminShell } from '@/components/AdminShell';

/**
 * The console.
 *
 * There is no permission check here, deliberately. The middleware refuses the
 * route to anybody without `is_admin`, and every read underneath is refused
 * again by RLS — a member who reaches this layout sees empty tables, not data.
 * A third check would be a third place to get it wrong.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
