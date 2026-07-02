import React from 'react';

export function TaskItem({ task, onToggleTask, onDeleteTask, onStartEdit, isEditing }) {
  return (
    <li className={`task-item ${task.completed ? 'completed' : ''} ${isEditing ? 'editing' : ''}`}>
      <div 
        className="task-content" 
        onDoubleClick={() => onStartEdit(task)} 
        title="Double click to edit task"
      >
        <input 
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggleTask(task.id)}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="task-text">
          <div>{task.text}</div>

          {task.description && (
            <p className="task-description">
              {task.description}
            </p>
          )}
          
          <div className="task-meta">
            <span className={`badge priority-badge-${task.priority.toLowerCase()}`}>
              {task.priority} Priority
            </span>
          
            <span className={`badge status-badge-${task.status.toLowerCase().replace(' ', '')}`}>
              {task.status}
            </span>

            {task.dueDate && (
              <p className="task-due-date">
                📅 Due:{" "}
                {new Date(task.dueDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
            
            {task.assignedMember && (
              <p className="task-member">
                👤 Assigneed to: <strong>{task.assignedMember}</strong>
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="task-actions">
        <button 
          className={`icon-button ${isEditing ? 'active-edit' : ''}`}
          onClick={() => onStartEdit(task)}
          title="Edit task details in form"
        >
          ✏️
        </button>
        <button 
          className="icon-button delete-btn" 
          onClick={() => onDeleteTask(task.id)} 
          title="Delete Task"
        >
          🗑️
        </button>
      </div>
    </li>
  );
}

export default React.memo(TaskItem);
