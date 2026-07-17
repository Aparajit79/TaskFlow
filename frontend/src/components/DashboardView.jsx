import React from 'react';
import {
  FolderOpen, Users, CircleCheck, Download, Zap, CircleAlert
} from 'lucide-react';
import { useTaskFlow } from '../context/TaskFlowContext';
import * as XLSX from 'xlsx';
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
            className="donut-segment"
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

export function DashboardView() {
  const { projects = [], members = [], tasks = [] } = useTaskFlow();

  const total      = tasks.length;
  const completed  = tasks.filter(t => t.completed).length;
  const inprogress = tasks.filter(t => t.status === 'In Progress' && !t.completed).length;
  const pending    = tasks.filter(t => t.status === 'Pending' && !t.completed).length;
  const blockers   = tasks.filter(t => t.status === 'Blocker' && !t.completed).length;

  const donutSegments = [
    { label: 'Completed',   value: completed,  color: 'var(--success-text)' },
    { label: 'In Progress', value: inprogress, color: 'var(--inprogress-text)' },
    { label: 'Pending',     value: pending,    color: 'var(--pending-text)' },
    { label: 'Blocker',     value: blockers,   color: 'var(--blocker-text)' },
  ];


  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  
  // Get start of the current week (Monday)
  const now = new Date();
  const currentDayIndex = now.getDay(); 
  const distanceToMonday = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - distanceToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  tasks.forEach(t => {
    if (t.completed && t.completedAt) {
      const compDate = new Date(t.completedAt);
      if (compDate >= startOfWeek && compDate <= endOfWeek) {
        const dayIdx = compDate.getDay(); 
        const dayName = dayIdx === 0 ? 'Sun' : daysOfWeek[dayIdx - 1];
        weeklyCounts[dayName] = (weeklyCounts[dayName] || 0) + 1;
      }
    }
  });

  const weeklyData = daysOfWeek.map(day => ({
    label: day,
    value: weeklyCounts[day]
  }));

  const maxWeeklyValue = Math.max(...weeklyData.map(d => d.value), 1);

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

  const kpis = [
    { icon: <CircleCheck size={18} strokeWidth={2} />, label: 'Total Tasks Completed', value: completed, accent: 'var(--success-text)' },
    { icon: <FolderOpen  size={18} strokeWidth={2} />, label: 'Active Projects',       value: projects.length, accent: 'var(--primary)' },
    { icon: <Users       size={18} strokeWidth={2} />, label: 'Team Members',          value: uniqueMemberCount, accent: 'var(--inprogress-text)' },
  ];

const handleExport = () => {
  const reportData = [
    { Metric: "Total Tasks", Value: total },
    { Metric: "Completed Tasks", Value: completed },
    { Metric: "In Progress Tasks", Value: inprogress },
    { Metric: "Pending Tasks", Value: pending },
    { Metric: "Blockers", Value: blockers },
    { Metric: "Active Projects", Value: projects.length },
    { Metric: "Team Members", Value: uniqueMemberCount },
  ];

  const worksheet = XLSX.utils.json_to_sheet(reportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Task Report");
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `task-report-${today}.xlsx`);
};

  return (
    <div className="dashboard-view-container">

      <div className="dashboard-header">
        <div>
          <h1>Analytics</h1>
          <p className="dashboard-subtitle">Track your performance and productivity metrics.</p>
        </div>
        <button 
          onClick={handleExport}
          className="export-report-btn"
        >
          <Download size={14} />
          Export Report
        </button>
      </div>

      <div className="kpi-row">
        {kpis.map((k) => (
          <div 
            key={k.label} 
            className="kpi-card" 
          >
            <div className="kpi-card-header">
              <span className="kpi-card-label">{k.label}</span>
              <span className="kpi-card-icon-wrapper" style={{ color: k.accent }}>
                {k.icon}
              </span>
            </div>
            <span className="kpi-card-value">
              {k.value}
            </span>
          </div>
        ))}
      </div>


      <div className="charts-row">
        <div className="dash-card">
          <h3>Weekly Task Completion</h3>
          
          <div className="flex-column-gap-20">
            {weeklyData.map(day => {
              const percentage = Math.round((day.value / maxWeeklyValue) * 100);
              return (
                <div key={day.label} className="flex-column-gap-8">
                  <div className="flex-between-font-13-weight-600">
                    <span className="color-text-main">{day.label}</span>
                    <span className="color-text-muted">{day.value} task{day.value !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="weekly-progress-track">
                    <div 
                      className="weekly-progress-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dash-card dash-card-flex">
          <h3>Task Status Distribution</h3>
          <div className="dashboard-donut-layout">
            <DonutChart segments={donutSegments} total={total} />
            
            <div className="donut-legend">
              {donutSegments.map(s => (
                <div key={s.label} className="legend-row">
                  <span className="legend-dot" style={{ background: s.color }} />
                  <span className="legend-text">{s.label}</span>
                  <span className="legend-val">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>


      <div className="dash-card margin-top-24">
        <h3>Project Performance Comparison</h3>
        <p className="dash-card-desc">Compare task completion and active status ratios across all projects.</p>
        
        {projects.length === 0 ? (
          <div className="dash-empty-state">
            No active projects found.
          </div>
        ) : (
          <div className="flex-column-gap-20">
            {projects.map(p => {
              const projectTasks = tasks.filter(t => Number(t.projectId) === Number(p.id));
              const totalT = projectTasks.length;
              const completedT = projectTasks.filter(t => t.completed).length;
              const inprogressT = projectTasks.filter(t => t.status === 'In Progress' && !t.completed).length;
              const pendingT = projectTasks.filter(t => t.status === 'Pending' && !t.completed).length;
              const blockersT = projectTasks.filter(t => t.status === 'Blocker' && !t.completed).length;

              if (totalT === 0) {
                return (
                  <div key={p.id} className="dashboard-project-comparison-row">
                    <span className="dashboard-project-name" title={p.name}>
                      {p.name}
                    </span>
                    <div className="dashboard-stacked-bar-track" />
                    <span className="dashboard-completion-zero">0%</span>
                  </div>
                );
              }

              return (
                <div key={p.id} className="dashboard-project-comparison-row">
                  <span className="dashboard-project-name" title={p.name}>
                    {p.name}
                  </span>
                  

                  <div className="dashboard-stacked-bar-track">
                    {completedT > 0 && (
                      <div 
                        className="dashboard-bar-fill dashboard-bar-fill-completed"
                        style={{ width: `${(completedT / totalT) * 100}%` }} 
                        title={`Completed: ${completedT} (${Math.round((completedT / totalT) * 100)}%)`} 
                      />
                    )}
                    {inprogressT > 0 && (
                      <div 
                        className="dashboard-bar-fill dashboard-bar-fill-inprogress"
                        style={{ width: `${(inprogressT / totalT) * 100}%` }} 
                        title={`In Progress: ${inprogressT} (${Math.round((inprogressT / totalT) * 100)}%)`} 
                      />
                    )}
                    {pendingT > 0 && (
                      <div 
                        className="dashboard-bar-fill dashboard-bar-fill-pending"
                        style={{ width: `${(pendingT / totalT) * 100}%` }} 
                        title={`Pending: ${pendingT} (${Math.round((pendingT / totalT) * 100)}%)`} 
                      />
                    )}
                    {blockersT > 0 && (
                      <div 
                        className="dashboard-bar-fill dashboard-bar-fill-blocker"
                        style={{ width: `${(blockersT / totalT) * 100}%` }} 
                        title={`Blockers: ${blockersT} (${Math.round((blockersT / totalT) * 100)}%)`} 
                      />
                    )}
                  </div>

                  {/* Completion percentage */}
                  <span className="dashboard-completion-percent">
                    {Math.round((completedT / totalT) * 100)}%
                  </span>
                </div>
              );
            })}
            

            <div className="dashboard-comparison-legend">
              <div className="dashboard-comparison-legend-item">
                <span className="legend-dot-circle bg-success" />
                <span>Completed</span>
              </div>
              <div className="dashboard-comparison-legend-item">
                <span className="legend-dot-circle bg-inprogress" />
                <span>In Progress</span>
              </div>
              <div className="dashboard-comparison-legend-item">
                <span className="legend-dot-circle bg-pending" />
                <span>Pending</span>
              </div>
              <div className="dashboard-comparison-legend-item">
                <span className="legend-dot-circle bg-blocker" />
                <span>Blocker</span>
              </div>
            </div>
          </div>
        )}
      </div>


      <div className="margin-top-32">
        <h3 className="health-section-title">Project Health Statistics</h3>
        <p className="health-section-subtitle">Detailed metrics breakdown and completion state for individual workspaces.</p>
        
        {projects.length === 0 ? (
          <div className="dash-health-empty-state">
            No workspaces registered. Create a project to monitor health metrics.
          </div>
        ) : (
          <div className="health-grid">
            {projects.map(p => {
              const projectTasks = tasks.filter(t => Number(t.projectId) === Number(p.id));
              const totalT = projectTasks.length;
              const completedT = projectTasks.filter(t => t.completed).length;
              const inprogressT = projectTasks.filter(t => t.status === 'In Progress' && !t.completed).length;
              const pendingT = projectTasks.filter(t => t.status === 'Pending' && !t.completed).length;
              const blockersT = projectTasks.filter(t => t.status === 'Blocker' && !t.completed).length;
              const pct = totalT > 0 ? Math.round((completedT / totalT) * 100) : 0;
              const hasBlocker = blockersT > 0;
              const projectMembers = members.filter(m => Number(m.projectId) === Number(p.id));

              return (
                <div 
                  key={p.id} 
                  className="project-health-card" 
                >

                  <div className="health-card-header">
                    <div className="health-card-title-container">
                      <FolderOpen size={16} strokeWidth={2} className="health-card-folder-icon" style={{ color: hasBlocker ? 'var(--blocker-text)' : 'var(--primary)' }} />
                      <span className="health-card-project-name" title={p.name}>
                        {p.name}
                      </span>
                    </div>
                    {hasBlocker ? (
                      <span className="health-status-badge health-status-badge-blocked">
                        <CircleAlert size={10} /> Blocked
                      </span>
                    ) : (
                      <span className={`health-status-badge ${totalT > 0 && pct === 100 ? 'health-status-badge-completed' : 'health-status-badge-active'}`}>
                        {totalT > 0 && pct === 100 ? <CircleCheck size={10} /> : <Zap size={10} />}
                        {totalT > 0 && pct === 100 ? 'Completed' : 'Active'}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="flex-column-gap-6">
                    <div className="flex-between-font-12-weight-600">
                      <span className="color-text-muted">Progress</span>
                      <span className="color-text-main">{pct}%</span>
                    </div>
                    <div className="health-progress-track">
                      <div 
                        className={`health-progress-fill ${hasBlocker ? 'health-progress-fill-blocked' : 'health-progress-fill-normal'}`} 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>


                  <div className="health-stats-row">
                    <div>
                      <div className="health-stat-label">Total Tasks</div>
                      <div className="health-stat-val">{totalT}</div>
                    </div>
                    <div>
                      <div className="health-stat-label success-text">Completed</div>
                      <div className="health-stat-val success-text">{completedT}</div>
                    </div>
                    <div>
                      <div className={`health-stat-label ${hasBlocker ? 'blocker-text' : 'inprogress-text'}`}>
                        {hasBlocker ? 'Blocked' : 'Active'}
                      </div>
                      <div className={`health-stat-val ${hasBlocker ? 'blocker-text' : 'inprogress-text'}`}>
                        {hasBlocker ? blockersT : (inprogressT + pendingT)}
                      </div>
                    </div>
                  </div>


                  <div className="health-card-footer">
                    <span className="health-team-label">Workspace Team</span>
                    {projectMembers.length === 0 ? (
                      <span className="health-no-members">No members</span>
                    ) : (
                      <div className="overlapping-avatars flex-align-center">
                        {projectMembers.slice(0, 3).map(m => (
                          <MemberAvatar
                            key={m.id}
                            name={m.name}
                            role={m.role}
                            size={22}
                            iconSize={10}
                            className="stacked-avatar"
                          />
                        ))}
                        {projectMembers.length > 3 && (
                          <div className="stacked-avatar-more-badge">
                            +{projectMembers.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

export default DashboardView;
