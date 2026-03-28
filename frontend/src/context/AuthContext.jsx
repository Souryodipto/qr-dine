import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount by calling /api/auth/me
  useEffect(() => {
    authApi.me()
      .then(({ user }) => {
        setCurrentUser({
          id: user.id,
          name: user.name || user.email,
          email: user.email,
          slug: user.slug || null,
          role: user.role === 'restaurant' ? 'owner' : user.role,
          hasRestaurant: true, // Backend-registered users always have a restaurant
        });
      })
      .catch(() => {
        setCurrentUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Restaurant owner signup (self-registration)
  const signup = useCallback(async (ownerName, email, password, restaurantName) => {
    const { user } = await authApi.register(ownerName, email, password, restaurantName);
    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      slug: user.slug,
      role: 'owner',
      hasRestaurant: false, // Needs to go through setup wizard
    };
    setCurrentUser(sessionUser);
    return sessionUser;
  }, []);

  // Login for both restaurant owners and admins
  const login = useCallback(async (email, password, isAdmin = false) => {
    let user;
    if (isAdmin) {
      const result = await authApi.adminLogin(email, password);
      user = result.user;
    } else {
      const result = await authApi.login(email, password);
      user = result.user;
    }

    const sessionUser = {
      id: user.id,
      name: user.name || user.email,
      email: user.email,
      slug: user.slug || null,
      role: user.role === 'restaurant' ? 'owner' : user.role,
      hasRestaurant: user.role === 'restaurant',
    };
    setCurrentUser(sessionUser);
    return sessionUser;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    setCurrentUser(null);
  }, []);

  // Called after restaurant setup is complete to move user to dashboard
  const markRestaurantReady = useCallback((slug) => {
    setCurrentUser(prev => prev ? { ...prev, hasRestaurant: true, slug } : prev);
  }, []);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    markRestaurantReady,
    isOwner: currentUser?.role === 'owner',
    isAdmin: currentUser?.role === 'admin' || currentUser?.role === 'superadmin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
