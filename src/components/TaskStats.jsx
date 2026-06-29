import React from 'react';

export function TaskStats({ tasks = [] }) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const highPriorityTasks = tasks.filter(task => task.priority === 'High').length;
  const inProgressTasks = tasks.filter(
  task => task.status === "In Progress"
   ).length;

   const blockerStatus = tasks.filter(   
     task => task.status === "Blocker"
   ).length;

  const pendingStatus = tasks.filter(
    task => task.status === "Pending"
   ).length;

  const inProgressStatus = tasks.filter(
   task => task.status === "In Progress"
  ).length;

   const completionRate =
     totalTasks === 0
       ? 0
       : Math.round((completedTasks / totalTasks) * 100);
   
  return (
    <>
    <div className="task-stats">
      <div className="stat-card">
        <h3>Total Tasks</h3>
        <p>{totalTasks}</p>
      </div>

      <div className="stat-card">
        <h3>Pending</h3>
        <p>{pendingTasks}</p>
      </div>

    

      <div className="stat-card">
        <h3>Completed</h3>
        <p>{completedTasks}</p>
      </div>
      


<div className="stat-card progress-card">


  <div className="progress-bar">
    <div
      className="progress-fill"
      style={{ width: `${completionRate}%` }}
    ></div>
  </div>

  <p>{completionRate}%</p>
</div>



    </div>
  <div className="status-summary">
  <h4>Task Status</h4>

  <div className="status-items">
    <span>🟠 Pending Not Started: {pendingStatus}</span>
    <span>🔵 In Progress: {inProgressStatus}</span>
    <span>🔴 Blocker: {blockerStatus}</span>
    <span>🔴 Higher priority: {highPriorityTasks}</span>
  </div>
</div>
    </>
  );
}

export default React.memo(TaskStats);