import React, { useState } from 'react';
import TaskStats from './TaskStats';

export function TaskList({ 
  activeProject, 
  tasks, 
  onAddTask, 
  onToggleTask, 
  onDeleteTask ,
  onEditTask
}) {
  const [inputText, setInputText] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  

  const handleSubmit = (e) => {
  e.preventDefault();

  if (!inputText.trim()) {
    alert("Title is required");
    return;
  }

  onAddTask(
    inputText.trim(),
    priority,
    status
  );

  setInputText('');
  setPriority('Medium');
  setStatus('Pending');
  };

  const startEditing = (task) => {
   setEditingId(task.id);
   setEditText(task.text);
  };

  const saveEdit = (id) => {
   if (editText.trim() === '') return;
   onEditTask(id, editText.trim());
   setEditingId(null);
   setEditText('');
  };

  return (
    <div className="app-card">
      <h1>{activeProject}' Tasks</h1>
      <form onSubmit={handleSubmit} className="task-form">
        <input
          type="text"
          placeholder={`Add task to ${activeProject}...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="task-input"
         />
         <select className="add-button2"
           value={priority}
           onChange={(e) => setPriority(e.target.value)}
          >
           <option value="Low">Low</option>
           <option value="Medium">Medium</option>
           <option value="High">High</option>
         </select>
         <select className="add-button2"
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
      <div className="task-list-container">
      <ul className="task-list">
        {tasks.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px' }}>
            No tasks here yet! 
          </p>
        ) : (
        tasks.map((task) => (
        <li key={task.id}
            className={`task-item ${task.completed ? 'completed' : ''}`}
        >
          <div className="task-content" >
              <input 
              onClick={() => onToggleTask(task.id)}
              type="checkbox"
              checked={task.completed}
              readOnly
              />
              {editingId === task.id ? (
              <input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              />
              ) : (
              <div className='task-text'>
                <div>{task.text}</div>

                <small>
                    Priority: {task.priority}
                </small>

                <br />

                <small>
                  Status: {task.status}
                </small>
              </div>
              )}
          </div>

          <div>
          {editingId === task.id ? (
          <button className="delete-button" onClick={() => saveEdit(task.id)}>
                    💾
          </button>
          ) : (
          <button className="delete-button" onClick={() => startEditing(task)}>
                    ✏️
          </button>
          )}
              
          <button
              className="delete-button"
              onClick={() => onDeleteTask(task.id)}
          >
                  🗑️
          </button>
        </div>
        </li>
        ))
        )}
      </ul>
      </div>
      <TaskStats
      totalTasks={tasks.length}
      completedTasks={tasks.filter(task => task.completed).length}
      />
    </div>
  );
}

export default TaskList;
