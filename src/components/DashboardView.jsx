import React from 'react';
import { useTaskFlow } from '../context/TaskFlowContext';

export function DashboardView() {
  const { 
    projects = [], 
    members = [], 
    tasks = [], 
    setActiveProject 
  } = useTaskFlow();

  // 1. Calculate overall stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const incompleteTasks = totalTasks - completedTasks;
  const inprogressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;
  const blockerTasks = tasks.filter((t) => t.status === 'Blocker').length;

  // 2. SVG Donut chart math
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.16

  // Portions in circumference units
  const getPortion = (count) => {
    if (totalTasks === 0) return 0;
    return (count / totalTasks) * circumference;
  };

  const lenCompleted = getPortion(completedTasks);
  const lenInProgress = getPortion(inprogressTasks);
  const lenPending = getPortion(pendingTasks);
  const lenBlocker = getPortion(blockerTasks);

  // Offset accumulators
  const offsetCompleted = 0;
  const offsetInProgress = -lenCompleted;
  const offsetPending = -(lenCompleted + lenInProgress);
  const offsetBlocker = -(lenCompleted + lenInProgress + lenPending);

  // Percentages for labels
  const getPercent = (count) => {
    if (totalTasks === 0) return 0;
    return Math.round((count / totalTasks) * 100);
  };

  return (
    <div className="dashboard-view-container">
      <div className="dashboard-header">
        <h1>📊 Dashboard Overview</h1>
        <p className="dashboard-subtitle">Global task tracking metrics, status breakdowns, and project assignee stacks.</p>
      </div>

      {/* Full-width Summary Row */}
      <div className="dashboard-summary-row">
        <div className="summary-stat-card">
          <span className="stat-icon">📁</span>
          <div className="stat-info">
            <h3>Projects</h3>
            <p>{projects.length}</p>
          </div>
        </div>

        <div className="summary-stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-info">
            <h3>Members</h3>
            <p>{members.length}</p>
          </div>
        </div>

        <div className="summary-stat-card">
          <span className="stat-icon">📋</span>
          <div className="stat-info">
            <h3>Total Tasks</h3>
            <p>{totalTasks}</p>
          </div>
        </div>

        <div className="summary-stat-card border-success">
          <span className="stat-icon text-success">✔️</span>
          <div className="stat-info">
            <h3>Completed</h3>
            <p>{completedTasks}</p>
          </div>
        </div>

        <div className="summary-stat-card border-inprogress">
          <span className="stat-icon text-inprogress">⚡</span>
          <div className="stat-info">
            <h3>In Progress</h3>
            <p>{inprogressTasks}</p>
          </div>
        </div>

        <div className="summary-stat-card border-blocker">
          <span className="stat-icon text-blocker">🛑</span>
          <div className="stat-info">
            <h3>Blockers</h3>
            <p>{blockerTasks}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-metrics-row">
        {/* SVG Donut Chart Card */}
        <div className="app-card chart-card">
          <h3>Task Status Distribution</h3>
          
          <div className="chart-wrapper">
            <div className="svg-container">
              <svg width="220" height="220" viewBox="0 0 140 140">
                {/* Background Ring */}
                <circle 
                  cx="70" 
                  cy="70" 
                  r={radius} 
                  fill="transparent" 
                  stroke="var(--border-color)" 
                  strokeWidth="14" 
                />
                {totalTasks === 0 ? (
                  <circle 
                    cx="70" 
                    cy="70" 
                    r={radius} 
                    fill="transparent" 
                    stroke="var(--secondary)" 
                    strokeWidth="14" 
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset="0"
                  />
                ) : (
                  <>
                    {/* Completed Ring */}
                    {completedTasks > 0 && (
                      <circle 
                        cx="70" 
                        cy="70" 
                        r={radius} 
                        fill="transparent" 
                        stroke="var(--success-text)" 
                        strokeWidth="14" 
                        strokeDasharray={`${lenCompleted} ${circumference}`}
                        strokeDashoffset={offsetCompleted}
                        strokeLinecap="round"
                        className="donut-segment"
                      />
                    )}
                    {/* In Progress Ring */}
                    {inprogressTasks > 0 && (
                      <circle 
                        cx="70" 
                        cy="70" 
                        r={radius} 
                        fill="transparent" 
                        stroke="var(--inprogress-text)" 
                        strokeWidth="14" 
                        strokeDasharray={`${lenInProgress} ${circumference}`}
                        strokeDashoffset={offsetInProgress}
                        strokeLinecap="round"
                        className="donut-segment"
                      />
                    )}
                    {/* Pending Ring */}
                    {pendingTasks > 0 && (
                      <circle 
                        cx="70" 
                        cy="70" 
                        r={radius} 
                        fill="transparent" 
                        stroke="var(--pending-text)" 
                        strokeWidth="14" 
                        strokeDasharray={`${lenPending} ${circumference}`}
                        strokeDashoffset={offsetPending}
                        strokeLinecap="round"
                        className="donut-segment"
                      />
                    )}
                    {/* Blocker Ring */}
                    {blockerTasks > 0 && (
                      <circle 
                        cx="70" 
                        cy="70" 
                        r={radius} 
                        fill="transparent" 
                        stroke="var(--blocker-text)" 
                        strokeWidth="14" 
                        strokeDasharray={`${lenBlocker} ${circumference}`}
                        strokeDashoffset={offsetBlocker}
                        strokeLinecap="round"
                        className="donut-segment"
                      />
                    )}
                  </>
                )}
              </svg>
              <div className="donut-center-label">
                <h2>{totalTasks}</h2>
                <small>Total Tasks</small>
              </div>
            </div>

            <div className="chart-legend-grid">
              <div className="legend-item">
                <span className="legend-dot dot-completed"></span>
                <span className="legend-label">Completed</span>
                <strong>{getPercent(completedTasks)}% ({completedTasks})</strong>
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-inprogress"></span>
                <span className="legend-label">In Progress</span>
                <strong>{getPercent(inprogressTasks)}% ({inprogressTasks})</strong>
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-pending"></span>
                <span className="legend-label">Pending</span>
                <strong>{getPercent(pendingTasks)}% ({pendingTasks})</strong>
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-blocker"></span>
                <span className="legend-label">Blocker</span>
                <strong>{getPercent(blockerTasks)}% ({blockerTasks})</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Numeric Stat Summary Cards */}
        <div className="stats-cards-vertical">
          <div className="app-card metric-square">
            <h3>Completed Tasks</h3>
            <p className="metric-number text-success">{completedTasks}</p>
            <span className="metric-badge-desc">Finished tasks across workspace</span>
          </div>

          <div className="app-card metric-square">
            <h3>Incomplete Tasks</h3>
            <p className="metric-number text-pending">{incompleteTasks}</p>
            <span className="metric-badge-desc">Remaining outstanding items</span>
          </div>

          <div className="app-card metric-square">
            <h3>Active Blockers</h3>
            <p className="metric-number text-blocker">{blockerTasks}</p>
            <span className="metric-badge-desc">Blocked tasks requiring attention</span>
          </div>
        </div>
      </div>

      {/* Projects Overview List Section */}
      <div className="dashboard-projects-section">
        <h2>📁 Projects Status Overview</h2>
        <div className="projects-grid">
          {projects.map((proj) => {
            const projectTasks = tasks.filter((t) => t.project === proj);
            const totalProjTasks = projectTasks.length;
            const completedProjTasks = projectTasks.filter((t) => t.completed).length;
            const progressPercent = totalProjTasks > 0 ? Math.round((completedProjTasks / totalProjTasks) * 100) : 0;
            
            const hasActiveBlocker = projectTasks.some((t) => t.status === 'Blocker' && !t.completed);
            const projectMembers = members.filter((m) => m.project === proj);

            return (
              <div key={proj} className="project-card minimalistic-card">
                <div className="project-card-header">
                  <h3>{proj}</h3>
                  <span className="task-count-pill">{totalProjTasks} Tasks</span>
                </div>

                <div className="project-card-progress">
                  <div className="progress-labels">
                    <span>Progress</span>
                    <strong>{progressPercent}%</strong>
                  </div>
                  <div className="progress-track-bg">
                    <div className={`progress-fill-bar ${hasActiveBlocker ? 'has-blocker' : ''}`} style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>

                <div className="project-card-footer">
                  <div className="overlapping-avatars">
                    {projectMembers.slice(0, 5).map((member) => (
                      <div 
                        key={member.id} 
                        className="stacked-avatar"
                        title={`${member.name} (${member.role})`}
                      >
                        {member.avatar}
                      </div>
                    ))}
                    {projectMembers.length > 5 && (
                      <div className="stacked-avatar more-avatar">
                        +{projectMembers.length - 5}
                      </div>
                    )}
                    {projectMembers.length === 0 && (
                      <span className="no-members-muted">No members</span>
                    )}
                  </div>

                  <button 
                    className="minimalist-open-btn"
                    onClick={() => setActiveProject(proj)}
                  >
                    Open
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
