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
    <div className="scrum-view-container sprints-extracted-1" >
      {/* Header section matching other views */}
      <div className="scrum-header sprints-extracted-2" >
        <div>
          <h1 className="sprints-extracted-3">Sprints Board</h1>
          <p className="scrum-subtitle sprints-extracted-4" >Plan sprints, log daily updates, and review retrospectives.</p>
        </div>

        {activeSprint && user?.role === 'admin' && (
          <button 
            onClick={handleCompleteSprintClick}
            className="sprints-extracted-5"
          >
            Complete Sprint {activeSprint.sprintNumber}
          </button>
        )}
      </div>

      {/* Sprint Metadata Header Banner if active */}
      {activeSprint && (
        <div className="sprints-extracted-6">
          <div>
            <div className="sprints-extracted-7">
              <Award size={18} className="sprints-extracted-8" />
              <span className="sprints-extracted-9">Sprint {activeSprint.sprintNumber} Goal</span>
            </div>
            <p className="sprints-extracted-10">
              {activeSprint.goal || 'No goal set for this sprint.'}
            </p>
          </div>
          <div className="sprints-extracted-11">
            <div className="sprints-extracted-12">
              <Calendar size={14} />
              <span>Ends: {new Date(activeSprint.endDate).toLocaleDateString()}</span>
            </div>
            <div className="sprints-extracted-13">
              <Zap size={14} className="sprints-extracted-14" />
              <span>Duration: {activeSprint.durationWeeks} Week{activeSprint.durationWeeks > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sprint Team Activity & Status Cards Grid */}
      {activeSprint && (
        <div className="sprints-extracted-15">
          <h3 className="sprints-extracted-16">
            <Users size={16} className="sprints-extracted-17" />
            Sprint Team Activity & Status
          </h3>
          <div className="sprints-extracted-18">
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
                <div key={member.id} className="sprints-extracted-19">
                  {/* Left: Avatar with Status Dot */}
                  <div className="sprints-extracted-20">
                    <div className="sprints-extracted-21">
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
                  <div className="sprints-extracted-22">
                    <div className="sprints-extracted-23">
                      {member.name}
                    </div>
                    <div className="sprints-extracted-24">
                      {member.role}
                    </div>
                    <div className="sprints-extracted-25">
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
      <div className="scrum-tabs sprints-extracted-26" >
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
              <div className="sprints-extracted-27">
                <Zap size={40} className="sprints-extracted-28" />
                <h3 className="sprints-extracted-29">No Active Sprint</h3>
                <p className="sprints-extracted-30">
                  There is currently no running sprint in this workspace. 
                  {user?.role === 'admin' ? ' Set the sprint duration and start a new sprint below.' : ' Please contact your administrator to start a sprint.'}
                </p>

                {user?.role === 'admin' && (
                  <form onSubmit={handleCreateSprintSubmit} className="sprints-extracted-31">
                    <div className="sprints-extracted-32">
                      <label className="sprints-extracted-33">Sprint Duration (Weeks)</label>
                      <select 
                        value={durationWeeks} 
                        onChange={(e) => setDurationWeeks(Number(e.target.value))}
                        className="select-input sprints-extracted-34"
                        
                      >
                        {[1, 2, 3, 4, 5, 6].map(w => (
                          <option key={w} value={w}>{w} Week{w > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sprints-extracted-35">
                      <label className="sprints-extracted-36">Sprint Goal</label>
                      <textarea
                        value={sprintGoal}
                        onChange={(e) => setSprintGoal(e.target.value)}
                        placeholder="e.g. Refactor API endpoints and build analytical export layouts."
                        className="sprints-extracted-37"
                        required
                      />
                    </div>

                    <button 
                      type="submit"
                      className="inline-add-primary-btn sprints-extracted-38"
                      
                    >
                      Start New Sprint
                    </button>
                  </form>
                )}
              </div>
            ) : (
              // Active Sprint Planning Workspace
              <div className="sprints-extracted-39">
                
                {/* Backlog Column */}
                <div className="sprints-extracted-40">
                  <div className="sprints-extracted-41">
                    <h3 className="sprints-extracted-42">Backlog Tasks</h3>
                    <span className="sprints-extracted-43">
                      {backlogTasks.length} task{backlogTasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="sprints-extracted-44">
                    {backlogTasks.length === 0 ? (
                      <p className="sprints-extracted-45">No tasks in Backlog.</p>
                    ) : (
                      backlogTasks.map(t => (
                        <div key={t.id} className="sprints-extracted-46">
                          <span className="sprints-extracted-47" title={t.text}>
                            {t.text}
                          </span>
                          {user?.role === 'admin' && (
                            <button 
                              onClick={() => handleAssignTaskToSprint(t.id, activeSprint.id)}
                              className="sprints-extracted-48"
                            >
                              <Plus size={10} className="sprints-extracted-49" /> Add to Sprint
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Sprint Kanban Board Column */}
                <div className="sprints-extracted-50">
                  <div className="sprints-extracted-51">
                    <h3 className="sprints-extracted-52">Active Sprint Board</h3>
                    <span className="sprints-extracted-53">
                      {sprintTasks.length} task{sprintTasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="sprints-extracted-54">
                    {sprintTasks.length === 0 ? (
                      <p className="sprints-extracted-55">Sprint board is empty. Move backlog tasks here.</p>
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
                          <div className="sprints-extracted-56">
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
                              <span className="sprints-extracted-57">
                                BLOCKER
                              </span>
                            )}
                          </div>
                          
                          {user?.role === 'admin' && (
                            <button 
                              onClick={() => handleAssignTaskToSprint(t.id, null)}
                              title="Move back to backlog"
                              className="logout-icon-btn sprints-extracted-58"
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
              <div className="sprints-extracted-59">
                Please start a sprint to view and log daily standups.
              </div>
            ) : (
              <div className="sprints-extracted-60">
                
                {/* Standup Log Form (For all project members) */}
                <div className="sprints-extracted-61">
                  <h3 className="sprints-extracted-62">Submit Standup Update</h3>
                  
                  {standupSuccess && (
                    <div className="sprints-extracted-63">
                      <CircleCheck size={14} /> Standup submitted successfully!
                    </div>
                  )}

                  <form onSubmit={handleLogStandupSubmit} className="sprints-extracted-64">
                    <div className="sprints-extracted-65">
                      <label className="sprints-extracted-66">1. What did you do yesterday?</label>
                      <textarea
                        value={yesterdayDone}
                        onChange={(e) => setYesterdayDone(e.target.value)}
                        placeholder="e.g. Finished implementing task filters in frontend context."
                        className="sprints-extracted-67"
                        required
                      />
                    </div>

                    <div className="sprints-extracted-68">
                      <label className="sprints-extracted-69">2. What will you do today?</label>
                      <textarea
                        value={todayPlan}
                        onChange={(e) => setTodayPlan(e.target.value)}
                        placeholder="e.g. Connect Daily Standup API endpoints to backend."
                        className="sprints-extracted-70"
                        required
                      />
                    </div>

                    <div className="sprints-extracted-71">
                      <label className="sprints-extracted-72">3. Do you have any blockers?</label>
                      <textarea
                        value={blockers}
                        onChange={(e) => setBlockers(e.target.value)}
                        placeholder="e.g. Database connection is sluggish. (Leave empty if none)"
                        className="sprints-extracted-73"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="inline-add-primary-btn sprints-extracted-74"
                      
                    >
                      Submit Standup Note
                    </button>
                  </form>
                </div>

                {/* Standup Feed - Admin Inbox view or general updates feed */}
                <div className="sprints-extracted-75">
                  <div className="sprints-extracted-76">
                    <div>
                      <h3 className="sprints-extracted-77">
                        {user?.role === 'admin' ? '📢 Admin Scrum Message Feed' : '📝 Team Standup Logs'}
                      </h3>
                      <p className="sprints-extracted-78">
                        {user?.role === 'admin' ? 'Consolidated reports and blocker escalations from members.' : 'View daily project logs.'}
                      </p>
                    </div>
                    <MessageSquare size={18} className="sprints-extracted-79" />
                  </div>

                  <div className="sprints-extracted-80">
                    {scrumMeetings.length === 0 ? (
                      <p className="sprints-extracted-81">No updates logged today yet.</p>
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
                            <div className="sprints-extracted-82">
                              <div className="sprints-extracted-83">
                                <span className="sprints-extracted-84">
                                  {meet.userName?.charAt(0).toUpperCase()}
                                </span>
                                <span className="sprints-extracted-85">{meet.userName}</span>
                              </div>
                              <span className="sprints-extracted-86">
                                {new Date(meet.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Blocker Alert Banner if exists */}
                            {hasBlocker && (
                              <div className="sprints-extracted-87">
                                <ShieldAlert size={14} className="sprints-extracted-88" />
                                <span><strong>Blocker reported:</strong> {meet.blockers}</span>
                              </div>
                            )}

                            {/* Standup Content Columns */}
                            <div className="sprints-extracted-89">
                              <div>
                                <div className="sprints-extracted-90">Yesterday Accomplished:</div>
                                <div className="sprints-extracted-91">{meet.yesterdayDone}</div>
                              </div>
                              <div>
                                <div className="sprints-extracted-92">Today Plan:</div>
                                <div className="sprints-extracted-93">{meet.todayPlan}</div>
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
          <div className="sprints-extracted-94">
            
            {/* Column 1: What Went Well */}
            <div className="sprints-extracted-95">
              <div className="sprints-extracted-96">
                🟢 What Went Well
              </div>
              
              {/* Items list */}
              <div className="sprints-extracted-97">
                {retroItems.filter(item => item.category === 'well').map(item => (
                  <div key={item.id} className="sprints-extracted-98">
                    <p className="sprints-extracted-99">{item.content}</p>
                    <div className="sprints-extracted-100">
                      <span className="sprints-extracted-101">by {item.userName}</span>
                      <button 
                        onClick={() => handleVoteRetroItem(item.id)}
                        className="sprints-extracted-102"
                      >
                        👍 {item.votes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input container */}
              <div className="sprints-extracted-103">
                <input 
                  type="text" 
                  placeholder="Add point..."
                  value={retroContentWell}
                  onChange={(e) => setRetroContentWell(e.target.value)}
                  className="sprints-extracted-104"
                />
                <button 
                  onClick={() => handleCreateRetroSubmit('well', retroContentWell, setRetroContentWell)}
                  className="sprints-extracted-105"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Column 2: What Can Be Improved */}
            <div className="sprints-extracted-106">
              <div className="sprints-extracted-107">
                🔴 What Can Be Improved
              </div>
              
              {/* Items list */}
              <div className="sprints-extracted-108">
                {retroItems.filter(item => item.category === 'improve').map(item => (
                  <div key={item.id} className="sprints-extracted-109">
                    <p className="sprints-extracted-110">{item.content}</p>
                    <div className="sprints-extracted-111">
                      <span className="sprints-extracted-112">by {item.userName}</span>
                      <button 
                        onClick={() => handleVoteRetroItem(item.id)}
                        className="sprints-extracted-113"
                      >
                        👍 {item.votes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input container */}
              <div className="sprints-extracted-114">
                <input 
                  type="text" 
                  placeholder="Add point..."
                  value={retroContentImprove}
                  onChange={(e) => setRetroContentImprove(e.target.value)}
                  className="sprints-extracted-115"
                />
                <button 
                  onClick={() => handleCreateRetroSubmit('improve', retroContentImprove, setRetroContentImprove)}
                  className="sprints-extracted-116"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Column 3: Action Items */}
            <div className="sprints-extracted-117">
              <div className="sprints-extracted-118">
                ⚡ Action Items
              </div>
              
              {/* Items list */}
              <div className="sprints-extracted-119">
                {retroItems.filter(item => item.category === 'action').map(item => (
                  <div key={item.id} className="sprints-extracted-120">
                    <p className="sprints-extracted-121">{item.content}</p>
                    <div className="sprints-extracted-122">
                      <span className="sprints-extracted-123">by {item.userName}</span>
                      <button 
                        onClick={() => handleVoteRetroItem(item.id)}
                        className="sprints-extracted-124"
                      >
                        👍 {item.votes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input container */}
              <div className="sprints-extracted-125">
                <input 
                  type="text" 
                  placeholder="Add point..."
                  value={retroContentAction}
                  onChange={(e) => setRetroContentAction(e.target.value)}
                  className="sprints-extracted-126"
                />
                <button 
                  onClick={() => handleCreateRetroSubmit('action', retroContentAction, setRetroContentAction)}
                  className="sprints-extracted-127"
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
