import React from 'react';
import { cn } from './utils';

const GRADIENTS = [
  'bg-gradient-to-br from-violet-600 to-blue-600',
  'bg-gradient-to-br from-teal-500 to-green-600',
  'bg-gradient-to-br from-amber-500 to-orange-600',
  'bg-gradient-to-br from-pink-500 to-rose-600',
  'bg-gradient-to-br from-indigo-500 to-purple-600',
];

interface AvatarProps {
  name: string;
  id?: string;
  className?: string;
}

export function Avatar({ name, id, className }: AvatarProps) {
  // Simple deterministic hash
  const str = id || name;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradientClass = GRADIENTS[Math.abs(hash) % GRADIENTS.length];
  
  // Initials
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full text-white font-semibold text-[0.8rem] shadow-sm flex-shrink-0",
        gradientClass,
        className
      )}
      style={{ width: '36px', height: '36px' }}
    >
      {initials}
    </div>
  );
}
