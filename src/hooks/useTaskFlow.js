import { useState } from 'react';


export function useTaskFlow() {
  const [projects, setProjects] = useState([
    'Personal ',
    'Work'
    
  ]);

  const [activeProject, setActiveProject] = useState('Personal ');

  const [tasks, setTasks] = useState([
    { id: 1, project: 'Personal ', text: 'Clean my bedroom ', completed: true },
    { id: 2, project: 'Personal ', text: 'Do laundry ', completed: false },
    { id: 3, project: 'Personal ', text: 'Do Writing ', completed: false },
    { id: 4, project: 'Personal ', text: 'Go to gym ', completed: false },
  ]);

  const handleAddProject = (newProjectName) => {
    setProjects([...projects, newProjectName]);
    setActiveProject(newProjectName); 
  };

  const handleAddTask = (taskText) => {
    const newTask = {
      id: Date.now(),
      project: activeProject,
      text: taskText,
      completed: false
    };
    setTasks([...tasks, newTask]);
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

  const filteredTasks = tasks.filter((task) => task.project === activeProject);

  return {
    projects,
    activeProject,
    setActiveProject,
    filteredTasks,
    handleAddProject,
    handleAddTask,
    handleToggleTask,
    handleDeleteTask
  };
}

export default useTaskFlow;
