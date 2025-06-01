import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/config";
import { 
  checkDateValidity, 
  checkAmountValidity, 
  checkTagsValidity 
} from '../utils/input_validation';
import './AnalyticsPage.css';

function getTodaysDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');  // +1 since January is 0
  const year = today.getFullYear();

  return `${day}-${month}-${year}`;
}

function AnalyticsPage({ isHidden }) {
  return (
    <section className="page" style={ isHidden ? { display: 'none' } : {}}>
      <header>
        <h1>Analytics</h1>
      </header>
      <AnalyticsPageMainContent />
    </section>
  );
}

function AnalyticsPageMainContent() {
  const { token } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [startDateValidity, setStartDateValidity] = useState('ok');
  const [endDate, setEndDate] = useState('');
  const [endDateValidity, setEndDateValidity] = useState('ok');
  const [tags, setTags] = useState('');
  const [tagsValidity, setTagsValidity] = useState('ok');
  const [spendings, setSpendings] = useState('');
  const [income, setIncome] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function checkValidity() {
    let startDateValidityResult = checkDateValidity(startDate);
    setStartDateValidity(startDateValidityResult);
    if (startDateValidityResult !== 'ok') return false;

    let endDateValidityResult = checkDateValidity(endDate);
    setEndDateValidity(endDateValidityResult);
    if (endDateValidityResult !== 'ok') return false;

    let tagsValidityResult = checkTagsValidity(tags);
    setTagsValidity(tagsValidityResult);
    if (tagsValidityResult !== 'ok') return false;

    return true;
  }

  function getAnalytics(e) {
    e.preventDefault();
    if (!checkValidity()) {
      return;
    }

    setIsLoading(true);

    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    params.append('tags', tags);
    const url = `${API_BASE_URL}/transactions/analytics?${params.toString()}`;

    fetch(url, {
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
    .then(({ spendings, income }) => {
      setSpendings(spendings);
      setIncome(income);
    })
    .catch(err => {
      console.error(err.message);
      alert('Error occurred while doing analytics: ' + err.message);
    })
    .finally(() => {
      setIsLoading(false);
    });
  }

  return (
    <main>
      <form id="analytics-form" onSubmit={getAnalytics}>
        <div className="inputs">
          <label className={startDateValidity === 'ok' ? 'input-container' : 'input-container invalid'}>
            <span className="input-label">Start date</span>
            <input 
              className="date" 
              value={startDate} 
              placeholder={getTodaysDate()} 
              onChange={(e) => { setStartDate(e.target.value); setStartDateValidity('ok'); }} 
              disabled={isLoading} 
            />
            {
              startDateValidity === 'ok' ?
              null :
              <div className="invalid-input-message-container"><span>{startDateValidity}</span></div>
            }
          </label>
          <label className={endDateValidity === 'ok' ? 'input-container' : 'input-container invalid'}>
            <span className="input-label">End date</span>
            <input 
              className="date" 
              value={endDate} 
              placeholder={getTodaysDate()} 
              onChange={(e) => { setEndDate(e.target.value); setEndDateValidity('ok'); }} 
              disabled={isLoading} 
            />
            {
              endDateValidity === 'ok' ?
              null :
              <div className="invalid-input-message-container"><span>{endDateValidity}</span></div>
            }
          </label>
          <label className={tagsValidity === 'ok' ? 'input-container' : 'input-container invalid'}>
            <span className="input-label">tags</span>
            <input 
              className="tags" 
              value={tags} 
              placeholder="#tag1 #tag2" 
              onChange={(e) => { setTags(e.target.value); setTagsValidity('ok'); }} 
              disabled={isLoading} 
            />
            {
              tagsValidity === 'ok' ?
              null :
              <div className="invalid-input-message-container"><span>{tagsValidity}</span></div>
            }
          </label>
          <button type="submit" disabled={isLoading}>
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
        {
          isLoading ? 
          "Loading..." : 
          <output>
            <p className="spendings">Total spendings:   <span>-{spendings ? Math.abs(spendings) : '0'}</span></p>
            <p className="income">Total income:         <span>+{income ? Math.abs(income) : '0'}</span></p>
          </output>
        }
      </form>
    </main>
  );
}

export default AnalyticsPage;