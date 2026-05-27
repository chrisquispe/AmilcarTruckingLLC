import { useState, useEffect } from 'react'
import { assignDriver, updateTotal, createDriver } from '../../api/client'

function fmt(val) {
  if (val == null) return '—'
  return `$${parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function TruckAssignmentCard({ group, reportId, drivers, onUpdated }) {
  const [driverInput, setDriverInput] = useState(group.driverName ?? '')
  const [percentage, setPercentage] = useState(
    group.driverPercentage != null ? parseFloat(group.driverPercentage) : 33
  )
  const [includeFuel, setIncludeFuel] = useState(group.includeFuelInTotal ?? false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState({
    mainTotal: group.mainTotal,
    fuelTotal: group.fuelTotal,
    driverPay: group.driverPay,
  })

  useEffect(() => {
    setDriverInput(group.driverName ?? '')
    setPercentage(group.driverPercentage != null ? parseFloat(group.driverPercentage) : 33)
    setIncludeFuel(group.includeFuelInTotal ?? false)
    setResult({ mainTotal: group.mainTotal, fuelTotal: group.fuelTotal, driverPay: group.driverPay })
  }, [group])

  const handleSave = async () => {
    if (!driverInput.trim()) return
    setSaving(true)
    try {
      // Resolve driver: find existing by name or create new
      let driver = drivers.find((d) => d.name.toLowerCase() === driverInput.trim().toLowerCase())
      if (!driver) {
        const res = await createDriver({ name: driverInput.trim(), common: false })
        driver = res.data
      }

      await assignDriver(reportId, group.truckId, driver.id)

      const totalRes = await updateTotal(reportId, group.truckId, {
        driverPercentage: percentage,
        includeFuelInTotal: includeFuel,
      })
      setResult({
        mainTotal: totalRes.data.mainTotal,
        fuelTotal: totalRes.data.fuelTotal,
        driverPay: totalRes.data.driverPay,
      })
      onUpdated?.()
    } catch (e) {
      console.error('Failed to save assignment', e)
    } finally {
      setSaving(false)
    }
  }

  // Live preview: calculate driver pay from inputs without saving
  const previewPay = () => {
    const main = parseFloat(result.mainTotal ?? group.mainTotal ?? 0) || 0
    const fuel = parseFloat(result.fuelTotal ?? group.fuelTotal ?? 0) || 0
    const base = includeFuel ? main + fuel : main
    return (base * percentage / 100).toFixed(2)
  }

  const commonDrivers = drivers.filter((d) => d.common)
  const otherDrivers = drivers.filter((d) => !d.common)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      {/* Truck Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-slate-800 text-base">{group.truckNumber}</p>
          <p className="text-xs text-slate-400">
            {group.regularTickets?.length ?? 0} tickets · {group.fuelTickets?.length ?? 0} fuel rows
          </p>
        </div>
        {group.driverName && (
          <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
            Assigned: {group.driverName}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Driver Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Driver Name</label>
          <input
            type="text"
            list={`drivers-${group.truckId}`}
            value={driverInput}
            onChange={(e) => setDriverInput(e.target.value)}
            placeholder="Type or select driver..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <datalist id={`drivers-${group.truckId}`}>
            {commonDrivers.length > 0 && commonDrivers.map((d) => (
              <option key={d.id} value={d.name} label="★ Common" />
            ))}
            {otherDrivers.map((d) => (
              <option key={d.id} value={d.name} />
            ))}
          </datalist>
          <p className="text-xs text-slate-400 mt-1">Type a new name to create a driver on save.</p>
        </div>

        {/* Percentage */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Driver % &nbsp;
            <span className="text-blue-600 font-bold">{percentage}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={percentage}
            onChange={(e) => setPercentage(parseFloat(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-0.5">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Fuel toggle */}
      <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={includeFuel}
          onChange={(e) => setIncludeFuel(e.target.checked)}
          className="accent-blue-600 w-4 h-4"
        />
        <span className="text-sm text-slate-700">Include fuel/reimbursement in driver pay calculation</span>
      </label>

      {/* Totals Preview */}
      <div className="bg-slate-50 rounded-lg p-4 mb-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Main Total</p>
          <p className="font-bold text-slate-800">{fmt(result.mainTotal ?? group.mainTotal)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Fuel Total</p>
          <p className="font-semibold text-slate-600">{fmt(result.fuelTotal ?? group.fuelTotal)}</p>
        </div>
        <div>
          <p className="text-xs text-blue-600 font-semibold mb-0.5">Driver Pay ({percentage}%)</p>
          <p className="font-bold text-blue-700 text-lg">${previewPay()}</p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !driverInput.trim()}
        className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg
                   hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Saving...' : 'Save & Calculate'}
      </button>
    </div>
  )
}
