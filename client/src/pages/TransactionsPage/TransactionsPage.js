import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import TransactionList from './TransactionList'; 
import AddTransactionForm from './AddTransactionForm'; 
import { API_BASE_URL } from '../../config/config';

// Utility functions for keeping transactions sorted by date

function merge(arr1, arr2, compare) {
  let result = [];
  let i1 = 0, i2 = 0;
  while (i1 < arr1.length && i2 < arr2.length) {
    if (compare(arr1[i1], arr2[i2]) === 0) {  
      // avoid duplications
      i2 += 1;
    } else if (compare(arr1[i1], arr2[i2]) === -1) {
      result.push(arr1[i1]);
      i1 += 1;
    } else {
      result.push(arr2[i2]);
      i2 += 1;
    }
  }
  while (i1 < arr1.length) {
    result.push(arr1[i1]);
    i1 += 1;
  }
  while (i2 < arr2.length) {
    result.push(arr2[i2]);
    i2 += 1;
  }
  return result;
}

function reverseDate(date) {
  return date.split('-').reverse().join('-');
}

function compareTransactions(t1, t2) {
  // [-1, 0, 1] = [<, =, >]
  if (t1.transactionId === t2.transactionId) {
    return 0;
  } else {
    return (reverseDate(t1.date) < reverseDate(t2.date)) || ((t1.date === t2.date) && (t1.transactionId < t2.transactionId)) ? -1 : 1;
  }
}

// Components

function TransactionsPage({ isHidden }) {
  return (
    <section className="page" style={ isHidden ? { display: 'none' } : {}}>
      <header>
        <h1>Transaction history</h1>    
      </header>
      <TransactionsPageMainContent />
    </section>
  );
}

function TransactionsPageMainContent() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);  // Should always be sorted by (date, transaction_id)
    
  useEffect(() => {
    fetch(`${API_BASE_URL}/transactions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(error => { throw new Error(error.message); });
      }
      return response.json();
    })
    .then(fetchedTransactions => {
      addTransactions(fetchedTransactions);
    })
    .catch(err => {
      console.error(err.message);
      alert('Error occurred while fetching transactions: ' + err.message);
    });
  }, []);

  function addTransactions(newTransactions) {
    setTransactions(transactions => {
      // Remain ordering by (date, transaction_id)
      return merge(transactions, newTransactions, compareTransactions);
    });
  }

  function deleteTransaction(transactionId) {
    setTransactions(transactions => {
      return transactions.filter(transaction => transaction.transactionId !== transactionId);
    });
  }

  function updateTransaction(updatedTransaction) {
    setTransactions(transactions => {
      // delete
      transactions = transactions.filter(transaction => transaction.transactionId !== updatedTransaction.transactionId);

      // insert in the right place
      return merge(transactions, [updatedTransaction], compareTransactions);
    });
  }

  return (
    <main>
      <TransactionList 
        transactions={transactions} 
        updateTransaction={updateTransaction} 
        deleteTransaction={deleteTransaction}
      />

      <AddTransactionForm addTransactions={addTransactions}/>
    </main>
  );
}

export default TransactionsPage;