import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/',        label: 'Dashboard',   icon: '▦' },
  { to: '/upload',  label: 'Upload PDF',  icon: '↑' },
  { to: '/reports', label: 'Reports',     icon: '≡' },
  { to: '/drivers', label: 'Drivers',     icon: '◉' },
  { to: '/trucks',  label: 'Trucks',      icon: '⊡' },
]

export default function Sidebar({ onNavigate }) {
  return (
    <aside className="w-60 min-h-screen bg-slate-900 flex flex-col shrink-0">
      <div className="px-6 py-6 border-b border-slate-700">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Amilcar</p>
        <p className="text-white font-bold text-lg leading-tight">Trucking LLC</p>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <span className="text-base w-5 text-center select-none">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">Payment Automation v1.0</p>
      </div>
    </aside>
  )
}
