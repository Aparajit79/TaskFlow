import React from 'react';
import {
  FolderOpen, Users, CircleCheck, Download
} from 'lucide-react';
import { useTaskFlow } from '../context/TaskFlowContext';
import Papa from "papaparse";

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

  const kpis = [
    { icon: <CircleCheck size={18} strokeWidth={2} />, label: 'Total Tasks Completed', value: completed, accent: 'var(--success-text)' },
    { icon: <FolderOpen  size={18} strokeWidth={2} />, label: 'Active Projects',       value: projects.length, accent: 'var(--primary)' },
    { icon: <Users       size={18} strokeWidth={2} />, label: 'Team Members',          value: members.length, accent: 'var(--inprogress-text)' },
  ];

const handleExport = () => {
  const csvData = [
    { Metric: "Total Tasks", Value: total },
    { Metric: "Completed Tasks", Value: completed },
    { Metric: "In Progress Tasks", Value: inprogress },
    { Metric: "Pending Tasks", Value: pending },
    { Metric: "Blockers", Value: blockers },
    { Metric: "Active Projects", Value: projects.length },
    { Metric: "Team Members", Value: members.length },
  ];

  const csv = Papa.unparse(csvData);

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "task-report.csv";
  link.click();

  URL.revokeObjectURL(link.href);
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
          
          <div className="donut-layout" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', flex: 1, justifyContent: 'center' }}>
            <DonutChart segments={donutSegments} total={total} />
            
            <div className="donut-legend" style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
              {donutSegments.map(s => (
                <div key={s.label} className="legend-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span className="legend-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }} />
                  <span className="legend-text" style={{ color: 'var(--text-muted)', flex: 1 }}>{s.label}</span>
                  <span className="legend-val" style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardView;
