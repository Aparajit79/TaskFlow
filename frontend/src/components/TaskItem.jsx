import React from 'react';
import { Pencil, Trash2, Calendar, UserRound } from 'lucide-react';

const highlightText = (text, search) => {
  if (!search || !search.trim()) return text;
  const regex = new RegExp(`(${search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
  );
};

export function TaskItem({ task, onToggleTask, onDeleteTask, onStartEdit, isEditing, members = [], searchTerm = '' }) {
  const assignee = members.find(m => Number(m.id) === Number(task.assignedMemberId));
  const assigneeName = assignee ? assignee.name : null;

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
          <div>{highlightText(task.text, searchTerm)}</div>

          {task.description && (
            <p className="task-description">{task.description}</p>
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
                <Calendar size={13} strokeWidth={1.75} />
                Due:{" "}
                {new Date(task.dueDate).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </p>
            )}

            {assigneeName && (
              <p className="task-member">
                <UserRound size={12} strokeWidth={1.75} />
                <strong>{assigneeName}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="task-actions">
        <button
          className={`icon-button ${isEditing ? 'active-edit' : ''}`}
          onClick={() => onStartEdit(task)}
          title="Edit task"
        >
          <Pencil size={14} strokeWidth={1.75} />
        </button>
        <button
          className="icon-button delete-btn"
          onClick={() => onDeleteTask(task.id)}
          title="Delete task"
        >
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
      </div>
    </li>
  );
}

export default React.memo(TaskItem);
