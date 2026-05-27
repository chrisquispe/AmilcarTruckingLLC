import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import ReportsList from './pages/ReportsList'
import ReportDetail from './pages/ReportDetail'
import Drivers from './pages/Drivers'
import Trucks from './pages/Trucks'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar: always visible on md+, slide-in drawer on mobile */}
        <div className={`
          fixed inset-y-0 left-0 z-30 md:static md:z-auto md:translate-x-0
          transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={() => setSidebarOpen((v) => !v)} />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/reports" element={<ReportsList />} />
              <Route path="/reports/:id" element={<ReportDetail />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/trucks" element={<Trucks />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
