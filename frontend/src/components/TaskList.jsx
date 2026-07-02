import React, { useState, useEffect } from 'react';
import TaskStats from './TaskStats';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import { useTasks, useMembers } from "../context/TaskFlowContext";

export function TaskList() {
  const {
    activeProject = '',
    filteredTasks: tasks = [],
    handleAddTask: onAddTask,
    handleToggleTask: onToggleTask,
    handleDeleteTask: onDeleteTask,
    handleEditTask: onEditTask
  } = useTasks();

  const { members = [] } = useMembers();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [memberFilter, setMemberFilter] = useState('All');
  const [editingTask, setEditingTask] = useState(null);
  useEffect(() => {
    setSearchTerm('');
    setDebouncedSearch('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setMemberFilter('All');
    setEditingTask(null);
  }, [activeProject]);

  const handleFormSubmit = (text, description, priority, status, dueDate, assignedMember) => {
    if (editingTask) {
      onEditTask(editingTask.id, text, description, priority, status, dueDate, assignedMember);
      setEditingTask(null);
    } else {
      onAddTask(text, description, priority, status, dueDate, assignedMember);
    }
  };

  const handleStartEdit = (task) => {
    setEditingTask(task);
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getTomorrowString = () => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const yyyy = tom.getFullYear();
    const mm = String(tom.getMonth() + 1).padStart(2, '0');
    const dd = String(tom.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const tomorrowStr = getTomorrowString();
  const tasksDueTomorrow = tasks.filter(t => t.dueDate === tomorrowStr && !t.completed);

  useEffect(() => {
    if (activeProject && tasksDueTomorrow.length > 0) {
      const taskNames = tasksDueTomorrow.map(t => `"${t.text}"`).join(", ");
      alert(`⚠️ Attention: The following task(s) in this project are due tomorrow: ${taskNames}`);
    }
  }, [activeProject]);

  const projectMembers = members.filter(member => member.project === activeProject);

  const searchedTasks = tasks.filter(task => {
    const matchesSearch = task.text.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = statusFilter === "All" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
    
    let matchesMember = true;
    if (memberFilter !== "All") {
      if (memberFilter === "Unassigned") {
        matchesMember = !task.assignedMember;
      } else {
        matchesMember = task.assignedMember === memberFilter;
      }
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesMember;
  });

  if (!activeProject) {
    return (
      <div className="dashboard-layout">
        <div className="app-card task-board-card empty-state">
          <div>
            <div className="empty-state-large-icon">⚡</div>
            <h1>Welcome to TaskMatrix</h1>
            <p>
              To get started, please add a new project in the sidebar on the left.
            </p>
          </div>
        </div>
        
        <div className="task-form-selection empty-state">
          <div>
            <div className="empty-state-icon">📁</div>
            <h3>No Active Project</h3>
            <p>
              Create or select a project in the sidebar to start adding tasks.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="app-card task-board-card">
        <h1>📁 {activeProject}'s Tasks</h1>

        {tasksDueTomorrow.length > 0 && (
          <div className="due-warning-banner">
            <span className="warning-icon">⚠️</span>
            <div className="warning-content">
              <strong>Due Tomorrow:</strong> You have {tasksDueTomorrow.length} task(s) due tomorrow!
              <ul className="due-tasks-mini-list">
                {tasksDueTomorrow.map(t => (
                  <li key={t.id}>“{t.text}”</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        <div className="search-container">
          <div className='search-controls'>
            <input
              type="text"
              placeholder={`Search tasks on ${activeProject}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="task-input"
            />
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-input"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocker">Blocker</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="select-input"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="select-input"
            >
              <option value="All">All Assignees</option>
              <option value="Unassigned">Unassigned</option>
              {projectMembers.map(member => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="task-list-container">
          {tasks.length === 0 ? (
            <p className="empty-message">No tasks in this project. Add your first Task!</p>
          ) : searchedTasks.length === 0 ? (
            <p className="empty-message">No tasks matching search filters</p>
          ) : (
            <ul className="task-list">
              {searchedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleTask={onToggleTask}
                  onDeleteTask={onDeleteTask}
                  onStartEdit={handleStartEdit}
                  isEditing={editingTask && editingTask.id === task.id}
                />
              ))}
            </ul>
          )}
        </div>

        <TaskStats tasks={tasks} />
      </div>

      <TaskForm
        activeProject={activeProject}
        members={members}
        onSubmit={handleFormSubmit}
        editingTask={editingTask}
        onCancelEdit={handleCancelEdit}
      />
    </div>
  );
}

export default React.memo(TaskList);
