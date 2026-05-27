import { useEffect, useState } from 'react'
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../api/client'

function StarIcon({ filled }) {
  return (
    <span className={`text-lg ${filled ? 'text-yellow-400' : 'text-slate-300'}`} title={filled ? 'Common driver' : 'Not pinned'}>
      ★
    </span>
  )
}

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newCommon, setNewCommon] = useState(false)
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editCommon, setEditCommon] = useState(false)
  const [error, setError] = useState(null)

  const load = () => {
    getDrivers()
      .then((r) => setDrivers(r.data))
      .catch(() => setError('Failed to load drivers.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    try {
      await createDriver({ name: newName.trim(), common: newCommon })
      setNewName('')
      setNewCommon(false)
      load()
    } catch {
      setError('Failed to create driver.')
    } finally {
      setAdding(false)
    }
  }

  const handleSaveEdit = async (id) => {
    try {
      await updateDriver(id, { name: editName.trim(), common: editCommon })
      setEditId(null)
      load()
    } catch {
      setError('Failed to update driver.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this driver?')) return
    try {
      await deleteDriver(id)
      load()
    } catch {
      setError('Failed to delete driver.')
    }
  }

  const handleToggleCommon = async (driver) => {
    try {
      await updateDriver(driver.id, { name: driver.name, common: !driver.common })
      load()
    } catch {
      setError('Failed to update driver.')
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Add Driver */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Add Driver</h2>
        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="Driver name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={newCommon}
              onChange={(e) => setNewCommon(e.target.checked)}
              className="accent-yellow-400"
            />
            Pin as common
          </label>
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {adding ? 'Adding...' : '+ Add'}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Pinned (★) drivers appear first in all driver dropdowns.
        </p>
      </div>

      {/* Driver List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200">
          <p className="text-sm font-semibold text-slate-700">{drivers.length} driver{drivers.length !== 1 ? 's' : ''}</p>
        </div>

        {loading && <p className="p-5 text-sm text-slate-400">Loading...</p>}

        {!loading && drivers.length === 0 && (
          <p className="p-5 text-sm text-slate-400">No drivers yet. Add one above.</p>
        )}

        {drivers.map((driver) => (
          <div key={driver.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50">
            {/* Star toggle */}
            <button onClick={() => handleToggleCommon(driver)} className="shrink-0">
              <StarIcon filled={driver.common} />
            </button>

            {editId === driver.id ? (
              <>
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(driver.id)}
                  className="flex-1 border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none"
                />
                <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editCommon}
                    onChange={(e) => setEditCommon(e.target.checked)}
                    className="accent-yellow-400"
                  />
                  Pinned
                </label>
                <button
                  onClick={() => handleSaveEdit(driver.id)}
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditId(null)}
                  className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded hover:bg-slate-200"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-slate-800">{driver.name}</span>
                {driver.common && (
                  <span className="text-xs text-yellow-600 font-semibold bg-yellow-50 px-2 py-0.5 rounded-full">
                    Common
                  </span>
                )}
                <button
                  onClick={() => { setEditId(driver.id); setEditName(driver.name); setEditCommon(driver.common) }}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(driver.id)}
                  className="text-xs text-red-500 hover:underline font-medium"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
