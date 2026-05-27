import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/':        'Dashboard',
  '/upload':  'Upload PDF',
  '/reports': 'Reports',
  '/drivers': 'Driver Management',
  '/trucks':  'Truck Management',
}

export default function TopBar({ onMenuClick }) {
  const { pathname } = useLocation()
  const base = '/' + pathname.split('/')[1]
  const title = PAGE_TITLES[base] ?? 'Report Detail'

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 shrink-0 gap-3">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="md:hidden flex flex-col gap-1.5 p-1.5 rounded hover:bg-slate-100"
        aria-label="Toggle menu"
      >
        <span className="block w-5 h-0.5 bg-slate-600" />
        <span className="block w-5 h-0.5 bg-slate-600" />
        <span className="block w-5 h-0.5 bg-slate-600" />
      </button>

      <h1 className="text-lg font-semibold text-slate-800">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden sm:block text-sm text-slate-500">Amilcar Trucking LLC</span>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold select-none">
          A
        </div>
      </div>
    </header>
  )
}
