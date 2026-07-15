import React, { useState } from 'react';
import {
  LayoutGrid, CheckSquare, BarChart2, Users,
  Settings, HelpCircle, Folder, Plus, ChevronDown, Trash2, Zap, Terminal, Kanban, LogOut
} from 'lucide-react';
import { useTasks, useTaskFlow } from "../context/TaskFlowContext";

export function Sidebar() {
  const {
    projects = [],
    activeProject = '',
    setActiveProject,
    handleAddProject: onAddProject,
    handleDeleteProject: onDeleteProject,
    activeView = 'Home',
    setActiveView,
    tasks = []
  } = useTasks();

  const { user, handleLogout } = useTaskFlow();

  const [isOpen, setIsOpen] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectText, setNewProjectText] = useState('');

  const handleAddProjectSubmit = (e) => {
    e.preventDefault();
    if (newProjectText.trim() === '') return;
    onAddProject(newProjectText);
    setNewProjectText('');
    setShowAddProject(false);
    setIsOpen(false);
    setActiveView('Project');
  };

  const handleProjectSelect = (projId) => {
    setActiveProject(projId);
    setActiveView('Project');
    setIsOpen(false);
  };

  const activeProjectObj = projects.find(p => Number(p.id) === Number(activeProject));
  const activeProjectName = activeProjectObj ? activeProjectObj.name : "Select Project...";

  // Get active tasks count for the badge (total pending tasks in active project)
  const activeTasksCount = tasks.filter(t => Number(t.projectId) === Number(activeProject) && !t.completed).length;

  return (
    <aside className="taskmatrix-sidebar">
      {/* Logo Header */}
      <div className="logo-container">
        <div className="logo-circle">
          <Zap size={18} strokeWidth={2.5} className="logo-icon" />
        </div>
        <span className="logo-text">TaskMatrix</span>
      </div>

      {/* Project Switcher */}
      <div className="project-switcher-container">
        <div className="project-switcher-header">
          <span className="project-switcher-label">Workspace</span>
          {activeProject && user?.role === 'admin' && (
            <button 
              className="delete-project-btn"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete the project "${activeProjectName}"?`)) {
                  onDeleteProject(activeProject);
                }
              }}
              title="Delete Active Project"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>

        <div className="custom-select-container">
          <button 
            className="custom-select-trigger" 
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="custom-select-trigger-content">
              <Folder size={14} className="project-select-icon" />
              <span className="current-project-name">
                {activeProjectName}
              </span>
            </div>
            <ChevronDown size={14} className={`project-select-chevron ${isOpen ? 'open' : ''}`} />
          </button>

          {isOpen && (
            <div className="custom-select-dropdown">
              <ul className="custom-select-options">
                {projects.map((p) => (
                  <li key={p.id}>
                    <button 
                      className={`custom-select-option ${Number(activeProject) === Number(p.id) ? 'selected' : ''}`}
                      onClick={() => handleProjectSelect(p.id)}
                    >
                      <Folder size={12} className="sidebar-folder-icon" />
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
              {user?.role === 'admin' && (
                <>
                  <div className="custom-select-divider"></div>
                  {showAddProject ? (
                    <form onSubmit={handleAddProjectSubmit} className="project-add-form" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        placeholder="Project name..."
                        value={newProjectText}
                        onChange={(e) => setNewProjectText(e.target.value)}
                        className="project-add-input"
                        autoFocus
                      />
                      <div className="project-add-actions">
                        <button type="submit" className="project-add-submit-btn">Add</button>
                        <button type="button" className="project-add-cancel-btn" onClick={() => setShowAddProject(false)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button 
                      className="custom-select-add-btn" 
                      onClick={() => setShowAddProject(true)}
                    >
                      <Plus size={12} className="margin-right-8" />
                      Create New Workspace
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <div className="sidebar-sections-wrapper">
        {/* Menu Section */}
        <div className="sidebar-section">
          <h4 className="sidebar-section-header-text">Menu</h4>
          
          <button
            className={`taskmatrix-nav-btn ${activeView === 'Home' ? 'active' : ''}`}
            onClick={() => setActiveView('Home')}
          >
            <div className="taskmatrix-nav-btn-content">
              <LayoutGrid size={18} className="nav-icon" />
              <span>Dashboard</span>
            </div>
          </button>

          <button
            className={`taskmatrix-nav-btn ${activeView === 'Project' ? 'active' : ''} ${projects.length === 0 ? 'sidebar-tab-disabled' : ''}`}
            onClick={() => {
              if (projects.length > 0) {
                if (!activeProject) {
                  setActiveProject(projects[0].id);
                }
                setActiveView('Project');
              } else {
                setActiveView('Home');
              }
            }}
            disabled={projects.length === 0}
          >
            <div className="taskmatrix-nav-btn-content">
              <CheckSquare size={18} className="nav-icon" />
              <span>Tasks</span>
            </div>
            {projects.length > 0 && activeProject && activeTasksCount > 0 && (
              <span className="taskmatrix-badge">{activeTasksCount}</span>
            )}
          </button>

          <button
            className={`taskmatrix-nav-btn ${activeView === 'Kanban' ? 'active' : ''} ${projects.length === 0 ? 'sidebar-tab-disabled' : ''}`}
            onClick={() => {
              if (projects.length > 0) {
                if (!activeProject) {
                  setActiveProject(projects[0].id);
                }
                setActiveView('Kanban');
              } else {
                setActiveView('Home');
              }
            }}
            disabled={projects.length === 0}
          >
            <div className="taskmatrix-nav-btn-content">
              <Kanban size={18} className="nav-icon" />
              <span>Kanban Board</span>
            </div>
          </button>
 
          <button
            className={`taskmatrix-nav-btn ${activeView === 'Sprints' ? 'active' : ''} ${projects.length === 0 ? 'sidebar-tab-disabled' : ''}`}
            onClick={() => {
              if (projects.length > 0) {
                if (!activeProject) {
                  setActiveProject(projects[0].id);
                }
                setActiveView('Sprints');
              } else {
                setActiveView('Home');
              }
            }}
            disabled={projects.length === 0}
          >
            <div className="taskmatrix-nav-btn-content">
              <Zap size={18} className="nav-icon" />
              <span>Sprints Board</span>
            </div>
          </button>

          <button
            className={`taskmatrix-nav-btn ${activeView === 'Dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('Dashboard')}
          >
            <div className="taskmatrix-nav-btn-content">
              <BarChart2 size={18} className="nav-icon" />
              <span>Analytics</span>
            </div>
          </button>

          {user?.role === 'admin' && (
            <button
              className={`taskmatrix-nav-btn ${activeView === 'PowerQuery' ? 'active' : ''}`}
              onClick={() => setActiveView('PowerQuery')}
            >
              <div className="taskmatrix-nav-btn-content">
                <Terminal size={18} className="nav-icon" />
                <span>Power Query</span>
              </div>
            </button>
          )}

          <button
            className={`taskmatrix-nav-btn ${activeView === 'Team' ? 'active' : ''} ${projects.length === 0 ? 'sidebar-tab-disabled' : ''}`}
            onClick={() => {
              if (projects.length > 0) {
                if (!activeProject) {
                  setActiveProject(projects[0].id);
                }
                setActiveView('Team');
              } else {
                setActiveView('Home');
              }
            }}
            disabled={projects.length === 0}
          >
            <div className="taskmatrix-nav-btn-content">
              <Users size={18} className="nav-icon" />
              <span>Team</span>
            </div>
          </button>
        </div>

        {/* General Section */}
        <div className="sidebar-section margin-top-16">
          <h4 className="sidebar-section-header-text">General</h4>

          <button
            className={`taskmatrix-nav-btn ${activeView === 'Settings' ? 'active' : ''}`}
            onClick={() => setActiveView('Settings')}
          >
            <div className="taskmatrix-nav-btn-content">
              <Settings size={18} className="nav-icon" />
              <span>Settings</span>
            </div>
          </button>

          <button
            className={`taskmatrix-nav-btn ${activeView === 'Help' ? 'active' : ''}`}
            onClick={() => setActiveView('Help')}
          >
            <div className="taskmatrix-nav-btn-content">
              <HelpCircle size={18} className="nav-icon" />
              <span>Help</span>
            </div>
          </button>
        </div>
      </div>

      {/* User Section at the bottom */}
      <div className="sidebar-user-footer">
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">
            {user?.name}
          </div>
          <div className="sidebar-user-role">
            {user?.role}
          </div>
        </div>
        <button 
          onClick={handleLogout}
          title="Sign Out"
          className="logout-icon-btn sidebar-logout-btn"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
