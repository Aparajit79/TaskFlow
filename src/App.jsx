import React, { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import HomeView from './components/HomeView';
import DashboardView from './components/DashboardView';
import SettingsView from './components/SettingsView';
import { TaskFlowProvider, useTaskFlow } from './context/TaskFlowContext';

function AppContent() {
  const { activeView } = useTaskFlow();

  // Apply dark theme on initial mount
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
      case 'Settings':
        return <SettingsView />;
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
