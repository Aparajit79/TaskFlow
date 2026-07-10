import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function MemberForm({ projectId, onAddMember, onAssignMember, onCancel, isAdmin }) {
  const [addMode, setAddMode] = useState('create'); // 'create' or 'assign'
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('Frontend Developer');

  useEffect(() => {
    if (projectId && isAdmin && addMode === 'assign') {
      fetch(`${API_URL}/users/available?projectId=${projectId}`, { credentials: 'include' })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load users');
          return res.json();
        })
        .then((data) => {
          setAvailableUsers(data);
          if (data.length > 0) {
            setSelectedUserId(data[0].id);
          } else {
            setSelectedUserId('');
          }
        })
        .catch((err) => console.error(err));
    }
  }, [projectId, isAdmin, addMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (addMode === 'assign') {
      if (!selectedUserId) return;
      onAssignMember(Number(selectedUserId), memberRole);
    } else {
      if (!memberName.trim()) return;
      onAddMember(memberName.trim(), memberRole);
    }
    setSelectedUserId('');
    setMemberName('');
    setMemberRole('Frontend Developer');
  };

  return (
    <div className="inline-add-form-container" style={{ width: '100%' }}>
      <div className="login-tabs" style={{ marginBottom: '12px', padding: '2px' }}>
        <button
          type="button"
          className={`login-tab-btn ${addMode === 'create' ? 'active' : ''}`}
          onClick={() => setAddMode('create')}
          style={{ padding: '6px' }}
        >
          Invite New Name
        </button>
        <button
          type="button"
          className={`login-tab-btn ${addMode === 'assign' ? 'active' : ''}`}
          onClick={() => setAddMode('assign')}
          style={{ padding: '6px' }}
        >
          Assign Existing
        </button>
      </div>

      <form className="inline-add-form" onSubmit={handleSubmit}>
        {addMode === 'assign' ? (
          <div>
            <label className="inline-input-label" style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-light)', marginBottom: '4px', display: 'block' }}>
              Select User Account
            </label>
            {availableUsers.length === 0 ? (
              <div className="inline-field-info" style={{ marginBottom: '10px' }}>
                <Info size={14} strokeWidth={2} />
                <p className="inline-field-info-text">No unregistered users available</p>
              </div>
            ) : (
              <select
                className="select-input inline-member-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{ marginBottom: '10px', width: '100%' }}
                required
              >
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.username})
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <div>
            <label className="inline-input-label" style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-light)', marginBottom: '4px', display: 'block' }}>
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Alice Cooper"
              className="task-input"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              style={{ marginBottom: '10px', width: '100%', height: '34px' }}
              required
              autoFocus
            />
          </div>
        )}

        <label className="inline-input-label" style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-light)', marginBottom: '4px', display: 'block' }}>
          Professional Role
        </label>
        <select
          className="select-input inline-member-select"
          value={memberRole}
          onChange={(e) => setMemberRole(e.target.value)}
          style={{ width: '100%', marginBottom: '12px' }}
        >
          <option>Frontend Developer</option>
          <option>Backend Developer</option>
          <option>Full Stack Developer</option>
          <option>UI/UX Designer</option>
          <option>QA Tester</option>
          <option>Project Manager</option>
          <option>DevOps Engineer</option>
        </select>

        <div className="inline-add-actions">
          <button type="submit" className="inline-add-btn" disabled={addMode === 'assign' && availableUsers.length === 0}>
            Add
          </button>
          <button type="button" className="inline-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default MemberForm;
