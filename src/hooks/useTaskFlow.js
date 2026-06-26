import { useState } from 'react';

export function useTaskFlow() {
  const [projects, setProjects] = useState(["Personal", "Work", "college", "School", "Things to buy", "Gym"]);
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
    const trimmed = newProjectName.trim();
    if (trimmed && !projects.includes(trimmed)) {
      setProjects((prev) => [...prev, trimmed]);
      setActiveProject(trimmed);
    }
  };

  const handleAddTask = (taskText, priority, status) => {
    const trimmed = taskText.trim();
    if (!trimmed) return;

    const newTask = {
      id: Date.now(),
      project: activeProject,
      text: trimmed,
      priority,
      status,
      completed: false
    };

    setTasks((prev) => [...prev, newTask]);
  };

  const handleToggleTask = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleEditTask = (id, updatedText) => {
    const trimmed = updatedText.trim();
    if (!trimmed) return;
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, text: trimmed } : task
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
