import React from 'react';
import {
  FolderOpen, Users, ClipboardList, CircleCheck,
  Zap, CircleAlert, ArrowRight
} from 'lucide-react';
import { useTaskFlow } from '../context/TaskFlowContext';
import MemberAvatar from './MemberAvatar';

function DonutChart({ segments, total }) {
  const radius = 54;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const gap = total > 0 ? 2 : 0; 

  let offset = 0;
  const arcs = segments
    .filter(s => s.value > 0)
    .map((s) => {
      const len = (s.value / total) * (circumference - gap * segments.filter(x => x.value > 0).length);
      const arc = { ...s, len, offset: -offset };
      offset += len + gap;
      return arc;
    });

  return (
    <div className="donut-wrapper">
      <svg viewBox="0 0 140 140" className="donut-svg">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--border-color)" strokeWidth={stroke} />
        {total === 0 ? (
          <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--border-color)" strokeWidth={stroke} />
        ) : arcs.map((arc, i) => (
          <circle
            key={i}
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={stroke}
            strokeDasharray={`${arc.len} ${circumference}`}
            strokeDashoffset={arc.offset}
            strokeLinecap="butt"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        ))}
      </svg>
      <div className="donut-center">
        <span className="donut-total">{total}</span>
        <span className="donut-label">tasks</span>
      </div>
    </div>
  );
}

