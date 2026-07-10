import React from 'react';
import { Pencil, Trash2, Calendar, UserRound } from 'lucide-react';
import { useTaskFlow } from '../context/TaskFlowContext';

const highlightText = (text, search) => {
  if (!search || !search.trim()) return text;
  const regex = new RegExp(`(${search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
  );
};

export function TaskItem({ task, onToggleTask, onDeleteTask, onStartEdit, isEditing, members = [], searchTerm = '' }) {
  const { user } = useTaskFlow();
  const assignee = members.find(m => Number(m.id) === Number(task.assignedMemberId));
  const assigneeName = assignee ? assignee.name : null;

  const isAdmin = user?.role === 'admin';
  const myMemberRecord = members.find(m => Number(m.projectId) === Number(task.projectId) && Number(m.userId) === Number(user?.id));
  const isMyTask = myMemberRecord && Number(task.assignedMemberId) === Number(myMemberRecord.id);
  const canModify = isAdmin || isMyTask;

  return (
    <li className={`task-item ${task.completed ? 'completed' : ''} ${isEditing ? 'editing' : ''} ${isMyTask ? 'my-task' : 'other-task'} ${!canModify ? 'locked-task' : ''}`}>
      <div
        className="task-content"
        onDoubleClick={() => canModify && onStartEdit(task)}
        title={canModify ? "Double click to edit task" : "Locked (Read-Only)"}
      >
        <input
          type="checkbox"
          checked={task.completed}
          disabled={!canModify}
          onChange={() => canModify && onToggleTask(task.id)}
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
        {canModify && (
          <button
            className={`icon-button ${isEditing ? 'active-edit' : ''}`}
            onClick={() => onStartEdit(task)}
            title="Edit task"
          >
            <Pencil size={14} strokeWidth={1.75} />
          </button>
        )}
        {isAdmin && (
          <button
            className="icon-button delete-btn"
            onClick={() => onDeleteTask(task.id)}
            title="Delete task"
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        )}
      </div>
    </li>
  );
}

export default React.memo(TaskItem);
