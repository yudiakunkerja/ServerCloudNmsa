import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export interface User {
  uid: string;
  displayName: string;
  email: string;
}

export function useAuth() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("remindme_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setLocation("/onboarding");
    }
    setLoading(false);
  }, [setLocation]);

  const login = (newUser: User) => {
    localStorage.setItem("remindme_user", JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("remindme_user");
    setUser(null);
    setLocation("/onboarding");
  };

  return { user, login, logout, loading };
}
