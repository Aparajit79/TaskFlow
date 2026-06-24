import React from 'react';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import { useTaskFlow } from './hooks/useTaskFlow';

// Root App Component
// Now it has 0 lines of complex calculations or helper functions!
// It simply gets the values from our custom hook and displays the layout.
export function App() {
  const {
    projects,
    activeProject,
    setActiveProject,
    filteredTasks,
    handleAddProject,
    handleAddTask,
    handleToggleTask,
    handleDeleteTask
  } = useTaskFlow();

  return (
    <div className="app-container">
      
      {/* Sidebar Component: Shows and adds project drawers */}
      <Sidebar
        projects={projects}
        activeProject={activeProject}
        setActiveProject={setActiveProject}
        onAddProject={handleAddProject}
      />

      {/* Main Content Area: Shows active drawer header and its tasks */}
      <main className="main-content">
        <TaskList
          activeProject={activeProject}
          tasks={filteredTasks}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
        />
      </main>

    </div>
  );
}

export default App;
