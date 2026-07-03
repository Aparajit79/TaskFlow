import React, { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import HomeView from './components/HomeView';
import DashboardView from './components/DashboardView';
import SettingsView from './components/SettingsView';
import { TaskFlowProvider, useTaskFlow } from './context/TaskFlowContext';

function AppContent() {
  const { activeView, tasks = [] } = useTaskFlow();

  useEffect(() => {
    const isDark = localStorage.getItem('taskflow_dark_theme') === 'true';
    document.body.classList.toggle('dark-theme', isDark);
  }, []);
  useEffect(() => {
    if (tasks.length > 0) {
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      const yyyy = tom.getFullYear();
      const mm = String(tom.getMonth() + 1).padStart(2, '0');
      const dd = String(tom.getDate()).padStart(2, '0');
      const tomorrowStr = `${yyyy}-${mm}-${dd}`;

      const dueTomorrow = tasks.filter(t => t.dueDate === tomorrowStr && !t.completed);
      if (dueTomorrow.length > 0) {
        const listStr = dueTomorrow.map(t => `• "${t.text}" [Project: ${t.project}]`).join("\n");
        alert(`⚠️ Workspace Alert: The following task(s) are due tomorrow:\n\n${listStr}`);
      }
    }
  }, [tasks.length]);

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
