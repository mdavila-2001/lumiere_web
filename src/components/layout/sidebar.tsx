import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

export interface SidebarProps {
  onNewScreeningClick?: () => void;
}

interface NavItem {
  label: string;
  path: string;
  iconName: string;
}

const mainNavItems: NavItem[] = [
  { label: 'Panel de Control', path: '/admin', iconName: 'dashboard' },
  { label: 'Catálogo de Películas', path: '/admin/movies', iconName: 'movie' },
  { label: 'Salas', path: '/admin/rooms', iconName: 'theater_comedy' },
  { label: 'Funciones', path: '/admin/showtimes', iconName: 'schedule' },
];

const footerNavItems: NavItem[] = [
  { label: 'Configuración', path: '/admin/settings', iconName: 'settings' },
  { label: 'Soporte', path: '/admin/support', iconName: 'help' },
];

export const Sidebar: React.FC<SidebarProps> = ({ onNewScreeningClick }) => {
  const { logout } = useAuth();

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Fallo al cerrar sesión:', error);
    }
  };

  return (
    <nav className="bg-[#1d1f26] h-screen w-64 fixed left-0 top-0 flex flex-col py-6 px-4 z-50 border-r border-gray-800 text-left">
      {/* Cabecera de la Marca */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex flex-col text-left">
          <span className="text-sm font-extrabold text-[#ffd700] uppercase tracking-tight leading-none">
            Lumiére
          </span>
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">
            Administración
          </span>
        </div>
      </div>

      {/* Botón de acción principal: Nueva Función */}
      {onNewScreeningClick && (
        <button
          onClick={onNewScreeningClick}
          className="w-full bg-[#ffd700] text-[#111319] text-[11px] font-bold py-2.5 px-4 rounded-xl mb-6 hover:bg-[#ffe16d] transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer border-none outline-none active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Nueva Función</span>
        </button>
      )}

      {/* Enlaces de navegación principal */}
      <div className="flex flex-col gap-1.5 flex-grow">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            style={({ isActive }) =>
              isActive
                ? {
                    textShadow: '0 0 10px rgba(255, 215, 0, 0.4)',
                  }
                : undefined
            }
            className={({ isActive }) =>
              `flex items-center gap-3.5 py-2.5 px-4 rounded-xl text-xs transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-[#ffd700] font-extrabold bg-[#ffd700]/10 border-l-4 border-[#ffd700]'
                  : 'text-gray-400 font-semibold hover:bg-[#ffd700]/5 hover:text-gray-200 active:scale-[0.98]'
              }`
            }
          >
            <span className="material-symbols-outlined text-[18px]">{item.iconName}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Enlaces de navegación del pie de página y Cerrar Sesión */}
      <div className="flex flex-col gap-1.5 mt-auto pt-4 border-t border-gray-800/50">
        {footerNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) =>
              isActive
                ? {
                    textShadow: '0 0 10px rgba(255, 215, 0, 0.4)',
                  }
                : undefined
            }
            className={({ isActive }) =>
              `flex items-center gap-3.5 py-2 px-4 rounded-xl text-[11px] transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-[#ffd700] font-extrabold bg-[#ffd700]/10 border-l-4 border-[#ffd700]'
                  : 'text-gray-400 font-semibold hover:bg-[#ffd700]/5 hover:text-gray-200 active:scale-[0.98]'
              }`
            }
          >
            <span className="material-symbols-outlined text-[16px]">{item.iconName}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Botón de Cerrar Sesión */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3.5 py-2 px-4 rounded-xl text-[11px] text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all duration-200 cursor-pointer font-semibold border-none outline-none text-left w-full bg-transparent"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
};
