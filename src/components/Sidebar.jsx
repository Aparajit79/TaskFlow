import React, { useState } from 'react';

// Sidebar component: Handles listing projects and adding new projects
export function Sidebar({ 
  projects, 
  activeProject, 
  setActiveProject, 
  onAddProject 
}) {
  const [newProjectText, setNewProjectText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newProjectText.trim() === '') return;
    
    onAddProject(newProjectText.trim());
    setNewProjectText('');
  };

  return (
    <aside className="sidebar">
      <h2>Projects 📂</h2>
      
      {/* List of projects */}
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

      {/* Form to add a new project */}
      <form onSubmit={handleSubmit} style={{ marginTop: '30px' }}>
        <input
          type="text"
          placeholder="New project..."
          value={newProjectText}
          onChange={(e) => setNewProjectText(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: 'none',
            marginBottom: '8px',
            fontSize: '14px'
          }}
        />
        <button 
          type="submit" 
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          + Add Project
        </button>
      </form>
    </aside>
  );
}

export default Sidebar;
