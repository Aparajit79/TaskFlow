import React, { useState, useEffect } from 'react';
import { FolderOpen, TriangleAlert, Search } from 'lucide-react';
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
  const projectMembers = members.filter(m => m.project === activeProject);

  const searchedTasks = tasks.filter(task => {
    const matchesSearch = task.text.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = statusFilter === "All" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
    let matchesMember = true;
    if (memberFilter !== "All") {
      matchesMember = memberFilter === "Unassigned" ? !task.assignedMember : task.assignedMember === memberFilter;
    }
    return matchesSearch && matchesStatus && matchesPriority && matchesMember;
  });

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
        <h1>
          <FolderOpen size={22} strokeWidth={1.75} style={{ marginRight: 8, color: 'var(--primary)', verticalAlign: 'middle' }} />
          {activeProject}
        </h1>

        {tasksDueTomorrow.length > 0 && (
          <div className="due-warning-banner">
            <TriangleAlert size={20} strokeWidth={1.75} style={{ flexShrink: 0, marginTop: 1 }} />
            <div className="warning-content">
              <strong>Due Tomorrow</strong> — {tasksDueTomorrow.length} task{tasksDueTomorrow.length > 1 ? 's' : ''} need attention
              <ul className="due-tasks-mini-list">
                {tasksDueTomorrow.map(t => <li key={t.id}>"{t.text}"</li>)}
              </ul>
            </div>
          </div>
        )}

        <div className="search-container">
          <div className="search-controls">
            <div className="search-input-wrapper">
              <Search size={14} strokeWidth={1.75} className="search-icon" />
              <input
                type="text"
                placeholder={`Search in ${activeProject}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="task-input search-with-icon"
              />
            </div>
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
              {projectMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
        </div>

        <div className="task-list-container">
          {tasks.length === 0 ? (
            <p className="empty-message">No tasks yet. Add your first task!</p>
          ) : searchedTasks.length === 0 ? (
            <p className="empty-message">No tasks match the current filters.</p>
          ) : (
            <ul className="task-list">
              {searchedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleTask={onToggleTask}
                  onDeleteTask={onDeleteTask}
                  onStartEdit={setEditingTask}
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
        onCancelEdit={() => setEditingTask(null)}
      />
    </div>
  );
}

export default React.memo(TaskList);
