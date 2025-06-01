import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { checkUsernameValidity, checkPasswordValidity } from '../utils/input_validation';
import './LoginPage.css'

function LoginPage() {
  const [username, setUsername] = useState('');
  const [usernameValidity, setUsernameValidity] = useState('ok');
  const [password, setPassword] = useState('');
  const [passwordValidity, setPasswordValidity] = useState('ok');
  const [isLoggining, setIsLoggining] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function checkValidity() {
    let usernameValidityResult = checkUsernameValidity(username);
    setUsernameValidity(usernameValidityResult);
    if (usernameValidityResult !== 'ok') return false;

    let passwordValidityResult = checkPasswordValidity(password);
    setPasswordValidity(passwordValidityResult);
    if (passwordValidityResult !== 'ok') return false;

    return true;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!checkValidity()) {
      return;
    }

    setIsLoggining(true);
    login({ username, password })
      .then(success => {
        if (success) {
          navigate('/app');
        } else {
          alert('Login failed.');
        }
        setIsLoggining(false);
      });
  }

  return (
    <div id="login-form-container">
      <form id="login-form" onSubmit={handleSubmit}>
        <h1>Welcome back</h1>
        <label className={usernameValidity === 'ok' ? 'input-container' : 'input-container invalid'}>
          <span className="input-label">Username</span>
          <input 
            value={username} 
            onChange={(e) => { setUsername(e.target.value); setUsernameValidity('ok'); }} 
            disabled={isLoggining} 
          />
          {
            usernameValidity === 'ok' ?
            null :
            <span className="invalid-input-message">{usernameValidity}</span>
          }
        </label>
        <label className={passwordValidity === 'ok' ? 'input-container' : 'input-container invalid'}>
          <span className="input-label">Password</span>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => { setPassword(e.target.value); setPasswordValidity('ok'); }} 
            disabled={isLoggining} 
          />
          {
            passwordValidity === 'ok' ?
            null :
            <span className="invalid-input-message">{passwordValidity}</span>
          }
        </label>
        <button type="submit" disabled={isLoggining}>
          {isLoggining ? "Trying..." : "Login"}
        </button>
      </form>
      <p className="footnote">
        Don't have an account? <a id="register-link" onClick={() => navigate('/register')}>Sign up</a>
      </p>
    </div>
  );
}

export default LoginPage;