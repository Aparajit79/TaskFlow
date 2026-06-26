import React from 'react';

export function TaskStats({ tasks = [] }) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const highPriorityTasks = tasks.filter(task => task.priority === 'High').length;

  return (
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
        <h3>High Priority</h3>
        <p>{highPriorityTasks}</p>
      </div>

      <div className="stat-card">
        <h3>Completed</h3>
        <p>{completedTasks}</p>
      </div>
    </div>
  );
}

export default TaskStats;