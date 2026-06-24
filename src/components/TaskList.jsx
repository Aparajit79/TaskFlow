import React, { useState } from 'react';

// TaskList component: Handles showing the list of tasks and the "Add Task" form
export function TaskList({ 
  activeProject, 
  tasks, 
  onAddTask, 
  onToggleTask, 
  onDeleteTask 
}) {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() === '') return;

    onAddTask(inputText.trim());
    setInputText('');
  };

  return (
    <div className="app-card">
      {/* 1. Active Project Title */}
      <h1>{activeProject}</h1>

      {/* 2. Add Task Form */}
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

      {/* 3. Tasks List */}
      <ul className="task-list">
        {tasks.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px' }}>
            No tasks here yet! 🎉
          </p>
        ) : (
          tasks.map((task) => (
            <li
              key={task.id}
              className={`task-item ${task.completed ? 'completed' : ''}`}
            >
              {/* Clickable task box to check/uncheck */}
              <div className="task-content" onClick={() => onToggleTask(task.id)}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  readOnly
                />
                <span className="task-text">{task.text}</span>
              </div>

              {/* Trash button to delete */}
              <button className="delete-button" onClick={() => onDeleteTask(task.id)}>
                🗑️
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default TaskList;
