import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const TaskFlowContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function TaskFlowProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeProject, setActiveProject] = useState('');
  const [activeView, setActiveView] = useState('Home');

  const handleSetActiveProject = useCallback((projId) => {
    setActiveProject(Number(projId));
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
          
          const formattedMembers = mems.map(m => ({
            ...m,
            id: Number(m.id),
            projectId: Number(m.projectId)
          }));
          setMembers(formattedMembers);
          
          const formattedTasks = tsks.map(t => ({
            ...t,
            id: Number(t.id),
            projectId: Number(t.projectId),
            assignedMemberId: t.assignedMemberId ? Number(t.assignedMemberId) : null
          }));
          setTasks(formattedTasks);

          if (projs.length > 0) {
            setActiveProject(Number(projs[0].id));
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
    if (!trimmed || projects.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) return;

    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      });
      if (res.ok) {
        const body = await res.json();
        const newProj = body.data ?? body;
        setProjects((prev) => [...prev, newProj]);
        setActiveProject(Number(newProj.id));
      }
    } catch (err) {
      console.error(err);
    }
  }, [projects]);

  const handleDeleteProject = useCallback(async (projId) => {
    const proj = projects.find(p => p.id === projId);
    const projName = proj ? proj.name : 'Unknown';
    const projectTasks = tasks.filter((t) => Number(t.projectId) === Number(projId));
    const msg = projectTasks.length > 0
      ? `"${projName}" has ${projectTasks.length} task(s). Deleting it will permanently remove all tasks. Continue?`
      : `Delete project "${projName}"?`;

    if (!window.confirm(msg)) return;

    try {
      const res = await fetch(`${API_URL}/projects/${projId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProjects((prev) => {
          const updated = prev.filter((p) => p.id !== projId);
          if (activeProject === projId) {
            setActiveProject(updated.length > 0 ? Number(updated[0].id) : '');
          }
          return updated;
        });
        setTasks((prev) => prev.filter((t) => Number(t.projectId) !== Number(projId)));
        setMembers((prev) => prev.filter((m) => Number(m.projectId) !== Number(projId)));
      }
    } catch (err) {
      console.error(err);
    }
  }, [tasks, activeProject, projects]);

  const handleAddTask = useCallback(async (text, description, priority, status, dueDate, assignedMemberId) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const id = Date.now();

    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          projectId: Number(activeProject),
          text: trimmed,
          description,
          priority,
          status,
          dueDate,
          assignedMemberId: assignedMemberId ? Number(assignedMemberId) : null
        })
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [...prev, {
          ...newTask,
          id: Number(newTask.id),
          projectId: Number(newTask.projectId),
          assignedMemberId: newTask.assignedMemberId ? Number(newTask.assignedMemberId) : null
        }]);
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
        setTasks((prev) => prev.map((t) => t.id === id ? {
          ...updatedTask,
          id: Number(updatedTask.id),
          projectId: Number(updatedTask.projectId),
          assignedMemberId: updatedTask.assignedMemberId ? Number(updatedTask.assignedMemberId) : null
        } : t));
      }
    } catch (err) {
      console.error(err);
    }
  }, [tasks]);

  const handleEditTask = useCallback(async (id, text, description, priority, status, dueDate, assignedMemberId) => {
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
          assignedMemberId: assignedMemberId ? Number(assignedMemberId) : null
        })
      });

      if (res.ok) {
        const updatedTask = await res.json();
        setTasks((prev) => prev.map((t) => t.id === id ? {
          ...updatedTask,
          id: Number(updatedTask.id),
          projectId: Number(updatedTask.projectId),
          assignedMemberId: updatedTask.assignedMemberId ? Number(updatedTask.assignedMemberId) : null
        } : t));
      }
    } catch (err) {
      console.error(err);
    }
  }, [tasks]);

  const handleDeleteTask = useCallback(async (id) => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
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
      (m) => Number(m.projectId) === Number(activeProject) &&
             m.name.toLowerCase() === trimmedName.toLowerCase() &&
             m.role === role
    );
    if (memberExists) return;

    try {
      const res = await fetch(`${API_URL}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: Number(activeProject),
          name: trimmedName,
          role
        })
      });

      if (res.ok) {
        const body = await res.json();
        const newMember = body.data ?? body;
        setMembers((prev) => [...prev, {
          ...newMember,
          id: Number(newMember.id),
          projectId: Number(newMember.projectId)
        }]);
      }
    } catch (err) {
      console.error(err);
    }
  }, [members, activeProject]);

  const handleDeleteMember = useCallback(async (id) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      const res = await fetch(`${API_URL}/members/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => Number(task.projectId) === Number(activeProject));
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
