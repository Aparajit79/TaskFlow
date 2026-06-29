import React from 'react';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import { useTaskFlow } from './hooks/useTaskFlow';


export function App() {

  

  const {
    projects,
    members,
    activeProject,
    setActiveProject,
    filteredTasks,
    handleAddProject,
    handleAddTask,
    handleAddMember, 
    handleToggleTask,
    handleDeleteTask,
    handleEditTask,
    handleDeleteProject,
    handleDeleteMember,
  } = useTaskFlow();
  

  return (
    <div className="app-container">
      
      <Sidebar
        projects={projects}
        activeProject={activeProject}
        members={members}
        setActiveProject={setActiveProject}
        onAddProject={handleAddProject}
        onDeleteProject={handleDeleteProject}
        onAddMember={handleAddMember}
        onDeleteMember={handleDeleteMember}
      />

      <main className="main-content">
        <TaskList
          activeProject={activeProject}
          tasks={filteredTasks}
          members={members}
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
