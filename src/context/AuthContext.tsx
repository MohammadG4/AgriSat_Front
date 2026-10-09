"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, RegisterPayload } from "@/types/auth";
import {
  loginApi,
  registerApi,
  getCurrentUserApi,
  getToken,
  setToken,
  removeToken,
} from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async (authToken: string) => {
    try {
      const userData = await getCurrentUserApi(authToken);
      setUser(userData);
      setTokenState(authToken);
    } catch {
      removeToken();
      setUser(null);
      setTokenState(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = getToken();
    if (savedToken) {
      fetchProfile(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginApi(email, password);
    setToken(res.access_token);
    setTokenState(res.access_token);
    const userData = await getCurrentUserApi(res.access_token);
    setUser(userData);
  };

  const register = async (payload: RegisterPayload) => {
    return await registerApi(payload);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setTokenState(null);
  };

  const refreshUser = async () => {
    const currentToken = token || getToken();
    if (currentToken) {
      await fetchProfile(currentToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
