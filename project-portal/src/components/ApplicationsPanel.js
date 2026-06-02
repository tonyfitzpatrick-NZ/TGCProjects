import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { STAGES } from '../lib/constants'
import {
  Plus, Edit2, Trash2, ExternalLink, Upload,
  FileText, CheckCircle, XCircle, AlertCircle,
  Clock, ChevronDown, ChevronRight
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Modal } from './NewProjectModal'

const APP_STATUSES = [
  'Not Required',
  'Required',
  'Submitted',
  'Approved',
  'Declined',
  'Conditions to Satisfy',
  'Lapsed'
]

const STATUS_COLORS = {
  'Not Required':          { bg: '#F0EFEF', color: '#999' },
  'Required':              { bg: '#FAEEDA', color: '#854F0B' },
  'Submitted':             { bg: '#E6F1FB', color: '#185FA5' },
  'Approved':              { bg: '#E1F5EE', color: '#0F6E56' },
  'Declined':              { bg: '#FAECE7', color: '#993C1D' },
  'Conditions to Satisfy': { bg: '#EEEDFE', color: '#534AB7' },
  'Lapsed':                { bg: '#F0EFEF', color: '#666' }
}

const DOC_LABELS = ['Application', 'Additional Information', 'Granted']

const DOC_LABEL_COLORS = {
  'Application':          { bg: '#E6F1FB', color: '#185FA5' },
  'Additional Information': { bg: '#FAEEDA', color: '#854F0B' },
  'Granted':              { bg: '#E1F5EE', color: '#0F6E56' }
}