function PriorityBar({ tasks }) {
  const total = tasks.length;
  const high   = tasks.filter(t => t.priority === 'High' && !t.completed).length;
  const medium = tasks.filter(t => t.priority === 'Medium' && !t.completed).length;
  const low    = tasks.filter(t => t.priority === 'Low' && !t.completed).length;

  const pct = (n) => total === 0 ? 0 : Math.round((n / total) * 100);

  const bars = [
    { label: 'High',   value: high,   pct: pct(high),   color: 'var(--danger-text)' },
    { label: 'Medium', value: medium, pct: pct(medium), color: 'var(--warning-text)' },
    { label: 'Low',    value: low,    pct: pct(low),    color: 'var(--success-text)' },
  ];

  return (
    <div className="priority-bar-card">
      <p className="chart-section-label">Open Tasks by Priority</p>
      <div className="priority-bars">
        {bars.map(b => (
          <div key={b.label} className="priority-bar-row">
            <span className="priority-bar-label">{b.label}</span>
            <div className="priority-bar-track">
              <div
                className="priority-bar-fill"
                style={{ width: `${b.pct}%`, background: b.color }}
              />
            </div>
            <span className="priority-bar-count">{b.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardView() {
  const { projects = [], members = [], tasks = [], setActiveProject } = useTaskFlow();

  const total      = tasks.length;
  const completed  = tasks.filter(t => t.completed).length;
  const inprogress = tasks.filter(t => t.status === 'In Progress' && !t.completed).length;
  const pending    = tasks.filter(t => t.status === 'Pending' && !t.completed).length;
  const blockers   = tasks.filter(t => t.status === 'Blocker' && !t.completed).length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  const donutSegments = [
    { label: 'Completed',   value: completed,  color: 'var(--success-text)' },
    { label: 'In Progress', value: inprogress, color: 'var(--inprogress-text)' },
    { label: 'Pending',     value: pending,    color: 'var(--pending-text)' },
    { label: 'Blocker',     value: blockers,   color: 'var(--blocker-text)' },
  ];


  const kpis = [
    { icon: <FolderOpen size={18} strokeWidth={1.75} />, label: 'Projects',    value: projects.length, accent: 'var(--primary)' },
    { icon: <Users      size={18} strokeWidth={1.75} />, label: 'Members',     value: members.length,  accent: 'var(--inprogress-text)' },
    { icon: <ClipboardList size={18} strokeWidth={1.75} />, label: 'Total Tasks', value: total,        accent: 'var(--text-muted)' },
    { icon: <CircleCheck size={18} strokeWidth={1.75} />, label: 'Completed',  value: completed,       accent: 'var(--success-text)' },
    { icon: <Zap         size={18} strokeWidth={1.75} />, label: 'In Progress',value: inprogress,      accent: 'var(--warning-text)' },
    { icon: <CircleAlert size={18} strokeWidth={1.75} />, label: 'Blockers',   value: blockers,        accent: 'var(--blocker-text)' },
  ];

  return (
    <div className="dashboard-view-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">Workspace overview — tasks, projects, and team activity at a glance.</p>
      </div>


      <div className="kpi-row">
        {kpis.map((k) => (
          <div key={k.label} className="kpi-card" style={{ '--kpi-accent': k.accent }}>
            <span className="kpi-icon">{k.icon}</span>
            <div className="kpi-body">
              <span className="kpi-value">{k.value}</span>
              <span className="kpi-label">{k.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-row">

        <div className="dash-card donut-card">
          <p className="chart-section-label">Task Status Distribution</p>
          <div className="donut-layout">
            <DonutChart segments={donutSegments} total={total} />
            <div className="donut-legend">
              {donutSegments.map(s => (
                <div key={s.label} className="legend-row">
                  <span className="legend-dot" style={{ background: s.color }} />
                  <span className="legend-text">{s.label}</span>
                  <span className="legend-val">
                    {s.value}
                    <em>{total > 0 ? ` · ${Math.round((s.value / total) * 100)}%` : ''}</em>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dash-card rate-card">
          <p className="chart-section-label">Overall Completion</p>
          <div className="completion-rate-display">
            <span className="completion-pct">{completionRate}%</span>
            <span className="completion-sub">{completed} of {total} tasks done</span>
          </div>
          <div className="rate-bar-track">
            <div className="rate-bar-fill" style={{ width: `${completionRate}%` }} />
          </div>

          <PriorityBar tasks={tasks} />
        </div>

      </div>


      {projects.length > 0 && (
        <div className="dash-projects-section">
          <p className="chart-section-label" style={{ marginBottom: 12 }}>Projects</p>
          <div className="dash-projects-list">
            {projects.map((proj) => {
              const pt = tasks.filter(t => t.project === proj);
              const done = pt.filter(t => t.completed).length;
              const pct  = pt.length > 0 ? Math.round((done / pt.length) * 100) : 0;
              const hasBlocker = pt.some(t => t.status === 'Blocker' && !t.completed);
              const pm   = members.filter(m => m.project === proj);

              return (
                <div key={proj} className="dash-project-row">
                  <div className="dpr-name">
                    <FolderOpen size={14} strokeWidth={1.75} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span>{proj}</span>
                    {hasBlocker && (
                      <span className="blocker-badge">
                        <CircleAlert size={11} strokeWidth={2} /> Blocker
                      </span>
                    )}
                  </div>

                  <div className="dpr-progress">
                    <div className="dpr-bar-track">
                      <div
                        className={`dpr-bar-fill ${hasBlocker ? 'has-blocker' : ''}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="dpr-pct">{pct}%</span>
                  </div>

                  <div className="dpr-meta">
                    <span className="task-count-pill">{pt.length} tasks</span>
                    <div className="overlapping-avatars" style={{ paddingLeft: 0 }}>
                      {pm.slice(0, 4).map(m => (
                        <MemberAvatar
                          key={m.id}
                          name={m.name}
                          role={m.role}
                          size={24}
                          iconSize={11}
                          className="stacked-avatar"
                        />
                      ))}
                      {pm.length > 4 && <div className="stacked-avatar more-avatar">+{pm.length - 4}</div>}
                      {pm.length === 0 && <span className="no-members-muted">No members</span>}
                    </div>
                  </div>

                  <button className="dpr-open-btn" onClick={() => setActiveProject(proj)}>
                    Open <ArrowRight size={13} strokeWidth={2} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardView;
