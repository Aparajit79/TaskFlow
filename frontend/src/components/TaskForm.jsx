import React, { useState, useEffect } from 'react';
import { Pencil, Plus } from 'lucide-react';

export function TaskForm({ activeProject, members, onSubmit, editingTask, onCancelEdit }) {
  const [inputText, setInputText] = useState('');
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending');
  const [dueDate, setDueDate] = useState("");
  const [assignedMember, setAssignedMember] = useState("");
  const [titleError, setTitleError] = useState("");
  const [dueDateError, setDueDateError] = useState("");

  useEffect(() => {
    if (editingTask) {
      setInputText(editingTask.text || '');
      setDescription(editingTask.description || '');
      setPriority(editingTask.priority || 'Medium');
      setStatus(editingTask.status || 'Pending');
      setDueDate(editingTask.dueDate || '');
      setAssignedMember(editingTask.assignedMember || '');
    } else {
      setInputText('');
      setDescription('');
      setPriority('Medium');
      setStatus('Pending');
      setDueDate('');
      setAssignedMember('');
    }
    setTitleError("");
    setDueDateError("");
  }, [editingTask]);

  const handleSubmit = (e) => {
    e.preventDefault();
    let valid = true;

    if (!inputText.trim()) {
      setTitleError("Title is required");
      valid = false;
    } else {
      setTitleError("");
    }

    if (priority === 'High' && !dueDate) {
      setDueDateError("High priority tasks require a due date");
      valid = false;
    } else if (dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [year, month, day] = dueDate.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      if (selectedDate < today) {
        setDueDateError("Due date cannot be in the past");
        valid = false;
      } else {
        setDueDateError("");
      }
    } else {
      setDueDateError("");
    }

    if (!valid) return;

    onSubmit(inputText.trim(), description.trim(), priority, status, dueDate, assignedMember);
    if (!editingTask) {
      setInputText('');
      setDescription("");
      setPriority('Medium');
      setStatus('Pending');
      setDueDate("");
      setAssignedMember("");
    }
  };

  if (!activeProject) {
    return (
      <div className="task-form-selection empty-state">
        <div>
          <div className="empty-state-icon">
            <Plus size={28} strokeWidth={1.5} style={{ color: 'var(--text-light)' }} />
          </div>
          <h3>No Active Project</h3>
          <p>Create or select a project in the sidebar to start adding tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`task-form-selection ${editingTask ? 'is-editing' : ''}`}>
      <h3>
        {editingTask
          ? <><Pencil size={15} strokeWidth={1.75} style={{ marginRight: 6 }} />Edit Task</>
          : <><Plus size={15} strokeWidth={2} style={{ marginRight: 6 }} />Add Task to {activeProject}</>
        }
      </h3>
      <form onSubmit={handleSubmit} className="task-form">
        <div>
          <label>Task Title <span className="required-star">*</span></label>
          <input
            type="text"
            placeholder={editingTask ? "Edit task title..." : `New task in ${activeProject}...`}
            value={inputText}
            onChange={(e) => { setInputText(e.target.value); if (titleError) setTitleError(""); }}
            className={`task-input ${titleError ? 'input-field-error' : ''}`}
          />
          {titleError && <p className="form-field-error">{titleError}</p>}
        </div>

        <div>
          <label>Description</label>
          <textarea
            placeholder="Optional description..."
            className="task-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-col">
            <label>Priority</label>
            <select className="select-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="form-col">
            <label>Status</label>
            <select className="select-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocker">Blocker</option>
            </select>
          </div>
        </div>

        <div>
          <label>Due Date</label>
          <input
            type="date"
            className={`task-input ${dueDateError ? 'input-field-error' : ''}`}
            value={dueDate}
            onChange={(e) => { setDueDate(e.target.value); if (dueDateError) setDueDateError(""); }}
          />
          {dueDateError && <p className="form-field-error">{dueDateError}</p>}
        </div>

        <div>
          <label>Assignee</label>
          <select className="select-input" value={assignedMember} onChange={(e) => setAssignedMember(e.target.value)}>
            <option value="">Unassigned</option>
            {members
              .filter(m => m.project === activeProject)
              .map(m => <option key={m.id} value={m.name}>{m.name}</option>)
            }
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="add-button">
            {editingTask ? 'Save Changes' : 'Add Task'}
          </button>
          {editingTask && (
            <button type="button" className="cancel-button" onClick={onCancelEdit}>Cancel</button>
          )}
        </div>
      </form>
    </div>
  );
}

export default React.memo(TaskForm);
