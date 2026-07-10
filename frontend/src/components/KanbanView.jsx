import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FolderOpen, Search, X, ListTodo, Play, AlertOctagon } from 'lucide-react';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import { useTasks, useMembers } from '../context/TaskFlowContext';

const COLUMNS = [
  { id: 'Pending', title: 'Pending', icon: <ListTodo size={16} />, colorClass: 'pending' },
  { id: 'In Progress', title: 'In Progress', icon: <Play size={16} />, colorClass: 'inprogress' },
  { id: 'Blocker', title: 'Blocker', icon: <AlertOctagon size={16} />, colorClass: 'blocker' }
];

export function KanbanView() {
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
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [memberFilter, setMemberFilter] = useState('All');
  const [editingTask, setEditingTask] = useState(null);

  const titleInputRef = useRef(null);

  useEffect(() => {
    setSearchTerm('');
    setDebouncedSearch('');
    setPriorityFilter('All');
    setMemberFilter('All');
    setEditingTask(null);
  }, [activeProject]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const projectMembers = members.filter(m => Number(m.projectId) === Number(activeProject));
  const activeProjObj = projects.find(p => Number(p.id) === Number(activeProject));
  const activeProjectName = activeProjObj ? activeProjObj.name : '';

  // Filter tasks for column display
  const getFilteredTasksForColumn = (columnId) => {
    return tasks.filter((task) => {
      if (task.status !== columnId) return false;
      const matchesSearch = task.text.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                            (task.description && task.description.toLowerCase().includes(debouncedSearch.toLowerCase()));
      const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
      let matchesMember = true;
      if (memberFilter !== 'All') {
        matchesMember = memberFilter === 'Unassigned' 
          ? !task.assignedMemberId 
          : Number(task.assignedMemberId) === Number(memberFilter);
      }
      return matchesSearch && matchesPriority && matchesMember;
    });
  };

  const handleFormSubmit = (text, description, priority, status, dueDate, assignedMemberId) => {
    if (editingTask) {
      onEditTask(editingTask.id, text, description, priority, status, dueDate, assignedMemberId);
      setEditingTask(null);
    } else {
      onAddTask(text, description, priority, status, dueDate, assignedMemberId);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = Number(draggableId);
    const targetStatus = destination.droppableId;
    const task = tasks.find((t) => t.id === taskId);

    if (task) {
      // Execute edit with updated status
      await onEditTask(
        taskId,
        task.text,
        task.description,
        task.priority,
        targetStatus,
        task.dueDate,
        task.assignedMemberId
      );
    }
  };

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
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="app-card task-board-card">
        <div className="board-header">
          <h2>{activeProjectName} Kanban Board</h2>
          <div className="board-controls-row">
            <div className="search-input-wrapper">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search board..."
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

            <div className="filters-wrapper">
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

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board">
            {COLUMNS.map((col) => {
              const colTasks = getFilteredTasksForColumn(col.id);

              return (
                <div key={col.id} className={`kanban-column col-${col.colorClass}`}>
                  <div className="kanban-column-header">
                    <span className="column-title-icon">{col.icon}</span>
                    <h3>{col.title}</h3>
                    <span className="kanban-count-badge">{colTasks.length}</span>
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`kanban-task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                      >
                        {colTasks.length === 0 ? (
                          <div className="kanban-empty-dropzone">
                            <span className="dropzone-text">Drop tasks here</span>
                          </div>
                        ) : (
                          <ul className="task-list kanban-list-style">
                            {colTasks.map((task, index) => (
                              <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`draggable-task ${snapshot.isDragging ? 'is-dragging' : ''}`}
                                    style={{
                                      ...provided.draggableProps.style,
                                    }}
                                  >
                                    <TaskItem
                                      task={task}
                                      onToggleTask={onToggleTask}
                                      onDeleteTask={onDeleteTask}
                                      onStartEdit={setEditingTask}
                                      isEditing={editingTask && editingTask.id === task.id}
                                      members={members}
                                      searchTerm={debouncedSearch}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </ul>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
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

export default React.memo(KanbanView);
