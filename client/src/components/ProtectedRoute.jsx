import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';

/**
 * Gate for signed-in (and optionally admin-only) pages.
 * This is a convenience, not a security boundary: the server checks every request too.
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, ready, isAdmin } = useAuth();
  const location = useLocation();

  // Wait until the stored token has been checked, or a refresh would bounce you to login
  if (!ready) {
    return (
      <main className="page narrow">
        <p className="muted center" aria-busy="true">Checking your session…</p>
      </main>
    );
  }

  // Remember where they were headed so login can send them back
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;

  if (adminOnly && !isAdmin) {
    return (
      <main className="page narrow">
        <div className="state-box" role="alert">
          <h1 className="h-sm">Admins only</h1>
          <p className="muted">You are signed in as {user.email}, which is not an admin account.</p>
        </div>
      </main>
    );
  }

  return children;
}
