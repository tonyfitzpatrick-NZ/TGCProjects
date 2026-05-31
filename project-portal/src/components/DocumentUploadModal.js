import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Modal } from './NewProjectModal'
import {
  DISCIPLINE_CODES, DOC_TYPES, DOC_STATUSES, REVISION_OPTIONS
} from '../lib/constants'
import { Copy, Check } from 'lucide-react'

function buildFamilyKey(projectCode, disciplineCode, docType, description) {
  const desc = description.trim().replace(/\s+/g, '-').toUpperCase()
  return [projectCode, disciplineCode, docType, desc].filter(Boolean).join('-')
}

function buildFilename(projectCode, disciplineCode, docType, revision, description, extension) {
  const desc = description.trim().replace(/\s+/g, '-')
  const base = [projectCode, disciplineCode, docType, revision, desc].filter(Boolean).join('-')
  return extension ? `${base}.${extension}` : base
}

export default function DocumentUploadModal({ projectId, projectCode, onClose, onUploaded, existingFile }) {
  const { profile } = useAuth()
  const isRevision = !!existingFile
  const fileRef = useRef()

  const [disciplineCode, setDisciplineCode] = useState(existingFile?.discipline_code || '')
  const [docType, setDocType] = useState(existingFile?.doc_type || '')
  const [revision, setRevision] = useState(() => {
    if (!existingFile) return 'R00'
    const current = existingFile.revision || 'R00'
    const num = parseInt(current.replace('R', ''), 10)
    return `R${String(num + 1).padStart(2, '0')}`
  })
  const [docStatus, setDocStatus] = useState(existingFile?.doc_status || 'For Information')
  const [description, setDescription] = useState(existingFile?.doc_description || '')
  const [file, setFile] = useState(null)
  const [fileExt, setFileExt] = useState('')
  const [useLink, setUseLink] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const suggestedName = buildFilename(projectCode, disciplineCode, docType, revision, description, fileExt)
  const familyKey = buildFamilyKey(projectCode, disciplineCode, docType, description)

  function handleFileSelect(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    const ext = f.name.split('.').pop().toLowerCase()
    setFileExt(ext)
    // Auto-detect doc type from extension
    if (ext === 'ifc' && !docType) setDocType('IFC')
    if (ext === 'pdf' && !docType) setDocType('PDF')
    if (['dwg', 'dxf'].includes(ext) && !docType) setDocType('DWG')
    if (['xlsx', 'xls'].includes(ext) && !docType) setDocType('SCHED')
    if (['docx', 'doc'].includes(ext) && !docType) setDocType('RPT')
  }

  function copyFilename() {
    navigator.clipboard.writeText(suggestedName)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!description.trim()) { setError('Document description is required.'); return }
    if (!disciplineCode) { setError('Please select a discipline.'); return }
    if (!docType) { setError('Please select a document type.'); return }
    if (!useLink && !file) { setError('Please select a file to upload.'); return }
    if (useLink && !linkUrl.trim()) { setError('Please enter a URL.'); return }

    setLoading(true); setError('')

    // Mark previous revision as superseded if this is a new revision
    if (isRevision && existingFile.doc_family_key) {
      await supabase.from('project_files')
        .update({ is_latest_revision: false, doc_status: 'Superseded' })
        .eq('doc_family_key', existingFile.doc_family_key)
        .eq('project_id', projectId)
    }

    let storagePath = null
    let fileName = suggestedName

    if (!useLink && file) {
      const path = `${projectId}/${Date.now()}_${suggestedName}`
      const { error: uploadErr } = await supabase.storage
        .from('project-files')
        .upload(path, file)
      if (uploadErr) { setError(uploadErr.message); setLoading(false); return }
      storagePath = path
    }

    const { error: dbErr } = await supabase.from('project_files').insert({
      project_id: projectId,
      name: fileName,
      file_type: fileExt || (useLink ? 'link' : 'other'),
      category: 'Documents',
      storage_path: storagePath,
      onedrive_url: useLink ? linkUrl : null,
      uploaded_by: profile?.id,
      discipline_code: disciplineCode,
      doc_type: docType,
      revision,
      doc_status: docStatus,
      doc_description: description.trim(),
      doc_family_key: familyKey,
      is_latest_revision: true,
      uploaded_at: new Date().toISOString(),
      file_size: file?.size || null
    })

    if (dbErr) { setError(dbErr.message); setLoading(false); return }
    onUploaded(); onClose()
  }

  return (
    <Modal title={isRevision ? `New revision — ${existingFile.doc_description}` : 'Upload document'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Filename preview */}
        <div style={{ background: '#1B2B4B', borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Generated filename
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, fontSize: '13px', color: '#F5EDD6', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: '1.5' }}>
              {suggestedName || 'Fill in fields below to generate filename…'}
            </div>
            {suggestedName && (
              <button type="button" onClick={copyFilename}
                style={{ background: 'none', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: copied ? '#9FE1CB' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', flexShrink: 0 }}>
                {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
              </button>
            )}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>
            Format: [ProjectCode]-[Discipline]-[Type]-[Revision]-[Description]
          </div>
        </div>

        {/* Discipline + Doc type */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Discipline *">
            <select style={S.input} value={disciplineCode} onChange={e => setDisciplineCode(e.target.value)} required>
              <option value="">Select…</option>
              {DISCIPLINE_CODES.map(d => (
                <option key={d.code} value={d.code}>{d.code} — {d.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Document type *">
            <select style={S.input} value={docType} onChange={e => setDocType(e.target.value)} required>
              <option value="">Select…</option>
              {DOC_TYPES.map(t => (
                <option key={t.code} value={t.code}>{t.code} — {t.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Description */}
        <Field label="Document description *">
          <input
            style={S.input}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Structural Calculation Report, Site Plan, Fire Report"
            required
          />
          <div style={{ fontSize: '11px', color: '#aaa', marginTop: '3px' }}>
            Keep consistent across revisions — this groups all revisions together
          </div>
        </Field>

        {/* Revision + Status */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Revision">
            <select style={S.input} value={revision} onChange={e => setRevision(e.target.value)}>
              {REVISION_OPTIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Document status">
            <select style={S.input} value={docStatus} onChange={e => setDocStatus(e.target.value)}>
              {DOC_STATUSES.filter(s => s !== 'Superseded').map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* File or link toggle */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={() => setUseLink(false)}
            style={{ ...S.toggleBtn, background: !useLink ? '#1B2B4B' : 'transparent', color: !useLink ? '#fff' : '#666', border: `0.5px solid ${!useLink ? '#1B2B4B' : '#D0CEC6'}` }}>
            Upload file
          </button>
          <button type="button" onClick={() => setUseLink(true)}
            style={{ ...S.toggleBtn, background: useLink ? '#1B2B4B' : 'transparent', color: useLink ? '#fff' : '#666', border: `0.5px solid ${useLink ? '#1B2B4B' : '#D0CEC6'}` }}>
            OneDrive / link
          </button>
        </div>

        {!useLink ? (
          <Field label="File">
            <input ref={fileRef} type="file" onChange={handleFileSelect}
              style={{ fontSize: '13px', color: '#444' }} />
            {file && (
              <div style={{ fontSize: '11px', color: '#aaa', marginTop: '3px' }}>
                Selected: {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </div>
            )}
          </Field>
        ) : (
          <Field label="URL *">
            <input style={S.input} type="url" value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://meridian.sharepoint.com/…" />
          </Field>
        )}

        {isRevision && (
          <div style={{ background: '#FAEEDA', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#854F0B', lineHeight: '1.6' }}>
            ⚠ The previous revision ({existingFile.revision}) will be automatically marked as <strong>Superseded</strong>.
          </div>
        )}

        {error && <div style={S.error}>{error}</div>}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
          <button type="submit" style={S.btnPrimary} disabled={loading}>
            {loading ? 'Uploading…' : isRevision ? 'Upload new revision' : 'Upload document'}
          </button>
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
  error: { background: '#FAECE7', color: '#993C1D', fontSize: '13px', padding: '10px 12px', borderRadius: '8px' },
  btnPrimary: { padding: '8px 18px', background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  btnSec: { padding: '8px 18px', background: 'transparent', color: '#666', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
  toggleBtn: { padding: '7px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500', transition: 'all 0.1s' }
}
