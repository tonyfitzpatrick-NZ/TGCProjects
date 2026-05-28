import { useState } from 'react'
import { supabase, STAGES } from '../lib/supabase'
import { Modal } from './NewProjectModal'
import { X } from 'lucide-react'

// ── INVITE CONSULTANT TO PROJECT ──────────────────────────────
export default function InviteModal({ projectId, onClose, onAdded }) {
  const [email, setEmail] = useState('')
  const [consultantType, setConsultantType] = useState('')
  const [deadline, setDeadline] = useState('')
  const [role, setRole] = useState('consultant')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const TYPES = ['Structural Engineer', 'Fire Designer', 'Interior Designer',
    'Remote Arch. Team', 'Quantity Surveyor', 'Civil Engineer', 'Other']

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data: userId, error: rpcErr } = await supabase.rpc('get_user_id_by_email', { email_input: email })
    if (rpcErr || !userId) {
      setError('User not found. Make sure they have an account first.')
      setLoading(false); return
    }
    const { error: insertErr } = await supabase.from('project_members').insert({
      project_id: projectId, user_id: userId,
      role, consultant_type: consultantType, deadline: deadline || null
    })
    if (insertErr) { setError(insertErr.message); setLoading(false); return }
    onAdded(); onClose()
  }

  return (
    <Modal title="Add consultant" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="Email address *">
          <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="engineer@company.com" required />
        </Field>
        <Field label="Role type">
          <select style={S.input} value={consultantType} onChange={e => setConsultantType(e.target.value)}>
            <option value="">Select…</option>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Portal role">
            <select style={S.input} value={role} onChange={e => setRole(e.target.value)}>
              <option value="consultant">Consultant</option>
              <option value="lead">Project lead</option>
            </select>
          </Field>
          <Field label="Deadline (optional)">
            <input style={S.input} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </Field>
        </div>
        {error && <div style={S.error}>{error}</div>}
        <p style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.5' }}>
          The user must already have an account. Admins can create accounts via the Users & Access page.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
          <button type="submit" style={S.btnPrimary} disabled={loading}>{loading ? 'Adding…' : 'Add to project'}</button>
        </div>
      </form>
    </Modal>
  )
}

// ── UPLOAD MODAL ──────────────────────────────────────────────
export function UploadModal({ projectId, onClose, onUploaded }) {
  const [file, setFile] = useState(null)
  const [category, setCategory] = useState('General')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const CATS = ['Project Brief', 'Drawings', 'Consultant Docs', 'General']

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) { setError('Please select a file.'); return }
    setLoading(true); setError('')
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `${projectId}/${Date.now()}_${file.name}`
    const { error: storageErr } = await supabase.storage.from('project-files').upload(path, file)
    if (storageErr) { setError(storageErr.message); setLoading(false); return }
    const { error: dbErr } = await supabase.from('project_files').insert({
      project_id: projectId, name: file.name, file_type: ext,
      category, storage_path: path, file_size: file.size
    })
    if (dbErr) { setError(dbErr.message); setLoading(false); return }
    onUploaded(); onClose()
  }

  return (
    <Modal title="Upload file" onClose={onClose}>
      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="File">
          <input type="file" onChange={e => setFile(e.target.files[0])} style={{ fontSize: '13px', color: '#444' }} />
        </Field>
        <Field label="Category">
          <select style={S.input} value={category} onChange={e => setCategory(e.target.value)}>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        {error && <div style={S.error}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
          <button type="submit" style={S.btnPrimary} disabled={loading}>{loading ? 'Uploading…' : 'Upload'}</button>
        </div>
      </form>
    </Modal>
  )
}

// ── ONEDRIVE LINK MODAL ────────────────────────────────────────
export function LinkModal({ projectId, onClose, onAdded }) {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Drawings')
  const [fileType, setFileType] = useState('dwg')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const CATS = ['Project Brief', 'Drawings', 'Consultant Docs', 'General']
  const TYPES = ['dwg', 'ifc', 'pdf', 'xlsx', 'docx', 'link']

  async function handleSubmit(e) {
    e.preventDefault()
    if (!url || !name) { setError('Name and URL are required.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.from('project_files').insert({
      project_id: projectId, name, file_type: fileType, category, onedrive_url: url
    })
    if (err) { setError(err.message); setLoading(false); return }
    onAdded(); onClose()
  }

  return (
    <Modal title="Add OneDrive / shared link" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="Display name *">
          <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="A-001 Site plan.dwg" required />
        </Field>
        <Field label="URL *">
          <input style={S.input} type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" required />
        </Field>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Category">
            <select style={S.input} value={category} onChange={e => setCategory(e.target.value)}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="File type">
            <select style={S.input} value={fileType} onChange={e => setFileType(e.target.value)}>
              {TYPES.map(t => <option key={t}>{t.toUpperCase()}</option>)}
            </select>
          </Field>
        </div>
        {error && <div style={S.error}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
          <button type="submit" style={S.btnPrimary} disabled={loading}>{loading ? 'Adding…' : 'Add link'}</button>
        </div>
      </form>
    </Modal>
  )
}

// ── EDIT PROJECT MODAL ─────────────────────────────────────────
export function EditProjectModal({ project, onClose, onUpdated }) {
  const [form, setForm] = useState({ ...project })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('')
    const { error: err } = await supabase.from('projects').update({
      name: form.name, code: form.code, client_name: form.client_name,
      address: form.address, stage: form.stage, progress: Number(form.progress),
      onedrive_url: form.onedrive_url, description: form.description,
      updated_at: new Date().toISOString()
    }).eq('id', project.id)
    if (err) { setError(err.message); setLoading(false); return }
    onUpdated()
  }

  return (
    <Modal title="Edit project" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Project name *"><input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} required /></Field>
          <Field label="Code *"><input style={{ ...S.input, width: '130px' }} value={form.code} onChange={e => set('code', e.target.value)} required /></Field>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Client name"><input style={S.input} value={form.client_name || ''} onChange={e => set('client_name', e.target.value)} /></Field>
          <Field label="Stage">
            <select style={S.input} value={form.stage} onChange={e => set('stage', e.target.value)}>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label={`Progress: ${form.progress}%`}>
          <input type="range" min="0" max="100" step="1" value={form.progress} onChange={e => set('progress', e.target.value)} style={{ width: '100%' }} />
        </Field>
        <Field label="Address"><input style={S.input} value={form.address || ''} onChange={e => set('address', e.target.value)} /></Field>
        <Field label="OneDrive folder URL"><input style={S.input} value={form.onedrive_url || ''} onChange={e => set('onedrive_url', e.target.value)} /></Field>
        {error && <div style={S.error}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
          <button type="submit" style={S.btnPrimary} disabled={loading}>{loading ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  )
}

function Field({ label, children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
    <label style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>{label}</label>
    {children}
  </div>
}

const S = {
  input: { padding: '8px 10px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '100%', boxSizing: 'border-box' },
  error: { background: '#FAECE7', color: '#993C1D', fontSize: '13px', padding: '10px 12px', borderRadius: '8px' },
  btnPrimary: { padding: '8px 18px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  btnSec: { padding: '8px 18px', background: 'transparent', color: '#666', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }
}
