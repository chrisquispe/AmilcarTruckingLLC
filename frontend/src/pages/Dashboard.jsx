import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../api/client'
import Spinner from '../components/ui/Spinner'

const STATUS_COLORS = {
  UPLOADED: 'bg-slate-100 text-slate-600',
  PARSED:   'bg-blue-100 text-blue-700',
  REVIEWED: 'bg-yellow-100 text-yellow-700',
  GENERATED:'bg-green-100 text-green-700',
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard()
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const revenue = data?.totalRevenue != null
    ? `$${parseFloat(data.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    : null

  return (
    <div className="p-4 md:p-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Reports"  value={data?.totalReports} />
        <StatCard label="Total Revenue"  value={revenue} sub="sum of all main totals" />
        <StatCard label="Active Trucks"  value={data?.activeTrucks} />
        <StatCard label="Drivers"        value={data?.totalDrivers} />
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-700">Recent Reports</h2>
          <Link
            to="/upload"
            className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Upload
          </Link>
        </div>

        {loading && <Spinner label="Loading dashboard..." />}

        {!loading && !data?.recentReports?.length && (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">🚛</p>
            <p className="text-sm font-medium text-slate-600 mb-1">No reports yet</p>
            <p className="text-xs text-slate-400 mb-5">
              Upload a TRUX remittance PDF to extract ticket data and generate driver pay reports.
            </p>
            <Link
              to="/upload"
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload First PDF
            </Link>
          </div>
        )}

        {data?.recentReports?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600">Filename</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Week Of</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Trucks</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-600"></th>
                </tr>
              </thead>
              <tbody>
                {data.recentReports.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700 max-w-xs truncate">{r.originalFilename}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.weekOf ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{r.truckCount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] ?? ''}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link to={`/reports/${r.id}`} className="text-blue-600 hover:underline font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data?.recentReports?.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
            <Link to="/reports" className="text-xs text-blue-600 hover:underline font-medium">
              View all reports →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
