import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Truck, Users, Map, Wrench, Fuel, BarChart3, Settings, LogOut } from 'lucide-react';

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
  const { user, logout } = useContext(AuthContext);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
      <div className="p-4 bg-slate-950 flex flex-col">
        <h1 className="text-white font-bold text-xl tracking-wide">TransitOps</h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{user?.role}</p>
      </div>
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium text-white truncate">{user?.name}</span>
            <span className="text-xs text-slate-400 truncate">{user?.email}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
