import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Users, ShieldCheck, Map, ShieldAlert, Wrench, Fuel, BarChart3, Settings, Search,
} from 'lucide-react';

interface NavTarget {
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: number }>;
}

const TARGETS: NavTarget[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Fleet', path: '/fleet', icon: Truck },
  { name: 'Drivers', path: '/drivers', icon: Users },
  { name: 'Compliance', path: '/compliance', icon: ShieldCheck },
  { name: 'Trips', path: '/trips', icon: Map },
  { name: 'Recovery', path: '/recovery', icon: ShieldAlert },
  { name: 'Maintenance', path: '/maintenance', icon: Wrench },
  { name: 'Fuel & Expenses', path: '/fuel', icon: Fuel },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

/**
 * Keyboard-driven navigation palette (Req 19). Opens on Cmd/Ctrl+K, filters targets
 * case-insensitively by name, and navigating via selection closes the palette.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!query.trim()) return TARGETS;
    const q = query.toLowerCase();
    return TARGETS.filter((t) => t.name.toLowerCase().includes(q)); // Req 19.2 — case-insensitive
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  const select = (target: NavTarget) => {
    navigate(target.path);
    setOpen(false); // Req 19.3 — navigate then close
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIndex]) { e.preventDefault(); select(results[activeIndex]); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg rounded-xl border border-white/10 bg-[#12151c] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <Search size={16} className="text-text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a page…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-text-muted outline-none"
          />
          <kbd className="text-[0.65rem] text-text-muted border border-white/10 rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto py-2">
          {results.map((t, i) => {
            const Icon = t.icon;
            return (
              <li key={t.path}>
                <button
                  onClick={() => select(t)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                    i === activeIndex ? 'bg-accent-primary/10 text-white' : 'text-text-muted hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} />
                  {t.name}
                </button>
              </li>
            );
          })}
          {results.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-text-muted">No matching pages</li>
          )}
        </ul>
      </div>
    </div>
  );
}
