import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getReport, getDrivers, generateForTruck, downloadForTruck } from '../api/client'
import TicketTable from '../components/tables/TicketTable'
import TruckAssignmentCard from '../components/forms/TruckAssignmentCard'
import ReportPreview from '../components/ui/ReportPreview'

const TABS = ['Extracted Data', 'Assign Drivers', 'Preview & Generate']

const STATUS_COLORS = {
  UPLOADED: 'bg-slate-100 text-slate-600',
  PARSED: 'bg-blue-100 text-blue-700',
  REVIEWED: 'bg-yellow-100 text-yellow-700',
  GENERATED: 'bg-green-100 text-green-700',
}

export default function ReportDetail() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [activeTruck, setActiveTruck] = useState(null)
  const [drivers, setDrivers] = useState([])

  const fetchReport = useCallback(() => {
    setLoading(true)
    getReport(id)
      .then((r) => {
        setReport(r.data)
        if (r.data.trucks?.length > 0 && !activeTruck) {
          setActiveTruck(r.data.trucks[0].truckId)
        }
      })
      .catch(() => setError('Failed to load report.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { fetchReport() }, [fetchReport])
  useEffect(() => { getDrivers().then((r) => setDrivers(r.data)).catch(() => {}) }, [])

  const handleTicketUpdated = (updated) => {
    setReport((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        trucks: prev.trucks.map((tg) => ({
          ...tg,
          regularTickets: tg.regularTickets.map((t) => t.id === updated.id ? updated : t),
          fuelTickets: tg.fuelTickets.map((t) => t.id === updated.id ? updated : t),
        })),
      }
    })
  }

  // When isFuelSurcharge toggles, move the ticket between the two arrays
  const handleTicketMoved = (updated) => {
    setReport((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        trucks: prev.trucks.map((tg) => {
          const inRegular = tg.regularTickets.some((t) => t.id === updated.id)
          const inFuel = tg.fuelTickets.some((t) => t.id === updated.id)
          if (!inRegular && !inFuel) return tg
          const withoutRegular = tg.regularTickets.filter((t) => t.id !== updated.id)
          const withoutFuel = tg.fuelTickets.filter((t) => t.id !== updated.id)
          return {
            ...tg,
            regularTickets: updated.fuelSurcharge ? withoutRegular : [...withoutRegular, updated],
            fuelTickets: updated.fuelSurcharge ? [...withoutFuel, updated] : withoutFuel,
          }
        }),
      }
    })
  }

  const handleTicketDeleted = (ticketId) => {
    setReport((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        trucks: prev.trucks.map((tg) => ({
          ...tg,
          regularTickets: tg.regularTickets.filter((t) => t.id !== ticketId),
          fuelTickets: tg.fuelTickets.filter((t) => t.id !== ticketId),
        })),
      }
    })
  }

  const handleTicketAdded = (newTicket) => {
    setReport((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        trucks: prev.trucks.map((tg) => {
          if (tg.truckId !== newTicket.truckId) return tg
          return {
            ...tg,
            regularTickets: newTicket.fuelSurcharge ? tg.regularTickets : [...tg.regularTickets, newTicket],
            fuelTickets: newTicket.fuelSurcharge ? [...tg.fuelTickets, newTicket] : tg.fuelTickets,
          }
        }),
      }
    })
  }

  if (loading) return <div className="p-6 text-sm text-slate-400">Loading report...</div>
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>
  if (!report) return null

  const currentTruckGroup = report.trucks?.find((t) => t.truckId === activeTruck)

  const totalRegular = currentTruckGroup?.regularTickets?.reduce(
    (sum, t) => sum + (parseFloat(t.payAmount) || 0), 0
  ) ?? 0
  const totalFuel = currentTruckGroup?.fuelTickets?.reduce(
    (sum, t) => sum + (parseFloat(t.payAmount) || 0), 0
  ) ?? 0

  return (
    <div className="p-6">
      {/* Report Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-slate-500 mb-1">
            <Link to="/reports" className="hover:underline">Reports</Link> / {report.originalFilename}
          </p>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800">
              Week of {report.weekOf ?? '—'}
            </h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[report.status] ?? ''}`}>
              {report.status}
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-400">{report.trucks?.length ?? 0} trucks</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === i
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB 1 — Extracted Data */}
      {activeTab === 0 && (
        <div className="flex gap-6">
          {/* Truck Selector Sidebar */}
          <div className="w-44 shrink-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Trucks</p>
            <div className="flex flex-col gap-1">
              {report.trucks?.map((tg) => (
                <button
                  key={tg.truckId}
                  onClick={() => setActiveTruck(tg.truckId)}
                  className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTruck === tg.truckId
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tg.truckNumber}
                  <span className="block text-xs opacity-70 mt-0.5">
                    {tg.regularTickets?.length ?? 0} tickets
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Data Panel */}
          <div className="flex-1 min-w-0">
            {currentTruckGroup ? (
              <TicketPanel
                group={currentTruckGroup}
                reportId={id}
                totalRegular={totalRegular}
                totalFuel={totalFuel}
                onTicketUpdated={handleTicketUpdated}
                onTicketMoved={handleTicketMoved}
                onTicketDeleted={handleTicketDeleted}
                onTicketAdded={handleTicketAdded}
              />
            ) : (
              <p className="text-sm text-slate-400">Select a truck to view tickets.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2 — Assign Drivers */}
      {activeTab === 1 && (
        <div>
          <p className="text-sm text-slate-500 mb-4">
            Assign a driver to each truck, set the pay percentage, and optionally include fuel in the total.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {report.trucks?.map((group) => (
              <TruckAssignmentCard
                key={group.truckId}
                group={group}
                reportId={id}
                drivers={drivers}
                onUpdated={() => { fetchReport(); getDrivers().then((r) => setDrivers(r.data)) }}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 3 — Preview & Generate */}
      {activeTab === 2 && (
        <PreviewTab report={report} reportId={id} onRefresh={fetchReport} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function TicketPanel({ group, reportId, totalRegular, totalFuel, onTicketUpdated, onTicketMoved, onTicketDeleted, onTicketAdded }) {
  const [search, setSearch] = useState('')

  const filterTickets = (tickets) =>
    tickets?.filter((t) =>
      !search ||
      (t.ticketNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.ticketDate ?? '').includes(search)
    ) ?? []

  const visibleRegular = filterTickets(group.regularTickets)
  const visibleFuel = filterTickets(group.fuelTickets)

  const sharedProps = {
    reportId,
    truckId: group.truckId,
    onTicketUpdated,
    onTicketMoved,
    onTicketDeleted,
    onTicketAdded,
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3 gap-4">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-slate-800">{group.truckNumber}</h3>
          <input
            type="text"
            placeholder="Search ticket # or date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-48
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-4 text-sm shrink-0">
          <span className="text-slate-500">
            Total: <span className="font-semibold text-slate-800">${totalRegular.toFixed(2)}</span>
          </span>
          <span className="text-slate-500">
            Fuel: <span className="font-semibold text-slate-600">${totalFuel.toFixed(2)}</span>
          </span>
        </div>
      </div>

      {/* Main tickets */}
      <div className="mb-6">
        <TicketTable tickets={visibleRegular} isFuel={false} {...sharedProps} />
      </div>

      {/* Fuel / Reimbursement — always shown so rows can be added */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Fuel / Reimbursement
        </p>
        <TicketTable tickets={visibleFuel} isFuel={true} {...sharedProps} />
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------

function PreviewTab({ report, reportId, onRefresh }) {
  const today = new Date().toISOString().split('T')[0]
  const [selectedTruckId, setSelectedTruckId] = useState(report.trucks?.[0]?.truckId ?? null)
  const [reportDate, setReportDate] = useState(today)
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [genError, setGenError] = useState(null)

  const group = report.trucks?.find((t) => t.truckId === selectedTruckId)

  const handleGenerate = async () => {
    if (!group) return
    setGenerating(true)
    setGenError(null)
    try {
      await generateForTruck(reportId, group.truckId, reportDate)
      await onRefresh()
    } catch (e) {
      setGenError(e.response?.data?.message ?? 'Generation failed. Is the Python service running?')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!group) return
    setDownloading(true)
    try {
      const res = await downloadForTruck(reportId, group.truckId)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `Amilcar_${group.truckNumber}_${group.driverName ?? 'Unassigned'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setGenError('Download failed.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex gap-6">
      {/* Truck Selector */}
      <div className="w-44 shrink-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Select Truck</p>
        <div className="flex flex-col gap-1">
          {report.trucks?.map((tg) => (
            <button
              key={tg.truckId}
              onClick={() => { setSelectedTruckId(tg.truckId); setGenError(null) }}
              className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTruckId === tg.truckId
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tg.truckNumber}
              <span className="block text-xs opacity-70 mt-0.5">
                {tg.driverName ?? 'No driver'}
              </span>
              {tg.hasGeneratedPdf && (
                <span className="block text-xs text-green-300 mt-0.5">PDF ready ✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Preview + Actions */}
      <div className="flex-1 min-w-0">
        {group ? (
          <>
            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {/* Report Date */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Report Date</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-5 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg
                           hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generating ? 'Generating...' : group.hasGeneratedPdf ? 'Re-generate PDF' : 'Generate PDF'}
              </button>

              {group.hasGeneratedPdf && (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg
                             hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {downloading ? 'Downloading...' : '↓ Download PDF'}
                </button>
              )}

              {!group.driverName && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  No driver assigned — go to "Assign Drivers" tab first.
                </p>
              )}
              {group.driverName && !group.driverPay && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  Totals not calculated yet — save in "Assign Drivers" tab first.
                </p>
              )}
            </div>

            {genError && (
              <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {genError}
              </div>
            )}

            {/* Live Preview */}
            <ReportPreview group={group} reportDate={reportDate} />
          </>
        ) : (
          <p className="text-sm text-slate-400">Select a truck to preview its report.</p>
        )}
      </div>
    </div>
  )
}
