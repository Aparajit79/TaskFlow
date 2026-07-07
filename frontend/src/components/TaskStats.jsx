import React from 'react';

export function TaskStats({ tasks = [] }) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;

  const blockerStatus = tasks.filter(
    task => task.status === "Blocker" && !task.completed
  ).length;

  const pendingStatus = tasks.filter(
    task => task.status === "Pending" && !task.completed
  ).length;

  const inProgressStatus = tasks.filter(
    task => task.status === "In Progress" && !task.completed
  ).length;

  const completionRate     = totalTasks === 0 ? 0 : Math.round((completedTasks   / totalTasks) * 100);
  const inprogressPercent  = totalTasks === 0 ? 0 : Math.round((inProgressStatus / totalTasks) * 100);
  const blockerPercent     = totalTasks === 0 ? 0 : Math.round((blockerStatus    / totalTasks) * 100);
  const pendingPercent     = totalTasks === 0 ? 0 : Math.max(0, 100 - completionRate - inprogressPercent - blockerPercent);

  return (
    <div className="compact-stats-footer">
      <div className="footer-stats-row">
        <div className="footer-stat-items">
          <span className="footer-stat-chip" title="Total Tasks">
            <span className="dot dot-total"></span>
            <strong>{totalTasks}</strong> Total
          </span>
          <span className="footer-stat-chip" title="Pending Tasks">
            <span className="dot dot-pending"></span>
            <strong>{pendingStatus}</strong> Pending
          </span>
          <span className="footer-stat-chip" title="Tasks In Progress">
            <span className="dot dot-inprogress"></span>
            <strong>{inProgressStatus}</strong> In Progress
          </span>
          <span className="footer-stat-chip" title="Blockers">
            <span className="dot dot-blocker"></span>
            <strong>{blockerStatus}</strong> Blocker
          </span>
          <span className="footer-stat-chip" title="Completed Tasks">
            <span className="dot dot-completed"></span>
            <strong>{completedTasks}</strong> Completed
          </span>
        </div>
        
        <div className="footer-completion-rate">
          <span className="rate-label">Project Progress</span>
          <span className="rate-value">{completionRate}%</span>
        </div>
      </div>
      
      <div className="footer-segmented-bar">
        {totalTasks > 0 ? (
          <>
            <div className="segment segment-completed" style={{ width: `${completionRate}%` }} title={`Completed: ${completionRate}%`}></div>
            <div className="segment segment-inprogress" style={{ width: `${inprogressPercent}%` }} title={`In Progress: ${inprogressPercent}%`}></div>
            <div className="segment segment-pending" style={{ width: `${pendingPercent}%` }} title={`Pending: ${pendingPercent}%`}></div>
            <div className="segment segment-blocker" style={{ width: `${blockerPercent}%` }} title={`Blockers: ${blockerPercent}%`}></div>
          </>
        ) : (
          <div className="segment segment-empty"></div>
        )}
      </div>
    </div>
  );
}

export default React.memo(TaskStats);