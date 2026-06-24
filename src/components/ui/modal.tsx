import * as React from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}) => {
  const dialogRef = React.useRef<HTMLDialogElement | null>(null);

  React.useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    if (isOpen) {
      if (!dialogEl.open) {
        dialogEl.showModal();
      }
    } else {
      if (dialogEl.open) {
        dialogEl.close();
      }
    }
  }, [isOpen]);

  React.useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    const handleCancel = (event: Event): void => {
      event.preventDefault();
      onClose();
    };

    dialogEl.addEventListener('cancel', handleCancel);
    return () => {
      dialogEl.removeEventListener('cancel', handleCancel);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const handleDialogClick = (event: React.MouseEvent<HTMLDialogElement>): void => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    const rect = dialogEl.getBoundingClientRect();
    const isInDialog =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      onClose();
    }
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className={`bg-surface-container border border-surface-bright/10 rounded-xl shadow-2xl p-0 outline-none overflow-hidden backdrop:bg-black/75 backdrop:backdrop-blur-sm ${sizeStyles[size]}`}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-on-surface-variant hover:text-primary-container transition-colors duration-200 cursor-pointer border-none outline-none bg-transparent"
        aria-label="Cerrar modal"
      >
        <span className="material-symbols-outlined text-[24px]">close</span>
      </button>

      {/* Modal Header */}
      {title && (
        <header className="px-6 py-4 border-b border-surface-bright/10 pr-12 text-left shrink-0">
          <h2 id="modal-title" className="text-lg font-bold text-on-surface">
            {title}
          </h2>
        </header>
      )}

      {/* Modal Body / Main Content */}
      <div className="px-6 py-5 overflow-y-auto flex-grow text-left text-sm text-on-surface-variant">
        {children}
      </div>

      {/* Modal Footer Slot */}
      {footer && (
        <footer className="px-6 py-4 border-t border-surface-bright/10 bg-surface-container-low flex justify-end gap-3 shrink-0">
          {footer}
        </footer>
      )}
    </dialog>,
    document.body
  );
};
