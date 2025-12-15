import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AccessControl from './pages/AccessControl';
import AttackSimulation from './pages/AttackSimulation';
import SecurityLogs from './pages/SecurityLogs'; 
import { MockBackend } from './services/mockBackend';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const renderPage = () => {
    switch(activePage) {
      case 'dashboard': return <Dashboard isDarkMode={isDarkMode} />;
      case 'access': return <AccessControl />;
      case 'attacks': return <AttackSimulation />;
      case 'logs': return <SecurityLogs />;
      default: return <Dashboard isDarkMode={isDarkMode} />;
    }
  };

  return (
    <Layout activePage={activePage} onNavigate={setActivePage} isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
      {renderPage()}
    </Layout>
  );
};

export default App;