import { createContext, useState, useContext } from 'react';
import { API_BASE_URL } from '../config/config';
import { Navigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  function login(credentials) {
    return fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(error => { throw new Error(error.message); });
      }
      return response.json();
    })
    .then(data => {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return true;
    })
    .catch(error => {
      console.error('Login failed: ' + error.message);
      return false;
    });
  }

  function register(userData) {
    return fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(error => { throw new Error(error.message); });
      }
      return response.json();
    })
    .then(data => {
      // auto-login after registration
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return true;
    })
    .catch(error => {
      console.error('Registration failed: ' + error.message);
      return false;
    });
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);