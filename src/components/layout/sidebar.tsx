import * as React from 'react';
import { NavLink } from 'react-router-dom';

export interface SidebarProps {
  onNewScreeningClick?: () => void;
}

interface NavItem {
  label: string;
  path: string;
  iconName: string;
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', iconName: 'dashboard' },
  { label: 'Catálogo de Películas', path: '/admin/movies', iconName: 'movie' },
  { label: 'Salas', path: '/admin/rooms', iconName: 'theater_comedy' },
  { label: 'Funciones', path: '/admin/showtimes', iconName: 'schedule' },
];

const footerNavItems: NavItem[] = [
  { label: 'Configuración', path: '/admin/settings', iconName: 'settings' },
  { label: 'Soporte', path: '/admin/support', iconName: 'help' },
];

export const Sidebar: React.FC<SidebarProps> = ({ onNewScreeningClick }) => {
  return (
    <nav className="bg-surface-container h-screen w-64 fixed left-0 top-0 flex flex-col py-lg px-md z-50 border-r border-surface-bright/10 text-left">
      {/* Brand Header & Admin profile info */}
      <div className="flex items-center gap-sm mb-lg">
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80"
          alt="Admin Profile"
          className="h-10 w-10 rounded-full object-cover border border-primary-container/20"
        />
        <div className="flex flex-col">
          <span className="font-headline-md text-headline-md font-bold text-primary-container uppercase tracking-tight">
            Lumiére
          </span>
          <span className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">
            Administración
          </span>
        </div>
      </div>

      {/* Main Call to Action: New Screening */}
      {onNewScreeningClick && (
        <button
          onClick={onNewScreeningClick}
          className="w-full bg-primary-container text-on-primary-container font-label-md text-label-md font-bold py-sm px-md rounded-lg mb-lg hover:bg-primary-fixed transition-colors flex items-center justify-center gap-sm cursor-pointer border-none outline-none"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Nueva Función</span>
        </button>
      )}

      {/* Main Navigation Links */}
      <div className="flex flex-col gap-sm flex-grow">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-sm py-sm px-md rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'text-primary-container font-bold border-l-4 border-primary-container bg-surface-bright/10'
                  : 'text-on-surface-variant font-medium hover:bg-surface-variant/50 active:scale-95 transition-transform'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{item.iconName}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Footer Navigation Links */}
      <div className="flex flex-col gap-sm mt-auto">
        {footerNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-sm py-sm px-md rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'text-primary-container font-bold border-l-4 border-primary-container bg-surface-bright/10'
                  : 'text-on-surface-variant font-medium hover:bg-surface-variant/50 active:scale-95 transition-transform'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{item.iconName}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
