import React from 'react';
import { cn } from './utils';

export interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

const GRADIENTS = [
  'bg-gradient-to-br from-violet-500 to-blue-600',
  'bg-gradient-to-br from-teal-400 to-green-600',
  'bg-gradient-to-br from-amber-400 to-orange-600',
  'bg-gradient-to-br from-pink-500 to-rose-600',
  'bg-gradient-to-br from-cyan-400 to-blue-600'
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getGradientForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 36, className }) => {
  const initials = getInitials(name);
  const gradient = getGradientForName(name);

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full text-white font-semibold shadow-sm shrink-0",
        gradient,
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.4) }}
      title={name}
    >
      {initials}
    </div>
  );
};
