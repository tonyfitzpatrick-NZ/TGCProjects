import { useState, useEffect } from 'react'
import { supabase, STAGES } from '../lib/supabase'
import { Modal } from './NewProjectModal'

const CONSULTANT_TYPES = [
  'Structural Engineer', 'Fire Designer', 'Interior Designer',
  'Remote Arch. Team', 'Quantity Surveyor', 'Civil Engineer',
  'Geotechnical Engineer', 'Project Manager', 'Other'
]

// ── INVITE CONSULTANT TO PROJECT ─────────────────────────────
export default function InviteModal({ projectId, onClose, onAdded }) {
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [consultantType, setConsultantType] = useState('')
  const [role, setRole] = useState('consultant')
  const [deadline, setDeadline] = useState('')
  const [dateEngaged, setDateEngaged] = useState('')
  const [dateDocsSent, setDateDocsSent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('profiles')
      .select('id, full_name, avatar_initials, companies(name), discipline')
      .order('full_name')
      .then(({ data }) => setUsers(data || []))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedUserId) { setError('Please select a user.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.from('project_members').insert({
      project_id: projectId,
      user_id: selectedUserId,
      role,
      consultant_type: consultantType,
      deadline: deadline || null,
      date_engaged: dateEngaged || null,
      date_docs_sent: dateDocsSent || null
    })
    if (err) { setError(err.message); setLoading(false); return }
    onAdded(); onClose()
  }

  return (
    <Modal title="Add team member" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="Select user *">
          <select style={S.input} value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required>
            <option value="">Choose a user…</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.full_name}{u.companies?.name ? ` — ${u.companies.name}` : ''}{u.discipline ? ` (${u.discipline})` : ''}
              </option>
            ))}
          </select>
        </Field>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Consultant type">
            <select style={S.input} value={consultantType} onChange={e => setConsultantType(e.target.value)}>
              <option value="">Select…</option>
              {CONSULTANT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Portal role">
            <select style={S.input} value={role} onChange={e => setRole(e.target.value)}>
              <option value="consultant">Consultant</option>
              <option value="lead">Project lead</option>
            </select>
          </Field>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Date engaged">
            <input style={S.input} type="date" value={dateEngaged} onChange={e => setDateEngaged(e.target.value)} />
          </Field>
          <Field label="Docs sent date">
            <input style={S.input} type="date" value={dateDocsSent} onChange={e => setDateDocsSent(e.target.value)} />
          </Field>
        </div>
        <Field label="Deadline">
          <input style={S.input} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        </Field>
        {error && <div style={S.error}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
          <button type="submit" style={S.btnPrimary} disabled={loading}>{loading ? 'Adding…' : 'Add to project'}</button>
        </div>
      </form>
    </Modal>
  )
}

// ── UPLOAD MODAL ─────────────────────────────────────────────
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

// ── ONEDRIVE LINK MODAL ───────────────────────────────────────
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

// ── EDIT PROJECT MODAL ────────────────────────────────────────
// EditProjectModal is now handled directly in ProjectDetailPage
// by passing project prop to NewProjectModal
export function EditProjectModal({ project, onClose, onUpdated }) {
  return <div style={{ display: 'none' }} />
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
  btnPrimary: { padding: '8px 18px', background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  btnSec: { padding: '8px 18px', background: 'transparent', color: '#666', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }
}
