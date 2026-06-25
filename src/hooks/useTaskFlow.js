import { useState } from 'react';


export function useTaskFlow() {

  const [projects, setProjects] = useState(["Personal "]);

  

  const [tasks, setTasks] = useState([
  {
    id: 1,
    project: "Personal",
    text: "Learn React",
    priority: "High",
    status: "In Progress",
    completed: false
    }
  ]);

  const [activeProject, setActiveProject] = useState('Personal');

  const filteredTasks = tasks.filter((task) => task.project === activeProject);

  const handleAddProject = (newProjectName) => {
    setProjects([...projects, newProjectName]);
    setActiveProject(newProjectName); 
  };

 const handleAddTask = (
  taskText,
  priority,
  status
) => {
  const newTask = {
    id: Date.now(),
    project: activeProject,
    text: taskText,
    priority,
    status,
    completed: false
  };

  setTasks(prev => [...prev, newTask]);
  };

  const handleToggleTask = (id) => {
    setTasks(
      tasks.map((task) => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const handleEditTask = (id, updatedText) => {
  setTasks(
    tasks.map((task) =>
      task.id === id
        ? { ...task, text: updatedText }
        : task
    )
  );
};

  

  return {
    projects,
    activeProject,
    setActiveProject,
    filteredTasks,
    handleAddProject,
    handleAddTask,
    handleToggleTask,
    handleDeleteTask,
    handleEditTask
  };
}

export default useTaskFlow;
