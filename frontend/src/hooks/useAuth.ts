/** useAuth — cross-feature auth hook */
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types/api';

/** Hook providing auth state and helpers */
export function useAuth() {
  const { token, role, username, isAuthenticated, isAdmin, login, logout } = useAuthStore();

  return {
    token,
    role,
    username,
    isAuthenticated: isAuthenticated(),
    isAdmin: isAdmin(),
    login,
    logout,
    hasRole: (requiredRole: UserRole) => role === requiredRole,
  };
}
