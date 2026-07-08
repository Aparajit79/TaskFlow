import React, { useState } from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';
import { useMembers } from '../context/TaskFlowContext';
import MemberAvatar from './MemberAvatar';

export function TeamView() {
  const {
    members = [],
    activeProject = '',
    handleAddMember: onAddMember,
    handleDeleteMember: onDeleteMember,
    filteredTasks = []
  } = useMembers();

  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('Frontend Developer');
  const [nameError, setNameError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState(false);

  // Filter members belonging to the active project
  const currentProjectMembers = members.filter((m) => Number(m.projectId) === Number(activeProject));
  const currentProjectTasks = filteredTasks;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!memberName.trim()) {
      setNameError('Name is required');
      return;
    }
    setNameError('');

    const trimmedName = memberName.trim();
    const isDuplicate = members.some(
      (m) =>
        Number(m.projectId) === Number(activeProject) &&
        m.name.toLowerCase() === trimmedName.toLowerCase() &&
        m.role === memberRole
    );

    if (isDuplicate) {
      setDuplicateAlert(true);
      return;
    }

    setDuplicateAlert(false);
    onAddMember(trimmedName, memberRole);
    setMemberName('');
    setMemberRole('Frontend Developer');
    setShowAddForm(false);
  };

  const handleNameChange = (e) => {
    setMemberName(e.target.value);
    if (nameError) setNameError('');
    if (duplicateAlert) setDuplicateAlert(false);
  };

  if (!activeProject) {
    return (
      <div className="view-container empty-state-container">
        <div className="empty-state">
          <div className="empty-state-icon">
            <Users size={32} strokeWidth={1.5} />
          </div>
          <h3>No Active Project</h3>
          <p>Please select a project from the dashboard or sidebar to manage its team members.</p>
        </div>
      </div>
    );
  }

  const getTaskCountForMember = (memberId) => {
    return currentProjectTasks.filter((t) => Number(t.assignedMemberId) === Number(memberId)).length;
  };

  return (
    <div className="view-container">
      <div className="view-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '6px' }}>Team</h1>
          <p className="view-subtitle" style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Manage your team members and their roles.
          </p>
        </div>
      </div>

      <button 
        className="add-button" 
        onClick={() => setShowAddForm(true)} 
        style={{ 
          maxWidth: '160px', 
          backgroundColor: 'var(--primary)', 
          color: '#ffffff', 
          padding: '10px 16px', 
          borderRadius: '20px', 
          fontWeight: '600', 
          fontSize: '14px',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '32px'
        }}
      >
        <Plus size={16} strokeWidth={2.5} />
        Add Member
      </button>

      {/* Add Member Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <h3>Add New Team Member</h3>
            <form onSubmit={handleSubmit} className="task-form" style={{ marginTop: '16px' }}>
              <div>
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className={`task-input ${nameError ? 'input-field-error' : ''}`}
                  value={memberName}
                  onChange={handleNameChange}
                  autoFocus
                />
                {nameError && <p className="form-field-error">{nameError}</p>}
                {duplicateAlert && (
                  <p className="form-field-error">This member is already registered in this project.</p>
                )}
              </div>

              <div>
                <label>Role</label>
                <select
                  className="select-input"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                >
                  <option>Frontend Developer</option>
                  <option>Backend Developer</option>
                  <option>Full Stack Developer</option>
                  <option>UI/UX Designer</option>
                  <option>QA Tester</option>
                  <option>Project Manager</option>
                  <option>DevOps Engineer</option>
                </select>
              </div>

              <div className="form-actions" style={{ marginTop: '16px' }}>
                <button type="submit" className="add-button">Add Member</button>
                <button type="button" className="cancel-button" onClick={() => setShowAddForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Grid Layout */}
      {currentProjectMembers.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 0' }}>
          <Users size={24} style={{ color: 'var(--text-light)', marginBottom: 8 }} />
          <h4>No Members Yet</h4>
          <p>Click "+ Add Member" to add team members to this project.</p>
        </div>
      ) : (
        <div className="members-view-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {currentProjectMembers.map((member) => {
            const memberTasksCount = getTaskCountForMember(member.id);
            const isActive = memberTasksCount > 0;
            
            return (
              <div className="member-view-card" key={member.id}>
                {/* Avatar Icon */}
                <div style={{ marginBottom: '16px' }}>
                  <MemberAvatar name={member.name} role={member.role} size={56} iconSize={24} />
                </div>
                
                {/* Title & Role Info */}
                <div className="member-view-card-body" style={{ margin: 0, padding: 0 }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                    {member.name}
                  </h4>
                  <span className="member-view-role-tag" style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'block', marginBottom: '12px' }}>
                    {member.role}
                  </span>
                </div>

                {/* Status Badge */}
                <div style={{ marginBottom: '16px' }}>
                  <span className={`member-status-badge ${isActive ? 'active' : 'away'}`}>
                    {isActive ? 'Assigned' : 'Unassigned'}
                  </span>
                </div>

                {/* Separator Line */}
                <div className="member-card-separator"></div>

                {/* Active Tasks Row */}
                <div className="member-tasks-row">
                  <span>Active Tasks</span>
                  <strong style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                    {memberTasksCount}
                  </strong>
                </div>

                {/* Remove Button */}
                <button
                  className="member-card-remove-btn"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to remove ${member.name} from this project?`)) {
                      onDeleteMember(member.id);
                    }
                  }}
                  title="Remove Member"
                >
                  <Trash2 size={14} style={{ marginRight: 6 }} />
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TeamView;
