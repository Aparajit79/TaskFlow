import React, { useState } from 'react';
import MemberManager from "./MemberManager";

export function Sidebar({ 
  projects = [],
  members = [], 
  activeProject = '', 
  setActiveProject, 
  onAddProject, 
  onDeleteProject,
  onAddMember,
  onDeleteMember 
}) {
  const [newProjectText, setNewProjectText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newProjectText.trim() === '') return;
    onAddProject(newProjectText);
    setNewProjectText('');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
      <h2>TaskMatrix</h2>
      <p>Manage your workflow</p>
      </div>
      <ul className="project-list">
        {projects.map((proj) => (
          <li key={proj} className="project-item">
            <div className="project-item-container">
              <button
                className={`project-button ${activeProject === proj ? 'active' : ''}`}
                onClick={() => setActiveProject(proj)}
              >
                {proj}
              </button>
              <button
                className="project-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProject(proj);
                }}
                title="Delete Project"
              >
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="add-project">
        <form onSubmit={handleSubmit} className="add-project-form">
          <input
            type="text"
            placeholder="New project..."
            value={newProjectText}
            onChange={(e) => setNewProjectText(e.target.value)}
            className="add-project-input"
          />
          <button type="submit" className="add-project-button">
            + Add Project
          </button>
        </form>
      </div>
      <MemberManager members={members} activeProject={activeProject} onDeleteMember={onDeleteMember} onAddMember={onAddMember} />
     
    </aside>
  );
}

export default Sidebar;
