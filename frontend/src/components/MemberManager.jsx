import React, { useState } from "react";
import { Users, Plus, Trash2, ClipboardList } from 'lucide-react';
import { useTasks, useMembers, useTaskFlow } from "../context/TaskFlowContext";
import MemberAvatar from "./MemberAvatar";
import MemberForm from "./MemberForm";

function MemberManager({ isCollapsed, setIsCollapsed }) {
  const {
    members = [],
    activeProject = '',
    handleAddMember: onAddMember,
    handleAssignMember: onAssignMember,
    handleDeleteMember: onDeleteMember
  } = useMembers();

  const { user } = useTaskFlow();

  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);

  const currentProjectMembers = members.filter(m => Number(m.projectId) === Number(activeProject));
  const totalMembers = currentProjectMembers.length;
  const { filteredTasks } = useTasks();
  const totalTasks = filteredTasks.length;

  const isAdmin = user?.role === 'admin';

  if (!activeProject) return null;

  if (isCollapsed) {
    return (
      <div className="collapsed-members-container">
        <div className="avatar-stack">
          {currentProjectMembers.map((member) => (
            <MemberAvatar
              key={member.id}
              name={member.name}
              role={member.role}
              size={28}
              iconSize={13}
              className="avatar-stack-item"
              title={`${member.name} (${member.role})`}
              onClick={() => setIsCollapsed(false)}
            />
          ))}
        </div>
        {isAdmin && (
          <button className="collapsed-add-member-btn" onClick={() => setIsCollapsed(false)} title="Add Member">
            <Plus size={14} strokeWidth={2} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="sidebar-section-card">
      <div className="sidebar-section-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="section-title">
          <span className={`section-chevron ${isExpanded ? 'expanded' : ''}`}>▶</span>
          Team Members
        </span>
        {isAdmin && (
          <button
            className="section-action-btn"
            onClick={(e) => { e.stopPropagation(); setShowAddMember(!showAddMember); if (!isExpanded) setIsExpanded(true); }}
            title="Add Member"
          >
            <Plus size={13} strokeWidth={2} />
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="sidebar-section-content">
          {showAddMember && isAdmin && (
            <MemberForm
              projectId={activeProject}
              onAddMember={onAddMember}
              onAssignMember={onAssignMember}
              onCancel={() => setShowAddMember(false)}
              isAdmin={isAdmin}
            />
          )}

          <div className="member-list">
            {currentProjectMembers.length === 0 ? (
              <p className="empty-section-message">No members assigned</p>
            ) : (
              currentProjectMembers.map((member) => (
                <div className="member-card" key={member.id}>
                  <MemberAvatar name={member.name} role={member.role} size={30} iconSize={13} />
                  <div className="member-info">
                    <strong>{member.name}</strong>
                    <small>{member.role}</small>
                  </div>
                  {isAdmin && (
                    <button className="member-delete-btn" onClick={() => onDeleteMember(member.id)} title="Remove Member">
                      <Trash2 size={12} strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="member-summary">
            <div className="summary-chip">
              <Users size={11} strokeWidth={1.75} />
              <span>{totalMembers}</span>
              <small>Members</small>
            </div>
            <div className="summary-chip">
              <ClipboardList size={11} strokeWidth={1.75} />
              <span>{totalTasks}</span>
              <small>Tasks</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberManager;
