import {
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { setTokenProvider } from '../../../api/client.ts';
import type { User } from '../../../types/index.ts';
import type {
  AuthContextValue,
  LoginCredentials,
  RegisterCredentials,
} from '../types.ts';
import { loginApi, registerApi, getMeApi } from '../api/authApi.ts';
import { AuthContext } from './auth-context.ts';

const SESSION_TOKEN_KEY = 'mini_online_store_token';

// Configure the API client's token provider to read from sessionStorage
setTokenProvider(() => sessionStorage.getItem(SESSION_TOKEN_KEY));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(SESSION_TOKEN_KEY)
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate existing token and retrieve current user profile on app initialization
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      const storedToken = sessionStorage.getItem(SESSION_TOKEN_KEY);

      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await getMeApi();
        if (isMounted) {
          setUser(response.user);
          setToken(storedToken);
        }
      } catch {
        // If token verification fails (e.g., 401 expired or invalid), clear session
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await loginApi(credentials);
      sessionStorage.setItem(SESSION_TOKEN_KEY, response.token);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await registerApi(credentials);
      sessionStorage.setItem(SESSION_TOKEN_KEY, response.token);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback((): void => {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
