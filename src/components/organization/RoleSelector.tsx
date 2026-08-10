'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface RoleSelectorProps {
  currentRole: string;
  availableRoles: { value: string; label: string; color: string }[];
  onRoleChange: (newRole: string) => Promise<void>;
  disabled?: boolean;
  canEdit?: boolean;
}

const RoleSelector = ({
  currentRole,
  availableRoles,
  onRoleChange,
  disabled = false,
  canEdit = true,
}: RoleSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentRoleData = availableRoles.find((r) => r.value === currentRole);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleRoleSelect = async (newRole: string) => {
    if (newRole === currentRole || isUpdating) return;

    setIsUpdating(true);
    setIsOpen(false);

    try {
      await onRoleChange(newRole);
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!canEdit) {
    return (
      <span
        className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 capitalize ${currentRoleData?.color || 'bg-[#2a3942] text-[#8696a0]'}`}
      >
        {currentRoleData?.label || currentRole}
      </span>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && !isUpdating && setIsOpen(!isOpen)}
        disabled={disabled || isUpdating}
        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all capitalize ${
          currentRoleData?.color || 'bg-[#2a3942] text-[#8696a0]'
        } ${!disabled && !isUpdating ? 'hover:opacity-80 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
      >
        {isUpdating ? (
          <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <>
            {currentRoleData?.label || currentRole}
            <ChevronDown className="w-3 h-3" />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-36 bg-[#1e2a30] border border-[#2a3942] rounded-lg shadow-lg z-50 py-1">
          {availableRoles.map((role) => (
            <button
              key={role.value}
              onClick={() => handleRoleSelect(role.value)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#e9edef] hover:bg-[#2a3942] transition-colors capitalize"
            >
              <span>{role.label}</span>
              {role.value === currentRole && <Check className="w-4 h-4 text-[#00a884]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
