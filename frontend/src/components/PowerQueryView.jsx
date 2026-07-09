import React, { useState, useEffect, useCallback } from 'react';
import { 
  Terminal, Search, Database, Copy, Check, 
  TriangleAlert, RefreshCw, Play, Filter 
} from 'lucide-react';
import { useTasks, useMembers } from "../context/TaskFlowContext";

export function PowerQueryView() {
  const { projects = [], handleQueryTasks } = useTasks();
  const { members = [] } = useMembers();

  const [projectId, setProjectId] = useState('All');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [assignedMemberId, setAssignedMemberId] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [methodUsed, setMethodUsed] = useState('QUERY');
  const [copied, setCopied] = useState(false);
  const [cacheStatus, setCacheStatus] = useState('BYPASS');
  const [responseTime, setResponseTime] = useState('unknown');

  // Build the HTTP Request representation dynamically
  const buildHttpRequest = useCallback(() => {
    const filterObj = {};
    if (projectId !== 'All') filterObj.projectId = Number(projectId);
    if (status !== 'All') filterObj.status = status;
    if (priority !== 'All') filterObj.priority = priority;
    if (assignedMemberId !== 'All') {
      filterObj.assignedMemberId = assignedMemberId === 'Unassigned' ? 'Unassigned' : Number(assignedMemberId);
    }
    if (searchTerm.trim() !== '') filterObj.searchTerm = searchTerm.trim();

    const jsonBody = JSON.stringify(filterObj, null, 2);
    
    return {
      rawHttp: `QUERY /api/tasks/query HTTP/1.1\nHost: localhost:5000\nContent-Type: application/json\nCache-Control: max-age=3600\n\n${jsonBody}`,
      bodyObj: filterObj
    };
  }, [projectId, status, priority, assignedMemberId, searchTerm]);

  const { rawHttp, bodyObj } = buildHttpRequest();

  const runQuery = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await handleQueryTasks(bodyObj);
      if (res.ok) {
        setResults(res.data);
        setMethodUsed(res.methodUsed);
        setCacheStatus(res.cacheStatus);
        setResponseTime(res.responseTime);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bodyObj, handleQueryTasks]);

  // Run when filters change
  useEffect(() => {
    runQuery();
  }, [projectId, status, priority, assignedMemberId]);

  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter') {
      runQuery();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawHttp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getProjectName = (projId) => {
    const proj = projects.find(p => Number(p.id) === Number(projId));
    return proj ? proj.name : 'Unknown';
  };

  const getAssigneeName = (memberId) => {
    const mem = members.find(m => Number(m.id) === Number(memberId));
    return mem ? mem.name : 'Unassigned';
  };

  return (
    <div className="view-container power-query-container">
      <div className="view-header">
        <div className="view-header-left">
          <div className="title-row-flex">
            <h1>Power Query Console</h1>
            <span className="rfc-tag">RFC 10008</span>
          </div>
          <p className="view-subtitle">
            Perform complex, safe, and cacheable search queries sending structured payload bodies using HTTP <code>QUERY</code>.
          </p>
        </div>
        <button className="primary-btn run-query-btn" onClick={runQuery} disabled={loading}>
          <Play size={14} fill="currentColor" style={{ marginRight: 6 }} />
          <span>Execute Request</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="app-card query-filter-card">
        <div className="filter-card-header">
          <Filter size={14} className="filter-header-icon" />
          <h3>Dynamic Query Filters</h3>
        </div>
        <div className="query-filter-grid">
          <div className="filter-group">
            <label>Workspace</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="select-input">
              <option value="All">All Workspaces</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="select-input">
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocker">Blocker</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="select-input">
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Assignee</label>
            <select value={assignedMemberId} onChange={(e) => setAssignedMemberId(e.target.value)} className="select-input">
              <option value="All">All Assignees</option>
              <option value="Unassigned">Unassigned</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({getProjectName(m.projectId)})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group search-keyword-group">
            <label>Keyword Search</label>
            <div className="search-input-wrapper">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search text or description... (Press Enter)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                className="task-input search-with-icon"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="power-query-split-layout">
        <div className="app-card power-query-terminal">
          <div className="terminal-header">
            <div className="terminal-header-left">
              <Terminal size={14} className="terminal-icon" />
              <span>HTTP Request Debugger</span>
            </div>
            <div className="terminal-actions">
              <span className={`method-pill ${methodUsed === 'QUERY' ? 'method-query' : 'method-post'}`}>
                Active: {methodUsed}
              </span>
              <button className="terminal-copy-btn" onClick={copyToClipboard} title="Copy RAW Request">
                {copied ? <Check size={13} style={{ color: 'var(--success-text)' }} /> : <Copy size={13} />}
              </button>
            </div>
          </div>
          <div className="terminal-body">
            <pre className="terminal-code">
              <code>{rawHttp}</code>
            </pre>
          </div>
        </div>

        {/* Right: Results List */}
        <div className="app-card power-query-results">
          <div className="results-header">
            <div className="results-header-left">
              <Database size={14} className="database-icon" />
              <h3>Database Response ({results.length} tasks found)</h3>
            </div>
            <div className="results-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {!loading && responseTime !== 'unknown' && (
                <span className="latency-badge" style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-light)' }}>
                  Latency: {responseTime}
                </span>
              )}
              {!loading && cacheStatus && (
                <span className={`cache-badge cache-badge-${cacheStatus.toLowerCase()}`} style={{
                  fontSize: '11px', 
                  fontWeight: '700', 
                  borderRadius: '4px', 
                  padding: '2px 6px', 
                  fontFamily: 'monospace',
                  backgroundColor: cacheStatus === 'HIT' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                  color: cacheStatus === 'HIT' ? 'var(--success-text)' : 'var(--warning-text)',
                  border: cacheStatus === 'HIT' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(249, 115, 22, 0.3)'
                }}>
                  Cache: {cacheStatus}
                </span>
              )}
              {loading && <RefreshCw size={14} className="spinning-loader" />}
            </div>
          </div>
          
          <div className="results-body">
            {error && (
              <div className="alert alert-danger error-alert">
                <TriangleAlert size={16} />
                <div><strong>Error querying database:</strong> {error}</div>
              </div>
            )}

            {!error && results.length === 0 && !loading && (
              <div className="query-empty-state">
                <Database size={32} strokeWidth={1.5} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p>No matching tasks in database. Try widening your filter parameters.</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="query-results-table-wrapper">
                <table className="query-results-table">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Workspace</th>
                      <th>Status / Priority</th>
                      <th>Assignee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((task) => (
                      <tr key={task.id} className={task.completed ? 'task-completed-row' : ''}>
                        <td>
                          <div className="task-title-cell">
                            <strong>{task.text}</strong>
                            {task.description && <p>{task.description}</p>}
                          </div>
                        </td>
                        <td>
                          <span className="workspace-cell-name">
                            {getProjectName(task.projectId)}
                          </span>
                        </td>
                        <td>
                          <div className="tags-cell">
                            <span className={`badge priority-badge-${task.priority.toLowerCase()}`}>
                              {task.priority}
                            </span>
                            <span className={`badge status-badge-${task.status.toLowerCase().replace(' ', '')}`}>
                              {task.status}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="assignee-cell-name">
                            {getAssigneeName(task.assignedMemberId)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PowerQueryView;
