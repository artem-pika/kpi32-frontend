import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/config';
import { 
  checkDateValidity, 
  checkAmountValidity, 
  checkTagsValidity 
} from '../../utils/input_validation';
import './TransactionList.css'

function TransactionsList({ transactions, updateTransaction, deleteTransaction }) {
  let listTransactions = transactions.map(transaction => 
    <li key={transaction.transactionId}>
      <Transaction {...{
        ...transaction, 
        updateTransaction: updateTransaction, 
        deleteTransaction: deleteTransaction}} />
    </li>
  );

  return (
    <div id="transaction-list-container">
      <ol id="transaction-list">
        {listTransactions}
      </ol>
    </div>
  );
}

function Transaction(props) {
  const { token } = useAuth();
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isChangingDisabled, setIsChangingDisabled] = useState(false);
  const [date, setDate] = useState(props.date);
  const [dateValidity, setDateValidity] = useState('ok');
  const [amount, setAmount] = useState(props.amount);
  const [amountValidity, setAmountValidity] = useState('ok');
  const [tags, setTags] = useState(props.tags);
  const [tagsValidity, setTagsValidity] = useState('ok');

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

  function saveTransactionChanges(e) {
    e.preventDefault();
    if (!checkValidity()) {
      return;
    }

    setIsChangingDisabled(true);
    fetch(`${API_BASE_URL}/transactions`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ transactionId: props.transactionId, date: date, amount: amount, tags: tags})
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(error => { throw new Error(error.message); });
      } else {
        props.updateTransaction({ transactionId: props.transactionId, date: date, amount: amount, tags: tags });
        setIsEditingMode(false);
      }
    })
    .catch(err => {
      console.error(err.message);
      alert("Error occurred while updating transaction: " + err.message);
    })
    .finally(() => {
      setIsChangingDisabled(false);
    });
  }

  function cancelTransactionChanges() {
    // Reset field values
    setDate(props.date);
    setAmount(props.amount);
    setTags(props.tags);

    setIsEditingMode(false);
  }

  function deleteTransaction() {
    setIsChangingDisabled(true);
    fetch(`${API_BASE_URL}/transactions`, {
      method: "DELETE",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ transactionId: props.transactionId })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(error => { throw new Error(error.message); });
      }
      props.deleteTransaction(props.transactionId);
    })
    .catch(err => {
      console.error(err.message);
      alert("Error occurred while deleting transaction: " + err.message);
      setIsChangingDisabled(false);
    });
  }

  if (isEditingMode) {
    return (
      <form className='transaction editing' onSubmit={saveTransactionChanges}>
        <input 
          className={ dateValidity === 'ok' ? 'date value-field' : 'date value-field invalid' }
          value={date} 
          onChange={e => { setDate(e.target.value); setDateValidity('ok'); }} 
          disabled={isChangingDisabled} 
        />
        <input 
          className={ amountValidity === 'ok' ? 'amount value-field' : 'amount value-field invalid' }
          value={amount} 
          onChange={e => { setAmount(e.target.value); setAmountValidity('ok'); }} 
          disabled={isChangingDisabled} 
        />
        <input 
          className={ tagsValidity === 'ok' ? 'tags value-field' : 'tags value-field invalid' } 
          value={tags} 
          onChange={e => { setTags(e.target.value); setTagsValidity('ok'); }} 
          disabled={isChangingDisabled} 
        />

        <button type="submit" disabled={isChangingDisabled}>
          <span className='material-symbols-outlined'>check</span>
        </button>
        <button type="button" onClick={cancelTransactionChanges} disabled={isChangingDisabled}>
          <span className='material-symbols-outlined'>close</span>
        </button>
        <button type="button" onClick={deleteTransaction} disabled={isChangingDisabled}>
          <span className='material-symbols-outlined'>delete</span>
        </button>
      </form>
    )
  } else {
    return (
      <div className='transaction'>
        <span className='date value-field'>{date}</span>
        <span className='amount value-field'>{amount}</span>
        <span className='tags value-field'>{tags}</span>

        <button type="button" onClick={() => setIsEditingMode(true)}>
          <span className='material-symbols-outlined'>edit</span>
        </button>
      </div>
    )
  }
}

export default TransactionsList;