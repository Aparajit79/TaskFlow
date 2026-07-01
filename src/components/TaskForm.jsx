import React, { useState, useEffect } from 'react';

export function TaskForm({ activeProject, members, onSubmit, editingTask, onCancelEdit }) {
  const [inputText, setInputText] = useState('');
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending');
  const [dueDate, setDueDate] = useState("");
  const [assignedMember, setAssignedMember] = useState("");

  // Sync state with editingTask if present
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
  }, [editingTask]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) {
      alert("Title is required");
      return;
    }
    onSubmit(inputText.trim(), description.trim(), priority, status, dueDate, assignedMember);
    
    // Reset form only if not editing (if editing, parent will reset editingTask and this useEffect will handle resetting)
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
      <div className="task-form-selection" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px' }}>
        <div>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>No Active Project</h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)' }}>
            Create or select a project in the sidebar to start adding tasks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`task-form-selection ${editingTask ? 'is-editing' : ''}`}>
      <h3>{editingTask ? '✏️ Edit Task' : `➕ Add Task to ${activeProject}`}</h3>
      <form onSubmit={handleSubmit} className="task-form">
        <div>
          <label>Task Title</label>
          <input
            type="text"
            placeholder={editingTask ? "Edit task title..." : `Add task to ${activeProject}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="task-input"
            required
          />
        </div>
        
        <div>
          <label>Description</label>
          <textarea 
            placeholder="Task Description"
            className="task-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label>Priority</label>
            <select 
              className="select-input"
              style={{ width: '100%' }}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          
          <div style={{ flex: 1 }}>
            <label>Status</label>
            <select 
              className="select-input"
              style={{ width: '100%' }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
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
            className="task-input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div>
          <label>Assignee</label>
          <select
            className="select-input"
            style={{ width: '100%' }}
            value={assignedMember}
            onChange={(e) => setAssignedMember(e.target.value)}
          >
            <option value="">Assign To</option>
            {members
              .filter(member => member.project === activeProject)
              .map(member => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))
            }
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="add-button">
            {editingTask ? 'Save Changes' : 'Add Task'}
          </button>
          {editingTask && (
            <button type="button" className="cancel-button" onClick={onCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default React.memo(TaskForm);
