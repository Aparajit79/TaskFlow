import React, { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import HomeView from './components/HomeView';
import DashboardView from './components/DashboardView';
import SettingsView from './components/SettingsView';
import TeamView from './components/TeamView';
import HelpView from './components/HelpView';
import PowerQueryView from './components/PowerQueryView';
import { TaskFlowProvider, useTaskFlow } from './context/TaskFlowContext';

function AppContent() {
  const { activeView } = useTaskFlow();

  useEffect(() => {
    const isDark = localStorage.getItem('taskflow_dark_theme') === 'true';
    document.body.classList.toggle('dark-theme', isDark);
  }, []);

  const renderActiveView = () => {
    switch (activeView) {
      case 'Home':
        return <HomeView />;
      case 'Project':
        return <TaskList />;
      case 'Dashboard':
        return <DashboardView />;
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
        {renderActiveView()}
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
