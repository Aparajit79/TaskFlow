import React, { useState } from 'react';
import {
  Zap, House, FolderOpen, FileText, LayoutDashboard,
  Settings, Trash2, Plus, PanelLeftClose, PanelLeftOpen, Users
} from 'lucide-react';
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

  if (isCollapsed) {
    return (
      <aside className="sidebar collapsed">
        <div className="sidebar-header">
          <div className="logo-compact" onClick={toggleSidebar} title="Expand Sidebar">
            <Zap size={20} strokeWidth={2.5} />
          </div>
        </div>

        <div className="collapsed-sidebar-items">
          <button
            className={`project-avatar-collapsed ${activeView === 'Home' ? 'active' : ''}`}
            onClick={() => setActiveView('Home')}
            title="Home"
          >
            <House size={16} strokeWidth={1.75} />
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
                <Plus size={16} strokeWidth={2} />
              </button>
            </li>
          </ul>

          <hr className="collapsed-divider" />

          <button
            className={`project-avatar-collapsed ${activeView === 'Dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('Dashboard')}
            title="Dashboard"
          >
            <LayoutDashboard size={16} strokeWidth={1.75} />
          </button>

          <button
            className={`project-avatar-collapsed ${activeView === 'Settings' ? 'active' : ''}`}
            onClick={() => setActiveView('Settings')}
            title="Settings"
          >
            <Settings size={16} strokeWidth={1.75} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title-container">
          <h2>
            <Zap size={18} strokeWidth={2.5} style={{ flexShrink: 0 }} />
            TaskMatrix
          </h2>
          <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="Collapse Sidebar">
            <PanelLeftClose size={14} strokeWidth={1.75} />
          </button>
        </div>
        <p>Manage your workflow</p>
      </div>

      <div className="sidebar-expanded-content">
        <nav className="sidebar-nav-links">
          <button
            className={`nav-link-btn ${activeView === 'Home' ? 'active' : ''}`}
            onClick={() => setActiveView('Home')}
          >
            <House size={15} strokeWidth={1.75} className="nav-icon" />
            Home
          </button>
        </nav>

        <div className="sidebar-accordions-container">

          <div className="sidebar-section-card">
            <div
              className="sidebar-section-header"
              onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
            >
              <span className="section-title">
                <span className={`section-chevron ${isProjectsExpanded ? 'expanded' : ''}`}>▶</span>
                Projects
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
                <Plus size={13} strokeWidth={2} />
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
                        <button type="button" className="inline-cancel-btn" onClick={() => setShowAddProject(false)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {projects.length === 0 && !showAddProject && (
                  <p className="empty-section-message">No projects yet</p>
                )}

                <ul className="project-list">
                  {projects.map((proj) => (
                    <li key={proj} className="project-item">
                      <div className="project-item-container">
                        <button
                          className={`project-button ${activeProject === proj && activeView === 'Project' ? 'active' : ''}`}
                          onClick={() => setActiveProject(proj)}
                        >
                          <FileText size={14} strokeWidth={1.75} className="nav-icon" />
                          {proj}
                        </button>
                        <button
                          className="project-delete-btn"
                          onClick={(e) => { e.stopPropagation(); onDeleteProject(proj); }}
                          title="Delete Project"
                        >
                          <Trash2 size={13} strokeWidth={1.75} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {activeView === 'Project' && activeProject && (
            <MemberManager isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          )}
        </div>

        <nav className="sidebar-nav-links-bottom">
          <button
            className={`nav-link-btn ${activeView === 'Dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('Dashboard')}
          >
            <LayoutDashboard size={15} strokeWidth={1.75} className="nav-icon" />
            Dashboard
          </button>
          <button
            className={`nav-link-btn ${activeView === 'Settings' ? 'active' : ''}`}
            onClick={() => setActiveView('Settings')}
          >
            <Settings size={15} strokeWidth={1.75} className="nav-icon" />
            Settings
          </button>
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
