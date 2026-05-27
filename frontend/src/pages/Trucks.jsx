import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTrucks, getTruckReports } from '../api/client'

const STATUS_COLORS = {
  UPLOADED: 'bg-slate-100 text-slate-600',
  PARSED:   'bg-blue-100 text-blue-700',
  REVIEWED: 'bg-yellow-100 text-yellow-700',
  GENERATED:'bg-green-100 text-green-700',
}

function fmt(val) {
  if (val == null) return '—'
  return `$${parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function TruckRow({ truck }) {
  const [expanded, setExpanded] = useState(false)
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    if (!expanded && history === null) {
      setLoading(true)
      try {
        const res = await getTruckReports(truck.id)
        setHistory(res.data)
      } catch {
        setHistory({ reports: [], reportCount: 0 })
      } finally {
        setLoading(false)
      }
    }
    setExpanded((v) => !v)
  }

  return (
    <>
      <tr
        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
        onClick={toggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-mono text-slate-400 select-none">
              {expanded ? '▾' : '▸'}
            </span>
            <span className="font-semibold text-slate-800">{truck.truckNumber}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-slate-500">
          {history ? `${history.reportCount} report${history.reportCount !== 1 ? 's' : ''}` : '—'}
        </td>
        <td className="px-4 py-3 text-sm text-slate-500">
          {truck.createdAt ? new Date(truck.createdAt).toLocaleDateString() : '—'}
        </td>
      </tr>

      {expanded && (
        <tr className="bg-slate-50">
          <td colSpan={3} className="px-6 py-3">
            {loading && <p className="text-xs text-slate-400 py-2">Loading history...</p>}

            {!loading && history && history.reports.length === 0 && (
              <p className="text-xs text-slate-400 py-2">No reports found for this truck.</p>
            )}

            {!loading && history && history.reports.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-left">
                      <th className="px-3 py-2 font-semibold text-slate-600">Week Of</th>
                      <th className="px-3 py-2 font-semibold text-slate-600">Driver</th>
                      <th className="px-3 py-2 font-semibold text-slate-600 text-right">Main Total</th>
                      <th className="px-3 py-2 font-semibold text-slate-600 text-right">Fuel Total</th>
                      <th className="px-3 py-2 font-semibold text-slate-600 text-right">Driver Pay</th>
                      <th className="px-3 py-2 font-semibold text-slate-600">Status</th>
                      <th className="px-3 py-2 font-semibold text-slate-600"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.reports.map((r) => (
                      <tr key={r.reportId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-700">{r.weekOf ?? '—'}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {r.driverName
                            ? <span className="font-medium">{r.driverName}</span>
                            : <span className="text-slate-400 italic">Unassigned</span>}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-800">{fmt(r.mainTotal)}</td>
                        <td className="px-3 py-2 text-right text-slate-500">{fmt(r.fuelTotal)}</td>
                        <td className="px-3 py-2 text-right font-bold text-blue-700">{fmt(r.driverPay)}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] ?? ''}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <Link
                            to={`/reports/${r.reportId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default function Trucks() {
  const [trucks, setTrucks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getTrucks()
      .then((r) => setTrucks(r.data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = trucks.filter((t) =>
    t.truckNumber.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <input
          type="text"
          placeholder="Search trucks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-slate-500">{filtered.length} truck{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading && <p className="p-6 text-sm text-slate-400">Loading...</p>}

        {!loading && filtered.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-3xl mb-3">⊡</p>
            <p className="text-sm font-medium text-slate-600">No trucks found</p>
            <p className="text-xs text-slate-400 mt-1">
              Trucks appear automatically when a remittance PDF is uploaded.
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-600">Truck Number</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Reports</th>
                <th className="px-4 py-3 font-semibold text-slate-600">First Seen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((truck) => (
                <TruckRow key={truck.id} truck={truck} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
