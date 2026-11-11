import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Layers,
  KanbanSquare,
  Sliders,
  LogOut,
  Clock,
  Compass,
  CheckCircle2
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/applications', label: 'Applications', icon: Layers },
    { to: '/kanban', label: 'Kanban Board', icon: KanbanSquare },
    { to: '/settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-[#0f172a]">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-[#e2e8f0] bg-[#ffffff] flex flex-col justify-between select-none shrink-0">
        <div>
          {/* Brand header */}
          <div className="h-16 px-5 border-b border-[#f1f5f9] flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#0f766e] text-[#ffffff] flex items-center justify-center font-bold text-xs tracking-tight">
              <Compass className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight text-[#0f172a]">KerjaTrack</div>
              <div className="text-[11px] text-[#64748b] leading-tight">Job Search Journal</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#f0fdfa] text-[#0f766e] font-semibold'
                        : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 stroke-[1.75]" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User profile & Locale footer */}
        <div className="p-3 border-t border-[#f1f5f9] space-y-2">
          {/* Malaysia Locale indicator */}
          <div className="px-3 py-2 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] text-[11px] text-[#64748b] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0f766e]" />
              Asia/Kuala_Lumpur
            </span>
            <span className="text-[10px] font-medium text-[#0f766e] bg-[#f0fdfa] px-1.5 py-0.5 rounded-[4px] border border-[#ccfbf1]">
              UTC+8
            </span>
          </div>

          {/* User profile info & logout */}
          <div className="p-2.5 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-7 h-7 rounded-[6px] bg-[#0f766e]/10 text-[#0f766e] font-semibold text-xs flex items-center justify-center shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-[#0f172a] truncate">{user?.name}</div>
                <div className="text-[11px] text-[#64748b] truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign out"
              aria-label="Sign out"
              className="p-1.5 text-[#64748b] hover:text-[#991b1b] hover:bg-[#fee2e2] rounded-[6px] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        <header className="h-16 border-b border-[#e2e8f0] bg-[#ffffff] px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-[#64748b]">
            <CheckCircle2 className="w-4 h-4 text-[#0f766e]" />
            <span className="font-medium text-[#0f172a]">Malaysia Workspace</span>
            <span className="text-[#cbd5e1]">·</span>
            <span className="tabular-nums">MYR Defaults</span>
          </div>
          <div className="text-xs text-[#64748b] flex items-center gap-2">
            <span>Date format:</span>
            <span className="px-2 py-0.5 rounded-[6px] bg-[#f1f5f9] text-[#0f172a] font-medium border border-[#e2e8f0] tabular-nums">
              DD/MM/YYYY
            </span>
          </div>
        </header>

        <div className="p-8 max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
