import React, { useState } from 'react';
import { Users, Plus, Trash2, FolderClosed, MessageSquare } from 'lucide-react';
import { useTaskFlow } from '../context/TaskFlowContext';
import MemberAvatar from './MemberAvatar';
import MemberForm from './MemberForm';

export function TeamView() {
  const {
    members = [],
    activeProject = '',
    handleAddMember: onAddMember,
    handleAssignMember: onAssignMember,
    handleDeleteMember: onDeleteMember,
    projects = [],
    tasks = [],
    user,
    fetchMessagesContacts,
    fetchMessages,
    handleSendMessage
  } = useTaskFlow();

  const [viewMode, setViewMode] = useState('project'); 
  const [showAddForm, setShowAddForm] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [activeContactId, setActiveContactId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');

  React.useEffect(() => {
    if (viewMode === 'messages') {
      const loadContacts = async () => {
        const list = await fetchMessagesContacts();
        setContacts(list);
      };
      loadContacts();
    }
  }, [viewMode, fetchMessagesContacts]);

  React.useEffect(() => {
    if (viewMode === 'messages' && activeContactId) {
      const loadMessages = async () => {
        const history = await fetchMessages(activeContactId);
        setMessages(history);
      };
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [viewMode, activeContactId, fetchMessages]);

  const handleChatSendSubmit = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeContactId) return;
    const res = await handleSendMessage(activeContactId, typedMessage.trim());
    if (res.ok) {
      setMessages(prev => [...prev, res.data]);
      setTypedMessage('');
    } else {
      alert(res.error || 'Failed to send message');
    }
  };

  const triggerMessageMember = (member) => {
    if (!member.userId) {
      alert("This member does not have a registered login user account linked to message.");
      return;
    }
    setViewMode('messages');
    setActiveContactId(member.userId);
  };

  const handleDeleteOverallMember = async (member) => {
    if (window.confirm(`Are you sure you want to delete ${member.name} from all projects?`)) {
      try {
        await Promise.all(member.allMemberIds.map(id => onDeleteMember(id)));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const currentProjectMembers = React.useMemo(() => {
    return members.filter((m) => Number(m.projectId) === Number(activeProject));
  }, [members, activeProject]);

  const uniqueDirectory = React.useMemo(() => {
    if (viewMode === 'project') {
      return currentProjectMembers;
    }
    // Group all membership entries by user identifier to prevent duplications
    const groups = {};
    members.forEach((m) => {
      const key = m.userId ? `id_${m.userId}` : `name_${m.name.trim().toLowerCase()}`;
      if (!groups[key]) {
        groups[key] = {
          id: m.id,
          userId: m.userId,
          name: m.name,
          role: m.role,
          avatar: m.avatar,
          projectId: m.projectId,
          projectIds: [m.projectId],
          allMemberIds: [m.id]
        };
      } else {
        groups[key].projectIds.push(m.projectId);
        groups[key].allMemberIds.push(m.id);
      }
    });
    return Object.values(groups);
  }, [viewMode, members, currentProjectMembers]);

  const isAdmin = user?.role === 'admin';

  const handleCancel = () => {
    setShowAddForm(false);
  };

  const getTaskCountForMember = (member) => {
    if (viewMode === 'project') {
      return tasks.filter((t) => Number(t.projectId) === Number(activeProject) && Number(t.assignedMemberId) === Number(member.id)).length;
    } else {
      const idsToMatch = member.allMemberIds.map(id => Number(id));
      return tasks.filter((t) => idsToMatch.includes(Number(t.assignedMemberId))).length;
    }
  };

  const getWorkspaceName = (projId) => {
    const proj = projects.find(p => Number(p.id) === Number(projId));
    return proj ? proj.name : 'Unknown Workspace';
  };

  const activeProjObj = projects.find(p => Number(p.id) === Number(activeProject));
  const activeProjectName = activeProjObj ? activeProjObj.name : '';

  return (
    <div className="view-container">
      {/* Title & Subtitle */}
      <div className="view-header team-view-header">
        <div>
          <h1>Team</h1>
          <p className="view-subtitle team-view-subtitle">
            Manage your team members, roles, and project assignments.
          </p>
        </div>
      </div>

      {/* View Toggle Bar */}
      <div className="view-toggle-bar team-view-toggle-bar">
        <div className="teamview-extracted-1">
          <button 
            className={`team-toggle-btn ${viewMode === 'project' ? 'active' : 'inactive'}`}
            onClick={() => setViewMode('project')}
          >
            Workspace Members
          </button>
          <button 
            className={`team-toggle-btn ${viewMode === 'overall' ? 'active' : 'inactive'}`}
            onClick={() => setViewMode('overall')}
          >
            Overall Directory (All Workspaces)
          </button>
          <button 
            className={`team-toggle-btn ${viewMode === 'messages' ? 'active' : 'inactive'}`}
            onClick={() => setViewMode('messages')}
          >
            Direct Messages
          </button>
        </div>

        {/* Add member button (Only active in specific project mode and for Admin) */}
        {viewMode !== 'messages' && isAdmin && (
          <button 
            className="add-button team-add-btn-override" 
            onClick={() => setShowAddForm(true)} 
          >
            <Plus size={14} strokeWidth={2.5} />
            Add Member
          </button>
        )}
      </div>

      {/* Context-aware rendering based on active viewMode */}
      {viewMode !== 'messages' && (viewMode === 'project' && !activeProject ? (
        <div className="empty-state team-empty-state-box">
          <FolderClosed size={32} className="team-empty-icon" />
          <h3>No Active Project Selected</h3>
          <p>Please select a project in the sidebar, or switch to the **Overall Directory** above.</p>
        </div>
      ) : (
        <>


          {showAddForm && viewMode !== 'messages' && isAdmin && (
            <div className="modal-overlay" onClick={handleCancel}>
              <div className="modal-content team-modal-override" onClick={(e) => e.stopPropagation()}>
                <h3 className="team-modal-title">Add New Team Member to {activeProjectName}</h3>
                <MemberForm
                  projectId={activeProject}
                  onAddMember={onAddMember}
                  onAssignMember={onAssignMember}
                  onCancel={handleCancel}
                  isAdmin={isAdmin}
                />
              </div>
            </div>
          )}

          {uniqueDirectory.length === 0 ? (
            <div className="empty-state team-empty-state-box">
              <Users size={24} className="team-empty-icon" />
              <h4>No Members Found</h4>
              <p>
                {viewMode === 'project' 
                  ? 'There are no assigned members in this project workspace.'
                  : 'No team members registered across any workspaces yet.'}
              </p>
            </div>
          ) : (
            <div className="members-view-grid team-members-grid">
              {uniqueDirectory.map((member) => {
                const memberTasksCount = getTaskCountForMember(member);
                const isActive = memberTasksCount > 0;
                const isSelf = member.userId === user?.id || (member.name === user?.name);
                const canMessage = !isSelf && (isAdmin || (member.role && member.role.toLowerCase() === 'admin'));
                
                return (
                  <div className="member-view-card" key={member.id}>
                    <div className="team-card-badge-container">
                      <MemberAvatar name={member.name} role={member.role} size={56} iconSize={24} />
                    </div>
                    
                    <div className="member-view-card-body">
                      <h4 className="team-card-title">
                        {member.name}
                      </h4>
                      <span className="team-card-role">
                        {member.role}
                      </span>
                    </div>

                    {viewMode === 'overall' && (
                      <div className="team-card-projects-row">
                        {member.projectIds.map((pid) => (
                          <span 
                            key={pid} 
                            className="workspace-cell-name team-card-project-badge" 
                          >
                            {getWorkspaceName(pid)}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="team-card-badge-container">
                      <span className={`member-status-badge ${isActive ? 'active' : 'away'}`}>
                        {isActive ? 'Active Tasks' : 'No Active Tasks'}
                      </span>
                    </div>

                    <div className="member-card-separator"></div>

                    <div className="member-tasks-row team-card-tasks-row">
                      <span>Active Tasks Count</span>
                      <strong className="team-card-tasks-count">
                        {memberTasksCount}
                      </strong>
                    </div>

                    {canMessage && (
                      <button
                        className="member-card-message-btn teamview-extracted-2"
                        onClick={() => triggerMessageMember(member)}
                        
                      >
                        <MessageSquare size={13} />
                        Message {member.name}
                      </button>
                    )}

                    {viewMode === 'project' && isAdmin && (
                      <button
                        className="member-card-remove-btn teamview-extracted-3"
                        onClick={() => onDeleteMember(member.id)}
                        title="Unassign Member"
                        
                      >
                        <Trash2 size={14} className="team-card-trash-icon" />
                        Unassign
                      </button>
                    )}

                    {viewMode === 'overall' && isAdmin && (
                      <button
                        className="member-card-remove-btn teamview-extracted-4"
                        onClick={() => handleDeleteOverallMember(member)}
                        title="Delete Member"
                        
                      >
                        <Trash2 size={13} className="team-card-trash-icon teamview-extracted-5"  />
                        Delete Member
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ))}

      {viewMode === 'messages' && (
        <div className="messages-layout teamview-extracted-6" >
          {/* Left panel: Contacts list */}
          <div className="contacts-panel teamview-extracted-7" >
            <h3 className="teamview-extracted-8">Contacts</h3>
            {contacts.length === 0 ? (
              <p className="teamview-extracted-9">
                No message contacts available.
              </p>
            ) : (
              contacts.map(c => {
                const isSelected = activeContactId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveContactId(c.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                      color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: isSelected ? '700' : '500',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      width: '100%'
                    }}
                  >
                    <div className="teamview-extracted-10">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="teamview-extracted-11">
                      <div className="teamview-extracted-12">{c.name}</div>
                      <div className="teamview-extracted-13">{c.role}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right panel: Chat Conversation */}
          <div className="chat-panel teamview-extracted-14" >
            {activeContactId ? (
              <>
                {/* Conversation Header */}
                <div className="teamview-extracted-15">
                  <div className="teamview-extracted-16">
                    {contacts.find(c => c.id === activeContactId)?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="teamview-extracted-17">
                      {contacts.find(c => c.id === activeContactId)?.name}
                    </h4>
                    <span className="teamview-extracted-18">
                      {contacts.find(c => c.id === activeContactId)?.role}
                    </span>
                  </div>
                </div>

                {/* Messages list */}
                <div className="teamview-extracted-19">
                  {messages.length === 0 ? (
                    <p className="teamview-extracted-20">
                      No messages exchanged yet. Start the conversation below!
                    </p>
                  ) : (
                    messages.map(msg => {
                      const isSelf = msg.senderId === user.id;
                      return (
                        <div key={msg.id} style={{
                          alignSelf: isSelf ? 'flex-end' : 'flex-start',
                          maxWidth: '70%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isSelf ? 'flex-end' : 'flex-start'
                        }}>
                          <div style={{
                            padding: '10px 14px',
                            borderRadius: isSelf ? '12px 12px 0 12px' : '12px 12px 12px 0',
                            backgroundColor: isSelf ? 'var(--primary)' : 'var(--bg-app)',
                            color: isSelf ? '#fff' : 'var(--text-main)',
                            border: isSelf ? 'none' : '1px solid var(--border-color)',
                            fontSize: '13px',
                            lineHeight: '1.4'
                          }}>
                            {msg.messageText}
                          </div>
                          <span className="teamview-extracted-21">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Compose Form */}
                <form onSubmit={handleChatSendSubmit} className="teamview-extracted-22">
                  <input
                    type="text"
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="teamview-extracted-23"
                    required
                  />
                  <button
                    type="submit"
                    className="teamview-extracted-24"
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="teamview-extracted-25">
                <MessageSquare size={32} className="teamview-extracted-26" />
                <h4 className="teamview-extracted-27">No Conversation Selected</h4>
                <p className="teamview-extracted-28">
                  {user?.role === 'admin' 
                    ? 'Select a team member contact from the sidebar to open their chat feed.' 
                    : 'Select the Project Administrator from the contacts panel to open your direct chat.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamView;
