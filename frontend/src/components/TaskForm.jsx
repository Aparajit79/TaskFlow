import React, { useState, useEffect } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useTaskFlow } from '../context/TaskFlowContext';

export function TaskForm({ activeProject, projects = [], members = [], onSubmit, editingTask, onCancelEdit, titleInputRef }) {
  const { user } = useTaskFlow();
  const [inputText, setInputText] = useState('');
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending');
  const [dueDate, setDueDate] = useState("");
  const [assignedMemberId, setAssignedMemberId] = useState("");
  const [titleError, setTitleError] = useState("");
  const [dueDateError, setDueDateError] = useState("");

  const activeProjObj = projects.find(p => Number(p.id) === Number(activeProject));
  const activeProjectName = activeProjObj ? activeProjObj.name : 'Unknown';

  const myMemberRecord = members.find(m => Number(m.projectId) === Number(activeProject) && Number(m.userId) === Number(user?.id));
  const myMemberId = myMemberRecord ? String(myMemberRecord.id) : '';

  useEffect(() => {
    if (editingTask) {
      setInputText(editingTask.text || '');
      setDescription(editingTask.description || '');
      setPriority(editingTask.priority || 'Medium');
      setStatus(editingTask.status || 'Pending');
      setDueDate(editingTask.dueDate || '');
      setAssignedMemberId(editingTask.assignedMemberId ? String(editingTask.assignedMemberId) : '');
    } else {
      setInputText('');
      setDescription('');
      setPriority('Medium');
      setStatus('Pending');
      setDueDate('');
      if (user?.role !== 'admin' && myMemberId) {
        setAssignedMemberId(myMemberId);
      } else {
        setAssignedMemberId('');
      }
    }
    setTitleError("");
    setDueDateError("");
  }, [editingTask, activeProject, user, myMemberId]);

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

    onSubmit(inputText.trim(), description.trim(), priority, status, dueDate, assignedMemberId ? Number(assignedMemberId) : null);
    if (!editingTask) {
      setInputText('');
      setDescription("");
      setPriority('Medium');
      setStatus('Pending');
      setDueDate("");
      if (user?.role !== 'admin' && myMemberId) {
        setAssignedMemberId(myMemberId);
      } else {
        setAssignedMemberId("");
      }
    }
  };

  if (!activeProject) {
    return (
      <div className="task-form-selection empty-state">
        <div>
          <div className="empty-state-icon">
            <Plus size={28} strokeWidth={1.5} className="taskform-extracted-1" />
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
          ? <><Pencil size={15} strokeWidth={1.75} className="taskform-extracted-2" />Edit Task</>
          : <><Plus size={15} strokeWidth={2} className="taskform-extracted-3" />Add Task to {activeProjectName}</>
        }
      </h3>
      <form onSubmit={handleSubmit} className="task-form">
        <div>
          <label>Task Title <span className="required-star">*</span></label>
          <input
            ref={titleInputRef}
            type="text"
            placeholder={editingTask ? "Edit task title..." : `New task in ${activeProjectName}...`}
            value={inputText}
            onChange={(e) => { setInputText(e.target.value); if (titleError) setTitleError(""); }}
            className={`task-input ${titleError ? 'input-field-error' : ''}`}
          />
          {titleError && <p className="form-field-error">{titleError}</p>}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ marginBottom: 0 }}>Description</label>
            <span style={{ fontSize: '11px', color: '#888888' }}>{description.length}/100</span>
          </div>
          <textarea
            placeholder="Optional description (max 100 characters)..."
            className="task-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={100}
            style={{ resize: 'none' }}
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
          {user?.role === 'admin' ? (
            <select className="select-input" value={assignedMemberId} onChange={(e) => setAssignedMemberId(e.target.value)}>
              <option value="">Unassigned</option>
              {members
                .filter(m => Number(m.projectId) === Number(activeProject))
                .map(m => <option key={m.id} value={m.id}>{m.name}</option>)
              }
            </select>
          ) : (
            <select className="select-input" value={assignedMemberId} disabled>
              <option value="">Unassigned</option>
              {myMemberRecord && <option value={myMemberId}>{user.name}</option>}
            </select>
          )}
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
