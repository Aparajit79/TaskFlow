import { useState } from "react";
import { Users, Plus, Trash2, ClipboardList } from 'lucide-react';
import { useTasks, useMembers } from "../context/TaskFlowContext";
import MemberAvatar from "./MemberAvatar";

function MemberManager({ isCollapsed, setIsCollapsed }) {
  const {
    members = [],
    activeProject = '',
    handleAddMember: onAddMember,
    handleDeleteMember: onDeleteMember
  } = useMembers();

  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("Frontend Developer");
  const [nameError, setNameError] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);

  const currentProjectMembers = members.filter(m => m.project === activeProject);
  const totalMembers = currentProjectMembers.length;
  const { filteredTasks } = useTasks();
  const totalTasks = filteredTasks.length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!memberName.trim()) { setNameError("Member name is required"); return; }
    setNameError("");
    onAddMember(memberName.trim(), memberRole);
    setMemberName("");
    setMemberRole("Frontend Developer");
    setShowAddMember(false);
  };

  const handleNameChange = (e) => {
    setMemberName(e.target.value);
    if (nameError) setNameError("");
  };

  const handleCancel = () => {
    setShowAddMember(false);
    setMemberName("");
    setMemberRole("Frontend Developer");
    setNameError("");
  };

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
        <button className="collapsed-add-member-btn" onClick={() => setIsCollapsed(false)} title="Add Member">
          <Plus size={14} strokeWidth={2} />
        </button>
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
        <button
          className="section-action-btn"
          onClick={(e) => { e.stopPropagation(); setShowAddMember(!showAddMember); if (!isExpanded) setIsExpanded(true); }}
          title="Add Member"
        >
          <Plus size={13} strokeWidth={2} />
        </button>
      </div>

      {isExpanded && (
        <div className="sidebar-section-content">
          {showAddMember && (
            <div className="inline-add-form-container">
              <form className="inline-add-form" onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Member name..."
                  className={`add-project-input ${nameError ? 'input-error' : ''}`}
                  value={memberName}
                  onChange={handleNameChange}
                  autoFocus
                />
                {nameError && <p className="inline-field-error">{nameError}</p>}
                <select
                  className="select-input inline-member-select"
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
                <div className="inline-add-actions">
                  <button type="submit" className="inline-add-btn">Add</button>
                  <button type="button" className="inline-cancel-btn" onClick={handleCancel}>Cancel</button>
                </div>
              </form>
            </div>
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
                  <button className="member-delete-btn" onClick={() => onDeleteMember(member.id)} title="Remove Member">
                    <Trash2 size={12} strokeWidth={1.75} />
                  </button>
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
