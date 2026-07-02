import React, { useState } from 'react';

export function SettingsView() {
  const [darkTheme, setDarkTheme] = useState(() => {
    return localStorage.getItem('taskflow_dark_theme') === 'true';
  });

  const handleToggle = (e) => {
    const isChecked = e.target.checked;
    setDarkTheme(isChecked);
    localStorage.setItem('taskflow_dark_theme', String(isChecked));
    document.body.classList.toggle('dark-theme', isChecked);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ Application Settings</h1>
        <p className="settings-subtitle">Customize your workspace experience and UI preferences.</p>
      </div>

      <div className="app-card settings-card">
        <h3>Theme Customization</h3>
        <p className="settings-desc">Choose a theme preference for your workspace interface.</p>
        
        <div className="settings-option">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={darkTheme} 
              onChange={handleToggle}
              className="settings-checkbox"
            />
            <span className="checkbox-text">Enable Dark Theme</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
