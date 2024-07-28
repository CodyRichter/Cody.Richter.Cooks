import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuthToken, removeAuthToken, storeAuthToken } from "./authUtils";

import { validateCredentials } from "./authUtils";

const AuthContext = createContext({
  isAuthenticated: false,
  login: (email: string, password: string) => {},
  logout: () => {},
});

// Create a provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  function logout() {
    setIsAuthenticated(false);
    removeAuthToken();
  }

  async function login(email: string, password: string) {
    const authToken = validateCredentials(email, password);
    if (authToken) {
      storeAuthToken(authToken);
      setIsAuthenticated(true);
    } else {
      logout();
    }
  }

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for accessing the context
export const useAuth = () => useContext(AuthContext);
