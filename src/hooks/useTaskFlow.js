import { useState } from 'react';

// Custom Hook: This is the "Brain" of our app.
// It handles all the memory (states) and functions (handlers).
export function useTaskFlow() {
  // 1. Memory for Projects list
  const [projects, setProjects] = useState([
    'Personal 🏠', 
    'Work 💼', 
    'School 📚'
  ]);

  // 2. Memory for currently selected Project drawer
  const [activeProject, setActiveProject] = useState('Personal 🏠');

  // 3. Memory for all Tasks
  const [tasks, setTasks] = useState([
    { id: 1, project: 'Personal 🏠', text: 'Clean my bedroom 🧹', completed: true },
    { id: 2, project: 'Personal 🏠', text: 'Prepare dinner 🍕', completed: false },
    { id: 3, project: 'Work 💼', text: 'Email project manager 📧', completed: false },
    { id: 4, project: 'School 📚', text: 'Complete Math Homework 📚', completed: false }
  ]);

  // 4. Action: Adding a new Project drawer
  const handleAddProject = (newProjectName) => {
    setProjects([...projects, newProjectName]);
    setActiveProject(newProjectName); // Switch to the new drawer
  };

  // 5. Action: Adding a new Task to the active project
  const handleAddTask = (taskText) => {
    const newTask = {
      id: Date.now(),
      project: activeProject,
      text: taskText,
      completed: false
    };
    setTasks([...tasks, newTask]);
  };

  // 6. Action: Check / uncheck a task
  const handleToggleTask = (id) => {
    setTasks(
      tasks.map((task) => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // 7. Action: Delete a task
  const handleDeleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // 8. Filter the tasks to only show the ones belonging to the active project drawer
  const filteredTasks = tasks.filter((task) => task.project === activeProject);

  // Return everything so App.jsx can use them!
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
