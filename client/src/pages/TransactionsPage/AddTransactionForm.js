import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/config';
import { 
  checkDateValidity, 
  checkAmountValidity, 
  checkTagsValidity 
} from '../../utils/input_validation';
import './AddTransactionForm.css'

function getTodaysDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');  // +1 since January is 0
  const year = today.getFullYear();

  return `${day}-${month}-${year}`;
}

function AddTransactionForm({ addTransactions }) {
  const { token } = useAuth();
  const [date, setDate] = React.useState('');
  const [dateValidity, setDateValidity] = React.useState('ok');
  const [amount, setAmount] = React.useState('');
  const [amountValidity, setAmountValidity] = React.useState('ok');
  const [tags, setTags] = React.useState(''); 
  const [tagsValidity, setTagsValidity] = React.useState('ok'); 
  const [isAdding, setIsAdding] = React.useState(false);

  function resetFieldValues() {
    setDate('');
    setDateValidity('ok');
    setAmount('');
    setAmountValidity('ok');
    setTags('');
    setTagsValidity('ok');
  }

  function checkValidity() {
    let dateValidityResult = checkDateValidity(date);
    setDateValidity(dateValidityResult);
    if (dateValidityResult !== 'ok') return false;

    let amountValidityResult = checkAmountValidity(amount);
    setAmountValidity(amountValidityResult);
    if (amountValidityResult !== 'ok') return false;
    
    let tagsValidityResult = checkTagsValidity(tags);
    setTagsValidity(tagsValidityResult);
    if (tagsValidityResult !== 'ok') return false;

    return true;
  }

  function addNewTransaction(e) {
    e.preventDefault();
    if (!checkValidity()) {
      return;
    }

    setIsAdding(true);
    resetFieldValues();
    fetch(`${API_BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ date, amount, tags })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(error => { throw new Error(error.message); });
      }
      return response.json();
    })
    .then(newTransaction => {
      addTransactions([newTransaction]);
    })
    .catch(err => {
      console.error(err.message);
      alert("Error occurred while adding new transaction: " + err.message);
    })
    .finally(() => {
      setIsAdding(false);
    });
  }

  return (
    <div id="add-transaction-form-container">
      <form id="add-transaction-form" onSubmit={addNewTransaction}>
        <label className={dateValidity === 'ok' ? 'input-container' : 'input-container invalid'}>
          <span className="input-label">Date</span>
          <input 
            className='date' 
            value={date} 
            placeholder={getTodaysDate()} 
            onChange={e => { setDate(e.target.value); setDateValidity('ok'); }} 
          />
          {
            dateValidity === 'ok' ?
            null :
            <div className="invalid-input-message-container"><span>{dateValidity}</span></div>
          }
        </label>

        <label className={amountValidity === 'ok' ? 'input-container' : 'input-container invalid'}>
          <span className="input-label">Amount</span>
          <input 
            className='amount' 
            value={amount} 
            placeholder="-100.00" 
            onChange={e => { setAmount(e.target.value); setAmountValidity('ok'); }} 
          />
          {
            amountValidity === 'ok' ?
            null :
            <div className="invalid-input-message-container"><span>{amountValidity}</span></div>
          }
        </label>

        <label className={tagsValidity === 'ok' ? 'input-container' : 'input-container invalid'}>
          <span className="input-label">tags</span>
          <input 
            className='tags' 
            value={tags} 
            placeholder="#tag1 #tag2" 
            onChange={e => { setTags(e.target.value); setTagsValidity('ok'); }} 
          />
          {
            tagsValidity === 'ok' ?
            null :
            <div className="invalid-input-message-container"><span>{tagsValidity}</span></div>
          }
        </label>

        <button tpye="submit" disabled={isAdding}>
          <span className="material-symbols-outlined">add</span>
        </button>
      </form>
    </div>
  );
}

export default AddTransactionForm;