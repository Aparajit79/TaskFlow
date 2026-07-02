import { useState } from "react";
import { useTasks, useMembers } from "../context/TaskFlowContext";

function MemberManager({ isCollapsed, setIsCollapsed }) { 
  const {
    members = [],
    activeProject = '',
    handleAddMember: onAddMember,
    handleDeleteMember: onDeleteMember
  } = useMembers(); 

  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("Frontend Developer");
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);

  const currentProjectMembers = members.filter(
    (member) => member.project === activeProject
  );
  
  const totalMembers = currentProjectMembers.length;
  const { filteredTasks } = useTasks();
  const totalTasks = filteredTasks.length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!memberName.trim()) {
      alert("Member name is required");
      return;
    }
    onAddMember(memberName.trim(), memberRole);
    setMemberName("");
    setMemberRole("Frontend Developer");
    setShowAddMember(false);
  };

  if (!activeProject) {
    return null;
  }

  if (isCollapsed) {
    return (
      <div className="collapsed-members-container">
        <div className="avatar-stack">
          {currentProjectMembers.map((member) => (
            <div 
              key={member.id} 
              className="avatar-stack-item member-avatar" 
              title={`${member.name} (${member.role})`}
              onClick={() => setIsCollapsed(false)}
            >
              {member.avatar}
            </div>
          ))}
        </div>
        <button 
          className="collapsed-add-member-btn" 
          onClick={() => setIsCollapsed(false)} 
          title="Add Member"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="sidebar-section-card">
      <div 
        className="sidebar-section-header" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="section-title">
          <span className={`section-chevron ${isExpanded ? 'expanded' : ''}`}>
            ▶
          </span>
          👥 Team Members
        </span>
        <button 
          className="section-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowAddMember(!showAddMember);
            if (!isExpanded) setIsExpanded(true);
          }}
          title="Add Member"
        >
          +
        </button>
      </div>

      {isExpanded && (
        <div className="sidebar-section-content">
          {showAddMember && (
            <div className="inline-add-form-container">
              <form className="inline-add-form" onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Member Name..."
                  className="add-project-input"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  autoFocus
                />
                
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
                  <button 
                    type="button" 
                    className="inline-cancel-btn" 
                    onClick={() => setShowAddMember(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="member-list">
            {currentProjectMembers.length === 0 ? (
              <p className="empty-section-message">
                No members assigned
              </p>
            ) : (
              currentProjectMembers.map(member => (
                <div className="member-card" key={member.id}>
                  <div className="member-avatar">
                    {member.avatar}
                  </div>
       
                  <div className="member-info">
                    <strong>{member.name}</strong>
                    <small>{member.role}</small>
                  </div>
                  
                  <button
                    className="member-delete-btn"
                    onClick={() => onDeleteMember(member.id)}
                    title="Remove Member"
                  >  
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="member-summary">
            <div className="summary-chip">
              <span>👥</span>
              <span>{totalMembers}</span>
              <small>Members</small>
            </div>

            <div className="summary-chip">
              <span>📋</span>
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