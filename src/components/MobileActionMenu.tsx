import { useState, useRef, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export interface MenuAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'gradient';
}

interface MobileActionMenuProps {
  actions: MenuAction[];
  /** Style variant for the trigger button */
  triggerVariant?: 'light' | 'dark';
}

/**
 * A hamburger menu component that displays action buttons in a clean dropdown.
 * Works on all screen sizes for a consistent, uncluttered interface.
 */
export function MobileActionMenu({ actions, triggerVariant = 'light' }: MobileActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleActionClick = (action: MenuAction) => {
    action.onClick();
    setIsOpen(false);
  };

  const getButtonStyles = (variant: MenuAction['variant']) => {
    switch (variant) {
      case 'primary':
        return 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100';
      case 'gradient':
        return 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 hover:from-purple-100 hover:to-indigo-100';
      default:
        return 'text-slate-700 hover:bg-slate-100';
    }
  };

  const triggerStyles = triggerVariant === 'dark'
    ? 'bg-white/20 hover:bg-white/30 text-white'
    : 'bg-slate-100 hover:bg-slate-200 text-slate-600';

  return (
    <div className="relative" ref={menuRef}>
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors ${triggerStyles}`}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop - clicking closes the menu */}
          <div 
            className="fixed inset-0 bg-black/20 z-40" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menu panel */}
          <div 
            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
            style={{
              animation: 'menuSlideIn 0.15s ease-out',
            }}
            role="menu"
          >
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleActionClick(action)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${getButtonStyles(action.variant)}`}
                role="menuitem"
              >
                <span className="mr-3">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
