import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Mascot, Spinner } from './ui';

/**
 * UI-level guard for staff pages. This is a convenience only: the API enforces admin
 * access on every request, so bypassing this component grants nothing.
 */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { me, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!me) return <Navigate to="/login" state={{ next: '/admin' }} replace />;
  if (me.user.role !== 'admin') {
    return (
      <div className="py-16 text-center">
        <Mascot className="mx-auto size-24" mood="sleepy" />
        <h1 className="mt-2 text-3xl font-bold">Admins only</h1>
        <p className="text-ink-soft">Log in with the admin demo account to manage books.</p>
      </div>
    );
  }
  return <>{children}</>;
}
