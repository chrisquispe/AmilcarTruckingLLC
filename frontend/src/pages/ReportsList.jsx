import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getReports, deleteReport } from '../api/client'

const STATUS_COLORS = {
  UPLOADED: 'bg-slate-100 text-slate-600',
  PARSED:   'bg-blue-100 text-blue-700',
  REVIEWED: 'bg-yellow-100 text-yellow-700',
  GENERATED:'bg-green-100 text-green-700',
}

export default function ReportsList() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const navigate = useNavigate()

  const load = () => {
    getReports()
      .then((r) => setReports(r.data))
      .catch(() => setError('Could not load reports. Is the backend running?'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Delete this report and all its extracted data?')) return
    try {
      await deleteReport(id)
      setReports((prev) => prev.filter((r) => r.id !== id))
    } catch {
      alert('Failed to delete report.')
    }
  }

  const filtered = reports.filter((r) => {
    const q = search.toLowerCase()
    const matchesSearch =
      r.originalFilename.toLowerCase().includes(q) ||
      (r.weekOf && r.weekOf.includes(q))
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by filename or week..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All statuses</option>
          <option value="UPLOADED">Uploaded</option>
          <option value="PARSED">Parsed</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="GENERATED">Generated</option>
        </select>
        <span className="text-sm text-slate-400 ml-1">
          {filtered.length} of {reports.length}
        </span>
        <Link
          to="/upload"
          className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Upload New
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading && (
          <div className="p-10 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-400">Loading reports...</p>
          </div>
        )}

        {error && (
          <div className="p-6 flex items-start gap-3 text-red-700 bg-red-50">
            <span className="text-lg">⚠</span>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📄</p>
            <p className="text-sm font-medium text-slate-600 mb-1">No reports yet</p>
            <p className="text-xs text-slate-400 mb-4">Upload a TRUX remittance PDF to get started.</p>
            <Link
              to="/upload"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload PDF
            </Link>
          </div>
        )}

        {!loading && !error && reports.length > 0 && filtered.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-400">No reports match your search.</p>
            <button onClick={() => { setSearch(''); setStatusFilter('ALL') }} className="mt-2 text-xs text-blue-600 hover:underline">
              Clear filters
            </button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600">Filename</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Week Of</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Trucks</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Uploaded</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-600"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/reports/${r.id}`)}
                    className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-slate-800 font-medium max-w-xs truncate">
                      {r.originalFilename}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.weekOf ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{r.truckCount}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(r.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] ?? ''}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDelete(e, r.id)}
                        className="text-red-400 hover:text-red-600 text-xs font-semibold hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
