import { useState } from 'react'
import { supabase, STAGES } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { X } from 'lucide-react'

export default function NewProjectModal({ onClose, onCreated }) {
  const { profile } = useAuth()
  const [form, setForm] = useState({ name: '', code: '', client_name: '', address: '', stage: 'Concept', progress: 0, onedrive_url: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.code) { setError('Project name and code are required.'); return }
    setLoading(true)
    const { data, error: err } = await supabase.from('projects').insert({ ...form, created_by: profile.id, progress: Number(form.progress) }).select().single()
    if (err) { setError(err.message); setLoading(false); return }
    // Add creator as lead
    await supabase.from('project_members').insert({ project_id: data.id, user_id: profile.id, role: 'lead', consultant_type: 'Project Lead' })
    onCreated(); onClose()
  }

  return (
    <Modal title="New project" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Row>
          <Field label="Project name *">
            <input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Marina Quarter Residences" required />
          </Field>
          <Field label="Project code *">
            <input style={{ ...S.input, width: '140px' }} value={form.code} onChange={e => set('code', e.target.value)} placeholder="MDV-2025-001" required />
          </Field>
        </Row>
        <Row>
          <Field label="Client name">
            <input style={S.input} value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Client Pty Ltd" />
          </Field>
          <Field label="Stage">
            <select style={S.input} value={form.stage} onChange={e => set('stage', e.target.value)}>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </Row>
        <Field label="Address">
          <input style={S.input} value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Example Street, City" />
        </Field>
        <Field label={`Progress: ${form.progress}%`}>
          <input type="range" min="0" max="100" step="1" value={form.progress} onChange={e => set('progress', e.target.value)} style={{ width: '100%' }} />
        </Field>
        <Field label="OneDrive folder URL (optional)">
          <input style={S.input} value={form.onedrive_url} onChange={e => set('onedrive_url', e.target.value)} placeholder="https://meridian.sharepoint.com/…" />
        </Field>
        <Field label="Description (optional)">
          <textarea style={{ ...S.input, minHeight: '70px', resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief project overview…" />
        </Field>
        {error && <div style={S.error}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
          <button type="submit" style={S.btnPrimary} disabled={loading}>{loading ? 'Creating…' : 'Create project'}</button>
        </div>
      </form>
    </Modal>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', border: '0.5px solid #E0DED6' }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, fontSize: '15px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '4px' }}><X size={16} /></button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
    <label style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>{label}</label>
    {children}
  </div>
}
function Row({ children }) {
  return <div style={{ display: 'flex', gap: '12px' }}>{children}</div>
}

const S = {
  input: { padding: '8px 10px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '100%', boxSizing: 'border-box' },
  error: { background: '#FAECE7', color: '#993C1D', fontSize: '13px', padding: '10px 12px', borderRadius: '8px' },
  btnPrimary: { padding: '8px 18px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  btnSec: { padding: '8px 18px', background: 'transparent', color: '#666', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }
}
