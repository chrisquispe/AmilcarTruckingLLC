import { useState } from 'react'
import { updateTicket, deleteTicket, createTicket } from '../../api/client'

function EditableCell({ value, onSave, type = 'text' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')

  const commit = () => {
    setEditing(false)
    if (draft !== String(value ?? '')) onSave(draft)
  }

  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="w-full border border-blue-400 rounded px-1 py-0.5 text-xs focus:outline-none"
      />
    )
  }

  return (
    <span
      onClick={() => { setDraft(value ?? ''); setEditing(true) }}
      className="cursor-pointer hover:bg-blue-50 px-1 rounded"
      title="Click to edit"
    >
      {value ?? '—'}
    </span>
  )
}

function AddRowForm({ onAdd, isFuel }) {
  const empty = { ticketDate: '', ticketNumber: '', quantity: '', payAmount: '', payRate: '' }
  const [row, setRow] = useState(empty)
  const [saving, setSaving] = useState(false)

  const set = (field, val) => setRow((r) => ({ ...r, [field]: val }))

  const handleAdd = async () => {
    if (!row.payAmount) return
    setSaving(true)
    try {
      await onAdd({ ...row, fuelSurcharge: isFuel })
      setRow(empty)
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className="bg-blue-50 border-t-2 border-blue-200">
      <td className="px-2 py-1.5">
        <input type="date" value={row.ticketDate} onChange={(e) => set('ticketDate', e.target.value)}
          className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-blue-400" />
      </td>
      <td className="px-2 py-1.5">
        <input type="text" placeholder="Ticket #" value={row.ticketNumber} onChange={(e) => set('ticketNumber', e.target.value)}
          className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-blue-400" />
      </td>
      <td className="px-2 py-1.5">
        <input type="number" step="0.001" placeholder="0.000" value={row.quantity} onChange={(e) => set('quantity', e.target.value)}
          className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs text-right focus:outline-none focus:border-blue-400" />
      </td>
      <td className="px-2 py-1.5">
        <input type="number" step="0.01" placeholder="0.00" value={row.payRate} onChange={(e) => set('payRate', e.target.value)}
          className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs text-right focus:outline-none focus:border-blue-400" />
      </td>
      <td className="px-2 py-1.5">
        <input type="number" step="0.01" placeholder="0.00" value={row.payAmount} onChange={(e) => set('payAmount', e.target.value)}
          className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs text-right focus:outline-none focus:border-blue-400" />
      </td>
      <td className="px-2 py-1.5 text-center" colSpan={2}>
        <button
          onClick={handleAdd}
          disabled={saving || !row.payAmount}
          className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '...' : '+ Add'}
        </button>
      </td>
    </tr>
  )
}

export default function TicketTable({ tickets, isFuel = false, onTicketUpdated, onTicketDeleted, onTicketMoved, onTicketAdded, reportId, truckId }) {
  const handleSave = async (ticketId, field, rawValue) => {
    try {
      const payload = {}
      if (['quantity', 'payAmount', 'payRate'].includes(field)) {
        payload[field] = parseFloat(rawValue)
      } else {
        payload[field] = rawValue
      }
      const res = await updateTicket(ticketId, payload)
      onTicketUpdated?.(res.data)
    } catch (e) {
      console.error('Failed to update ticket', e)
    }
  }

  const handleMove = async (ticket) => {
    try {
      const res = await updateTicket(ticket.id, { isFuelSurcharge: !isFuel })
      onTicketMoved?.(res.data)
    } catch (e) {
      console.error('Failed to move ticket', e)
    }
  }

  const handleDelete = async (ticketId) => {
    if (!window.confirm('Delete this ticket row?')) return
    try {
      await deleteTicket(ticketId)
      onTicketDeleted?.(ticketId)
    } catch (e) {
      console.error('Failed to delete ticket', e)
    }
  }

  const handleAdd = async (data) => {
    try {
      const payload = {
        ticketNumber: data.ticketNumber || null,
        ticketDate: data.ticketDate || null,
        quantity: data.quantity ? parseFloat(data.quantity) : null,
        payAmount: data.payAmount ? parseFloat(data.payAmount) : null,
        payRate: data.payRate ? parseFloat(data.payRate) : null,
        fuelSurcharge: data.fuelSurcharge,
      }
      const res = await createTicket(reportId, truckId, payload)
      onTicketAdded?.(res.data)
    } catch (e) {
      console.error('Failed to add ticket', e)
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className={`text-white text-left ${isFuel ? 'bg-slate-500' : 'bg-slate-800'}`}>
            <th className="px-2 py-2 font-semibold">Ticket Date</th>
            <th className="px-2 py-2 font-semibold">Ticket #</th>
            <th className="px-2 py-2 font-semibold text-right">Quantity</th>
            <th className="px-2 py-2 font-semibold text-right">Pay Rate</th>
            <th className="px-2 py-2 font-semibold text-right">Pay Amount</th>
            <th className="px-2 py-2 font-semibold text-center w-16">Move</th>
            <th className="px-2 py-2 font-semibold text-center w-10"></th>
          </tr>
        </thead>
        <tbody>
          {(tickets ?? []).map((t, i) => (
            <tr key={t.id} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
              <td className="px-2 py-1.5">
                <EditableCell value={t.ticketDate} onSave={(v) => handleSave(t.id, 'ticketDate', v)} />
              </td>
              <td className="px-2 py-1.5 font-mono text-slate-600">
                <EditableCell value={t.ticketNumber} onSave={(v) => handleSave(t.id, 'ticketNumber', v)} />
              </td>
              <td className="px-2 py-1.5 text-right">
                <EditableCell
                  value={t.quantity != null ? parseFloat(t.quantity).toFixed(3) : null}
                  onSave={(v) => handleSave(t.id, 'quantity', v)}
                  type="number"
                />
              </td>
              <td className="px-2 py-1.5 text-right text-slate-600">
                <EditableCell
                  value={t.payRate != null ? `$${parseFloat(t.payRate).toFixed(2)}` : null}
                  onSave={(v) => handleSave(t.id, 'payRate', v.replace('$', ''))}
                />
              </td>
              <td className="px-2 py-1.5 text-right font-medium text-slate-800">
                <EditableCell
                  value={t.payAmount != null ? `$${parseFloat(t.payAmount).toFixed(2)}` : null}
                  onSave={(v) => handleSave(t.id, 'payAmount', v.replace('$', ''))}
                />
              </td>
              <td className="px-2 py-1.5 text-center">
                <button
                  onClick={() => handleMove(t)}
                  title={isFuel ? 'Move to Main table' : 'Move to Fuel table'}
                  className="px-1.5 py-0.5 text-xs rounded border border-slate-300 text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  {isFuel ? '↑ Main' : '↓ Fuel'}
                </button>
              </td>
              <td className="px-2 py-1.5 text-center">
                <button
                  onClick={() => handleDelete(t.id)}
                  title="Delete row"
                  className="text-red-400 hover:text-red-600 font-bold text-sm leading-none"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
          <AddRowForm onAdd={handleAdd} isFuel={isFuel} />
        </tbody>
      </table>
    </div>
  )
}
