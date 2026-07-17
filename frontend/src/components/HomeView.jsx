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

function TaskPreviewRow({ task, assigneeName }) {
  const s = STATUS_COLOR[task.status] || STATUS_COLOR['Pending'];
  return (
    <div className={`home-task-preview home-task-preview-padding ${task.completed ? 'home-task-done' : ''}`}>
      <span
        className="home-task-priority-dot"
        style={{ background: PRIORITY_COLOR[task.priority] }}
        title={`${task.priority} priority`}
      />
      <span className="home-task-text home-task-text-style">{task.text}</span>
      <span
        className="home-task-status home-task-status-style"
        style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
      >
        {task.status}
      </span>
      {assigneeName && (
        <span className="home-task-assignee home-task-assignee-style" title={`Assigned to ${assigneeName}`}>
          {assigneeName.split(' ')[0]}
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
    user
  } = useTaskFlow();

  const [newProjectName, setNewProjectName] = useState('');
  const [showAddForm, setShowAddForm]       = useState(false);

  const totalProjects = projects.length;
  const totalTasks    = tasks.length;
  const doneTasks     = tasks.filter(t => t.completed).length;
  const blockerCount  = tasks.filter(t => t.status === 'Blocker' && !t.completed).length;

  // Calculate unique members globally
  const uniqueMemberCount = React.useMemo(() => {
    const uniqueIds = new Set();
    members.forEach(m => {
      if (m.userId) {
        uniqueIds.add(m.userId);
      } else if (m.name) {
        uniqueIds.add(m.name.trim().toLowerCase());
      }
    });
    return uniqueIds.size;
  }, [members]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    handleAddProject(newProjectName.trim());
    setNewProjectName('');
    setShowAddForm(false);
  };

  return (
    <div className="home-hub-container home-hub-container-max">
      <div className="hub-header home-hub-header-margin">
        <div className="hub-header-left">
          <h1>Home</h1>
          <p className="hub-subtitle home-hub-subtitle-style">
            Your workspace at a glance
          </p>
        </div>
        {user?.role === 'admin' && (
          <button
            className="hub-new-project-btn"
            onClick={() => setShowAddForm(v => !v)}
          >
            <Plus size={14} strokeWidth={2} />
            New Project
          </button>
        )}
      </div>

      {user?.role === 'admin' && showAddForm && (
        <div className="hub-add-form-bar home-hub-form-bar">
          <form onSubmit={handleSubmit} className="hub-add-form-inner">
            <FolderOpen size={15} strokeWidth={1.75} className="home-folder-open-icon" />
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

      <div className="hub-summary-strip home-hub-summary-margin">
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
        <div className="hub-summary-item color-success-text">
          <CircleCheck size={14} strokeWidth={1.75} />
          <span><strong>{doneTasks}</strong> Done</span>
        </div>
        <div className="hub-summary-divider" />
        {blockerCount > 0 && (
          <>
            <div className="hub-summary-item color-blocker-text">
              <CircleAlert size={14} strokeWidth={1.75} />
              <span><strong>{blockerCount}</strong> Blocker{blockerCount > 1 ? 's' : ''}</span>
            </div>
            <div className="hub-summary-divider" />
          </>
        )}
        <div className="hub-summary-item">
          <Users size={14} strokeWidth={1.75} />
          <span><strong>{uniqueMemberCount}</strong> Members</span>
        </div>
      </div>

      {projects.length === 0 && (
        <div className="hub-empty-state">
          <FolderOpen size={40} strokeWidth={1.25} className="home-empty-folder-icon" />
          <p>No projects yet. Create your first one above.</p>
        </div>
      )}

      <div className="hub-project-list">
        {projects.map((proj) => {
          const projectTasks   = tasks.filter(t => Number(t.projectId) === Number(proj.id));
          const totalT         = projectTasks.length;
          const doneT          = projectTasks.filter(t => t.completed).length;
          const inprogressT    = projectTasks.filter(t => t.status === 'In Progress' && !t.completed).length;
          const blockersT      = projectTasks.filter(t => t.status === 'Blocker'     && !t.completed).length;
          const pct            = totalT > 0 ? Math.round((doneT / totalT) * 100) : 0;
          const hasBlocker     = blockersT > 0;
          const projectMembers = members.filter(m => Number(m.projectId) === Number(proj.id));

          const previewTasks = [...projectTasks]
            .sort((a, b) => {
              if (a.completed !== b.completed) return a.completed ? 1 : -1;
              const p = { High: 0, Medium: 1, Low: 2 };
              return (p[a.priority] ?? 1) - (p[b.priority] ?? 1);
            })
            .slice(0, 2);

          const remaining = totalT - 2;

          return (
            <div
              key={proj.id}
              className={`hub-project-row ${hasBlocker ? 'hub-project-row--blocker' : ''}`}
            >
              {/* Top metadata info section */}
              <div className="home-row-info-wrapper">
                {/* Left side group: Title + Stats chips */}
                <div className="home-row-left-group">
                  {/* 1. Project Title Section */}
                  <div className="home-row-title-col">
                    <FolderOpen size={18} strokeWidth={1.75} className="hub-row-folder-icon" />
                    <span className="hub-row-name home-row-title-text">
                      {proj.name}
                    </span>
                    {hasBlocker && (
                      <span className="hub-blocker-pill">
                        <CircleAlert size={10} strokeWidth={2} /> Blocker
                      </span>
                    )}
                  </div>

                  {/* 2. Stats Section */}
                  <div className="home-row-stats-col">
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
                </div>

                <div className="home-row-right-group">
                  {/* 3. Members Section */}
                  <div className="home-row-members-col">
                    {projectMembers.length === 0 ? (
                      <span className="no-members-label text-muted-small">No members</span>
                    ) : (
                      <div className="overlapping-avatars">
                        {projectMembers.slice(0, 3).map(m => (
                          <MemberAvatar
                            key={m.id}
                            name={m.name}
                            role={m.role}
                            size={24}
                            iconSize={11}
                            className="stacked-avatar"
                          />
                        ))}
                        {projectMembers.length > 3 && (
                          <div className="stacked-avatar more-avatar home-row-avatar-more">
                            +{projectMembers.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="home-row-actions-col">
                    <button
                      className="hub-open-project-btn home-row-open-btn"
                      onClick={() => setActiveProject(proj.id)}
                    >
                      Open <ArrowRight size={12} strokeWidth={2} />
                    </button>
                    
                    {user?.role === 'admin' && (
                      <button
                        className="project-card-delete"
                        onClick={() => handleDeleteProject(proj.id)}
                        title="Delete project"
                      >
                        <Trash2 size={13} strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {totalT > 0 && (
                <div className="hub-task-preview-section">
                  <div className="hub-task-preview-list">
                    {previewTasks.map(t => {
                      const assignee = members.find(m => Number(m.id) === Number(t.assignedMemberId));
                      const assigneeName = assignee ? assignee.name : null;
                      return <TaskPreviewRow key={t.id} task={t} assigneeName={assigneeName} />;
                    })}
                    {remaining > 0 && (
                      <p className="hub-remaining-label">
                        +{remaining} more task{remaining > 1 ? 's' : ''} in workspace
                      </p>
                    )}
                  </div>

                  <div className="home-row-progress-col">
                    <div className="home-row-progress-labels">
                      <span className="color-text-muted">Progress</span>
                      <span className="color-text-main">{pct}%</span>
                    </div>
                    <div className="hub-row-progress-track home-row-progress-track-override">
                      <div
                        className={`hub-row-progress-fill ${hasBlocker ? 'has-blocker' : ''}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HomeView;
