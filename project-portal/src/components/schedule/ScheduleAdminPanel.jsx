// ============================================================
// ScheduleAdminPanel.jsx
// Admin-only panel for adding/editing/deleting item options
// and linking CodeMark / BRANZ / manual documents.
// Only rendered when userRole === 'admin'
// ============================================================

import React, { useState } from 'react'
import { Plus, Trash2, ExternalLink, X, ChevronDown } from 'lucide-react'
import {
  addItemOption,
  deleteItemOption,
  addOptionDoc,
  deleteOptionDoc,
  fetchOptionDocs,
} from '../../lib/scheduleQueries'

const DOC_TYPES = ['codemark', 'branz', 'manual', 'datasheet', 'other']

function AddOptionForm({ itemId, onAdded, onCancel }) {
  const [form, setForm] = useState({
    label: '', detail: '', warranty: '', supplier: '', modelRef: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const handleSubmit = async () => {
    if (!form.label.trim()) { setError('Label is required'); return }
    setSaving(true)
    try {
      const newOpt = await addItemOption({ itemId, ...form })
      onAdded(newOpt)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#1a202c' }}>
        Add new option
      </div>
      {error && (
        <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{error}</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        {[
          { key: 'label',    placeholder: 'Short label *' },
          { key: 'supplier', placeholder: 'Supplier' },
          { key: 'modelRef', placeholder: 'Model / product code' },
          { key: 'warranty', placeholder: 'Warranty (e.g. 5 Year)' },
        ].map(f => (
          <input
            key={f.key}
            placeholder={f.placeholder}
            value={form[f.key]}
            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
            style={{
              padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6,
              fontSize: 13, outline: 'none', background: '#fff',
            }}
          />
        ))}
      </div>
      <textarea
        placeholder="Full specification detail *"
        value={form.detail}
        onChange={e => setForm(p => ({ ...p, detail: e.target.value }))}
        rows={2}
        style={{
          width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0',
          borderRadius: 6, fontSize: 13, resize: 'vertical',
          fontFamily: 'inherit', outline: 'none', marginBottom: 8,
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            padding: '7px 16px', background: '#4f46e5', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {saving ? 'Adding…' : 'Add option'}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '7px 16px', background: '#fff', color: '#64748b',
            border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function AddDocForm({ optionId, onAdded, onCancel }) {
  const [form, setForm] = useState({ docType: 'codemark', title: '', url: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      setError('Title and URL are required'); return
    }
    setSaving(true)
    try {
      const doc = await addOptionDoc({ optionId, ...form })
      onAdded(doc)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#1a202c' }}>
        Link a document
      </div>
      {error && <div style={{ fontSize: 11, color: '#dc2626', marginBottom: 6 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <select
          value={form.docType}
          onChange={e => setForm(p => ({ ...p, docType: e.target.value }))}
          style={{ padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}
        >
          {DOC_TYPES.map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <input
          placeholder="Document title"
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          style={{ flex: 1, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}
        />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          placeholder="https://…"
          value={form.url}
          onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
          style={{ flex: 1, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}
        />
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{ padding: '6px 12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
        >
          {saving ? '…' : 'Add'}
        </button>
        <button
          onClick={onCancel}
          style={{ padding: '6px 8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}

function AdminOptionRow({ option, onDelete }) {
  const [docs, setDocs]           = useState(null)
  const [showDocs, setShowDocs]   = useState(false)
  const [showAddDoc, setShowAddDoc] = useState(false)

  const loadDocs = async () => {
    if (docs === null) {
      const d = await fetchOptionDocs(option.id)
      setDocs(d)
    }
    setShowDocs(v => !v)
  }

  const handleDeleteOption = async () => {
    if (!window.confirm(`Delete option "${option.label}"? This cannot be undone.`)) return
    await deleteItemOption(option.id)
    onDelete(option.id)
  }

  const handleDeleteDoc = async (docId) => {
    await deleteOptionDoc(docId)
    setDocs(d => d.filter(x => x.id !== docId))
  }

  return (
    <div style={{ padding: '8px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#1a202c' }}>
            {option.label}
            {option.is_default && (
              <span style={{ marginLeft: 6, fontSize: 10, background: '#ede9fe', color: '#5b21b6', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>
                DEFAULT
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{option.detail}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {option.supplier && <span style={{ fontSize: 11, background: '#f1f5f9', color: '#64748b', padding: '1px 5px', borderRadius: 3 }}>{option.supplier}</span>}
            {option.warranty && <span style={{ fontSize: 11, background: '#dcfce7', color: '#166534', padding: '1px 5px', borderRadius: 3 }}>{option.warranty}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            onClick={loadDocs}
            title="Documents"
            style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc', fontSize: 11, cursor: 'pointer', color: '#4f46e5' }}
          >
            Docs {showDocs ? '▲' : '▼'}
          </button>
          <button
            onClick={handleDeleteOption}
            title="Delete option"
            style={{ padding: '4px 6px', border: '1px solid #fecaca', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#dc2626' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {showDocs && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
          {(docs || []).map(doc => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 10, background: '#e0e7ff', color: '#3730a3', padding: '1px 4px', borderRadius: 3, textTransform: 'uppercase', fontWeight: 600 }}>
                {doc.doc_type}
              </span>
              <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#4f46e5', flex: 1 }}>
                {doc.title} <ExternalLink size={10} style={{ display: 'inline' }} />
              </a>
              <button
                onClick={() => handleDeleteDoc(doc.id)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
              >
                <X size={11} />
              </button>
            </div>
          ))}
          {!showAddDoc ? (
            <button
              onClick={() => setShowAddDoc(true)}
              style={{ fontSize: 11, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
            >
              + Link document
            </button>
          ) : (
            <AddDocForm
              optionId={option.id}
              onAdded={doc => { setDocs(d => [...(d || []), doc]); setShowAddDoc(false) }}
              onCancel={() => setShowAddDoc(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default function ScheduleAdminPanel({ itemsBySection, onOptionsChanged }) {
  const [openSection, setOpenSection] = useState(null)
  const [openItem, setOpenItem]       = useState(null)
  const [showAddForm, setShowAddForm] = useState(null)   // item id
  const [localOptions, setLocalOptions] = useState({})   // item_id → options[]

  const getOptions = (item) =>
    localOptions[item.id] !== undefined
      ? localOptions[item.id]
      : item.sched_item_options || []

  const handleOptionAdded = (itemId, newOpt) => {
    setLocalOptions(p => ({
      ...p,
      [itemId]: [...(p[itemId] || []), newOpt],
    }))
    setShowAddForm(null)
    if (onOptionsChanged) onOptionsChanged()
  }

  const handleOptionDeleted = (itemId, optId) => {
    setLocalOptions(p => ({
      ...p,
      [itemId]: (p[itemId] || []).filter(o => o.id !== optId),
    }))
    if (onOptionsChanged) onOptionsChanged()
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a202c', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #e2e8f0' }}>
        Admin — Manage master schedule options
      </div>
      {itemsBySection.map(section => (
        <div key={section.id} style={{ marginBottom: 6 }}>
          <button
            onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
            style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#1a202c', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
          >
            {section.name}
            <ChevronDown size={14} style={{ transform: openSection === section.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {openSection === section.id && (
            <div style={{ padding: '8px 0 4px' }}>
              {section.items.map(item => (
                <div key={item.id} style={{ marginBottom: 8, paddingLeft: 12 }}>
                  <button
                    onClick={() => setOpenItem(openItem === item.id ? null : item.id)}
                    style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, color: '#475569', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span>{item.label}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {getOptions(item).length} option{getOptions(item).length !== 1 ? 's' : ''}
                    </span>
                  </button>

                  {openItem === item.id && (
                    <div style={{ paddingLeft: 12, paddingTop: 8 }}>
                      {getOptions(item).map(opt => (
                        <AdminOptionRow
                          key={opt.id}
                          option={opt}
                          onDelete={(optId) => handleOptionDeleted(item.id, optId)}
                        />
                      ))}

                      {showAddForm === item.id ? (
                        <AddOptionForm
                          itemId={item.id}
                          onAdded={newOpt => handleOptionAdded(item.id, newOpt)}
                          onCancel={() => setShowAddForm(null)}
                        />
                      ) : (
                        <button
                          onClick={() => setShowAddForm(item.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: '1px dashed #c4b5fd', borderRadius: 6, background: '#faf5ff', color: '#7c3aed', fontSize: 12, fontWeight: 500, cursor: 'pointer', marginTop: 4 }}
                        >
                          <Plus size={12} /> Add option
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
