import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { X, Home } from 'lucide-react'
import {
  STAGES, PROJECT_STATUSES, WIND_ZONES, EARTHQUAKE_ZONES,
  EXPOSURE_ZONES, NZ_TERRITORIAL_AUTHORITIES
} from '../lib/constants'

// Works for both New (no project prop) and Edit (project prop passed)
export default function NewProjectModal({ onClose, onCreated, project }) {
  const { profile } = useAuth()
  const isEdit = !!project
  const [form, setForm] = useState({
    name: project?.name || '',
    code: project?.code || '',
    client_name: project?.client_name || '',
    address: project?.address || '',
    stage: project?.stage || 'Concept',
    status: project?.status || 'Active',
    progress: project?.progress || 0,
    onedrive_url: project?.onedrive_url || '',
    description: project?.description || '',
    legal_description: project?.legal_description || '',
    site_area: project?.site_area || '',
    wind_zone: project?.wind_zone || '',
    earthquake_zone: project?.earthquake_zone || '',
    exposure_zone: project?.exposure_zone || '',
    territorial_authority: project?.territorial_authority || '',
    ta_zone: project?.ta_zone || '',
    building_consent_authority: project?.building_consent_authority || '',
    project_deadline: project?.project_deadline || ''
  })
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(() => {
    if (project?.cover_image_path) {
      const { data } = supabase.storage.from('project-covers').getPublicUrl(project.cover_image_path)
      return data?.publicUrl || null
    }
    return null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleCoverSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.code) { setError('Project name and code are required.'); return }
    setLoading(true); setError('')

    let cover_image_path = project?.cover_image_path || null
    if (coverFile) {
      const ext = coverFile.name.split('.').pop()
      const path = `${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('project-covers').upload(path, coverFile)
      if (!uploadErr) cover_image_path = path
    }

    const payload = {
      ...form,
      progress: Number(form.progress),
      cover_image_path,
      project_deadline: form.project_deadline || null
    }

    if (isEdit) {
      const { error: err } = await supabase.from('projects').update({
        ...payload, updated_at: new Date().toISOString()
      }).eq('id', project.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { data, error: err } = await supabase.from('projects').insert({
        ...payload, created_by: profile.id
      }).select().single()
      if (err) { setError(err.message); setLoading(false); return }
      await supabase.from('project_members').insert({
        project_id: data.id, user_id: profile.id, role: 'lead', consultant_type: 'Project Lead'
      })
    }
    onCreated(); onClose()
  }

  return (
    <Modal title={isEdit ? `Edit — ${project.name}` : 'New project'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Cover image + name/code */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div onClick={() => fileRef.current?.click()} style={{
            width: '80px', height: '80px', borderRadius: '10px', flexShrink: 0,
            background: coverPreview ? 'transparent' : '#F0EEE9', border: '0.5px dashed #D0CEC6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden'
          }}>
            {coverPreview
              ? <img src={coverPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ textAlign: 'center' }}><Home size={20} color="#ccc" /><div style={{ fontSize: '10px', color: '#ccc', marginTop: '4px' }}>Add photo</div></div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleCoverSelect} style={{ display: 'none' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Row>
              <Field label="Project name *">
                <input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="High Street Heritage" required />
              </Field>
              <Field label="Project code *" w="150px">
                <input style={{ ...S.input, width: '150px' }} value={form.code} onChange={e => set('code', e.target.value)} placeholder="TGC-2025-001" required />
              </Field>
            </Row>
            <Row>
              <Field label="Status">
                <select style={S.input} value={form.status} onChange={e => set('status', e.target.value)}>
                  {PROJECT_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Stage">
                <select style={S.input} value={form.stage} onChange={e => set('stage', e.target.value)}>
                  {STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </Row>
          </div>
        </div>

        <SectionHeading>Project details</SectionHeading>
        <Row>
          <Field label="Client name">
            <input style={S.input} value={form.client_name} onChange={e => set('client_name', e.target.value)} />
          </Field>
          <Field label="Project deadline" w="160px">
            <input style={{ ...S.input, width: '160px' }} type="date" value={form.project_deadline} onChange={e => set('project_deadline', e.target.value)} />
          </Field>
        </Row>
        <Field label="Site address">
          <input style={S.input} value={form.address} onChange={e => set('address', e.target.value)} placeholder="204 High Street, Dunedin" />
        </Field>
        <Field label="Legal description">
          <input style={S.input} value={form.legal_description} onChange={e => set('legal_description', e.target.value)} placeholder="Lot 1 DP 12345" />
        </Field>
        <Row>
          <Field label="Site area (m²)">
            <input style={S.input} value={form.site_area} onChange={e => set('site_area', e.target.value)} placeholder="450" />
          </Field>
          <Field label="Territorial authority">
            <select style={S.input} value={form.territorial_authority} onChange={e => set('territorial_authority', e.target.value)}>
              <option value="">Select TA…</option>
              {NZ_TERRITORIAL_AUTHORITIES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </Row>
        <Row>
          <Field label="TA zone">
            <input style={S.input} value={form.ta_zone} onChange={e => set('ta_zone', e.target.value)} placeholder="e.g. Residential 1" />
          </Field>
          <Field label="Building consent authority">
            <input style={S.input} value={form.building_consent_authority} onChange={e => set('building_consent_authority', e.target.value)} />
          </Field>
        </Row>

        <SectionHeading>NZS 3604 Zones</SectionHeading>
        <Row>
          <Field label="Wind zone">
            <select style={S.input} value={form.wind_zone} onChange={e => set('wind_zone', e.target.value)}>
              <option value="">Select…</option>
              {WIND_ZONES.map(z => <option key={z}>{z}</option>)}
            </select>
          </Field>
          <Field label="Earthquake zone">
            <select style={S.input} value={form.earthquake_zone} onChange={e => set('earthquake_zone', e.target.value)}>
              <option value="">Select…</option>
              {EARTHQUAKE_ZONES.map(z => <option key={z}>{z}</option>)}
            </select>
          </Field>
          <Field label="Exposure zone">
            <select style={S.input} value={form.exposure_zone} onChange={e => set('exposure_zone', e.target.value)}>
              <option value="">Select…</option>
              {EXPOSURE_ZONES.map(z => <option key={z}>{z}</option>)}
            </select>
          </Field>
        </Row>

        <SectionHeading>Other</SectionHeading>
        <Field label={`Progress: ${form.progress}%`}>
          <input type="range" min="0" max="100" step="1" value={form.progress} onChange={e => set('progress', e.target.value)} style={{ width: '100%' }} />
        </Field>
        <Field label="OneDrive folder URL">
          <input style={S.input} value={form.onedrive_url} onChange={e => set('onedrive_url', e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Project description">
          <textarea style={{ ...S.input, minHeight: '70px', resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief project overview…" />
        </Field>

        {error && <div style={S.error}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
          <button type="submit" style={S.btnPrimary} disabled={loading}>
            {loading ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save changes' : 'Create project')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '600px', maxHeight: '92vh', overflowY: 'auto', border: '0.5px solid #E0DED6', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div style={{ flex: 1, fontSize: '15px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '4px' }}><X size={16} /></button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children, w }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: w ? undefined : 1, width: w }}>
    <label style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>{label}</label>
    {children}
  </div>
}
function Row({ children }) {
  return <div style={{ display: 'flex', gap: '12px' }}>{children}</div>
}
function SectionHeading({ children }) {
  return <div style={{ fontSize: '11px', fontWeight: '500', color: '#B8952A', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '0.5px solid #F0E8D0', paddingBottom: '4px', marginTop: '4px' }}>{children}</div>
}

const S = {
  input: { padding: '8px 10px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '100%', boxSizing: 'border-box' },
  error: { background: '#FAECE7', color: '#993C1D', fontSize: '13px', padding: '10px 12px', borderRadius: '8px' },
  btnPrimary: { padding: '8px 18px', background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  btnSec: { padding: '8px 18px', background: 'transparent', color: '#666', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }
}
