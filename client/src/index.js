import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const transactionList = ReactDOM.createRoot(document.getElementById('root'));
transactionList.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);