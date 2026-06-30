import React from 'react';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import { TaskFlowProvider } from './hooks/useTaskFlow';

function AppContent() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <TaskList />
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
