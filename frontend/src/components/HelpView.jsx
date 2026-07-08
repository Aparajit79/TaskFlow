import { BookOpen, MessageSquare, ShieldCheck, Keyboard, LifeBuoy } from 'lucide-react';


export function HelpView() {
  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1>Help & Support</h1>
          <p className="view-subtitle">Get answers, read user guides, and learn how to master TaskMatrix</p>
        </div>
      </div>

      <div className="help-grid">
        <div className="help-card">
          <BookOpen className="help-icon" size={24} style={{ color: 'var(--primary)' }} />
          <h3>Getting Started Guide</h3>
          <p>Learn the basics of TaskMatrix: how to create workspaces, invite members, and build your task workflows from scratch.</p>
        </div>

        <div className="help-card">
          <Keyboard className="help-icon" size={24} style={{ color: 'var(--success-text)' }} />
          <h3>Keyboard Shortcuts</h3>
          <p>Speed up your productivity with keyboard mappings to quickly create tasks, switch views, and search across workspaces.</p>
        </div>

        <div className="help-card">
          <ShieldCheck className="help-icon" size={24} style={{ color: 'var(--warning-text)' }} />
          <h3>Security & Permissions</h3>
          <p>Read about how TaskMatrix keeps your workspace secure and configures role-based access for developers and managers.</p>
        </div>

        <div className="help-card">
          <MessageSquare className="help-icon" size={24} style={{ color: 'var(--info-text)' }} />
          <h3>FAQs & Troubleshooting</h3>
          <p>Find quick answers to frequently asked questions about project deletion, team avatars, and task priority settings.</p>
        </div>
      </div>

      <div className="help-support-box">
        <LifeBuoy size={20} className="support-box-icon" />
        <div>
          <h4>Need more assistance?</h4>
          <p>Contact our internal systems administrator or raise a ticket in our issue tracker for hardware/infrastructure help.</p>
        </div>
      </div>
    </div>
  );
}

export default HelpView;
