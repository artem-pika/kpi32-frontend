import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css'
import { checkUsernameValidity, checkPasswordValidity } from '../utils/input_validation';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [usernameValidity, setUsernameValidity] = useState('ok');
  const [password, setPassword] = useState('');
  const [passwordValidity, setPasswordValidity] = useState('ok');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordValidity, setConfirmPasswordValidity] = useState('ok');
  const [isRegistering, setIsRegistering] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function checkValidity() {
    let usernameValidityResult = checkUsernameValidity(username);
    setUsernameValidity(usernameValidityResult);
    if (usernameValidityResult !== 'ok') return false;

    let passwordValidityResult = checkPasswordValidity(password);
    setPasswordValidity(passwordValidityResult);
    if (passwordValidityResult !== 'ok') return false;

    let confirmPasswordValidityResult = password === confirmPassword ? 'ok' : 'Passwords do not match!';
    setConfirmPasswordValidity(confirmPasswordValidityResult);
    if (confirmPasswordValidityResult !== 'ok') return false;

    return true;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!checkValidity()) {
      return;
    }
    
    setIsRegistering(true);
    register({ username, password })
      .then(success => {
        if (success) {
          navigate('/app');
          alert('Registration successful!');
        } else {
          alert('Registration failed. Please try again.');
        }
        setIsRegistering(false);
      });
  }

  return (
    <div id="register-form-container">
      <form id="register-form" onSubmit={handleSubmit}>
        <h1>Create an account</h1>
        <label className={usernameValidity === 'ok' ? 'input-container' : 'input-container invalid'}>
          <span className="input-label">Username</span>
          <input 
            value={username} 
            onChange={(e) => { setUsername(e.target.value); setUsernameValidity('ok'); }} 
            disabled={isRegistering} 
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
            disabled={isRegistering} 
          />
          {
            passwordValidity === 'ok' ?
            null :
            <span className="invalid-input-message">{passwordValidity}</span>
          }
        </label>
        <label className={confirmPasswordValidity === 'ok' ? 'input-container' : 'input-container invalid'}>
          <span className="input-label">Confirm password</span>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordValidity('ok'); }} 
            disabled={isRegistering} 
          />
          {
            confirmPasswordValidity === 'ok' ?
            null :
            <span className="invalid-input-message">{confirmPasswordValidity}</span>
          }
        </label>
        <button type="submit" disabled={isRegistering}>
          {isRegistering ? "Trying..." : "Sign up"}
        </button>
      </form>
      <p className="footnote">
        Already have an account? <a id="login-link" onClick={() => navigate('/login')}>Log in</a>
      </p>
    </div>
  );
}

export default RegisterPage;