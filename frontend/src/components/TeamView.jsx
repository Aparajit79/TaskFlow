import React, { useState } from 'react';
import { Users, Plus, Trash2, FolderClosed } from 'lucide-react';
import { useTaskFlow } from '../context/TaskFlowContext';
import MemberAvatar from './MemberAvatar';
import MemberForm from './MemberForm';

export function TeamView() {
  const {
    members = [],
    activeProject = '',
    handleAddMember: onAddMember,
    handleAssignMember: onAssignMember,
    handleDeleteMember: onDeleteMember,
    projects = [],
    tasks = [],
    user
  } = useTaskFlow();

  const [viewMode, setViewMode] = useState('project'); 
  const [showAddForm, setShowAddForm] = useState(false);

  const currentProjectMembers = React.useMemo(() => {
    return members.filter((m) => Number(m.projectId) === Number(activeProject));
  }, [members, activeProject]);

  const uniqueDirectory = React.useMemo(() => {
    if (viewMode === 'project') {
      return currentProjectMembers;
    }
    // Group all membership entries by user identifier to prevent duplications
    const groups = {};
    members.forEach((m) => {
      const key = m.userId ? `id_${m.userId}` : `name_${m.name.trim().toLowerCase()}`;
      if (!groups[key]) {
        groups[key] = {
          id: m.id,
          userId: m.userId,
          name: m.name,
          role: m.role,
          avatar: m.avatar,
          projectId: m.projectId,
          projectIds: [m.projectId],
          allMemberIds: [m.id]
        };
      } else {
        groups[key].projectIds.push(m.projectId);
        groups[key].allMemberIds.push(m.id);
      }
    });
    return Object.values(groups);
  }, [viewMode, members, currentProjectMembers]);

  const isAdmin = user?.role === 'admin';

  const handleCancel = () => {
    setShowAddForm(false);
  };

  const getTaskCountForMember = (member) => {
    if (viewMode === 'project') {
      return tasks.filter((t) => Number(t.projectId) === Number(activeProject) && Number(t.assignedMemberId) === Number(member.id)).length;
    } else {
      const idsToMatch = member.allMemberIds.map(id => Number(id));
      return tasks.filter((t) => idsToMatch.includes(Number(t.assignedMemberId))).length;
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
      <div className="view-toggle-bar" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
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

        {/* Add member button (Only active in specific project mode and for Admin) */}
        {viewMode === 'project' && isAdmin && (
          <button 
            className="add-button" 
            onClick={() => setShowAddForm(true)} 
            style={{ 
              backgroundColor: 'var(--primary)', 
              color: '#ffffff', 
              padding: '8px 16px', 
              borderRadius: '20px', 
              fontWeight: '600', 
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flex: 'none'
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Add Member
          </button>
        )}
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
          {showAddForm && viewMode === 'project' && isAdmin && (
            <div className="modal-overlay" onClick={handleCancel}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <h3 style={{ marginBottom: '16px' }}>Add New Team Member to {activeProjectName}</h3>
                <MemberForm
                  projectId={activeProject}
                  onAddMember={onAddMember}
                  onAssignMember={onAssignMember}
                  onCancel={handleCancel}
                  isAdmin={isAdmin}
                />
              </div>
            </div>
          )}

          {uniqueDirectory.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <Users size={24} style={{ color: 'var(--text-light)', marginBottom: 8 }} />
              <h4>No Members Found</h4>
              <p>
                {viewMode === 'project' 
                  ? 'There are no assigned members in this project workspace.'
                  : 'No team members registered across any workspaces yet.'}
              </p>
            </div>
          ) : (
            <div className="members-view-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {uniqueDirectory.map((member) => {
                const memberTasksCount = getTaskCountForMember(member);
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
                      <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {member.projectIds.map((pid) => (
                          <span 
                            key={pid} 
                            className="workspace-cell-name" 
                            style={{ 
                              display: 'inline-block',
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--border-color)',
                              color: 'var(--text-muted)'
                            }}
                          >
                            {getWorkspaceName(pid)}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                      <span className={`member-status-badge ${isActive ? 'active' : 'away'}`}>
                        {isActive ? 'Active Tasks' : 'No Active Tasks'}
                      </span>
                    </div>

                    <div className="member-card-separator"></div>

                    <div className="member-tasks-row" style={{ marginBottom: '16px' }}>
                      <span>Active Tasks Count</span>
                      <strong style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                        {memberTasksCount}
                      </strong>
                    </div>

                    {viewMode === 'project' && isAdmin && (
                      <button
                        className="member-card-remove-btn"
                        onClick={() => onDeleteMember(member.id)}
                        title="Remove Member"
                      >
                        <Trash2 size={14} style={{ marginRight: 6 }} />
                        Remove
                      </button>
                    )}
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
