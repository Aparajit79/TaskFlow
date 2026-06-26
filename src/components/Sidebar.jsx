import React, { useState } from 'react';

export function Sidebar({ projects, activeProject, setActiveProject, onAddProject }) {
  const [newProjectText, setNewProjectText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newProjectText.trim() === '') return;
    onAddProject(newProjectText);
    setNewProjectText('');
  };

  return (
    <aside className="sidebar">
      <h2>Projects 📂</h2>
      <ul className="project-list">
        {projects.map((proj) => (
          <li key={proj} className="project-item">
            <button
              className={`project-button ${activeProject === proj ? 'active' : ''}`}
              onClick={() => setActiveProject(proj)}
            >
              {proj}
            </button>
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
    </aside>
  );
}

export default Sidebar;
