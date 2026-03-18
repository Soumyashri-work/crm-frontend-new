import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    // TEMP: fake login for UI testing — remove before production
    const fakeToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIiwiZXhwIjo5OTk5OTk5OTk5fQ.fake";
    const fakeUser = {
      name: "John Anderson",
      email: "john.anderson@company.com",
      role: "admin",
      picture: null
    };
    localStorage.setItem('access_token', fakeToken);
    localStorage.setItem('user', JSON.stringify(fakeUser));
    setToken(fakeToken);
    setUser(fakeUser);
    setLoading(false);
  }, []);


  

// useEffect(() => {
//     const storedToken = localStorage.getItem('access_token');
//     const storedUser = localStorage.getItem('user');
//     if (storedToken && storedUser && !isTokenExpired(storedToken)) {
//       setToken(storedToken);
//       setUser(JSON.parse(storedUser));
//     } else {
//       localStorage.removeItem('access_token');
//       localStorage.removeItem('user');
//     }
//     setLoading(false);
//   }, []);

  const login = useCallback((tokenVal, userData) => {
    localStorage.setItem('access_token', tokenVal);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenVal);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token && !isTokenExpired(token);
  const isAdmin = user?.role === 'admin' || user?.role === 'Admin';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated, isAdmin, isTokenExpired }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
