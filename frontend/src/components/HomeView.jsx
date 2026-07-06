import React, { useState } from 'react';
import {
  FolderOpen, Trash2, Plus, ArrowRight, ClipboardList,
  CircleCheck, Zap, CircleAlert, Users
} from 'lucide-react';
import { useTaskFlow } from '../context/TaskFlowContext';
import MemberAvatar from './MemberAvatar';

const STATUS_COLOR = {
  'Pending':     { bg: 'var(--pending-bg)',     color: 'var(--pending-text)',     border: 'var(--pending-border)' },
  'In Progress': { bg: 'var(--inprogress-bg)',  color: 'var(--inprogress-text)',  border: 'var(--inprogress-border)' },
  'Blocker':     { bg: 'var(--blocker-bg)',      color: 'var(--blocker-text)',     border: 'var(--blocker-border)' },
};

const PRIORITY_COLOR = {
  'High':   'var(--danger-text)',
  'Medium': 'var(--warning-text)',
  'Low':    'var(--success-text)',
};

function TaskPreviewRow({ task }) {
  const s = STATUS_COLOR[task.status] || STATUS_COLOR['Pending'];
  return (
    <div className={`home-task-preview ${task.completed ? 'home-task-done' : ''}`}>
      <span
        className="home-task-priority-dot"
        style={{ background: PRIORITY_COLOR[task.priority] }}
        title={`${task.priority} priority`}
      />
      <span className="home-task-text">{task.text}</span>
      <span
        className="home-task-status"
        style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
      >
        {task.status}
      </span>
      {task.assignedMember && (
        <span className="home-task-assignee" title={`Assigned to ${task.assignedMember}`}>
          {task.assignedMember.split(' ')[0]}
        </span>
      )}
    </div>
  );
}

