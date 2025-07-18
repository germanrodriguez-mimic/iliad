// src/contexts/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { ReactNode } from 'react'
import { BACKEND_URL } from '../config/api';
import axios from 'axios'

axios.defaults.withCredentials = true;

// Describes the structure of the user object returned from your backend
interface User {
  email: string;
  name: string;
}

// Describes the shape of the authentication context
interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

// Describes the props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// 1. Create the context
const AuthContext = createContext<AuthContextType | null>(null);
// 2. Create the provider component
export function AuthProvider({ children } : AuthProviderProps) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Checks for an existing session cookie by calling the /me endpoint.
    const checkUserSession = async () => {
        setIsLoading(true);
        try {
            const { data } = await axios.get<User>(`${BACKEND_URL}/api/users/me`);
            setUser(data);
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    checkUserSession();
    
    // After checking, we can clean up any error params from the URL
    // that the backend might have added on a failed login attempt.
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

  }, []);

  const loginWithGoogle = async () => {
    const redirectUri = window.location.origin
    window.location.href = `${BACKEND_URL}/auth/login/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const logout = async () => {
    try {
      await await axios.get(`${BACKEND_URL}/auth/logout`);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = { user, loginWithGoogle, logout, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 3. Create a custom hook for easy access to the context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}