import { useContext } from 'react';
import { AuthContext } from './auth-context.ts';
import type { AuthContextValue } from '../types.ts';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

