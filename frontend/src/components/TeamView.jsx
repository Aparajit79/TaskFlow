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
      <div className="view-header team-view-header">
        <div>
          <h1>Team</h1>
          <p className="view-subtitle team-view-subtitle">
            Manage your team members, roles, and project assignments.
          </p>
        </div>
      </div>

      {/* View Toggle Bar */}
      <div className="view-toggle-bar team-view-toggle-bar">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`team-toggle-btn ${viewMode === 'project' ? 'active' : 'inactive'}`}
            onClick={() => setViewMode('project')}
          >
            Workspace Members
          </button>
          <button 
            className={`team-toggle-btn ${viewMode === 'overall' ? 'active' : 'inactive'}`}
            onClick={() => setViewMode('overall')}
          >
            Overall Directory (All Workspaces)
          </button>
        </div>

        {/* Add member button (Only active in specific project mode and for Admin) */}
        {viewMode === 'project' && isAdmin && (
          <button 
            className="add-button team-add-btn-override" 
            onClick={() => setShowAddForm(true)} 
          >
            <Plus size={14} strokeWidth={2.5} />
            Add Member
          </button>
        )}
      </div>

      {/* Context-aware rendering based on active viewMode */}
      {viewMode === 'project' && !activeProject ? (
        <div className="empty-state team-empty-state-box">
          <FolderClosed size={32} className="team-empty-icon" />
          <h3>No Active Project Selected</h3>
          <p>Please select a project in the sidebar, or switch to the **Overall Directory** above.</p>
        </div>
      ) : (
        <>
          {showAddForm && viewMode === 'project' && isAdmin && (
            <div className="modal-overlay" onClick={handleCancel}>
              <div className="modal-content team-modal-override" onClick={(e) => e.stopPropagation()}>
                <h3 className="team-modal-title">Add New Team Member to {activeProjectName}</h3>
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
            <div className="empty-state team-empty-state-box">
              <Users size={24} className="team-empty-icon" />
              <h4>No Members Found</h4>
              <p>
                {viewMode === 'project' 
                  ? 'There are no assigned members in this project workspace.'
                  : 'No team members registered across any workspaces yet.'}
              </p>
            </div>
          ) : (
            <div className="members-view-grid team-members-grid">
              {uniqueDirectory.map((member) => {
                const memberTasksCount = getTaskCountForMember(member);
                const isActive = memberTasksCount > 0;
                
                return (
                  <div className="member-view-card" key={member.id}>
                    <div className="team-card-badge-container">
                      <MemberAvatar name={member.name} role={member.role} size={56} iconSize={24} />
                    </div>
                    
                    <div className="member-view-card-body">
                      <h4 className="team-card-title">
                        {member.name}
                      </h4>
                      <span className="team-card-role">
                        {member.role}
                      </span>
                    </div>

                    {viewMode === 'overall' && (
                      <div className="team-card-projects-row">
                        {member.projectIds.map((pid) => (
                          <span 
                            key={pid} 
                            className="workspace-cell-name team-card-project-badge" 
                          >
                            {getWorkspaceName(pid)}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="team-card-badge-container">
                      <span className={`member-status-badge ${isActive ? 'active' : 'away'}`}>
                        {isActive ? 'Active Tasks' : 'No Active Tasks'}
                      </span>
                    </div>

                    <div className="member-card-separator"></div>

                    <div className="member-tasks-row team-card-tasks-row">
                      <span>Active Tasks Count</span>
                      <strong className="team-card-tasks-count">
                        {memberTasksCount}
                      </strong>
                    </div>

                    {viewMode === 'project' && isAdmin && (
                      <button
                        className="member-card-remove-btn"
                        onClick={() => onDeleteMember(member.id)}
                        title="Remove Member"
                      >
                        <Trash2 size={14} className="team-card-trash-icon" />
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
