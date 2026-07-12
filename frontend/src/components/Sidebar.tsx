import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Truck, Users, Map, Wrench, Fuel, BarChart3, Settings, LogOut } from 'lucide-react';
import { cn } from './ui/utils';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Fleet', path: '/fleet', icon: Truck },
  { name: 'Drivers', path: '/drivers', icon: Users },
  { name: 'Trips', path: '/trips', icon: Map },
  { name: 'Maintenance', path: '/maintenance', icon: Wrench },
  { name: 'Fuel & Expenses', path: '/fuel', icon: Fuel },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { logout } = useContext(AuthContext);

  return (
    <aside className="w-16 lg:w-[240px] shrink-0 bg-surface border-r border-border flex flex-col transition-all duration-300">
      <div className="h-[64px] flex items-center justify-center lg:justify-start lg:px-6 border-b border-border shrink-0">
        <h1 className="text-text-primary font-display font-bold text-xl hidden lg:block tracking-wide">TransitOps</h1>
        <div className="lg:hidden font-display font-bold text-accent-primary text-xl">TO</div>
      </div>
      <nav className="flex-1 py-6 overflow-y-auto">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center h-12 lg:px-6 px-0 justify-center lg:justify-start transition-colors border-l-[3px]",
                    isActive 
                      ? "border-accent-primary bg-accent-primary/10 text-accent-primary" 
                      : "border-transparent text-text-muted hover:text-text-primary hover:bg-surface-raised"
                  )
                }
                title={item.name}
              >
                <item.icon className="w-5 h-5 lg:mr-3 shrink-0" />
                <span className="hidden lg:inline text-sm font-medium">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center justify-center lg:justify-start w-full h-10 lg:px-4 rounded-[6px] text-text-muted hover:bg-surface-raised hover:text-text-primary transition-colors focus:outline-none focus:ring-[2px] focus:ring-accent-primary"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5 lg:mr-3 shrink-0" />
          <span className="hidden lg:inline text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
