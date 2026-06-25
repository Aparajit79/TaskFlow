import React from 'react';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import { useTaskFlow } from './hooks/useTaskFlow';


export function App() {

  

  const {
    projects,
    activeProject,
    setActiveProject,
    filteredTasks,
    handleAddProject,
    handleAddTask,
    handleToggleTask,
    handleDeleteTask,
    handleEditTask
  } = useTaskFlow();
  

  return (
    <div className="app-container">
      
      <Sidebar
        projects={projects}
        activeProject={activeProject}
        setActiveProject={setActiveProject}
        onAddProject={handleAddProject}
      />

      <main className="main-content">
        <TaskList
          activeProject={activeProject}
          tasks={filteredTasks}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
        />
        
      </main>

    </div>
  );
}

export default App;
