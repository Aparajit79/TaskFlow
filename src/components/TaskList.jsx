import React, { useState } from 'react';

export function TaskList({ 
  activeProject, 
  tasks, 
  onAddTask, 
  onToggleTask, 
  onDeleteTask ,
  onEditTask
}) {
  const [inputText, setInputText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) {
    alert("Title is required");
    return;
    }
    onAddTask(inputText.trim());
    setInputText('');
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
         <button type="submit" className="add-button">
          Add
         </button>
      </form>

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
              <span className="task-text">{task.text}</span>
              )}
          </div>

          <div>
          {editingId === task.id ? (
          <button onClick={() => saveEdit(task.id)}>
                    💾
          </button>
          ) : (
          <button onClick={() => startEditing(task)}>
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
  );
}

export default TaskList;
