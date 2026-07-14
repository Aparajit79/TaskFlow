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
    <div className="donut-wrapper" style={{ margin: '0 auto 16px auto', width: '150px', height: '150px', position: 'relative' }}>
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
      <div className="donut-center" style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <span className="donut-total" style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{total}</span>
        <span className="donut-label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>tasks</span>
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

  // Calculate dynamic weekly completions
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  
  // Get start of the current week (Monday)
  const now = new Date();
  const currentDayIndex = now.getDay(); // 0 is Sun, 1 is Mon, etc.
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
        const dayIdx = compDate.getDay(); // 0 is Sun, 1 is Mon, etc.
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

  // Filter out duplicate project-level memberships for global analytics
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
    <div className="dashboard-view-container" style={{ padding: '24px 0' }}>
      {/* Header section matching mockup style */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Analytics</h1>
          <p className="dashboard-subtitle" style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>Track your performance and productivity metrics.</p>
        </div>
        <button 
          onClick={handleExport}
          className="export-report-btn"
        >
          <Download size={14} />
          Export Report
        </button>
      </div>

      <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {kpis.map((k) => (
          <div 
            key={k.label} 
            className="kpi-card" 
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '16px', 
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'flex-start',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>{k.label}</span>
              <span style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--border-color)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: k.accent,
                flexShrink: 0
              }}>
                {k.icon}
              </span>
            </div>
            <span style={{ fontSize: '36px', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-1px', marginTop: '4px' }}>
              {k.value}
            </span>
          </div>
        ))}
      </div>

      {/* Weekly Completion & Pie Chart Layout */}
      <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        <div 
          className="dash-card" 
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '16px', 
            padding: '24px' 
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 24px 0' }}>Weekly Task Completion</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {weeklyData.map(day => {
              const percentage = Math.round((day.value / maxWeeklyValue) * 100);
              return (
                <div key={day.label} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600' }}>
                    <span style={{ color: 'var(--text-main)' }}>{day.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{day.value} task{day.value !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', width: '100%' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${percentage}%`, 
                        backgroundColor: 'var(--primary)', 
                        borderRadius: '4px',
                        transition: 'width 0.5s ease-out'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Status Distribution (Donut Chart) Card */}
        <div 
          className="dash-card" 
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '16px', 
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 24px 0' }}>Task Status Distribution</h3>
          
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

      {/* Project Performance Comparison (Stacked Bar Chart) */}
      <div 
        className="dash-card" 
        style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '16px', 
          padding: '24px',
          marginTop: '24px'
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 8px 0' }}>Project Performance Comparison</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>Compare task completion and active status ratios across all projects.</p>
        
        {projects.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            No active projects found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {projects.map(p => {
              const projectTasks = tasks.filter(t => Number(t.projectId) === Number(p.id));
              const totalT = projectTasks.length;
              const completedT = projectTasks.filter(t => t.completed).length;
              const inprogressT = projectTasks.filter(t => t.status === 'In Progress' && !t.completed).length;
              const pendingT = projectTasks.filter(t => t.status === 'Pending' && !t.completed).length;
              const blockersT = projectTasks.filter(t => t.status === 'Blocker' && !t.completed).length;

              if (totalT === 0) {
                return (
                  <div key={p.id} className="dashboard-project-comparison-row" style={{ display: 'grid', gridTemplateColumns: '200px 250px 80px', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>
                      {p.name}
                    </span>
                    <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', backgroundColor: 'var(--border-color)', width: '100%' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>0%</span>
                  </div>
                );
              }

              return (
                <div key={p.id} className="dashboard-project-comparison-row" style={{ display: 'grid', gridTemplateColumns: '200px 250px 80px', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>
                    {p.name}
                  </span>
                  
                  {/* Stacked bar */}
                  <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', backgroundColor: 'var(--border-color)', width: '100%' }}>
                    {completedT > 0 && (
                      <div 
                        style={{ width: `${(completedT / totalT) * 100}%`, backgroundColor: 'var(--success-text)', transition: 'width 0.3s ease' }} 
                        title={`Completed: ${completedT} (${Math.round((completedT / totalT) * 100)}%)`} 
                      />
                    )}
                    {inprogressT > 0 && (
                      <div 
                        style={{ width: `${(inprogressT / totalT) * 100}%`, backgroundColor: 'var(--inprogress-text)', transition: 'width 0.3s ease' }} 
                        title={`In Progress: ${inprogressT} (${Math.round((inprogressT / totalT) * 100)}%)`} 
                      />
                    )}
                    {pendingT > 0 && (
                      <div 
                        style={{ width: `${(pendingT / totalT) * 100}%`, backgroundColor: 'var(--pending-text)', transition: 'width 0.3s ease' }} 
                        title={`Pending: ${pendingT} (${Math.round((pendingT / totalT) * 100)}%)`} 
                      />
                    )}
                    {blockersT > 0 && (
                      <div 
                        style={{ width: `${(blockersT / totalT) * 100}%`, backgroundColor: 'var(--blocker-text)', transition: 'width 0.3s ease' }} 
                        title={`Blockers: ${blockersT} (${Math.round((blockersT / totalT) * 100)}%)`} 
                      />
                    )}
                  </div>

                  {/* Completion percentage */}
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>
                    {Math.round((completedT / totalT) * 100)}%
                  </span>
                </div>
              );
            })}
            
            {/* Legend for the comparison rows */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success-text)' }} />
                <span>Completed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--inprogress-text)' }} />
                <span>In Progress</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--pending-text)' }} />
                <span>Pending</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--blocker-text)' }} />
                <span>Blocker</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Project Health Cards Grid */}
      <div style={{ marginTop: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 8px 0' }}>Project Health Statistics</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>Detailed metrics breakdown and completion state for individual workspaces.</p>
        
        {projects.length === 0 ? (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No workspaces registered. Create a project to monitor health metrics.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
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
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  {/* Card Title & Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <FolderOpen size={16} strokeWidth={2} style={{ color: hasBlocker ? 'var(--blocker-text)' : 'var(--primary)', flexShrink: 0 }} />
                      <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>
                        {p.name}
                      </span>
                    </div>
                    {hasBlocker ? (
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        color: 'var(--blocker-text)', 
                        backgroundColor: 'var(--blocker-bg)', 
                        padding: '2px 8px', 
                        borderRadius: '10px',
                        border: '1px solid var(--blocker-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0
                      }}>
                        <CircleAlert size={10} /> Blocked
                      </span>
                    ) : (
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        color: totalT > 0 && pct === 100 ? 'var(--success-text)' : 'var(--inprogress-text)', 
                        backgroundColor: totalT > 0 && pct === 100 ? 'var(--success-bg)' : 'var(--inprogress-bg)', 
                        padding: '2px 8px', 
                        borderRadius: '10px',
                        border: totalT > 0 && pct === 100 ? '1px solid var(--success-border)' : '1px solid var(--inprogress-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0
                      }}>
                        {totalT > 0 && pct === 100 ? <CircleCheck size={10} /> : <Zap size={10} />}
                        {totalT > 0 && pct === 100 ? 'Completed' : 'Active'}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                      <span style={{ color: 'var(--text-main)' }}>{pct}%</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: hasBlocker ? 'var(--blocker-text)' : 'var(--primary)',
                        borderRadius: '3px',
                        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                      }} />
                    </div>
                  </div>

                  {/* Stats counts summary */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '8px', 
                    borderTop: '1px solid var(--border-color)', 
                    borderBottom: '1px solid var(--border-color)',
                    padding: '12px 0', 
                    textAlign: 'center' 
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Tasks</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>{totalT}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--success-text)' }}>Completed</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--success-text)', marginTop: '2px' }}>{completedT}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: hasBlocker ? 'var(--blocker-text)' : 'var(--inprogress-text)' }}>
                        {hasBlocker ? 'Blocked' : 'Active'}
                      </div>
                      <div style={{ 
                        fontSize: '15px', 
                        fontWeight: '700', 
                        color: hasBlocker ? 'var(--blocker-text)' : 'var(--inprogress-text)',
                        marginTop: '2px' 
                      }}>
                        {hasBlocker ? blockersT : (inprogressT + pendingT)}
                      </div>
                    </div>
                  </div>

                  {/* Members Avatars stacked */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Workspace Team</span>
                    {projectMembers.length === 0 ? (
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontStyle: 'italic' }}>No members</span>
                    ) : (
                      <div className="overlapping-avatars" style={{ display: 'flex', alignItems: 'center' }}>
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
                          <div 
                            className="stacked-avatar more-avatar" 
                            style={{ 
                              width: '22px', 
                              height: '22px', 
                              borderRadius: '50%', 
                              backgroundColor: 'var(--border-color)', 
                              color: 'var(--text-main)', 
                              fontSize: '10px', 
                              fontWeight: '700', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              marginLeft: '-6px',
                              border: '2px solid var(--bg-card)'
                            }}
                          >
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
