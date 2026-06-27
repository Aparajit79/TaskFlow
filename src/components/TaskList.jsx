import React, { useState } from 'react';
import TaskStats from './TaskStats';

export function TaskList({ 
  activeProject, 
  tasks, 
  onAddTask, 
  onToggleTask, 
  onDeleteTask,
  onEditTask
}) {
  const [inputText, setInputText] = useState('');
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) {
      alert("Title is required");
      return;
    }
    onAddTask(inputText.trim(),description , priority, status);
    setInputText('');
    setDescription("");
    setPriority('Medium');
    setStatus('Pending');
  };

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditText(task.text);
    setEditDescription(task.description || '');
  };

  const saveEdit = (id) => {
    if (editText.trim() === '') return;
    onEditTask(id, editText.trim(), editDescription.trim());
    setEditingId(null);
    setEditText('');
    setEditDescription('');
  };

  const searchedTasks = tasks.filter(task =>
  task.text.toLowerCase().includes(searchTerm.toLowerCase()) &&
  (statusFilter === "All" || task.status === statusFilter)
  );

  return (
  <div className="app-card">
      <div className="search-container">
        <h1>{activeProject}'s Tasks</h1>
        <div className='search-controls'>
        <input
          type="text"
          placeholder={`Search tasks on ${activeProject}`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="task-input"
        />
         <select className="task-input"
         value={statusFilter}
         onChange={(e) => setStatusFilter(e.target.value)}
         className="select-input"
          >
         <option value="All">All</option>
         <option value="Pending">Pending</option>
         <option value="In Progress">In Progress</option>
         <option value="Completed">Completed</option>
         </select>
         </div>
      </div>

      <div className="task-dashboard">
        <div className="task-list-section">
          <div className="task-list-container">
            {tasks.length === 0 ? (
              <p className="empty-message">Add your first Task!</p>
            ) : searchedTasks.length === 0 ? (
              <p className="empty-message">No tasks matching "{searchTerm}"</p>
            ) : (
              <ul className="task-list">
                {searchedTasks.map((task) => (
                  <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                    <div className="task-content">
                      <input 
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => onToggleTask(task.id)}
                      />
                      {editingId === task.id ? (
                        <div className="edit-fields-container">
                          <input 
                            className="task-input edit-input"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit(task.id)}
                            autoFocus
                            placeholder="Task Title"
                          />
                          <textarea
                            className="task-input edit-description-input"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Task Description"
                          />
                        </div>
                      ) : (
                        <div className="task-text">
                          <div>{task.text}</div>

                             {task.description && (
                               <p className="task-description">
                                      {task.description}
                               </p>
                             )}
                          <div className="task-meta">
                            <span className="badge priority-badge">Priority: {task.priority}</span>
                            <span className="badge status-badge">Status: {task.status}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="task-actions">
                      {editingId === task.id ? (
                        <button className="icon-button" onClick={() => saveEdit(task.id)}>💾</button>
                      ) : (
                        <button className="icon-button" onClick={() => startEditing(task)}>✏️</button>
                      )}
                      <button className="icon-button delete-btn" onClick={() => onDeleteTask(task.id)}>🗑️</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="task-form-selection">
          <h3>Add Task to {activeProject}</h3>
          <form onSubmit={handleSubmit} className="task-form">
            <input
              type="text"
              placeholder={`Add task to ${activeProject}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="task-input"
            />
             <textarea placeholder="Task Description"
             className="task-input"
             value={description}
             onChange={(e) => setDescription(e.target.value)}
             />
            <select 
              className="select-input"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <select 
              className="select-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <button type="submit" className="add-button">
              Add
            </button>
          </form>
        </div>
      </div>
      
     <TaskStats tasks={tasks} />
  </div>
  );
}

export default TaskList;
