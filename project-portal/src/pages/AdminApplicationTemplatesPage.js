import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, Edit2, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { Modal } from '../components/NewProjectModal'
import { STAGES } from '../lib/constants'

export default function AdminApplicationTemplatesPage() {
  const { profile } = useAuth()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState(null)

  const isAdmin = profile?.role === 'admin'

  useEffect(() => { fetchTemplates() }, [])

  async function fetchTemplates() {
    setLoading(true)
    const { data } = await supabase
      .from('application_templates')
      .select('*')
      .order('sort_order')
      .order('name')
    setTemplates(data || [])
    setLoading(false)
  }

  async function toggleActive(id, current) {
    await supabase.from('application_templates').update({ is_active: !current }).eq('id', id)
    fetchTemplates()
  }

  async function deleteTemplate(id, name) {
    if (!window.confirm(`Delete "${name}"? This will not affect existing project applications.`)) return
    await supabase.from('application_templates').delete().eq('id', id)
    fetchTemplates()
  }

  async function moveOrder(id, direction) {
    const idx = templates.findIndex(t => t.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= templates.length) return
    const a = templates[idx], b = templates[swapIdx]
    await Promise.all([
      supabase.from('application_templates').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('application_templates').update({ sort_order: a.sort_order }).eq('id', b.id)
    ])
    fetchTemplates()
  }

  if (!isAdmin) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
      Admin access required.
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={S.topbar}>
        <div style={{ flex: 1 }}>
          <div style={S.title}>Application Templates</div>
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
            These templates are automatically added to every new project. Manage which are active and their default details here.
          </div>
        </div>
        <button onClick={() => setShowNew(true)} style={S.btnPrimary}>
          <Plus size={13} /> New template
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <div style={S.empty}>Loading…</div>
        ) : templates.length === 0 ? (
          <div style={S.empty}>No templates yet. Add your first application type above.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Active templates */}
            <div style={{ fontSize: '11px', fontWeight: '500', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
              Active ({templates.filter(t => t.is_active).length})
            </div>
            {templates.filter(t => t.is_active).map((t, i, arr) => (
              <TemplateRow key={t.id} template={t}
                onEdit={() => setEditing(t)}
                onToggle={() => toggleActive(t.id, t.is_active)}
                onDelete={() => deleteTemplate(t.id, t.name)}
                onMoveUp={() => moveOrder(t.id, 'up')}
                onMoveDown={() => moveOrder(t.id, 'down')}
                isFirst={i === 0} isLast={i === arr.length - 1}
              />
            ))}

            {/* Inactive templates */}
            {templates.filter(t => !t.is_active).length > 0 && (
              <>
                <div style={{ fontSize: '11px', fontWeight: '500', color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '16px', marginBottom: '4px' }}>
                  Inactive ({templates.filter(t => !t.is_active).length})
                </div>
                {templates.filter(t => !t.is_active).map(t => (
                  <TemplateRow key={t.id} template={t}
                    onEdit={() => setEditing(t)}
                    onToggle={() => toggleActive(t.id, t.is_active)}
                    onDelete={() => deleteTemplate(t.id, t.name)}
                    inactive
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {showNew && <TemplateModal onClose={() => setShowNew(false)} onSaved={fetchTemplates} />}
      {editing && <TemplateModal template={editing} onClose={() => setEditing(null)} onSaved={fetchTemplates} />}
    </div>
  )
}

function TemplateRow({ template: t, onEdit, onToggle, onDelete, onMoveUp, onMoveDown, isFirst, isLast, inactive }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', border: `0.5px solid ${inactive ? '#F0EFEF' : '#ECEAE4'}`, borderRadius: '10px', background: inactive ? '#FAFAFA' : '#fff', opacity: inactive ? 0.7 : 1 }}>
      {!inactive && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}>
          <button onClick={onMoveUp} disabled={isFirst} style={{ ...S.iconBtn, opacity: isFirst ? 0.2 : 1 }}><ChevronUp size={12} /></button>
          <button onClick={onMoveDown} disabled={isLast} style={{ ...S.iconBtn, opacity: isLast ? 0.2 : 1 }}><ChevronDown size={12} /></button>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{t.name}</div>
        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
          {t.agency && <span>{t.agency}</span>}
          {t.agency && t.stage && <span style={{ color: '#ccc' }}> · </span>}
          {t.stage && <span style={{ color: '#aaa' }}>{t.stage}</span>}
        </div>
        {t.description && <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>{t.description}</div>}
      </div>
      <button onClick={onToggle} style={{
        fontSize: '11px', padding: '3px 10px', borderRadius: '20px', cursor: 'pointer',
        fontFamily: 'inherit', border: 'none', fontWeight: '500',
        background: t.is_active ? '#E1F5EE' : '#F0EFEF',
        color: t.is_active ? '#0F6E56' : '#999'
      }}>{t.is_active ? 'Active' : 'Inactive'}</button>
      <button onClick={onEdit} style={S.iconBtn} title="Edit"><Edit2 size={13} /></button>
      <button onClick={onDelete} style={{ ...S.iconBtn, color: '#ddd' }} title="Delete"><Trash2 size={13} /></button>
    </div>
  )
}

function TemplateModal({ template, onClose, onSaved }) {
  const isEdit = !!template
  const [form, setForm] = useState({
    name: template?.name || '',
    description: template?.description || '',
    agency: template?.agency || '',
    agency_website: template?.agency_website || '',
    stage: template?.stage || '',
    is_active: template?.is_active ?? true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required.'); return }
    setLoading(true); setError('')
    if (isEdit) {
      const { error: err } = await supabase.from('application_templates').update(form).eq('id', template.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('application_templates').insert({ ...form, sort_order: 999 })
      if (err) { setError(err.message); setLoading(false); return }
    }
    onSaved(); onClose()
  }

  return (
    <Modal title={isEdit ? `Edit — ${template.name}` : 'New application template'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="Application name *">
          <input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Resource Consent, Building Consent, PIM" required autoFocus />
        </Field>
        <Field label="Description">
          <textarea style={{ ...S.input, minHeight: '60px', resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of what this application covers…" />
        </Field>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Agency / authority">
            <input style={S.input} value={form.agency} onChange={e => set('agency', e.target.value)} placeholder="e.g. Dunedin City Council" />
          </Field>
          <Field label="Typical project stage">
            <select style={S.input} value={form.stage} onChange={e => set('stage', e.target.value)}>
              <option value="">Any stage</option>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Agency website (optional)">
          <input style={S.input} type="url" value={form.agency_website} onChange={e => set('agency_website', e.target.value)} placeholder="https://…" />
        </Field>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
          <label htmlFor="is_active" style={{ fontSize: '13px', color: '#444', cursor: 'pointer' }}>Active — include in new projects</label>
        </div>
        {error && <div style={S.error}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
          <button type="submit" style={S.btnPrimary} disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create template'}</button>
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
  topbar: { padding: '14px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', alignItems: 'flex-start', gap: '12px' },
  title: { fontSize: '16px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
  btnSec: { padding: '8px 18px', background: 'transparent', color: '#666', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
  iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px', border: '0.5px solid #E0DED6', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: '#888' },
  input: { padding: '8px 10px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '100%', boxSizing: 'border-box' },
  error: { background: '#FAECE7', color: '#993C1D', fontSize: '13px', padding: '10px 12px', borderRadius: '8px' },
  empty: { textAlign: 'center', color: '#ccc', padding: '60px', fontSize: '14px' }
}
