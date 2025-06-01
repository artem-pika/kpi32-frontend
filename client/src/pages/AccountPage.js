import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/config";
import './AccountPage.css';

function AccountPage({ isHidden }) {
  return (
    <section className="page" style={ isHidden ? { display: 'none' } : {}}>
      <header><h1>Account</h1></header>
      <main>
        <DeleteAccount />
      </main>
    </section>
  );
}

function DeleteAccount() {
  const { token, logout } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  function deleteAccount(e) {
    e.preventDefault();
    if (inputValue !== "delete my account") return;

    setIsDeleting(true);
    fetch(`${API_BASE_URL}/users`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(error => { throw new Error(error.message); });
      }
      logout();
      navigate("/login")
    })
    .catch(err => {
      alert("Error occurred while deleting the user: " + err.message);
      setIsDeleting(false);
    });
  }

  return (
    <form id="delete-account-form" onSubmit={deleteAccount}>
      <label className="input-container">
        <span className="input-label">To delete your account, type "delete my account": </span>
        <input value={inputValue} onChange={e => setInputValue(e.target.value)} />
      </label>
      <button type="submit" disabled={inputValue !== "delete my account" || isDeleting}>Delete account</button>
    </form>
  );
}

export default AccountPage;