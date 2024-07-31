import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuthToken, removeAuthToken, storeAuthToken } from "./authUtils";

import { notifications } from "@mantine/notifications";
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
    notifications.show({
      title: "Logout Successful",
      message: "You have been logged out.",
      color: "blue",
    });
  }

  async function login(email: string, password: string) {
    try {
      const authToken = validateCredentials(email, password);

      if (authToken) {
        storeAuthToken(authToken);
        setIsAuthenticated(true);
        notifications.show({
          title: "Login Successful",
          message: "Welcome back!",
          color: "green",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Unable to Login",
        message: "Invalid email or password.",
        color: "red",
      });
      return;
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
