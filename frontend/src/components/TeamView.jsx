import React, { useState } from 'react';
import { Users, Plus, Trash2, FolderClosed } from 'lucide-react';
import { useTaskFlow } from '../context/TaskFlowContext';
import MemberAvatar from './MemberAvatar';

export function TeamView() {
  const {
    members = [],
    activeProject = '',
    handleAddMember: onAddMember,
    handleDeleteMember: onDeleteMember,
    projects = [],
    tasks = []
  } = useTaskFlow();

  const [viewMode, setViewMode] = useState('project'); 
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('Frontend Developer');
  const [nameError, setNameError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState(false);

  const currentProjectMembers = members.filter((m) => Number(m.projectId) === Number(activeProject));

  const displayedMembers = viewMode === 'project' ? currentProjectMembers : members;

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

  const getTaskCountForMember = (memberId, memberProjectId) => {
    if (viewMode === 'project') {
      return tasks.filter((t) => Number(t.projectId) === Number(activeProject) && Number(t.assignedMemberId) === Number(memberId)).length;
    } else {
      return tasks.filter((t) => Number(t.projectId) === Number(memberProjectId) && Number(t.assignedMemberId) === Number(memberId)).length;
    }
  };

  const getWorkspaceName = (projId) => {
    const proj = projects.find(p => Number(p.id) === Number(projId));
    return proj ? proj.name : 'Unknown Workspace';
  };

  const activeProjObj = projects.find(p => Number(p.id) === Number(activeProject));
  const activeProjectName = activeProjObj ? activeProjObj.name : '';

  return (
    <div className="view-container">
      {/* Title & Subtitle */}
      <div className="view-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '6px' }}>Team</h1>
          <p className="view-subtitle" style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Manage your team members, roles, and project assignments.
          </p>
        </div>
      </div>

      {/* View Toggle Bar */}
      <div className="view-toggle-bar" style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button 
          className={`tabmatrix-toggle-btn ${viewMode === 'project' ? 'active' : ''}`}
          onClick={() => setViewMode('project')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            border: '1px solid var(--border-color)',
            backgroundColor: viewMode === 'project' ? 'var(--primary)' : 'var(--bg-card)',
            color: viewMode === 'project' ? '#ffffff' : 'var(--text-main)',
            transition: 'all 0.2s ease'
          }}
        >
          Workspace Members
        </button>
        <button 
          className={`tabmatrix-toggle-btn ${viewMode === 'overall' ? 'active' : ''}`}
          onClick={() => setViewMode('overall')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            border: '1px solid var(--border-color)',
            backgroundColor: viewMode === 'overall' ? 'var(--primary)' : 'var(--bg-card)',
            color: viewMode === 'overall' ? '#ffffff' : 'var(--text-main)',
            transition: 'all 0.2s ease'
          }}
        >
          Overall Directory (All Workspaces)
        </button>
      </div>

      {/* Context-aware rendering based on active viewMode */}
      {viewMode === 'project' && !activeProject ? (
        <div className="empty-state" style={{ padding: '40px 0' }}>
          <FolderClosed size={32} style={{ color: 'var(--text-light)', marginBottom: 8 }} />
          <h3>No Active Project Selected</h3>
          <p>Please select a project in the sidebar, or switch to the **Overall Directory** above.</p>
        </div>
      ) : (
        <>
          {/* Add member button (Only active in specific project mode) */}
          {viewMode === 'project' && (
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
          )}

          {showAddForm && viewMode === 'project' && (
            <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <h3>Add New Team Member to {activeProjectName}</h3>
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

          {displayedMembers.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <Users size={24} style={{ color: 'var(--text-light)', marginBottom: 8 }} />
              <h4>No Members Found</h4>
              <p>
                {viewMode === 'project' 
                  ? 'Click "+ Add Member" to add team members to this project.'
                  : 'No team members registered across any workspaces yet.'}
              </p>
            </div>
          ) : (
            <div className="members-view-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {displayedMembers.map((member) => {
                const memberTasksCount = getTaskCountForMember(member.id, member.projectId);
                const isActive = memberTasksCount > 0;
                
                return (
                  <div className="member-view-card" key={member.id}>
                    <div style={{ marginBottom: '16px' }}>
                      <MemberAvatar name={member.name} role={member.role} size={56} iconSize={24} />
                    </div>
                    
                    <div className="member-view-card-body" style={{ margin: 0, padding: 0 }}>
                      <h4 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                        {member.name}
                      </h4>
                      <span className="member-view-role-tag" style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                        {member.role}
                      </span>
                    </div>

                    {viewMode === 'overall' && (
                      <div style={{ marginBottom: '12px' }}>
                        <span className="workspace-cell-name" style={{ display: 'inline-block' }}>
                          {getWorkspaceName(member.projectId)}
                        </span>
                      </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                      <span className={`member-status-badge ${isActive ? 'active' : 'away'}`}>
                        {isActive ? 'Assigned' : 'Unassigned'}
                      </span>
                    </div>

                    <div className="member-card-separator"></div>

                    <div className="member-tasks-row" style={{ marginBottom: '16px' }}>
                      <span>Active Tasks</span>
                      <strong style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                        {memberTasksCount}
                      </strong>
                    </div>

                    <button
                      className="member-card-remove-btn"
                      onClick={() => onDeleteMember(member.id)}
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
        </>
      )}
    </div>
  );
}

export default TeamView;
