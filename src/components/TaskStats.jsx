function TaskStats({ totalTasks }) {
  return (
    <div className="task-stats">
      <div className="stat-card">
        <h3>Total Tasks</h3>
        <p>{totalTasks}</p>
      </div>

      <div className="stat-card">
        <h3>Pending</h3>
        <p>-</p>
      </div>

      <div className="stat-card">
        <h3>High Priority</h3>
        <p>-</p>
      </div>

      <div className="stat-card">
        <h3>Completed</h3>
        <p>-</p>
      </div>
    </div>
  );
}

export default TaskStats;