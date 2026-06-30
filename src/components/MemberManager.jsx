import { useState } from "react";
import { useMembers } from "../hooks/useTaskFlow";

function MemberManager() { 
  const {
    members = [],
    activeProject = '',
    handleAddMember: onAddMember,
    handleDeleteMember: onDeleteMember
  } = useMembers(); 

  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("Frontend Developer");

  const handleSubmit = (e) => {
     e.preventDefault();
   
     if (!memberName.trim()) {
       alert("Member name is required");
       return;
     }
   
     onAddMember(memberName.trim(), memberRole);

    setMemberName("");
    setMemberRole("Frontend Developer");
   };

  return (
    <div className="member-manager">

      <h3>Project Members</h3>

      <form className="member-form" onSubmit={handleSubmit}>

        <input
          type="text"
          placeholder="Member Name"
          className="task-input"
          value={memberName}
          onChange={(e) => setMemberName(e.target.value)}
        />

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

        <button className="add-button">
          Add Member
        </button>

      </form>
      <div className="member-list">

       {members
         .filter(member => member.project === activeProject)
         .map(member => (

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
      

    ))}

</div>

    </div>
  );
}

export default MemberManager;