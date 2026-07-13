import React, { useState, useEffect } from 'react';
import { 
  CircleCheck, Zap, Plus, Calendar, Check, MessageSquare, ShieldAlert, Award, Users
} from 'lucide-react';
import { useTaskFlow } from '../context/TaskFlowContext';

export function SprintsBoardView() {
  const {
    user,
    activeProject,
    tasks = [],
    sprints = [],
    members = [],
    scrumMeetings = [],
    retroItems = [],
    fetchScrumMeetings,
    fetchRetroItems,
    handleCreateSprint,
    handleCompleteSprint,
    handleAssignTaskToSprint,
    handleLogStandup,
    handleCreateRetroItem,
    handleVoteRetroItem,
    handleToggleTask
  } = useTaskFlow();

  const [activeTab, setActiveTab] = useState('Planning'); // 'Planning', 'Standup', 'Retro'
  const [durationWeeks, setDurationWeeks] = useState(2);
  const [sprintGoal, setSprintGoal] = useState('');

  // Daily standup form state
  const [yesterdayDone, setYesterdayDone] = useState('');
  const [todayPlan, setTodayPlan] = useState('');
  const [blockers, setBlockers] = useState('');
  const [standupSuccess, setStandupSuccess] = useState(false);

  // Retro item state
  const [retroContentWell, setRetroContentWell] = useState('');
  const [retroContentImprove, setRetroContentImprove] = useState('');
  const [retroContentAction, setRetroContentAction] = useState('');

  const activeSprint = sprints.find(s => s.status === 'active');
  const projectTasks = tasks.filter(t => Number(t.projectId) === Number(activeProject));
  const backlogTasks = projectTasks.filter(t => !t.sprintId);
  const sprintTasks = projectTasks.filter(t => t.sprintId === activeSprint?.id);
  const projectMembers = members.filter(m => Number(m.projectId) === Number(activeProject));

  // Fetch standups and retros whenever the active sprint loads/changes
  useEffect(() => {
    if (activeSprint) {
      fetchScrumMeetings(activeSprint.id);
      fetchRetroItems(activeSprint.id);
    }
  }, [activeSprint, fetchScrumMeetings, fetchRetroItems]);

  const handleCreateSprintSubmit = async (e) => {
    e.preventDefault();
    if (!activeProject) return;
    const res = await handleCreateSprint(activeProject, durationWeeks, sprintGoal);
    if (res.ok) {
      setSprintGoal('');
    } else {
      alert(res.error || 'Failed to create sprint');
    }
  };

  const handleCompleteSprintClick = async () => {
    if (!activeSprint) return;
    if (window.confirm(`Are you sure you want to complete Sprint ${activeSprint.sprintNumber}? Any uncompleted tasks will roll back to the backlog.`)) {
      const res = await handleCompleteSprint(activeSprint.id, activeProject);
      if (!res.ok) {
        alert(res.error || 'Failed to complete sprint');
      }
    }
  };

  const handleLogStandupSubmit = async (e) => {
    e.preventDefault();
    if (!activeSprint) return;
    const res = await handleLogStandup(activeSprint.id, yesterdayDone, todayPlan, blockers);
    if (res.ok) {
      setYesterdayDone('');
      setTodayPlan('');
      setBlockers('');
      setStandupSuccess(true);
      setTimeout(() => setStandupSuccess(false), 3000);
      fetchScrumMeetings(activeSprint.id);
    } else {
      alert(res.error || 'Failed to log standup');
    }
  };

  const handleCreateRetroSubmit = async (category, content, setContent) => {
    if (!activeSprint || !content.trim()) return;
    const res = await handleCreateRetroItem(activeSprint.id, category, content.trim());
    if (res.ok) {
      setContent('');
      fetchRetroItems(activeSprint.id);
    } else {
      alert(res.error || 'Failed to create retro item');
    }
  };

  return (
    <div className="scrum-view-container" style={{ padding: '24px 0', overflowY: 'auto', height: '100%' }}>
      {/* Header section matching other views */}
      <div className="scrum-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Sprints Board</h1>
          <p className="scrum-subtitle" style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>Plan sprints, log daily updates, and review retrospectives.</p>
        </div>

        {activeSprint && user?.role === 'admin' && (
          <button 
            onClick={handleCompleteSprintClick}
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--blocker-text)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Complete Sprint {activeSprint.sprintNumber}
          </button>
        )}
      </div>

      {/* Sprint Metadata Header Banner if active */}
      {activeSprint && (
        <div style={{
          backgroundColor: 'var(--primary-light)',
          border: '1px solid var(--primary-glow)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>Sprint {activeSprint.sprintNumber} Goal</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              {activeSprint.goal || 'No goal set for this sprint.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} />
              <span>Ends: {new Date(activeSprint.endDate).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} style={{ color: 'var(--inprogress-text)' }} />
              <span>Duration: {activeSprint.durationWeeks} Week{activeSprint.durationWeeks > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sprint Team Activity & Status Cards Grid */}
      {activeSprint && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} style={{ color: 'var(--primary)' }} />
            Sprint Team Activity & Status
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {projectMembers.map(member => {
              const memberSprintTasks = sprintTasks.filter(t => Number(t.assignedMemberId) === Number(member.id));
              const totalTasksCount = memberSprintTasks.length;
              const completedTasksCount = memberSprintTasks.filter(t => t.completed).length;
              const progressPct = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
              
              const loggedToday = scrumMeetings.some(meet => 
                Number(meet.userId) === Number(member.userId) && 
                new Date(meet.createdAt).toDateString() === new Date().toDateString()
              );

              return (
                <div key={member.id} style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {/* Left: Avatar with Status Dot */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontWeight: '700',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Status Dot: green if logged today, gray if pending */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: loggedToday ? 'var(--success-text)' : 'var(--text-light)',
                      border: '2px solid var(--bg-card)'
                    }} title={loggedToday ? 'Standup Submitted Today' : 'Standup Pending Today'} />
                  </div>

                  {/* Right: Info */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {member.role}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-light)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Sprint Tasks: {completedTasksCount}/{totalTasksCount}</span>
                      <span>{progressPct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs Row */}
      <div className="scrum-tabs" style={{ 
        display: 'flex', 
        gap: '8px', 
        borderBottom: '1px solid var(--border-color)', 
        paddingBottom: '0', 
        marginBottom: '24px' 
      }}>
        {['Planning', 'Standup', 'Retro'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '-1px'
            }}
          >
            {tab === 'Planning' ? 'Sprint Planning' : tab === 'Standup' ? 'Daily Standups' : 'Sprint Retrospective'}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="scrum-tab-content">
        
        {/* Tab 1: Sprint Planning */}
        {activeTab === 'Planning' && (
          <div>
            {!activeSprint ? (
              // No Active Sprint state
              <div style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
                maxWidth: '600px',
                margin: '40px auto'
              }}>
                <Zap size={40} style={{ color: 'var(--primary)', marginBottom: '16px', opacity: 0.7 }} />
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 8px 0' }}>No Active Sprint</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 24px 0', lineHeight: '1.5' }}>
                  There is currently no running sprint in this workspace. 
                  {user?.role === 'admin' ? ' Set the sprint duration and start a new sprint below.' : ' Please contact your administrator to start a sprint.'}
                </p>

                {user?.role === 'admin' && (
                  <form onSubmit={handleCreateSprintSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Sprint Duration (Weeks)</label>
                      <select 
                        value={durationWeeks} 
                        onChange={(e) => setDurationWeeks(Number(e.target.value))}
                        className="select-input"
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
                      >
                        {[1, 2, 3, 4, 5, 6].map(w => (
                          <option key={w} value={w}>{w} Week{w > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Sprint Goal</label>
                      <textarea
                        value={sprintGoal}
                        onChange={(e) => setSprintGoal(e.target.value)}
                        placeholder="e.g. Refactor API endpoints and build analytical export layouts."
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                        required
                      />
                    </div>

                    <button 
                      type="submit"
                      className="inline-add-primary-btn"
                      style={{ padding: '12px', borderRadius: '8px', fontWeight: '600', width: '100%', border: 'none', cursor: 'pointer', backgroundColor: 'var(--primary)', color: '#fff' }}
                    >
                      Start New Sprint
                    </button>
                  </form>
                )}
              </div>
            ) : (
              // Active Sprint Planning Workspace
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                
                {/* Backlog Column */}
                <div style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '16px', 
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  minHeight: '400px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Backlog Tasks</h3>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-light)', backgroundColor: 'var(--border-color)', padding: '2px 8px', borderRadius: '10px' }}>
                      {backlogTasks.length} task{backlogTasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '450px' }}>
                    {backlogTasks.length === 0 ? (
                      <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', margin: '24px 0' }}>No tasks in Backlog.</p>
                    ) : (
                      backlogTasks.map(t => (
                        <div key={t.id} style={{
                          backgroundColor: 'var(--bg-app)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.text}>
                            {t.text}
                          </span>
                          {user?.role === 'admin' && (
                            <button 
                              onClick={() => handleAssignTaskToSprint(t.id, activeSprint.id)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                backgroundColor: 'var(--primary-light)',
                                border: '1px solid var(--primary-glow)',
                                color: 'var(--primary)',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <Plus size={10} style={{ marginRight: 4 }} /> Add to Sprint
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Sprint Kanban Board Column */}
                <div style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '16px', 
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  minHeight: '400px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Active Sprint Board</h3>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#fff', backgroundColor: 'var(--primary)', padding: '2px 8px', borderRadius: '10px' }}>
                      {sprintTasks.length} task{sprintTasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '450px' }}>
                    {sprintTasks.length === 0 ? (
                      <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', margin: '24px 0' }}>Sprint board is empty. Move backlog tasks here.</p>
                    ) : (
                      sprintTasks.map(t => (
                        <div key={t.id} style={{
                          backgroundColor: 'var(--bg-app)',
                          border: t.status === 'Blocker' ? '1px solid var(--blocker-border)' : '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <button
                              onClick={() => handleToggleTask(t.id, t.completed)}
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                border: '1px solid var(--border-color)',
                                backgroundColor: t.completed ? 'var(--success-text)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              {t.completed && <Check size={11} color="#fff" />}
                            </button>
                            <span style={{ 
                              fontSize: '13px', 
                              fontWeight: '600', 
                              color: t.completed ? 'var(--text-muted)' : 'var(--text-main)', 
                              textDecoration: t.completed ? 'line-through' : 'none',
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap' 
                            }} title={t.text}>
                              {t.text}
                            </span>
                            {t.status === 'Blocker' && (
                              <span style={{ fontSize: '9px', fontWeight: '700', backgroundColor: 'var(--blocker-bg)', color: 'var(--blocker-text)', padding: '1px 4px', borderRadius: '3px', flexShrink: 0 }}>
                                BLOCKER
                              </span>
                            )}
                          </div>
                          
                          {user?.role === 'admin' && (
                            <button 
                              onClick={() => handleAssignTaskToSprint(t.id, null)}
                              title="Move back to backlog"
                              style={{
                                padding: '4px 6px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: 'var(--text-light)',
                                cursor: 'pointer',
                                fontSize: '11px',
                                borderRadius: '4px'
                              }}
                              className="logout-icon-btn"
                            >
                              Return
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Tab 2: Daily Standups */}
        {activeTab === 'Standup' && (
          <div>
            {!activeSprint ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Please start a sprint to view and log daily standups.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
                
                {/* Standup Log Form (For all project members) */}
                <div style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '16px', 
                  padding: '20px'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 16px 0' }}>Submit Standup Update</h3>
                  
                  {standupSuccess && (
                    <div style={{ 
                      backgroundColor: 'var(--success-bg)', 
                      color: 'var(--success-text)', 
                      border: '1px solid var(--success-border)',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <CircleCheck size={14} /> Standup submitted successfully!
                    </div>
                  )}

                  <form onSubmit={handleLogStandupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>1. What did you do yesterday?</label>
                      <textarea
                        value={yesterdayDone}
                        onChange={(e) => setYesterdayDone(e.target.value)}
                        placeholder="e.g. Finished implementing task filters in frontend context."
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '12px', minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>2. What will you do today?</label>
                      <textarea
                        value={todayPlan}
                        onChange={(e) => setTodayPlan(e.target.value)}
                        placeholder="e.g. Connect Daily Standup API endpoints to backend."
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '12px', minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>3. Do you have any blockers?</label>
                      <textarea
                        value={blockers}
                        onChange={(e) => setBlockers(e.target.value)}
                        placeholder="e.g. Database connection is sluggish. (Leave empty if none)"
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '12px', minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
                      />
                    </div>

                    <button 
                      type="submit"
                      className="inline-add-primary-btn"
                      style={{ padding: '10px', borderRadius: '6px', fontWeight: '600', width: '100%', border: 'none', cursor: 'pointer', backgroundColor: 'var(--primary)', color: '#fff' }}
                    >
                      Submit Standup Note
                    </button>
                  </form>
                </div>

                {/* Standup Feed - Admin Inbox view or general updates feed */}
                <div style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '16px', 
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                        {user?.role === 'admin' ? '📢 Admin Scrum Message Feed' : '📝 Team Standup Logs'}
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {user?.role === 'admin' ? 'Consolidated reports and blocker escalations from members.' : 'View daily project logs.'}
                      </p>
                    </div>
                    <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '480px' }}>
                    {scrumMeetings.length === 0 ? (
                      <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', margin: '24px 0' }}>No updates logged today yet.</p>
                    ) : (
                      scrumMeetings.map(meet => {
                        const cleanBlockers = meet.blockers ? meet.blockers.trim().toLowerCase() : '';
                        const hasBlocker = cleanBlockers && 
                                           cleanBlockers !== 'none' && 
                                           cleanBlockers !== 'no' && 
                                           cleanBlockers !== 'nil' && 
                                           cleanBlockers !== 'nothing' && 
                                           cleanBlockers !== 'no blockers' && 
                                           cleanBlockers !== 'no blocker';
                        return (
                          <div 
                            key={meet.id} 
                            style={{
                              border: hasBlocker ? '1px solid var(--blocker-border)' : '1px solid var(--border-color)',
                              backgroundColor: hasBlocker ? 'rgba(219, 39, 119, 0.04)' : 'var(--bg-app)',
                              borderRadius: '12px',
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}
                          >
                            {/* Card Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ 
                                  width: '24px', 
                                  height: '24px', 
                                  borderRadius: '50%', 
                                  backgroundColor: 'var(--border-color)', 
                                  color: 'var(--text-main)', 
                                  fontSize: '11px', 
                                  fontWeight: '700', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center' 
                                }}>
                                  {meet.userName?.charAt(0).toUpperCase()}
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>{meet.userName}</span>
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                                {new Date(meet.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Blocker Alert Banner if exists */}
                            {hasBlocker && (
                              <div style={{ 
                                backgroundColor: 'var(--blocker-bg)', 
                                color: 'var(--blocker-text)', 
                                border: '1px solid var(--blocker-border)',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: '600'
                              }}>
                                <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                                <span><strong>Blocker reported:</strong> {meet.blockers}</span>
                              </div>
                            )}

                            {/* Standup Content Columns */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px' }}>
                              <div>
                                <div style={{ fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Yesterday Accomplished:</div>
                                <div style={{ color: 'var(--text-main)', padding: '6px', backgroundColor: 'var(--bg-card)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{meet.yesterdayDone}</div>
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Today Plan:</div>
                                <div style={{ color: 'var(--text-main)', padding: '6px', backgroundColor: 'var(--bg-card)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{meet.todayPlan}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Tab 3: Retrospectives */}
        {activeTab === 'Retro' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'start' }}>
            
            {/* Column 1: What Went Well */}
            <div style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '16px', 
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ 
                backgroundColor: 'var(--success-bg)', 
                color: 'var(--success-text)', 
                border: '1px solid var(--success-border)',
                borderRadius: '8px', 
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '700',
                textAlign: 'center'
              }}>
                🟢 What Went Well
              </div>
              
              {/* Items list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '150px', maxHeight: '350px', overflowY: 'auto' }}>
                {retroItems.filter(item => item.category === 'well').map(item => (
                  <div key={item.id} style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)' }}>{item.content}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-light)', fontWeight: '500' }}>by {item.userName}</span>
                      <button 
                        onClick={() => handleVoteRetroItem(item.id)}
                        style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', borderRadius: '4px', color: 'var(--text-muted)', fontSize: '10px', padding: '2px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        👍 {item.votes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input container */}
              <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Add point..."
                  value={retroContentWell}
                  onChange={(e) => setRetroContentWell(e.target.value)}
                  style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
                />
                <button 
                  onClick={() => handleCreateRetroSubmit('well', retroContentWell, setRetroContentWell)}
                  style={{ padding: '8px 12px', fontSize: '12px', border: 'none', backgroundColor: 'var(--primary)', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Column 2: What Can Be Improved */}
            <div style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '16px', 
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ 
                backgroundColor: 'var(--blocker-bg)', 
                color: 'var(--blocker-text)', 
                border: '1px solid var(--blocker-border)',
                borderRadius: '8px', 
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '700',
                textAlign: 'center'
              }}>
                🔴 What Can Be Improved
              </div>
              
              {/* Items list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '150px', maxHeight: '350px', overflowY: 'auto' }}>
                {retroItems.filter(item => item.category === 'improve').map(item => (
                  <div key={item.id} style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)' }}>{item.content}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-light)', fontWeight: '500' }}>by {item.userName}</span>
                      <button 
                        onClick={() => handleVoteRetroItem(item.id)}
                        style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', borderRadius: '4px', color: 'var(--text-muted)', fontSize: '10px', padding: '2px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        👍 {item.votes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input container */}
              <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Add point..."
                  value={retroContentImprove}
                  onChange={(e) => setRetroContentImprove(e.target.value)}
                  style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
                />
                <button 
                  onClick={() => handleCreateRetroSubmit('improve', retroContentImprove, setRetroContentImprove)}
                  style={{ padding: '8px 12px', fontSize: '12px', border: 'none', backgroundColor: 'var(--primary)', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Column 3: Action Items */}
            <div style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '16px', 
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ 
                backgroundColor: 'var(--pending-bg)', 
                color: 'var(--pending-text)', 
                border: '1px solid var(--pending-border)',
                borderRadius: '8px', 
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '700',
                textAlign: 'center'
              }}>
                ⚡ Action Items
              </div>
              
              {/* Items list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '150px', maxHeight: '350px', overflowY: 'auto' }}>
                {retroItems.filter(item => item.category === 'action').map(item => (
                  <div key={item.id} style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)' }}>{item.content}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-light)', fontWeight: '500' }}>by {item.userName}</span>
                      <button 
                        onClick={() => handleVoteRetroItem(item.id)}
                        style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', borderRadius: '4px', color: 'var(--text-muted)', fontSize: '10px', padding: '2px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        👍 {item.votes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input container */}
              <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Add point..."
                  value={retroContentAction}
                  onChange={(e) => setRetroContentAction(e.target.value)}
                  style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
                />
                <button 
                  onClick={() => handleCreateRetroSubmit('action', retroContentAction, setRetroContentAction)}
                  style={{ padding: '8px 12px', fontSize: '12px', border: 'none', backgroundColor: 'var(--primary)', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Add
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default SprintsBoardView;
