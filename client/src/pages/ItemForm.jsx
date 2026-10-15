import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const CATEGORIES = ['electronics', 'clothing', 'documents', 'accessories', 'other']
const STATUSES = ['lost', 'found', 'claimed']

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // TODO 3 (edit mode): when there is an `id`, load the item and fill the form.
  useEffect(() => {
    if (!id) return
    let cancelled = false
    setError('')
    api.get('/items/' + id)
      .then(res => {
        if (cancelled) return
        const item = res.data.item || res.data
        // copy only the editable fields (never reportedBy, _id, etc.)
        setForm({
          title: item.title ?? '',
          status: item.status ?? 'lost',
          category: item.category ?? 'other',
          location: item.location ?? '',
          description: item.description ?? '',
        })
      })
      .catch(err => {
        if (!cancelled) setError(err?.response?.data?.message || 'Failed to load item')
      })
    return () => { cancelled = true }
  }, [id])

  // TODO 1: every input has a `name` matching a key in `form`.
  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // TODO 2 + 3: POST a new item, or PATCH the existing one when editing.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    // Only these five fields. Do NOT send reportedBy: the server rejects it.
    const payload = {
      title: form.title,
      status: form.status,
      category: form.category,
      location: form.location,
      description: form.description,
    }
    try {
      if (id) {
        await api.patch('/items/' + id, payload)
      } else {
        await api.post('/items', payload)
      }
      nav('/items')
    } catch (err) {
      setError(err?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="input"
          name="title"
          placeholder="Title (e.g. Black backpack)"
          value={form.title}
          onChange={onChange}
        />

        <select className="input" name="status" value={form.status} onChange={onChange}>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select className="input" name="category" value={form.category} onChange={onChange}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <input
          className="input"
          name="location"
          placeholder="Location (optional, e.g. Library 2nd floor)"
          value={form.location}
          onChange={onChange}
        />

        <textarea
          className="input"
          name="description"
          rows={4}
          placeholder="Description (optional)"
          value={form.description}
          onChange={onChange}
        />

        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit" disabled={saving}>Save</button>
      </form>
    </div>
  )
}