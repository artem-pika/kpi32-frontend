import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppPage from './pages/AppPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { API_BASE_URL } from './config/config';

function LoginRouteHandler() {
  const { token } = useAuth();
  return token ? <Navigate to="/app" /> : <LoginPage />;
}

function PrivateRoute({ children }) {
  const { token, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`${API_BASE_URL}/verify-token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return true;
    })
    .then(() => {
      // Token is valid
      setIsLoading(false);
    })
    .catch(error => {
      // Network error or token is invalid
      console.error('Token verification error:', error);
      logout();
    });
  }, [token])

  if (isLoading) {
    return <div>Trying to log in...</div>;
  }

  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginRouteHandler />} />
          <Route 
            path="/app" 
            element={
              <PrivateRoute>
                <AppPage />
              </PrivateRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;