import React, { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import HomeView from './components/HomeView';
import DashboardView from './components/DashboardView';
import SettingsView from './components/SettingsView';
import TeamView from './components/TeamView';
import HelpView from './components/HelpView';
import PowerQueryView from './components/PowerQueryView';
import KanbanView from './components/KanbanView';
import LoginView from './components/LoginView';
import SprintsBoardView from './components/SprintsBoardView';
import { TaskFlowProvider, useTaskFlow } from './context/TaskFlowContext';

import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const { activeView, user, authLoading, handleLoginSuccess } = useTaskFlow();

  useEffect(() => {
    const isDark = localStorage.getItem('taskflow_dark_theme') === 'true';
    document.body.classList.toggle('dark-theme', isDark);
  }, []);

  if (authLoading) {
    return (
      <div className="app-loader-container">
        Loading Session...
      </div>
    );
  }

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'Home':
        return <HomeView />;
      case 'Project':
        return <TaskList />;
      case 'Dashboard':
        return <DashboardView />;
      case 'Kanban':
        return <KanbanView />;
      case 'Sprints':
        return <SprintsBoardView />;
      case 'Team':
        return <TeamView />;
      case 'Settings':
        return <SettingsView />;
      case 'Help':
        return <HelpView />;
      case 'PowerQuery':
        return <PowerQueryView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <ErrorBoundary key={activeView}>
          {renderActiveView()}
        </ErrorBoundary>
      </main>
    </div>
  );
}

export function App() {
  return (
    <TaskFlowProvider>
      <AppContent />
    </TaskFlowProvider>
  );
}

export default App;
