import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen, TriangleAlert, Search, X } from 'lucide-react';
import TaskStats from './TaskStats';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import { useTasks, useMembers } from "../context/TaskFlowContext";

export function TaskList() {
  const {
    projects = [],
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
  const [sortBy, setSortBy] = useState('Default');

  const titleInputRef = useRef(null);

  useEffect(() => {
    setSearchTerm('');
    setDebouncedSearch('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setMemberFilter('All');
    setEditingTask(null);
    setSortBy('Default');
  }, [activeProject]);

  const handleFormSubmit = (text, description, priority, status, dueDate, assignedMemberId) => {
    if (editingTask) {
      onEditTask(editingTask.id, text, description, priority, status, dueDate, assignedMemberId);
      setEditingTask(null);
    } else {
      onAddTask(text, description, priority, status, dueDate, assignedMemberId);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getTomorrowString = () => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    return `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}-${String(tom.getDate()).padStart(2, '0')}`;
  };

  const tomorrowStr = getTomorrowString();
  const tasksDueTomorrow = tasks.filter(t => t.dueDate === tomorrowStr && !t.completed);
  const projectMembers = members.filter(m => Number(m.projectId) === Number(activeProject));

  const searchedTasks = tasks.filter(task => {
    const matchesSearch = task.text.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = statusFilter === "All" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
    let matchesMember = true;
    if (memberFilter !== "All") {
      matchesMember = memberFilter === "Unassigned" ? !task.assignedMemberId : Number(task.assignedMemberId) === Number(memberFilter);
    }
    return matchesSearch && matchesStatus && matchesPriority && matchesMember;
  });

  const sortedTasks = [...searchedTasks].sort((a, b) => {
    if (sortBy === 'DueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (sortBy === 'Priority') {
      const priorityWeight = { High: 3, Medium: 2, Low: 1 };
      const weightA = priorityWeight[a.priority] || 0;
      const weightB = priorityWeight[b.priority] || 0;
      return weightB - weightA; 
    }
    return 0; // Default (insertion order)
  });

  const activeProjObj = projects.find(p => Number(p.id) === Number(activeProject));
  const activeProjectName = activeProjObj ? activeProjObj.name : '';

  if (!activeProject) {
    return (
      <div className="dashboard-layout">
        <div className="app-card task-board-card empty-state">
          <div>
            <div className="empty-state-large-icon">
              <FolderOpen size={48} strokeWidth={1.25} style={{ color: 'var(--primary)', opacity: 0.4 }} />
            </div>
            <h1>Welcome to TaskMatrix</h1>
            <p>Add a new project in the sidebar to get started.</p>
          </div>
        </div>
        <div className="task-form-selection empty-state">
          <div>
            <div className="empty-state-icon">
              <FolderOpen size={28} strokeWidth={1.5} style={{ color: 'var(--text-light)' }} />
            </div>
            <h3>No Active Project</h3>
            <p>Create or select a project to start adding tasks.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="app-card task-board-card">
        <div className="board-header">
          <h2>{activeProjectName} Task Board</h2>
          <div className="board-controls-row">
            <div className="search-input-wrapper">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="task-input search-with-icon"
              />
              {searchTerm && (
                <button 
                  className="search-clear-btn"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                  type="button"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select-input sort-select">
              <option value="Default">Default Order</option>
              <option value="DueDate">Sort by Due Date</option>
              <option value="Priority">Sort by Priority</option>
            </select>

            <div className="filters-wrapper">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-input">
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocker">Blocker</option>
              </select>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="select-input">
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <select value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)} className="select-input">
                <option value="All">All Assignees</option>
                <option value="Unassigned">Unassigned</option>
                {projectMembers.map(m => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="task-list-container">
          {tasks.length === 0 ? (
            <p className="empty-message">
              No tasks yet. <button onClick={() => titleInputRef.current?.focus()} className="empty-state-link-btn" type="button">Add your first task!</button>
            </p>
          ) : searchedTasks.length === 0 ? (
            <p className="empty-message">No tasks match the current filters.</p>
          ) : (
            <ul className="task-list">
              {sortedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleTask={onToggleTask}
                  onDeleteTask={onDeleteTask}
                  onStartEdit={setEditingTask}
                  isEditing={editingTask && editingTask.id === task.id}
                  members={members}
                  searchTerm={searchTerm}
                />
              ))}
            </ul>
          )}
        </div>

        {tasksDueTomorrow.length > 0 && (
          <div className="alert alert-warning">
            <TriangleAlert size={16} style={{ marginRight: 8, flexShrink: 0 }} />
            <div>
              <strong>Attention needed:</strong> You have {tasksDueTomorrow.length} task{tasksDueTomorrow.length > 1 ? 's' : ''} due tomorrow!
            </div>
          </div>
        )}

        <TaskStats tasks={tasks} />
      </div>

      <TaskForm
        activeProject={activeProject}
        projects={projects}
        members={members}
        onSubmit={handleFormSubmit}
        editingTask={editingTask}
        onCancelEdit={() => setEditingTask(null)}
        titleInputRef={titleInputRef}
      />
    </div>
  );
}

export default React.memo(TaskList);
