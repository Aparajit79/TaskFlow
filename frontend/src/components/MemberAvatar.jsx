import React from 'react';
import {
  Code2, Server, Layers, Palette,
  TestTube2, FolderKanban, Container, UserRound
} from 'lucide-react';

const AVATAR_COLORS = [
  { bg: '#e0e7ff', color: '#4f46e5' },
  { bg: '#ede9fe', color: '#7c3aed' },
  { bg: '#fce7f3', color: '#be185d' },
  { bg: '#fef3c7', color: '#b45309' }, 
  { bg: '#d1fae5', color: '#065f46' }, 
  { bg: '#dbeafe', color: '#1d4ed8' }, 
  { bg: '#fee2e2', color: '#b91c1c' }, 
  { bg: '#ccfbf1', color: '#0f766e' }, 
];


const AVATAR_COLORS_DARK = [
  { bg: 'rgba(79,70,229,0.25)',  color: '#a5b4fc' },
  { bg: 'rgba(124,58,237,0.25)', color: '#c4b5fd' },
  { bg: 'rgba(190,24,93,0.25)',  color: '#f9a8d4' },
  { bg: 'rgba(180,83,9,0.25)',   color: '#fcd34d' },
  { bg: 'rgba(6,95,70,0.25)',    color: '#6ee7b7' },
  { bg: 'rgba(29,78,216,0.25)',  color: '#93c5fd' },
  { bg: 'rgba(185,28,28,0.25)',  color: '#fca5a5' },
  { bg: 'rgba(15,118,110,0.25)', color: '#5eead4' },
];

function hashName(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return Math.abs(h) % AVATAR_COLORS.length;
}

const ROLE_ICONS = {
  'Frontend Developer':   Code2,
  'Backend Developer':    Server,
  'Full Stack Developer': Layers,
  'UI/UX Designer':       Palette,
  'QA Tester':            TestTube2,
  'Project Manager':      FolderKanban,
  'DevOps Engineer':      Container,
};

/**
 * MemberAvatar
 * @param {string}  name    
 * @param {string}  role      
 * @param {number}  size     
 * @param {number}  iconSize  
 * @param {boolean} dark     
 * @param {string}  className
 */
export function MemberAvatar({ name = '', role = '', size = 32, iconSize = 14, dark = false, className = '' }) {
  const idx     = hashName(name);
  const palette = dark ? AVATAR_COLORS_DARK[idx] : AVATAR_COLORS[idx];
  const Icon    = ROLE_ICONS[role] || UserRound;

  return (
    <span
      className={`member-role-avatar ${className}`}
      title={`${name} — ${role}`}
      style={{
        width:           size,
        height:          size,
        minWidth:        size,
        backgroundColor: palette.bg,
        color:           palette.color,
        borderRadius:    '50%',
        display:         'inline-flex',
        alignItems:      'center',
        justifyContent:  'center',
        flexShrink:       0,
      }}
    >
      <Icon size={iconSize} strokeWidth={1.75} />
    </span>
  );
}

export default MemberAvatar;