export function HomeView() {
  const {
    projects = [],
    members  = [],
    tasks    = [],
    setActiveProject,
    handleAddProject,
    handleDeleteProject,
  } = useTaskFlow();

  const [newProjectName, setNewProjectName] = useState('');
  const [showAddForm, setShowAddForm]       = useState(false);

  const totalProjects = projects.length;
  const totalTasks    = tasks.length;
  const doneTasks     = tasks.filter(t => t.completed).length;
  const blockerCount  = tasks.filter(t => t.status === 'Blocker' && !t.completed).length;
  const memberCount   = members.length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    handleAddProject(newProjectName.trim());
    setNewProjectName('');
    setShowAddForm(false);
  };

  return (
    <div className="home-hub-container">

      <div className="hub-header">
        <div className="hub-header-left">
          <h1>Home</h1>
          <p className="hub-subtitle">Your workspace at a glance</p>
        </div>
        <button
          className="hub-new-project-btn"
          onClick={() => setShowAddForm(v => !v)}
        >
          <Plus size={14} strokeWidth={2} />
          New Project
        </button>
      </div>

      {showAddForm && (
        <div className="hub-add-form-bar">
          <form onSubmit={handleSubmit} className="hub-add-form-inner">
            <FolderOpen size={15} strokeWidth={1.75} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Project name…"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              className="hub-add-input"
              autoFocus
              required
            />
            <button type="submit" className="inline-add-primary-btn">Create</button>
            <button type="button" className="inline-add-ghost-btn" onClick={() => setShowAddForm(false)}>Cancel</button>
          </form>
        </div>
      )}

      <div className="hub-summary-strip">
        <div className="hub-summary-item">
          <FolderOpen size={14} strokeWidth={1.75} />
          <span><strong>{totalProjects}</strong> Projects</span>
        </div>
        <div className="hub-summary-divider" />
        <div className="hub-summary-item">
          <ClipboardList size={14} strokeWidth={1.75} />
          <span><strong>{totalTasks}</strong> Tasks</span>
        </div>
        <div className="hub-summary-divider" />
        <div className="hub-summary-item" style={{ color: 'var(--success-text)' }}>
          <CircleCheck size={14} strokeWidth={1.75} />
          <span><strong>{doneTasks}</strong> Done</span>
        </div>
        <div className="hub-summary-divider" />
        {blockerCount > 0 && (
          <>
            <div className="hub-summary-item" style={{ color: 'var(--blocker-text)' }}>
              <CircleAlert size={14} strokeWidth={1.75} />
              <span><strong>{blockerCount}</strong> Blocker{blockerCount > 1 ? 's' : ''}</span>
            </div>
            <div className="hub-summary-divider" />
          </>
        )}
        <div className="hub-summary-item">
          <Users size={14} strokeWidth={1.75} />
          <span><strong>{memberCount}</strong> Members</span>
        </div>
      </div>

      {projects.length === 0 && (
        <div className="hub-empty-state">
          <FolderOpen size={40} strokeWidth={1.25} style={{ color: 'var(--primary)', opacity: 0.35 }} />
          <p>No projects yet. Create your first one above.</p>
        </div>
      )}

      <div className="hub-project-list">
        {projects.map((proj) => {
          const projectTasks   = tasks.filter(t => t.project === proj);
          const totalT         = projectTasks.length;
          const doneT          = projectTasks.filter(t => t.completed).length;
          const inprogressT    = projectTasks.filter(t => t.status === 'In Progress' && !t.completed).length;
          const blockersT      = projectTasks.filter(t => t.status === 'Blocker'     && !t.completed).length;
          const pct            = totalT > 0 ? Math.round((doneT / totalT) * 100) : 0;
          const hasBlocker     = blockersT > 0;
          const projectMembers = members.filter(m => m.project === proj);


          const previewTasks = [...projectTasks]
            .sort((a, b) => {
              if (a.completed !== b.completed) return a.completed ? 1 : -1;
              const p = { High: 0, Medium: 1, Low: 2 };
              return (p[a.priority] ?? 1) - (p[b.priority] ?? 1);
            })
            .slice(0, 2);

          const remaining = totalT - 2;

          return (
            <div key={proj} className={`hub-project-row ${hasBlocker ? 'hub-project-row--blocker' : ''}`}>

              <div className="hub-row-header">
                <div className="hub-row-left">
                  <FolderOpen size={16} strokeWidth={1.75} className="hub-row-folder-icon" />
                  <span className="hub-row-name">{proj}</span>
                  {hasBlocker && (
                    <span className="hub-blocker-pill">
                      <CircleAlert size={10} strokeWidth={2} /> Blocker
                    </span>
                  )}
                </div>

                <div className="hub-row-stats">
                  <span className="hub-stat-chip hub-stat-chip--total" title="Total tasks">
                    <ClipboardList size={11} strokeWidth={1.75} /> {totalT}
                  </span>
                  {doneT > 0 && (
                    <span className="hub-stat-chip hub-stat-chip--done" title="Completed">
                      <CircleCheck size={11} strokeWidth={1.75} /> {doneT}
                    </span>
                  )}
                  {inprogressT > 0 && (
                    <span className="hub-stat-chip hub-stat-chip--inprogress" title="In Progress">
                      <Zap size={11} strokeWidth={1.75} /> {inprogressT}
                    </span>
                  )}
                  {blockersT > 0 && (
                    <span className="hub-stat-chip hub-stat-chip--blocker" title="Blockers">
                      <CircleAlert size={11} strokeWidth={1.75} /> {blockersT}
                    </span>
                  )}
                </div>

                <div className="hub-row-members">
                  {projectMembers.length === 0 ? (
                    <span className="no-members-label">No members</span>
                  ) : (
                    <div className="overlapping-avatars" style={{ paddingLeft: 6 }}>
                      {projectMembers.slice(0, 4).map(m => (
                        <MemberAvatar
                          key={m.id}
                          name={m.name}
                          role={m.role}
                          size={26}
                          iconSize={12}
                          className="stacked-avatar"
                        />
                      ))}
                      {projectMembers.length > 4 && (
                        <div className="stacked-avatar more-avatar">+{projectMembers.length - 4}</div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  className="project-card-delete"
                  onClick={() => handleDeleteProject(proj)}
                  title="Delete project"
                >
                  <Trash2 size={13} strokeWidth={1.75} />
                </button>
              </div>


              <div className="hub-row-progress">
                <div className="hub-row-progress-track">
                  <div
                    className={`hub-row-progress-fill ${hasBlocker ? 'has-blocker' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="hub-row-progress-pct">{pct}%</span>
              </div>

              {totalT > 0 && (
                <div className="hub-task-preview-section">
                  {previewTasks.map(t => (
                    <TaskPreviewRow key={t.id} task={t} />
                  ))}
                  {remaining > 0 && (
                    <p className="hub-remaining-label">
                      +{remaining} more task{remaining > 1 ? 's' : ''} in this project
                    </p>
                  )}
                </div>
              )}

              <div className="hub-row-footer">
                <button
                  className="hub-open-project-btn"
                  onClick={() => setActiveProject(proj)}
                >
                  Open Project <ArrowRight size={13} strokeWidth={2} />
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HomeView;
