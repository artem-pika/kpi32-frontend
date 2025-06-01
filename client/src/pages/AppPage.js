import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import TransactionsPage from "./TransactionsPage/TransactionsPage";
import AnalyticsPage from "./AnalyticsPage";
import AccountPage from "./AccountPage";
import './AppPage.css';

function AppPage() {
  const [selectedPage, setSelectedPage] = useState("transactions");
  const [displaySettingsMenu, setDisplaySettingsMenu] = useState(false);
  
  const settingsPages = ["account"];
  
  return (
    <div id="app-page" onClick={() => setDisplaySettingsMenu(false)}>
      <nav>
        <ul>
          <li>
            <a 
              className={selectedPage === "transactions" ? "selected" : ""} 
              onClick={() => setSelectedPage("transactions")}
            >
              <span className='material-symbols-outlined'>receipt_long</span>
              Transactions
            </a>
          </li>

          <li>
            <a 
              className={selectedPage === "analytics" ? "selected" : ""} 
              onClick={() => setSelectedPage("analytics")}
            >
              <span className='material-symbols-outlined'>monitoring</span>
              Analytics
            </a>
          </li>
          
          <li>
            <a 
              className={displaySettingsMenu || settingsPages.includes(selectedPage) ? "selected" : ""} 
              onClick={(e) => { setDisplaySettingsMenu(true); e.stopPropagation();}}
            >
              <span className='material-symbols-outlined'>settings</span>
              Settings
            </a>
            { 
              displaySettingsMenu ? 
              <SettingsMenu 
                setSelectedPage={setSelectedPage} 
                setDisplaySettingsMenu={setDisplaySettingsMenu} 
              /> 
              : null 
            }
          </li>
        </ul>
      </nav>

      <TransactionsPage isHidden={selectedPage !== "transactions"} />
      <AnalyticsPage isHidden={selectedPage !== "analytics"} />
      <AccountPage isHidden={selectedPage !== "account"} />
    </div>
  );
}

function SettingsMenu({ setSelectedPage }) {
  const { logout } = useAuth();

  return (
    <div id="settings-menu-container">
      <ul id="settings-menu">
        <li>
          <a onClick={() => setSelectedPage("account")}>
            <span className='material-symbols-outlined'>person</span>
            Account
          </a>
        </li>

        <li>
          <a onClick={logout}>
            <span className='material-symbols-outlined'>logout</span>
            Logout
          </a>
        </li>
      </ul>
    </div>
  );
}

export default AppPage;