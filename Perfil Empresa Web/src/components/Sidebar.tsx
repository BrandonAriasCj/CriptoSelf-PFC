import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Squares2X2Icon,
  UsersIcon,
  TrophyIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { LogoMark } from './Logo';

interface Props {
  onNavigate?: () => void;
}

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface NavItem {
  to: string;
  Icon: IconType;
  label: string;
  section: string;
}

const NAV: NavItem[] = [
  { to: '/dashboard',    Icon: Squares2X2Icon,        label: 'Dashboard',   section: 'Principal' },
  { to: '/students',     Icon: UsersIcon,             label: 'Integrantes', section: 'Equipo' },
  { to: '/challenges',   Icon: TrophyIcon,            label: 'Retos',       section: 'Gamificación' },
  { to: '/gamification', Icon: ChartBarIcon,          label: 'Leaderboard', section: 'Gamificación' },
  { to: '/profile',      Icon: BuildingOffice2Icon,   label: 'Mi Empresa',  section: 'Cuenta' },
];

export default function Sidebar({ onNavigate }: Props) {
  const { user, logout } = useAuth();
  const cp = user?.company_profile;

  const initials = (
    (cp?.company_name?.[0] || '') +
    (cp?.company_name?.split(' ')?.[1]?.[0] || '')
  ).toUpperCase() || user?.username?.[0]?.toUpperCase() || 'E';

  const sections = [...new Set(NAV.map(n => n.section))];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <LogoMark size={42} />
        <div className="sidebar-logo-text">
          <h1>CriptoSelf</h1>
          <p>Panel Empresarial</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map(sec => (
          <div key={sec}>
            <div className="sidebar-section-label">{sec}</div>
            {NAV.filter(n => n.section === sec).map(({ to, Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onNavigate}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon"><Icon strokeWidth={1.8} /></span>
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-card">
          <div className="avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="name">{cp?.company_name || user?.username}</div>
            <div className="role">
              {cp?.industry || 'Empresa Web'}
            </div>
          </div>
        </div>
        <button
          className="nav-item"
          style={{ color: 'var(--danger)', borderColor: 'transparent' }}
          onClick={logout}
        >
          <span className="nav-icon"><ArrowRightOnRectangleIcon strokeWidth={1.8} /></span>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
