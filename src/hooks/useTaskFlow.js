import { useReducer } from 'react';

const initialState = {
  projects: ["Personal", "Work", "college", "School", "Things to buy", "Gym"],
  tasks: [
    {
      id: 1,
      project: "Personal",
      text: "Learn React",
      priority: "High",
      status: "In Progress",
      completed: false
    }
  ],
  activeProject: 'Personal'
};

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
      const { text, priority, status } = action.payload;
      const trimmed = text.trim();
      if (!trimmed) return state;

      const newTask = {
        id: Date.now(),
        project: state.activeProject,
        text: trimmed,
        priority,
        status,
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
          task.id === action.payload ? { ...task, completed: !task.completed } : task
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
      const { id, text } = action.payload;
      const trimmed = text.trim();
      if (!trimmed) return state;
      
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, text: trimmed } : task
        )
      };
    }
    default:
      return state;
  }
}

export function useTaskFlow() {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  const filteredTasks = state.tasks.filter((task) => task.project === state.activeProject);

  return {
    projects: state.projects,
    activeProject: state.activeProject,
    filteredTasks,
    setActiveProject: (proj) => dispatch({ type: 'SET_ACTIVE_PROJECT', payload: proj }),
    handleAddProject: (name) => dispatch({ type: 'ADD_PROJECT', payload: name }),
    handleAddTask: (text, priority, status) => dispatch({ type: 'ADD_TASK', payload: { text, priority, status } }),
    handleToggleTask: (id) => dispatch({ type: 'TOGGLE_TASK', payload: id }),
    handleDeleteTask: (id) => dispatch({ type: 'DELETE_TASK', payload: id }),
    handleEditTask: (id, text) => dispatch({ type: 'EDIT_TASK', payload: { id, text } })
  };
}

export default useTaskFlow;
