
import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';

const TaskFlowContext = createContext();

const initialState = {
  projects: ["Personal", "Work", "college", "Things to buy"],
  members:[],
  tasks: [
    {
      id: 1,
      project: "Personal",
      text: "Learn React",
      description: "Complete React basics and hooks",
      priority: "High",
      status: "In Progress",
      dueDate:null,
      assignedMember:"",
      completed: false
    } ,
   
  ],
  
  activeProject: 'Personal'
};

function loadState() {
  try {
    const savedData = localStorage.getItem("taskflow");

    if (!savedData) {
        return null;
    }
    const parsed = JSON.parse(savedData);
    if (!parsed || typeof parsed !== 'object') {
        return null;
    }
    return parsed;
  } catch (e) {
    console.error("Failed to parse taskflow state from localStorage:", e);
    return null;
  }
}

function saveState(state) {
    const data = JSON.stringify(state);

    localStorage.setItem("taskflow", data);
}


function taskReducer(state, action) {
  switch (action.type) {
    case 'ADD_PROJECT': {
      const trimmed = action.payload.trim();
      if (!trimmed || state.projects.includes(trimmed)) return state;
      return {
        ...state,
        projects: [...state.projects, trimmed],
        activeProject: trimmed
      };
    }
    case 'SET_ACTIVE_PROJECT': {
      return {
        ...state,
        activeProject: action.payload
      };
      
    }
    case 'ADD_TASK': {
      const { text,description, priority, status ,dueDate,assignedMember } = action.payload;
      const trimmed = text.trim();
      if (!trimmed) return state;

      const newTask = {
        id: Date.now(),
        project: state.activeProject,
        text: trimmed,
        description,
        priority,
        status,
        dueDate,
        assignedMember,
        completed: false
      };

      return {
        ...state,
        tasks: [...state.tasks, newTask]
      };
    }
    case 'TOGGLE_TASK': {
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload
            ? { ...task, completed: !task.completed }
            : task
        )
      };
    }
    case 'DELETE_TASK': {
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload)
      };
    }
    case 'EDIT_TASK': {
      const { id, text, description, priority, status ,dueDate,assignedMember} = action.payload;
      const trimmed = text.trim();
      if (!trimmed) return state;
      
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, text: trimmed, description, priority, status ,dueDate,assignedMember} : task
        )
      };
    }
    case 'DELETE_PROJECT': {
      const projName = action.payload;
      const updatedProjects = state.projects.filter((p) => p !== projName);
      
      let newActiveProject = state.activeProject;
      if (state.activeProject === projName) {
        newActiveProject = updatedProjects.length > 0 ? updatedProjects[0] : '';
      }
      
      return {
        ...state,
        projects: updatedProjects,
        tasks: state.tasks.filter((t) => t.project !== projName),
        activeProject: newActiveProject
      };

    }
   case "ADD_MEMBER": {
  const { name, role } = action.payload;
  const trimmedName = name.trim();
  const memberExists = state.members.some(
    (member) =>
      member.project === state.activeProject &&
      member.name.toLowerCase() === trimmedName.toLowerCase() &&
      member.role === role
  );
  if (memberExists) {
    alert("This member already exists in the project.");
    return state;
  }
  const newMember = {
    id: Date.now(),
    project: state.activeProject,
    name: trimmedName,
    role,
    avatar: trimmedName.charAt(0).toUpperCase()
  };
  return {
    ...state,
    members: [...(state.members || []), newMember]
  };
}
  case "DELETE_MEMBER": {
  return {
    ...state,
    members: state.members.filter(
      (member) => member.id !== action.payload
    )
  };
}
    default:
      return state;
  }
}

export function TaskFlowProvider({ children }) {
  const savedState = loadState();
  const initial = savedState 
    ? {
        projects: Array.isArray(savedState.projects) ? savedState.projects : initialState.projects,
        members: Array.isArray(savedState.members) ? savedState.members : initialState.members,
        tasks: Array.isArray(savedState.tasks) ? savedState.tasks : initialState.tasks,
        activeProject: typeof savedState.activeProject === 'string' && savedState.projects?.includes(savedState.activeProject)
          ? savedState.activeProject 
          : (Array.isArray(savedState.projects) && savedState.projects[0]) || initialState.activeProject
      }
    : initialState;

  const [state, dispatch] = useReducer(taskReducer, initial);
  
  useEffect(() => {
    saveState(state);
  }, [state]);

  const filteredTasks = state.tasks.filter((task) => task.project === state.activeProject);

  const setActiveProject = useCallback((proj) => {
    dispatch({ type: 'SET_ACTIVE_PROJECT', payload: proj });
  }, []);

  const handleAddProject = useCallback((name) => {
    dispatch({ type: 'ADD_PROJECT', payload: name });
  }, []);

  const handleAddTask = useCallback((text, description, priority, status, dueDate, assignedMember) => {
    dispatch({ type: 'ADD_TASK', payload: { text, description, priority, status, dueDate, assignedMember } });
  }, []);

  const handleAddMember = useCallback((name, role) => {
    dispatch({ type: "ADD_MEMBER", payload: { name, role } });
  }, []);

  const handleDeleteMember = useCallback((id) => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      dispatch({ type: "DELETE_MEMBER", payload: id });
    }
  }, []);

  const handleToggleTask = useCallback((id) => {
    dispatch({ type: 'TOGGLE_TASK', payload: id });
  }, []);

  const handleDeleteTask = useCallback((id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      dispatch({ type: 'DELETE_TASK', payload: id });
    }
  }, []);

  const handleEditTask = useCallback((id, text, description, priority, status, dueDate, assignedMember) => {
    dispatch({ type: 'EDIT_TASK', payload: { id, text, description, priority, status, dueDate, assignedMember } });
  }, []);

  const handleDeleteProject = useCallback((projName) => {
    const projectTasks = state.tasks.filter((t) => t.project === projName);
    if (projectTasks.length === 0) {
      dispatch({ type: 'DELETE_PROJECT', payload: projName });
    } else {
      if (window.confirm(`Project "${projName}" has ${projectTasks.length} task(s). Are you sure you want to delete it and all its tasks?`)) {
        dispatch({ type: 'DELETE_PROJECT', payload: projName });
      }
    }
  }, [state.tasks]);

  const value = useMemo(() => ({
    projects: state.projects,
    members: state.members,
    activeProject: state.activeProject,
    filteredTasks,
    setActiveProject,
    handleAddProject,
    handleAddTask,
    handleAddMember,
    handleDeleteMember,
    handleToggleTask,
    handleDeleteTask,
    handleEditTask,
    handleDeleteProject
  }), [
    state.projects,
    state.members,
    state.activeProject,
    filteredTasks,
    setActiveProject,
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
