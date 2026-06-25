import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

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

export const Sidebar: React.FC<SidebarProps> = ({ onNewScreeningClick }) => {
  const { logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleConfirmLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Fallo al cerrar sesión:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="bg-[#1d1f26] h-screen w-64 fixed left-0 top-0 flex flex-col py-6 px-4 z-50 border-r border-gray-800 text-left">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex flex-col text-left">
          <span className="text-sm font-extrabold text-amber-500 uppercase tracking-tight leading-none">
            Lumiére
          </span>
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">
            Administración
          </span>
        </div>
      </div>

      {onNewScreeningClick && (
        <button
          onClick={onNewScreeningClick}
          className="w-full bg-amber-500 text-[#111319] text-[11px] font-bold py-2.5 px-4 rounded-xl mb-6 hover:bg-amber-400 transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer border-none outline-none active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Nueva Función</span>
        </button>
      )}

      <div className="flex flex-col gap-1.5 flex-grow">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            style={({ isActive }) =>
              isActive
                ? {
                    textShadow: '0 0 10px rgba(0, 241, 255, 0.4)',
                  }
                : undefined
            }
            className={({ isActive }) =>
              `flex items-center gap-3.5 py-2.5 px-4 rounded-xl text-xs transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-amber-500 font-extrabold bg-amber-500/10 border-l-4 border-amber-500'
                  : 'text-gray-400 font-semibold hover:bg-amber-500/5 hover:text-gray-200 active:scale-[0.98]'
              }`
            }
          >
            <span className="material-symbols-outlined text-[18px]">{item.iconName}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 mt-auto pt-4 border-t border-gray-800/50">
        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex items-center gap-3.5 py-2 px-4 rounded-xl text-[11px] text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all duration-200 cursor-pointer font-semibold border-none outline-none text-left w-full bg-transparent"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {isLogoutModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (!isLoggingOut) setIsLogoutModalOpen(false);
          }}
          title="Cerrar Sesión"
          size="sm"
          footer={
            <div className="flex gap-3 justify-end w-full font-sans">
              <Button
                variant="outline"
                onClick={() => setIsLogoutModalOpen(false)}
                disabled={isLoggingOut}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmLogout}
                isLoading={isLoggingOut}
                className="cursor-pointer"
              >
                Cerrar Sesión
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-left font-sans">
            <p className="text-zinc-300 text-sm leading-relaxed">
              ¿Estás seguro de que deseas cerrar sesión? Deberás volver a iniciar
              sesión para acceder al panel de administración.
            </p>
          </div>
        </Modal>
      )}
    </nav>
  );
};
