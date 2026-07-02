
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const TaskFlowContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function TaskFlowProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeProject, setActiveProject] = useState('');
  const [activeView, setActiveView] = useState('Home');

  const handleSetActiveProject = useCallback((proj) => {
    setActiveProject(proj);
    setActiveView('Project');
  }, []);

  useEffect(() => {
    async function initFetch() {
      try {
        const [projRes, memRes, taskRes] = await Promise.all([
          fetch(`${API_URL}/projects`),
          fetch(`${API_URL}/members`),
          fetch(`${API_URL}/tasks`)
        ]);

        if (projRes.ok && memRes.ok && taskRes.ok) {
          const projs = await projRes.json();
          const mems = await memRes.json();
          const tsks = await taskRes.json();

          setProjects(projs);
          setMembers(mems);
          
          const formattedTasks = tsks.map(t => ({
            ...t,
            id: Number(t.id)
          }));
          setTasks(formattedTasks);

          if (projs.length > 0) {
            setActiveProject(projs[0]);
          }
        }
      } catch (err) {
        console.error("Connection to database API failed, using empty memory state:", err);
      }
    }
    initFetch();
  }, []);

  const handleAddProject = useCallback(async (name) => {
    const trimmed = name.trim();
    if (!trimmed || projects.includes(trimmed)) return;

    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      });
      if (res.ok) {
        setProjects((prev) => [...prev, trimmed]);
        setActiveProject(trimmed);
      }
    } catch (err) {
      console.error(err);
    }
  }, [projects]);

  const handleDeleteProject = useCallback(async (projName) => {
    const projectTasks = tasks.filter((t) => t.project === projName);
    const performDelete = async () => {
      try {
        const res = await fetch(`${API_URL}/projects/${encodeURIComponent(projName)}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setProjects((prev) => prev.filter((p) => p !== projName));
          setTasks((prev) => prev.filter((t) => t.project !== projName));
          setMembers((prev) => prev.filter((m) => m.project !== projName));
          
          if (activeProject === projName) {
            setProjects((updatedProjs) => {
              setActiveProject(updatedProjs.length > 0 ? updatedProjs[0] : '');
              return updatedProjs;
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (projectTasks.length === 0) {
      await performDelete();
    } else {
      if (window.confirm(`Project "${projName}" has ${projectTasks.length} task(s). Are you sure you want to delete it and all its tasks?`)) {
        await performDelete();
      }
    }
  }, [tasks, activeProject]);

  const handleAddTask = useCallback(async (text, description, priority, status, dueDate, assignedMember) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const id = Date.now(); 

    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          project: activeProject,
          text: trimmed,
          description,
          priority,
          status,
          dueDate,
          assignedMember
        })
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [...prev, { ...newTask, id: Number(newTask.id) }]);
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeProject]);

  const handleToggleTask = useCallback(async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...task,
          completed: !task.completed
        })
      });

      if (res.ok) {
        const updatedTask = await res.json();
        setTasks((prev) => prev.map((t) => t.id === id ? { ...updatedTask, id: Number(updatedTask.id) } : t));
      }
    } catch (err) {
      console.error(err);
    }
  }, [tasks]);

  const handleEditTask = useCallback(async (id, text, description, priority, status, dueDate, assignedMember) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...task,
          text: text.trim(),
          description,
          priority,
          status,
          dueDate,
          assignedMember
        })
      });

      if (res.ok) {
        const updatedTask = await res.json();
        setTasks((prev) => prev.map((t) => t.id === id ? { ...updatedTask, id: Number(updatedTask.id) } : t));
      }
    } catch (err) {
      console.error(err);
    }
  }, [tasks]);

  const handleDeleteTask = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleAddMember = useCallback(async (name, role) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const memberExists = members.some(
      (m) => m.project === activeProject && m.name.toLowerCase() === trimmedName.toLowerCase() && m.role === role
    );
    if (memberExists) {
      alert("This member already exists in the project.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: activeProject,
          name: trimmedName,
          role
        })
      });

      if (res.ok) {
        const newMember = await res.json();
        setMembers((prev) => [...prev, newMember]);
      }
    } catch (err) {
      console.error(err);
    }
  }, [members, activeProject]);

  const handleDeleteMember = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;

    try {
      const res = await fetch(`${API_URL}/members/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => task.project === activeProject);
  }, [tasks, activeProject]);

  const value = useMemo(() => ({
    projects,
    members,
    tasks,
    activeProject,
    filteredTasks,
    setActiveProject: handleSetActiveProject,
    activeView,
    setActiveView,
    handleAddProject,
    handleAddTask,
    handleAddMember,
    handleDeleteMember,
    handleToggleTask,
    handleDeleteTask,
    handleEditTask,
    handleDeleteProject
  }), [
    projects,
    members,
    tasks,
    activeProject,
    filteredTasks,
    handleSetActiveProject,
    activeView,
    setActiveView,
    handleAddProject,
    handleAddTask,
    handleAddMember,
    handleDeleteMember,
    handleToggleTask,
    handleDeleteTask,
    handleEditTask,
    handleDeleteProject
  ]);

  return (
    <TaskFlowContext.Provider value={value}>
      {children}
    </TaskFlowContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskFlowContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskFlowProvider');
  }
  return {
    projects: context.projects,
    activeProject: context.activeProject,
    setActiveProject: context.setActiveProject,
    activeView: context.activeView,
    setActiveView: context.setActiveView,
    filteredTasks: context.filteredTasks,
    handleAddTask: context.handleAddTask,
    handleToggleTask: context.handleToggleTask,
    handleDeleteTask: context.handleDeleteTask,
    handleEditTask: context.handleEditTask,
    handleDeleteProject: context.handleDeleteProject,
    handleAddProject: context.handleAddProject
  };
}

export function useMembers() {
  const context = useContext(TaskFlowContext);
  if (!context) {
    throw new Error('useMembers must be used within a TaskFlowProvider');
  }
  return {
    members: context.members,
    activeProject: context.activeProject,
    handleAddMember: context.handleAddMember,
    handleDeleteMember: context.handleDeleteMember,
    filteredTasks: context.filteredTasks
  };
}

export function useTaskFlow() {
  const context = useContext(TaskFlowContext);
  if (!context) {
    throw new Error('useTaskFlow must be used within a TaskFlowProvider');
  }
  return context;
}

export default useTaskFlow;
