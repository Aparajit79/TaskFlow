import React, { useState } from 'react';
import MemberManager from "./MemberManager";
import { useTasks } from "../context/TaskFlowContext";

export function Sidebar() {
  const {
    projects = [],
    activeProject = '',
    setActiveProject,
    handleAddProject: onAddProject,
    handleDeleteProject: onDeleteProject,
    activeView = 'Home',
    setActiveView
  } = useTasks();

  const [newProjectText, setNewProjectText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('taskflow_sidebar_collapsed') === 'true';
  });

  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('taskflow_sidebar_collapsed', next);
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newProjectText.trim() === '') return;
    onAddProject(newProjectText);
    setNewProjectText('');
    setShowAddProject(false);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {isCollapsed ? (
          <div 
            className="logo-compact" 
            onClick={toggleSidebar} 
            title="Expand Sidebar"
          >
            ⚡
          </div>
        ) : (
          <div className="sidebar-title-container">
            <h2>⚡ TaskMatrix</h2>
            <button 
              className="sidebar-toggle-btn" 
              onClick={toggleSidebar} 
              title="Collapse Sidebar"
            >
              ◀
            </button>
          </div>
        )}
        {!isCollapsed && <p>Manage your workflow</p>}
      </div>

      {isCollapsed ? (
        <div className="collapsed-sidebar-items">
          <button 
            className={`project-avatar-collapsed ${activeView === 'Home' ? 'active' : ''}`}
            onClick={() => setActiveView('Home')}
            title="Home Hub"
          >
            🏠
          </button>
          
          <hr className="collapsed-divider" />

          <ul className="project-list">
            {projects.map((proj) => (
              <li key={proj} className="project-item">
                <button
                  className={`project-avatar-collapsed ${activeProject === proj && activeView === 'Project' ? 'active' : ''}`}
                  onClick={() => setActiveProject(proj)}
                  title={proj}
                >
                  {getInitials(proj)}
                </button>
              </li>
            ))}
            <li className="project-item">
              <button 
                className="add-project-collapsed-btn" 
                onClick={() => setIsCollapsed(false)} 
                title="Add Project"
              >
                +
              </button>
            </li>
          </ul>

          <hr className="collapsed-divider" />

          <button 
            className={`project-avatar-collapsed ${activeView === 'Dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('Dashboard')}
            title="Dashboard"
          >
            📊
          </button>

          <button 
            className={`project-avatar-collapsed ${activeView === 'Settings' ? 'active' : ''}`}
            onClick={() => setActiveView('Settings')}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      ) : (
        <div className="sidebar-expanded-content">
          <div className="sidebar-nav-links">
            <button 
              className={`nav-link-btn ${activeView === 'Home' ? 'active' : ''}`}
              onClick={() => setActiveView('Home')}
            >
              <span className="nav-icon">🏠</span> Home Hub
            </button>
          </div>

          <div className="sidebar-accordions-container">
            {/* Projects Accordion Section */}
            <div className="sidebar-section-card">
              <div 
                className="sidebar-section-header" 
                onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
              >
                <span className="section-title">
                  <span className={`section-chevron ${isProjectsExpanded ? 'expanded' : ''}`}>
                    ▶
                  </span>
                  📁 Projects
                </span>
                <button 
                  className="section-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddProject(!showAddProject);
                    if (!isProjectsExpanded) setIsProjectsExpanded(true);
                  }}
                  title="Add Project"
                >
                  +
                </button>
              </div>

              {isProjectsExpanded && (
                <div className="sidebar-section-content">
                  {showAddProject && (
                    <div className="inline-add-form-container">
                      <form onSubmit={handleSubmit} className="inline-add-form">
                        <input
                          type="text"
                          placeholder="Project name..."
                          value={newProjectText}
                          onChange={(e) => setNewProjectText(e.target.value)}
                          className="add-project-input"
                          autoFocus
                        />
                        <div className="inline-add-actions">
                          <button type="submit" className="inline-add-btn">Add</button>
                          <button 
                            type="button" 
                            className="inline-cancel-btn" 
                            onClick={() => setShowAddProject(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                  
                  <ul className="project-list">
                    {projects.map((proj) => (
                      <li key={proj} className="project-item">
                        <div className="project-item-container">
                          <button
                            className={`project-button ${activeProject === proj && activeView === 'Project' ? 'active' : ''}`}
                            onClick={() => setActiveProject(proj)}
                          >
                            📄 {proj}
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
                </div>
              )}
            </div>
            
            {/* Members Accordion Section - only render when a project is active */}
            {activeView === 'Project' && activeProject && (
              <MemberManager isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            )}
          </div>

          <div className="sidebar-nav-links-bottom">
            <button 
              className={`nav-link-btn ${activeView === 'Dashboard' ? 'active' : ''}`}
              onClick={() => setActiveView('Dashboard')}
            >
              <span className="nav-icon">📊</span> Dashboard
            </button>
            
            <button 
              className={`nav-link-btn ${activeView === 'Settings' ? 'active' : ''}`}
              onClick={() => setActiveView('Settings')}
            >
              <span className="nav-icon">⚙️</span> Settings
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
