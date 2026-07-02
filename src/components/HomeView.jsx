import React, { useState } from 'react';
import { useTaskFlow } from '../context/TaskFlowContext';

export function HomeView() {
  const { 
    projects = [], 
    members = [], 
    tasks = [], 
    setActiveProject, 
    handleAddProject, 
    handleDeleteProject 
  } = useTaskFlow();

  const [newProjectName, setNewProjectName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    handleAddProject(newProjectName.trim());
    setNewProjectName('');
  };

  return (
    <div className="home-hub-container">
      <div className="hub-header">
        <h1>⚡ Workspace Projects Hub</h1>
        <p className="hub-subtitle">Manage, monitor, and configure all team workflows in one central dashboard.</p>
      </div>

      <div className="projects-grid">
        {projects.map((proj) => {
          const projectTasks = tasks.filter((t) => t.project === proj);
          const totalTasks = projectTasks.length;
          const completedTasks = projectTasks.filter((t) => t.completed).length;
          const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          
          const projectMembers = members.filter((m) => m.project === proj);

          return (
            <div key={proj} className="project-card">
              <div className="project-card-header">
                <h3>📁 {proj}</h3>
                <button 
                  className="project-card-delete"
                  onClick={() => handleDeleteProject(proj)}
                  title="Delete Project"
                >
                  🗑️
                </button>
              </div>

              <p className="project-card-desc">
                Minimalist project space for coordinating tasks, tracking status indicators, and managing team assignees.
              </p>

              <div className="project-card-progress">
                <div className="progress-labels">
                  <span>Progress</span>
                  <strong>{progressPercent}%</strong>
                </div>
                <div className="progress-track-bg">
                  <div className="progress-fill-bar" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>

              <div className="project-card-footer">
                <div className="project-members-stack">
                  {projectMembers.length === 0 ? (
                    <span className="no-members-label">No members</span>
                  ) : (
                    <div className="overlapping-avatars">
                      {projectMembers.slice(0, 4).map((member) => (
                        <div 
                          key={member.id} 
                          className="stacked-avatar"
                          title={`${member.name} (${member.role})`}
                        >
                          {member.avatar}
                        </div>
                      ))}
                      {projectMembers.length > 4 && (
                        <div className="stacked-avatar more-avatar">
                          +{projectMembers.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button 
                  className="open-project-btn"
                  onClick={() => setActiveProject(proj)}
                >
                  Open Board →
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Project Card */}
        <div className="project-card add-project-card">
          <h3>➕ New Project</h3>
          <p className="project-card-desc">Initialize a new team workspace to begin planning tasks and tracking milestones.</p>
          <form onSubmit={handleSubmit} className="hub-add-project-form">
            <input 
              type="text" 
              placeholder="Enter project name..." 
              value={newProjectName} 
              onChange={(e) => setNewProjectName(e.target.value)}
              className="task-input"
              required
            />
            <button type="submit" className="add-button">
              Create Project
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default HomeView;
