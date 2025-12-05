
import React, { useState } from 'react';
import { HomePage } from './components/HomePage';
import { SimulatorPage } from './components/SimulatorPage';
import { Dashboard } from './components/Dashboard';
import { SettingsPage } from './components/SettingsPage';
import { LocalizationProvider } from './context/LocalizationContext';
import { ThemeProvider } from './context/ThemeContext';
import type { Page, User, UserRole, PointsTransaction } from './types';

const AppContent: React.FC = () => {
  const [page, setPage] = useState<Page>('home');
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (role: UserRole) => {
    // In a real app, this would involve authentication.
    // Here, we just mock the user object.
    const userMap: Record<UserRole, { id: string, name: string, dealerId?: string, points: number, badges: string[], pointsHistory: PointsTransaction[]}> = {
      farmer: { id: 'user-farmer-01', name: 'J. Mwangi', points: 125, badges: ['Pioneer', 'Bug Hunter'], pointsHistory: [] },
      expert: { id: 'user-expert-01', name: 'Dr. A. Okoro', points: 0, badges: [], pointsHistory: [] },
      ministry: { id: 'user-ministry-01', name: 'Director K.', points: 0, badges: [], pointsHistory: [] },
      'agro-dealer': { id: 'user-dealer-01', name: 'S. Kipchoge', dealerId: 'dealer-1', points: 0, badges: [], pointsHistory: [] },
    };
    const userData = userMap[role];
    setUser({ 
        id: userData.id,
        role, 
        name: userData.name, 
        dealerId: userData.dealerId, 
        points: userData.points, 
        badges: userData.badges,
        pointsHistory: userData.pointsHistory 
    });
    setPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setPage('home');
  };

  const navigate = (newPage: Page) => {
    setPage(newPage);
  };

  const renderContent = () => {
    switch (page) {
      case 'simulator':
        return <SimulatorPage onNavigate={navigate} />;
      case 'dashboard':
        return <Dashboard user={user} onLogout={handleLogout} onNavigate={navigate} />;
      case 'settings':
        return <SettingsPage onNavigate={navigate} />;
      case 'home':
      default:
        return <HomePage onNavigate={navigate} onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-200 antialiased">
      {renderContent()}
    </div>
  );
};


const App: React.FC = () => (
  <ThemeProvider>
    <LocalizationProvider>
      <AppContent />
    </LocalizationProvider>
  </ThemeProvider>
);


export default App;