export default function ApplicationsPanel({ projectId, projectCode, isLead }) {
  const { profile } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [editing, setEditing] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [uploadingFor, setUploadingFor] = useState(null)
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterStage, setFilterStage] = useState('All')

  useEffect(() => {
    fetchApplications()
    // Auto-populate from templates if project has none yet
    autoPopulate()
  }, [projectId])

  async function autoPopulate() {
    const { data: existing } = await supabase
      .from('project_applications')
      .select('id')
      .eq('project_id', projectId)
      .limit(1)
    if (existing && existing.length > 0) return // already populated

    const { data: templates } = await supabase
      .from('application_templates')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    if (!templates?.length) return

    await supabase.from('project_applications').insert(
      templates.map((t, i) => ({
        project_id: projectId,
        template_id: t.id,
        name: t.name,
        description: t.description,
        agency: t.agency,
        agency_website: t.agency_website,
        stage: t.stage,
        status: 'Not Required',
        is_required: false,
        sort_order: i
      }))
    )
    fetchApplications()
  }

  async function fetchApplications() {
    setLoading(true)
    const { data } = await supabase
      .from('project_applications')
      .select('*, application_documents(*)')
      .eq('project_id', projectId)
      .order('sort_order')
      .order('name')
    setApplications(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    const updates = { status, updated_at: new Date().toISOString() }
    if (status === 'Not Required') updates.is_required = false
    else if (status === 'Required') updates.is_required = true
    else updates.is_required = true
    await supabase.from('project_applications').update(updates).eq('id', id)
    fetchApplications()
  }

  async function deleteApplication(id, name) {
    if (!window.confirm(`Remove "${name}" from this project?`)) return
    await supabase.from('project_applications').delete().eq('id', id)
    fetchApplications()
  }

  async function deleteDocument(docId, storagePath) {
    if (!window.confirm('Delete this document?')) return
    if (storagePath) await supabase.storage.from('project-files').remove([storagePath])
    await supabase.from('application_documents').delete().eq('id', docId)
    fetchApplications()
  }

  async function openDocument(doc) {
    if (doc.onedrive_url) { window.open(doc.onedrive_url, '_blank'); return }
    if (doc.storage_path) {
      const { data } = await supabase.storage.from('project-files').createSignedUrl(doc.storage_path, 60)
      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    }
  }

  function toggleExpand(id) {
    setExpanded(e => ({ ...e, [id]: !e[id] }))
  }

  const filtered = applications.filter(a => {
    const matchStatus = filterStatus === 'All' || a.status === filterStatus
    const matchStage = filterStage === 'All' || a.stage === filterStage
    return matchStatus && matchStage
  })

  // Stats
  const stats = {
    required: applications.filter(a => a.is_required).length,
    submitted: applications.filter(a => a.status === 'Submitted').length,
    approved: applications.filter(a => a.status === 'Approved').length,
    attention: applications.filter(a => ['Declined', 'Conditions to Satisfy', 'Lapsed'].includes(a.status)).length
  }

  return (
    <div>
      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Required', count: stats.required, bg: '#FAEEDA', color: '#854F0B' },
          { label: 'Submitted', count: stats.submitted, bg: '#E6F1FB', color: '#185FA5' },
          { label: 'Approved', count: stats.approved, bg: '#E1F5EE', color: '#0F6E56' },
          { label: 'Need attention', count: stats.attention, bg: '#FAECE7', color: '#993C1D' },
        ].map(({ label, count, bg, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', background: bg }}>
            <span style={{ fontSize: '20px', fontWeight: '700', color }}>{count}</span>
            <span style={{ fontSize: '11px', color }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select style={S.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All statuses</option>
          {APP_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select style={S.filterSelect} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
          <option value="All">All stages</option>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
        {isLead && (
          <button onClick={() => setShowNew(true)} style={{ ...S.btnPrimary, marginLeft: 'auto' }}>
            <Plus size={13} /> Add application
          </button>
        )}
      </div>

      {/* Application list */}
      {loading ? (
        <div style={S.empty}>Loading applications…</div>
      ) : filtered.length === 0 ? (
        <div style={S.empty}>No applications match your filters.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map(app => {
            const sc = STATUS_COLORS[app.status] || STATUS_COLORS['Not Required']
            const docs = app.application_documents || []
            const isExpanded = expanded[app.id]
            const hasActivity = app.date_submitted || app.date_decision || app.reference_number || docs.length > 0 || app.notes

            return (
              <div key={app.id} style={{ border: '0.5px solid #ECEAE4', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                {/* Main row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px' }}>
                  {/* Expand toggle */}
                  <button
                    onClick={() => toggleExpand(app.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: '2px', flexShrink: 0 }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {/* Name and agency */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{app.name}</span>
                      {app.stage && (
                        <span style={{ fontSize: '10px', background: '#F0EEE9', color: '#888', padding: '1px 6px', borderRadius: '4px' }}>{app.stage}</span>
                      )}
                      {docs.length > 0 && (
                        <span style={{ fontSize: '10px', background: '#EEEDFE', color: '#534AB7', padding: '1px 6px', borderRadius: '4px' }}>
                          {docs.length} doc{docs.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {app.agency && (
                        app.agency_website
                          ? <a href={app.agency_website} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#534AB7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              {app.agency} <ExternalLink size={10} />
                            </a>
                          : <span>{app.agency}</span>
                      )}
                      {app.reference_number && <span style={{ color: '#bbb' }}>· Ref: {app.reference_number}</span>}
                    </div>
                    {/* Key dates inline */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '3px', flexWrap: 'wrap' }}>
                      {app.date_required_by && <DateChip label="Required by" date={app.date_required_by} warn />}
                      {app.date_submitted && <DateChip label="Submitted" date={app.date_submitted} />}
                      {app.date_decision && <DateChip label="Decision" date={app.date_decision} />}
                    </div>
                  </div>

                  {/* Status selector */}
                  <select
                    value={app.status}
                    onChange={e => updateStatus(app.id, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{
                      padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '500',
                      border: 'none', cursor: 'pointer', background: sc.bg, color: sc.color,
                      fontFamily: 'inherit', flexShrink: 0
                    }}>
                    {APP_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>

                  {/* Actions */}
                  {isLead && (
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button onClick={e => { e.stopPropagation(); setUploadingFor(app) }} style={S.iconBtn} title="Upload document">
                        <Upload size={13} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setEditing(app) }} style={S.iconBtn} title="Edit details">
                        <Edit2 size={13} />
                      </button>
                      {app.is_custom && (
                        <button onClick={e => { e.stopPropagation(); deleteApplication(app.id, app.name) }} style={{ ...S.iconBtn, color: '#ddd' }} title="Remove">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ borderTop: '0.5px solid #F3F1EB', padding: '12px 14px 14px 40px', background: '#FAFAF8' }}>
                    {app.description && (
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px', lineHeight: '1.6' }}>{app.description}</div>
                    )}
                    {app.notes && (
                      <div style={{ fontSize: '12px', color: '#888', background: '#fff', padding: '8px 10px', borderRadius: '6px', border: '0.5px solid #ECEAE4', marginBottom: '10px', lineHeight: '1.6' }}>
                        <span style={{ fontWeight: '500', color: '#666' }}>Notes: </span>{app.notes}
                      </div>
                    )}

                    {/* Documents */}
                    {docs.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '500', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Documents</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {docs.map(doc => {
                            const lc = DOC_LABEL_COLORS[doc.doc_label] || DOC_LABEL_COLORS['Application']
                            return (
                              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', border: '0.5px solid #ECEAE4', borderRadius: '7px', background: '#fff', cursor: 'pointer' }}
                                onClick={() => openDocument(doc)}>
                                <FileText size={13} color="#aaa" />
                                <span style={{ flex: 1, fontSize: '12px', color: '#1a1a1a' }}>{doc.name}</span>
                                <span style={{ ...S.badge, background: lc.bg, color: lc.color, fontSize: '10px' }}>{doc.doc_label}</span>
                                {doc.onedrive_url && <ExternalLink size={11} color="#bbb" />}
                                {isLead && (
                                  <button onClick={e => { e.stopPropagation(); deleteDocument(doc.id, doc.storage_path) }} style={{ ...S.iconBtn, color: '#ddd', border: 'none' }}>
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {isLead && (
                      <button onClick={() => setUploadingFor(app)} style={{ fontSize: '12px', color: '#534AB7', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                        <Upload size={12} /> Upload document
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {editing && <EditApplicationModal app={editing} onClose={() => setEditing(null)} onSaved={fetchApplications} />}
      {showNew && <NewApplicationModal projectId={projectId} onClose={() => setShowNew(false)} onSaved={fetchApplications} />}
      {uploadingFor && <UploadAppDocModal app={uploadingFor} onClose={() => setUploadingFor(null)} onUploaded={fetchApplications} profile={{ id: profile?.id }} />}
    </div>
  )
}

// ── DATE CHIP ─────────────────────────────────────────────────
function DateChip({ label, date, warn }) {
  const d = parseISO(date)
  const isOverdue = warn && new Date() > d
  return (
    <span style={{ fontSize: '11px', color: isOverdue ? '#A32D2D' : '#888', display: 'flex', alignItems: 'center', gap: '3px' }}>
      {isOverdue && <AlertCircle size={10} />}
      <span style={{ color: '#bbb' }}>{label}:</span> {format(d, 'd MMM yyyy')}
    </span>
  )
}

// ── EDIT APPLICATION MODAL ────────────────────────────────────
function EditApplicationModal({ app, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: app.name || '',
    description: app.description || '',
    agency: app.agency || '',
    agency_website: app.agency_website || '',
    stage: app.stage || '',
    status: app.status || 'Not Required',
    reference_number: app.reference_number || '',
    date_required_by: app.date_required_by || '',
    date_submitted: app.date_submitted || '',
    date_decision: app.date_decision || '',
    notes: app.notes || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('')
    const { error: err } = await supabase.from('project_applications').update({
      ...form,
      is_required: form.status !== 'Not Required',
      date_required_by: form.date_required_by || null,
      date_submitted: form.date_submitted || null,
      date_decision: form.date_decision || null,
      updated_at: new Date().toISOString()
    }).eq('id', app.id)
    if (err) { setError(err.message); setLoading(false); return }
    onSaved(); onClose()
  }

  return (
    <Modal title={`Edit — ${app.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="Application name *">
          <input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} required />
        </Field>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Agency / authority">
            <input style={S.input} value={form.agency} onChange={e => set('agency', e.target.value)} placeholder="e.g. Dunedin City Council" />
          </Field>
          <Field label="Status">
            <select style={S.input} value={form.status} onChange={e => set('status', e.target.value)}>
              {APP_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Agency website">
            <input style={S.input} type="url" value={form.agency_website} onChange={e => set('agency_website', e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Project stage">
            <select style={S.input} value={form.stage} onChange={e => set('stage', e.target.value)}>
              <option value="">Any stage</option>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Reference / consent number">
          <input style={S.input} value={form.reference_number} onChange={e => set('reference_number', e.target.value)} placeholder="e.g. RC-2025-00123" />
        </Field>

        <SectionLabel>Key dates</SectionLabel>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Required by">
            <input style={S.input} type="date" value={form.date_required_by} onChange={e => set('date_required_by', e.target.value)} />
          </Field>
          <Field label="Date submitted">
            <input style={S.input} type="date" value={form.date_submitted} onChange={e => set('date_submitted', e.target.value)} />
          </Field>
          <Field label="Decision date">
            <input style={S.input} type="date" value={form.date_decision} onChange={e => set('date_decision', e.target.value)} />
          </Field>
        </div>
        <Field label="Description">
          <textarea style={{ ...S.input, minHeight: '60px', resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} />
        </Field>
        <Field label="Notes">
          <textarea style={{ ...S.input, minHeight: '60px', resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any relevant notes, conditions, follow-up required…" />
        </Field>
        {error && <div style={S.error}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
          <button type="submit" style={S.btnPrimary} disabled={loading}>{loading ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  )
}

// ── NEW CUSTOM APPLICATION MODAL ──────────────────────────────
function NewApplicationModal({ projectId, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', agency: '', agency_website: '', stage: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.from('project_applications').insert({
      project_id: projectId, ...form,
      status: 'Not Required', is_required: false, is_custom: true, sort_order: 999
    })
    if (err) { setError(err.message); setLoading(false); return }
    onSaved(); onClose()
  }

  return (
    <Modal title="Add application" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="Application name *">
          <input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Heritage NZ Approval" required autoFocus />
        </Field>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Agency">
            <input style={S.input} value={form.agency} onChange={e => set('agency', e.target.value)} />
          </Field>
          <Field label="Stage">
            <select style={S.input} value={form.stage} onChange={e => set('stage', e.target.value)}>
              <option value="">Any stage</option>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Agency website">
          <input style={S.input} type="url" value={form.agency_website} onChange={e => set('agency_website', e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Description">
          <textarea style={{ ...S.input, minHeight: '60px', resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} />
        </Field>
        {error && <div style={S.error}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
          <button type="submit" style={S.btnPrimary} disabled={loading}>{loading ? 'Adding…' : 'Add application'}</button>
        </div>
      </form>
    </Modal>
  )
}

// ── UPLOAD DOCUMENT MODAL ─────────────────────────────────────
function UploadAppDocModal({ app, onClose, onUploaded, profile }) {
  const [file, setFile] = useState(null)
  const [docLabel, setDocLabel] = useState('Application')
  const [linkUrl, setLinkUrl] = useState('')
  const [useLink, setUseLink] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!useLink && !file) { setError('Please select a file.'); return }
    if (useLink && !linkUrl.trim()) { setError('Please enter a URL.'); return }
    setLoading(true); setError('')

    let storagePath = null
    let fileName = useLink ? linkUrl.split('/').pop() || 'Linked document' : file.name

    if (!useLink && file) {
      const path = `${app.project_id}/applications/${Date.now()}_${file.name}`
      const { error: uploadErr } = await supabase.storage.from('project-files').upload(path, file)
      if (uploadErr) { setError(uploadErr.message); setLoading(false); return }
      storagePath = path
    }

    const { error: dbErr } = await supabase.from('application_documents').insert({
      application_id: app.id,
      project_id: app.project_id,
      name: fileName,
      doc_label: docLabel,
      storage_path: storagePath,
      onedrive_url: useLink ? linkUrl : null,
      file_type: file ? file.name.split('.').pop().toLowerCase() : 'link',
      file_size: file?.size || null,
      uploaded_by: profile?.id
    })
    if (dbErr) { setError(dbErr.message); setLoading(false); return }
    onUploaded(); onClose()
  }

  return (
    <Modal title={`Upload document — ${app.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="Document label">
          <div style={{ display: 'flex', gap: '8px' }}>
            {DOC_LABELS.map(l => {
              const lc = DOC_LABEL_COLORS[l]
              return (
                <button key={l} type="button" onClick={() => setDocLabel(l)} style={{
                  flex: 1, padding: '8px 6px', borderRadius: '8px', border: `1.5px solid ${docLabel === l ? lc.color : '#D0CEC6'}`,
                  background: docLabel === l ? lc.bg : 'transparent', color: docLabel === l ? lc.color : '#666',
                  fontSize: '12px', fontWeight: docLabel === l ? '600' : '400', cursor: 'pointer', fontFamily: 'inherit'
                }}>{l}</button>
              )
            })}
          </div>
        </Field>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={() => setUseLink(false)} style={{ ...S.toggleBtn, background: !useLink ? '#1B2B4B' : 'transparent', color: !useLink ? '#fff' : '#666', border: `0.5px solid ${!useLink ? '#1B2B4B' : '#D0CEC6'}` }}>Upload file</button>
          <button type="button" onClick={() => setUseLink(true)} style={{ ...S.toggleBtn, background: useLink ? '#1B2B4B' : 'transparent', color: useLink ? '#fff' : '#666', border: `0.5px solid ${useLink ? '#1B2B4B' : '#D0CEC6'}` }}>OneDrive / link</button>
        </div>

        {!useLink ? (
          <Field label="File">
            <input type="file" onChange={e => setFile(e.target.files[0])} style={{ fontSize: '13px', color: '#444' }} />
          </Field>
        ) : (
          <Field label="URL">
            <input style={S.input} type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://…" />
          </Field>
        )}

        {error && <div style={S.error}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
          <button type="submit" style={S.btnPrimary} disabled={loading}>{loading ? 'Uploading…' : 'Upload'}</button>
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

function SectionLabel({ children }) {
  return <div style={{ fontSize: '11px', fontWeight: '500', color: '#B8952A', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '0.5px solid #F0E8D0', paddingBottom: '4px' }}>{children}</div>
}

const S = {
  filterSelect: { padding: '5px 8px', border: '0.5px solid #D0CEC6', borderRadius: '7px', fontSize: '12px', background: '#FAFAF8', fontFamily: 'inherit', color: '#444', cursor: 'pointer' },
  input: { padding: '8px 10px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '100%', boxSizing: 'border-box' },
  error: { background: '#FAECE7', color: '#993C1D', fontSize: '13px', padding: '10px 12px', borderRadius: '8px' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  btnSec: { padding: '8px 18px', background: 'transparent', color: '#666', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
  iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px', border: '0.5px solid #E0DED6', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: '#888' },
  toggleBtn: { padding: '7px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500' },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '500' },
  empty: { textAlign: 'center', color: '#ccc', padding: '40px', fontSize: '13px' }
}
