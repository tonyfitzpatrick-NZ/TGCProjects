import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  REVISION_OPTIONS,
  DISCIPLINE_CODES, DOC_TYPES, DOC_STATUSES, DOC_STATUS_COLORS
} from '../lib/constants'
import {
  ChevronDown, ChevronRight, Upload, Edit2, RotateCcw,
  ExternalLink, FileText, Trash2, Search, Filter
} from 'lucide-react'
import { format } from 'date-fns'
import DocumentUploadModal from './DocumentUploadModal'
import { Modal } from './NewProjectModal'

export default function DocumentRegister({ projectId, projectCode, isLead }) {
  const { profile } = useAuth()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDiscipline, setFilterDiscipline] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterType, setFilterType] = useState('All')
  const [showSuperseded, setShowSuperseded] = useState(false)
  const [groupBy, setGroupBy] = useState('discipline')
  const [expandedFamilies, setExpandedFamilies] = useState({})
  const [showUpload, setShowUpload] = useState(false)
  const [revisingFile, setRevisingFile] = useState(null)
  const [editingFile, setEditingFile] = useState(null)

  useEffect(() => { fetchFiles() }, [projectId])

  async function fetchFiles() {
    setLoading(true)
    const { data } = await supabase
      .from('project_files')
      .select('*, profiles(full_name)')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false })
    setFiles(data || [])
    setLoading(false)
  }

  async function deleteFile(f) {
    if (!window.confirm(`Delete ${f.name}? This cannot be undone.`)) return
    if (f.storage_path) {
      await supabase.storage.from('project-files').remove([f.storage_path])
    }
    await supabase.from('project_files').delete().eq('id', f.id)
    fetchFiles()
  }

  async function openFile(f) {
    if (f.onedrive_url) { window.open(f.onedrive_url, '_blank'); return }
    if (f.storage_path) {
      const { data } = await supabase.storage.from('project-files').createSignedUrl(f.storage_path, 60)
      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    }
  }

  function toggleFamily(key) {
    setExpandedFamilies(e => ({ ...e, [key]: !e[key] }))
  }

  // Separate managed docs (have doc metadata) from legacy files
  const managedDocs = files.filter(f => f.discipline_code || f.doc_type)
  const legacyFiles = files.filter(f => !f.discipline_code && !f.doc_type)

  // Filter managed docs
  const filtered = managedDocs.filter(f => {
    if (!showSuperseded && f.doc_status === 'Superseded') return false
    const matchSearch = !search ||
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.doc_description?.toLowerCase().includes(search.toLowerCase()) ||
      f.revision?.toLowerCase().includes(search.toLowerCase())
    const matchDisc = filterDiscipline === 'All' || f.discipline_code === filterDiscipline
    const matchStatus = filterStatus === 'All' || f.doc_status === filterStatus
    const matchType = filterType === 'All' || f.doc_type === filterType
    return matchSearch && matchDisc && matchStatus && matchType
  })

  // Group by family key first (for revision history), then by chosen grouping
  const families = {}
  filtered.forEach(f => {
    const key = f.doc_family_key || f.id
    if (!families[key]) families[key] = []
    families[key].push(f)
  })

  // Sort within each family by revision descending
  Object.values(families).forEach(fam => {
    fam.sort((a, b) => (b.revision || '').localeCompare(a.revision || ''))
  })

  // Now group families by chosen groupBy
  function getGroups() {
    const groups = {}
    Object.entries(families).forEach(([famKey, docs]) => {
      const latest = docs[0]
      let groupKey = 'Other'
      if (groupBy === 'discipline') {
        const disc = DISCIPLINE_CODES.find(d => d.code === latest.discipline_code)
        groupKey = disc ? `${disc.code} — ${disc.label}` : 'Other'
      } else if (groupBy === 'status') {
        groupKey = latest.doc_status || 'Unknown'
      } else if (groupBy === 'type') {
        const type = DOC_TYPES.find(t => t.code === latest.doc_type)
        groupKey = type ? `${type.code} — ${type.label}` : 'Other'
      }
      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push({ famKey, docs })
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }

  const groups = getGroups()
  const latestCount = Object.values(families).filter(f => f[0]?.is_latest_revision !== false).length

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
          <Search size={13} color="#aaa" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            style={{ ...S.input, paddingLeft: '28px', width: '100%' }}
            placeholder="Search documents…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {isLead && (
          <button onClick={() => setShowUpload(true)} style={S.btnPrimary}>
            <Upload size={13} /> Upload document
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center', padding: '10px 12px', background: '#F7F6F3', borderRadius: '10px' }}>
        <Filter size={13} color="#aaa" />

        <select style={S.filterSelect} value={filterDiscipline} onChange={e => setFilterDiscipline(e.target.value)}>
          <option value="All">All disciplines</option>
          {DISCIPLINE_CODES.map(d => <option key={d.code} value={d.code}>{d.code} — {d.label}</option>)}
        </select>

        <select style={S.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All statuses</option>
          {DOC_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>

        <select style={S.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">All types</option>
          {DOC_TYPES.map(t => <option key={t.code} value={t.code}>{t.code} — {t.label}</option>)}
        </select>

        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#aaa' }}>Group:</span>
          {['discipline', 'status', 'type'].map(g => (
            <button key={g} onClick={() => setGroupBy(g)} style={{
              padding: '3px 9px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer',
              fontFamily: 'inherit', border: '0.5px solid #D0CEC6',
              background: groupBy === g ? '#1B2B4B' : 'transparent',
              color: groupBy === g ? '#fff' : '#666'
            }}>{g.charAt(0).toUpperCase() + g.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', fontSize: '12px', color: '#aaa', alignItems: 'center' }}>
        <span>{latestCount} document{latestCount !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{files.length} total files (including revisions)</span>
        <button
          onClick={() => setShowSuperseded(s => !s)}
          style={{ marginLeft: 'auto', fontSize: '11px', color: showSuperseded ? '#534AB7' : '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
          {showSuperseded ? 'Hide superseded' : 'Show superseded'}
        </button>
      </div>

      {/* Document groups */}
      {loading ? (
        <div style={S.empty}>Loading documents…</div>
      ) : groups.length === 0 ? (
        <div style={S.empty}>
          {managedDocs.length === 0
            ? 'No documents uploaded yet. Use "Upload document" to add files with proper metadata.'
            : 'No documents match your filters.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {groups.map(([groupName, groupFamilies]) => (
            <div key={groupName}>
              {/* Group header */}
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#1B2B4B', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '8px 0 6px', borderBottom: '1.5px solid #1B2B4B', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{groupName}</span>
                <span style={{ fontWeight: '400', color: '#aaa', fontSize: '10px' }}>{groupFamilies.length} doc{groupFamilies.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Document families */}
              {groupFamilies.map(({ famKey, docs }) => {
                const latest = docs[0]
                const hasRevisions = docs.length > 1
                const isExpanded = expandedFamilies[famKey]
                const sc = DOC_STATUS_COLORS[latest.doc_status] || DOC_STATUS_COLORS['For Information']

                return (
                  <div key={famKey} style={{ border: '0.5px solid #ECEAE4', borderRadius: '10px', overflow: 'hidden', marginBottom: '6px', background: '#fff' }}>
                    {/* Latest revision row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px' }}>

                      {/* Expand revisions toggle */}
                      <button
                        onClick={() => hasRevisions && toggleFamily(famKey)}
                        style={{ background: 'none', border: 'none', cursor: hasRevisions ? 'pointer' : 'default', color: hasRevisions ? '#aaa' : 'transparent', padding: '2px', flexShrink: 0 }}>
                        {hasRevisions
                          ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)
                          : <ChevronRight size={14} color="transparent" />}
                      </button>

                      {/* File icon */}
                      <FileText size={15} color="#aaa" style={{ flexShrink: 0 }} />

                      {/* Doc info */}
                      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => openFile(latest)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>
                            {latest.doc_description || latest.name}
                          </span>
                          <span style={{ fontSize: '10px', background: '#F0EEE9', color: '#888', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                            {latest.revision || 'R00'}
                          </span>
                          {latest.doc_type && (
                            <span style={{ fontSize: '10px', color: '#aaa' }}>{latest.doc_type}</span>
                          )}
                          {latest.onedrive_url && <ExternalLink size={11} color="#bbb" />}
                          {hasRevisions && (
                            <span style={{ fontSize: '10px', color: '#aaa' }}>{docs.length} revisions</span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px', fontFamily: 'monospace' }}>
                          {latest.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '1px' }}>
                          {latest.profiles?.full_name && `Uploaded by ${latest.profiles.full_name}`}
                          {latest.uploaded_at && ` · ${format(new Date(latest.uploaded_at), 'd MMM yyyy')}`}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span style={{ ...S.badge, background: sc.bg, color: sc.color, flexShrink: 0 }}>
                        {latest.doc_status}
                      </span>

                      {/* Actions */}
                      {isLead && (
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                          <button onClick={() => setRevisingFile(latest)} style={S.iconBtn} title="Upload new revision">
                            <RotateCcw size={13} />
                          </button>
                          <button onClick={() => setEditingFile(latest)} style={S.iconBtn} title="Edit metadata">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => deleteFile(latest)} style={{ ...S.iconBtn, color: '#ddd' }} title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Revision history (expanded) */}
                    {isExpanded && docs.slice(1).map(rev => {
                      const rsc = DOC_STATUS_COLORS[rev.doc_status] || DOC_STATUS_COLORS['For Information']
                      return (
                        <div key={rev.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px 8px 40px', background: '#F9F8F6', borderTop: '0.5px solid #F0EEE9' }}>
                          <FileText size={13} color="#ccc" style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openFile(rev)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12px', color: '#888' }}>{rev.doc_description}</span>
                              <span style={{ fontSize: '10px', background: '#F0EEE9', color: '#aaa', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{rev.revision}</span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#ccc', fontFamily: 'monospace', marginTop: '1px' }}>{rev.name}</div>
                            <div style={{ fontSize: '10px', color: '#ccc', marginTop: '1px' }}>
                              {rev.uploaded_at && format(new Date(rev.uploaded_at), 'd MMM yyyy')}
                            </div>
                          </div>
                          <span style={{ ...S.badge, background: rsc.bg, color: rsc.color, fontSize: '10px', flexShrink: 0 }}>
                            {rev.doc_status}
                          </span>
                          {isLead && (
                            <button onClick={() => deleteFile(rev)} style={{ ...S.iconBtn, color: '#ddd' }} title="Delete revision">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Legacy files section */}
      {legacyFiles.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px', paddingBottom: '6px', borderBottom: '0.5px solid #ECEAE4' }}>
            Previously uploaded files (no metadata)
          </div>
          {legacyFiles.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', border: '0.5px solid #ECEAE4', borderRadius: '8px', marginBottom: '4px', background: '#fff' }}>
              <FileText size={14} color="#ccc" />
              <span style={{ flex: 1, fontSize: '12px', color: '#888', cursor: 'pointer' }} onClick={() => openFile(f)}>{f.name}</span>
              {isLead && (
                <button onClick={() => setEditingFile(f)} style={{ ...S.iconBtn, fontSize: '11px' }} title="Add metadata">
                  Add metadata
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showUpload && (
        <DocumentUploadModal
          projectId={projectId}
          projectCode={projectCode}
          onClose={() => setShowUpload(false)}
          onUploaded={fetchFiles}
        />
      )}
      {revisingFile && (
        <DocumentUploadModal
          projectId={projectId}
          projectCode={projectCode}
          existingFile={revisingFile}
          onClose={() => setRevisingFile(null)}
          onUploaded={fetchFiles}
        />
      )}
      {editingFile && (
        <EditMetadataModal
          file={editingFile}
          onClose={() => setEditingFile(null)}
          onSaved={fetchFiles}
        />
      )}
    </div>
  )
}

// ── EDIT METADATA MODAL ───────────────────────────────────────
function EditMetadataModal({ file, onClose, onSaved }) {
  const [disciplineCode, setDisciplineCode] = useState(file.discipline_code || '')
  const [docType, setDocType] = useState(file.doc_type || '')
  const [revision, setRevision] = useState(file.revision || 'R00')
  const [docStatus, setDocStatus] = useState(file.doc_status || 'For Information')
  const [description, setDescription] = useState(file.doc_description || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await supabase.from('project_files').update({
      discipline_code: disciplineCode || null,
      doc_type: docType || null,
      revision,
      doc_status: docStatus,
      doc_description: description || null,
      doc_family_key: description
        ? `${disciplineCode}-${docType}-${description.trim().replace(/\s+/g, '-').toUpperCase()}`
        : file.doc_family_key
    }).eq('id', file.id)
    if (err) { setError(err.message); setLoading(false); return }
    onSaved(); onClose()
  }

  return (
    <Modal title="Edit document metadata" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ background: '#F7F6F3', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>{file.name}</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Discipline">
            <select style={S.input} value={disciplineCode} onChange={e => setDisciplineCode(e.target.value)}>
              <option value="">Select…</option>
              {DISCIPLINE_CODES.map(d => <option key={d.code} value={d.code}>{d.code} — {d.label}</option>)}
            </select>
          </Field>
          <Field label="Document type">
            <select style={S.input} value={docType} onChange={e => setDocType(e.target.value)}>
              <option value="">Select…</option>
              {DOC_TYPES.map(t => <option key={t.code} value={t.code}>{t.code} — {t.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Document description">
          <input style={S.input} value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Structural Report" />
        </Field>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Revision">
            <select style={S.input} value={revision} onChange={e => setRevision(e.target.value)}>
              {REVISION_OPTIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select style={S.input} value={docStatus} onChange={e => setDocStatus(e.target.value)}>
              {DOC_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        {error && <div style={S.error}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
          <button type="submit" style={S.btnPrimary} disabled={loading}>{loading ? 'Saving…' : 'Save metadata'}</button>
        </div>
      </form>
    </Modal>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
      <label style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>{label}</label>
      {children}
    </div>
  )
}

const S = {
  input: { padding: '8px 10px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '100%', boxSizing: 'border-box' },
  filterSelect: { padding: '5px 8px', border: '0.5px solid #D0CEC6', borderRadius: '7px', fontSize: '12px', background: '#fff', fontFamily: 'inherit', color: '#444', cursor: 'pointer' },
  error: { background: '#FAECE7', color: '#993C1D', fontSize: '13px', padding: '10px 12px', borderRadius: '8px' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  btnSec: { padding: '8px 16px', background: 'transparent', color: '#666', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
  iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px', border: '0.5px solid #E0DED6', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: '#888', fontSize: '12px' },
  badge: { display: 'inline-block', padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '500' },
  empty: { textAlign: 'center', color: '#ccc', padding: '40px', fontSize: '13px' }
}
