import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const TaskFlowContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function TaskFlowProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [scrumMeetings, setScrumMeetings] = useState([]);
  const [retroItems, setRetroItems] = useState([]);
  const [activeProject, setActiveProject] = useState(() => {
    const saved = localStorage.getItem('active_project_id');
    return saved ? Number(saved) : '';
  });
  const [activeView, setActiveView] = useState(() => localStorage.getItem('active_view') || 'Home');

  const fetchWithCredentials = useCallback((url, options = {}) => {
    return fetch(url, {
      ...options,
      credentials: 'include'
    });
  }, []);

  const handleSetActiveProject = useCallback((projId) => {
    setActiveProject(Number(projId));
    localStorage.setItem('active_project_id', Number(projId));
    setActiveView('Project');
  }, []);

  const fetchWorkspaceData = useCallback(async () => {
    try {
      const [projRes, memRes, taskRes] = await Promise.all([
        fetchWithCredentials(`${API_URL}/projects`),
        fetchWithCredentials(`${API_URL}/members`),
        fetchWithCredentials(`${API_URL}/tasks`)
      ]);

      if (projRes.ok && memRes.ok && taskRes.ok) {
        const projs = await projRes.json();
        const mems = await memRes.json();
        const tsks = await taskRes.json();

        setProjects(projs);
        
        const formattedMembers = mems.map(m => ({
          ...m,
          id: Number(m.id),
          projectId: Number(m.projectId),
          userId: m.userId ? Number(m.userId) : null
        }));
        setMembers(formattedMembers);
        
        const formattedTasks = tsks.map(t => ({
          ...t,
          id: Number(t.id),
          projectId: Number(t.projectId),
          assignedMemberId: t.assignedMemberId ? Number(t.assignedMemberId) : null
        }));
        setTasks(formattedTasks);

        setActiveProject((currentActive) => {
          const savedActive = Number(localStorage.getItem('active_project_id'));
          const targetActive = currentActive || savedActive;
          if (targetActive && projs.some(p => Number(p.id) === Number(targetActive))) {
            localStorage.setItem('active_project_id', Number(targetActive));
            return Number(targetActive);
          }
          const defaultActive = projs.length > 0 ? Number(projs[0].id) : '';
          if (defaultActive) {
            localStorage.setItem('active_project_id', Number(defaultActive));
          } else {
            localStorage.removeItem('active_project_id');
          }
          return defaultActive;
        });
      }
    } catch (err) {
      console.error("Failed to load workspace data:", err);
    }
  }, [fetchWithCredentials]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetchWithCredentials(`${API_URL}/auth/me`);
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Session verification failed:", err);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [fetchWithCredentials]);

  useEffect(() => {
    if (activeView) {
      localStorage.setItem('active_view', activeView);
    }
  }, [activeView]);

  useEffect(() => {
    if (user) {
      fetchWorkspaceData();
    } else if (!authLoading) {
      setProjects([]);
      setMembers([]);
      setTasks([]);
      setActiveProject('');
      setActiveView('Home');
      localStorage.removeItem('active_project_id');
      localStorage.removeItem('active_view');
    }
  }, [user, authLoading, fetchWorkspaceData]);

  const handleLoginSuccess = useCallback((userData) => {
    setUser(userData);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetchWithCredentials(`${API_URL}/auth/logout`, { method: 'POST' });
      setUser(null);
      localStorage.removeItem('active_project_id');
      localStorage.removeItem('active_view');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }, [fetchWithCredentials]);

  const handleAddProject = useCallback(async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (projects.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      alert(`A project with the name "${trimmed}" already exists.`);
      return;
    }

    try {
      const res = await fetchWithCredentials(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      });
      if (res.ok) {
        const body = await res.json();
        const newProj = body.data ?? body;
        await fetchWorkspaceData();
        setActiveProject(Number(newProj.id));
      }
    } catch (err) {
      console.error(err);
    }
  }, [projects, fetchWithCredentials, fetchWorkspaceData]);

  const handleDeleteProject = useCallback(async (projId) => {
    const proj = projects.find(p => p.id === projId);
    const projName = proj ? proj.name : 'Unknown';
    const projectTasks = tasks.filter((t) => Number(t.projectId) === Number(projId));
    const msg = projectTasks.length > 0
      ? `"${projName}" has ${projectTasks.length} task(s). Deleting it will permanently remove all tasks. Continue?`
      : `Delete project "${projName}"?`;

    if (!window.confirm(msg)) return;

    try {
      const res = await fetchWithCredentials(`${API_URL}/projects/${projId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchWorkspaceData();
      }
    } catch (err) {
      console.error(err);
    }
  }, [tasks, projects, fetchWithCredentials, fetchWorkspaceData]);

  const handleAddTask = useCallback(async (text, description, priority, status, dueDate, assignedMemberId) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const id = Date.now();

    try {
      const res = await fetchWithCredentials(`${API_URL}/tasks`, {
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
        await fetchWorkspaceData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to add task');
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeProject, fetchWithCredentials, fetchWorkspaceData]);

  const handleToggleTask = useCallback(async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    try {
      const res = await fetchWithCredentials(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...task,
          completed: !task.completed
        })
      });

      if (res.ok) {
        await fetchWorkspaceData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to toggle task');
      }
    } catch (err) {
      console.error(err);
    }
  }, [tasks, fetchWithCredentials, fetchWorkspaceData]);

  const handleEditTask = useCallback(async (id, text, description, priority, status, dueDate, assignedMemberId) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    try {
      const res = await fetchWithCredentials(`${API_URL}/tasks/${id}`, {
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
        await fetchWorkspaceData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to edit task');
      }
    } catch (err) {
      console.error(err);
    }
  }, [tasks, fetchWithCredentials, fetchWorkspaceData]);

  const handleDeleteTask = useCallback(async (id) => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    try {
      const res = await fetchWithCredentials(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchWorkspaceData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete task');
      }
    } catch (err) {
      console.error(err);
    }
  }, [fetchWithCredentials, fetchWorkspaceData]);

  const handleAddMember = useCallback(async (name, role) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    try {
      const res = await fetchWithCredentials(`${API_URL}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: Number(activeProject),
          name: trimmedName,
          role
        })
      });

      if (res.ok) {
        await fetchWorkspaceData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to add member');
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeProject, fetchWithCredentials, fetchWorkspaceData]);

  const handleAssignMember = useCallback(async (userId, role) => {
    try {
      const res = await fetchWithCredentials(`${API_URL}/members/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: Number(activeProject),
          userId: Number(userId),
          role
        })
      });

      if (res.ok) {
        await fetchWorkspaceData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to assign member');
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeProject, fetchWithCredentials, fetchWorkspaceData]);

  const handleDeleteMember = useCallback(async (id) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      const res = await fetchWithCredentials(`${API_URL}/members/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchWorkspaceData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to remove member');
      }
    } catch (err) {
      console.error(err);
    }
  }, [fetchWithCredentials, fetchWorkspaceData]);

  const handleQueryTasks = useCallback(async (filters, useFallback = false) => {
    try {
      const response = await fetchWithCredentials(`${API_URL}/tasks/query`, {
        method: useFallback ? 'POST' : 'QUERY',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filters)
      });
      if (response.ok) {
        const data = await response.json();
        return {
          ok: true,
          data: data.map(t => ({
            ...t,
            id: Number(t.id),
            projectId: Number(t.projectId),
            assignedMemberId: t.assignedMemberId ? Number(t.assignedMemberId) : null
          })),
          methodUsed: response.headers.get('X-Response-Method') || (useFallback ? 'POST' : 'QUERY'),
          cacheStatus: response.headers.get('X-Cache') || 'BYPASS',
          responseTime: response.headers.get('X-Response-Time') || 'unknown'
        };
      }
      return { ok: false, error: `Server returned status ${response.status}` };
    } catch (err) {
      console.error("QUERY request failed, attempting fallback POST:", err);
      if (!useFallback) {
        return handleQueryTasks(filters, true);
      }
      return { ok: false, error: err.message };
    }
  }, [fetchWithCredentials]);

  const fetchSprints = useCallback(async (projId) => {
    if (!projId) return;
    try {
      const res = await fetchWithCredentials(`${API_URL}/projects/${projId}/sprints`);
      if (res.ok) {
        const data = await res.json();
        setSprints(data);
      }
    } catch (err) {
      console.error("Failed to fetch sprints:", err);
    }
  }, [fetchWithCredentials]);

  const fetchScrumMeetings = useCallback(async (sprintId) => {
    if (!sprintId) return;
    try {
      const res = await fetchWithCredentials(`${API_URL}/sprints/${sprintId}/meetings`);
      if (res.ok) {
        const data = await res.json();
        setScrumMeetings(data);
      }
    } catch (err) {
      console.error("Failed to fetch scrum meetings:", err);
    }
  }, [fetchWithCredentials]);

  const fetchRetroItems = useCallback(async (sprintId) => {
    if (!sprintId) return;
    try {
      const res = await fetchWithCredentials(`${API_URL}/sprints/${sprintId}/retro`);
      if (res.ok) {
        const data = await res.json();
        setRetroItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch retro items:", err);
    }
  }, [fetchWithCredentials]);

  const handleCreateSprint = useCallback(async (projId, durationWeeks, goal) => {
    try {
      const res = await fetchWithCredentials(`${API_URL}/projects/${projId}/sprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationWeeks, goal })
      });
      if (res.ok) {
        const newSprint = await res.json();
        setSprints(prev => [newSprint, ...prev]);
        return { ok: true, data: newSprint };
      }
      const err = await res.json();
      return { ok: false, error: err.error };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [fetchWithCredentials]);

  const handleCompleteSprint = useCallback(async (sprintId, projId) => {
    try {
      const res = await fetchWithCredentials(`${API_URL}/sprints/${sprintId}/complete`, {
        method: 'PUT'
      });
      if (res.ok) {
        await Promise.all([
          fetchSprints(projId),
          fetchWorkspaceData()
        ]);
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, error: err.error };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [fetchSprints, fetchWorkspaceData, fetchWithCredentials]);

  const handleAssignTaskToSprint = useCallback(async (taskId, sprintId) => {
    try {
      const res = await fetchWithCredentials(`${API_URL}/tasks/${taskId}/sprint`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprintId })
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === Number(taskId) ? { ...t, sprintId: sprintId ? Number(sprintId) : null } : t));
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, error: err.error };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [fetchWithCredentials]);

  const handleLogStandup = useCallback(async (sprintId, yesterdayDone, todayPlan, blockers) => {
    try {
      const res = await fetchWithCredentials(`${API_URL}/sprints/${sprintId}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yesterdayDone, todayPlan, blockers })
      });
      if (res.ok) {
        const newMeeting = await res.json();
        setScrumMeetings(prev => [newMeeting, ...prev]);
        return { ok: true, data: newMeeting };
      }
      const err = await res.json();
      return { ok: false, error: err.error };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [fetchWithCredentials]);

  const handleCreateRetroItem = useCallback(async (sprintId, category, content) => {
    try {
      const res = await fetchWithCredentials(`${API_URL}/sprints/${sprintId}/retro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, content })
      });
      if (res.ok) {
        const newItem = await res.json();
        setRetroItems(prev => [newItem, ...prev]);
        return { ok: true, data: newItem };
      }
      const err = await res.json();
      return { ok: false, error: err.error };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [fetchWithCredentials]);

  const handleVoteRetroItem = useCallback(async (itemId) => {
    try {
      const res = await fetchWithCredentials(`${API_URL}/retro/${itemId}/vote`, {
        method: 'POST'
      });
      if (res.ok) {
        const votedItem = await res.json();
        setRetroItems(prev => prev.map(item => item.id === Number(itemId) ? { ...item, votes: votedItem.votes } : item).sort((a, b) => b.votes - a.votes));
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, error: err.error };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [fetchWithCredentials]);

  const fetchMessagesContacts = useCallback(async () => {
    try {
      const res = await fetchWithCredentials(`${API_URL}/messages-contacts`);
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [fetchWithCredentials]);

  const fetchMessages = useCallback(async (contactId) => {
    try {
      const res = await fetchWithCredentials(`${API_URL}/messages/${contactId}`);
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [fetchWithCredentials]);

  const handleSendMessage = useCallback(async (receiverId, messageText) => {
    try {
      const res = await fetchWithCredentials(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId, messageText })
      });
      if (res.ok) {
        return { ok: true, data: await res.json() };
      }
      const err = await res.json();
      return { ok: false, error: err.error };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [fetchWithCredentials]);

  useEffect(() => {
    setScrumMeetings([]);
    setRetroItems([]);
    if (activeProject) {
      fetchSprints(activeProject);
    } else {
      setSprints([]);
    }
  }, [activeProject, fetchSprints]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => Number(task.projectId) === Number(activeProject));
  }, [tasks, activeProject]);

  const value = useMemo(() => ({
    user,
    authLoading,
    projects,
    members,
    tasks,
    activeProject,
    filteredTasks,
    setActiveProject: handleSetActiveProject,
    activeView,
    setActiveView,
    handleLoginSuccess,
    handleLogout,
    handleAddProject,
    handleAddTask,
    handleAddMember,
    handleAssignMember,
    handleDeleteMember,
    handleToggleTask,
    handleDeleteTask,
    handleEditTask,
    handleDeleteProject,
    handleQueryTasks,
    sprints,
    scrumMeetings,
    retroItems,
    fetchSprints,
    fetchScrumMeetings,
    fetchRetroItems,
    handleCreateSprint,
    handleCompleteSprint,
    handleAssignTaskToSprint,
    handleLogStandup,
    handleCreateRetroItem,
    handleVoteRetroItem,
    fetchMessagesContacts,
    fetchMessages,
    handleSendMessage
  }), [
    user,
    authLoading,
    projects,
    members,
    tasks,
    activeProject,
    filteredTasks,
    handleSetActiveProject,
    activeView,
    setActiveView,
    handleLoginSuccess,
    handleLogout,
    handleAddProject,
    handleAddTask,
    handleAddMember,
    handleAssignMember,
    handleDeleteMember,
    handleToggleTask,
    handleDeleteTask,
    handleEditTask,
    handleDeleteProject,
    handleQueryTasks,
    sprints,
    scrumMeetings,
    retroItems,
    fetchSprints,
    fetchScrumMeetings,
    fetchRetroItems,
    handleCreateSprint,
    handleCompleteSprint,
    handleAssignTaskToSprint,
    handleLogStandup,
    handleCreateRetroItem,
    handleVoteRetroItem,
    fetchMessagesContacts,
    fetchMessages,
    handleSendMessage
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
    handleAddProject: context.handleAddProject,
    handleQueryTasks: context.handleQueryTasks
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
    handleAssignMember: context.handleAssignMember,
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
