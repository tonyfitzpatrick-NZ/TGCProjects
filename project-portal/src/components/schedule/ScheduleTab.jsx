// ============================================================
// ScheduleTab.jsx
// Main schedule of finishes tab — drop into your project
// detail page alongside Files, Team, Messages tabs.
//
// Props:
//   projectId  — uuid of the current project
//   userRole   — 'admin' | 'lead' | 'consultant'
// ============================================================

import React, { useState, useMemo } from 'react'
import { Search, Shield, AlertCircle, Loader, CheckCircle } from 'lucide-react'
import { useSchedule } from '../../hooks/useSchedule'
import ScheduleSection from './ScheduleSection'
import './ScheduleTab.css'

const STATUS_FILTERS = [
  { value: 'all',         label: 'All items' },
  { value: 'tbc',         label: 'TBC only' },
  { value: 'confirmed',   label: 'Confirmed' },
  { value: 'warranted',   label: 'Has warranty' },
]

export default function ScheduleTab({ projectId, userRole }) {
  const {
    itemsBySection,
    selections,
    templates,
    stats,
    loading,
    error,
    saving,
    selectOption,
    updateStatus,
    updateNote,
    applyTemplateToProject,
  } = useSchedule(projectId)

  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [templateApplied, setTemplateApplied]   = useState(false)

  const isAdmin = userRole === 'admin' || userRole === 'lead'

  // Apply template handler
  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return
    await applyTemplateToProject(selectedTemplate)
    setTemplateApplied(true)
    setTimeout(() => setTemplateApplied(false), 3000)
  }

  // Filter logic
  const filteredSections = useMemo(() => {
    return itemsBySection
      .map(section => {
        let items = section.items

        // Text search
        if (search.trim()) {
          const q = search.toLowerCase()
          items = items.filter(item => {
            const optionText = item.sched_item_options
              ?.map(o => `${o.label} ${o.detail} ${o.supplier} ${o.model_ref}`)
              .join(' ')
              .toLowerCase() || ''
            return (
              item.label.toLowerCase().includes(q) ||
              optionText.includes(q) ||
              (item.cbi_code || '').toLowerCase().includes(q)
            )
          })
        }

        // Status filter
        if (statusFilter === 'tbc') {
          items = items.filter(i => {
            const s = selections[i.id]?.status
            return !s || s === 'tbc'
          })
        } else if (statusFilter === 'confirmed') {
          items = items.filter(i => selections[i.id]?.status === 'confirmed')
        } else if (statusFilter === 'warranted') {
          items = items.filter(i => {
            const selOptId = selections[i.id]?.option_id
            const opts = i.sched_item_options || []
            const opt = selOptId
              ? opts.find(o => o.id === selOptId)
              : opts.find(o => o.is_default)
            return opt?.warranty
          })
        }

        return { ...section, items }
      })
      .filter(s => s.items.length > 0)
  }, [itemsBySection, selections, search, statusFilter])

  if (loading) {
    return (
      <div className="schedule-loading">
        <Loader size={18} className="spin" />
        Loading schedule…
      </div>
    )
  }

  if (error) {
    return (
      <div className="schedule-error">
        <AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} />
        {error}
      </div>
    )
  }

  return (
    <div className="schedule-tab">

      {/* Template bar — shown when no selections exist yet */}
      {isAdmin && templates.length > 0 && stats.confirmed === 0 && (
        <div className="schedule-template-bar">
          <span className="schedule-template-bar-label">
            Start from a template
          </span>
          <select
            className="schedule-template-select"
            value={selectedTemplate}
            onChange={e => setSelectedTemplate(e.target.value)}
          >
            <option value="">Choose template…</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            className="schedule-template-apply"
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate}
          >
            {templateApplied ? '✓ Applied' : 'Apply'}
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="schedule-stats">
        <div className="schedule-stat">
          <span className="schedule-stat-value">{stats.total}</span>
          <span className="schedule-stat-label">Total items</span>
        </div>
        <div className="schedule-stat-divider" />
        <div className="schedule-stat">
          <span className="schedule-stat-value" style={{ color: '#166534' }}>
            {stats.confirmed}
          </span>
          <span className="schedule-stat-label">Confirmed</span>
        </div>
        <div className="schedule-stat-divider" />
        <div className="schedule-stat">
          <span className="schedule-stat-value" style={{ color: '#5b21b6' }}>
            {stats.specified}
          </span>
          <span className="schedule-stat-label">Specified</span>
        </div>
        <div className="schedule-stat-divider" />
        <div className="schedule-stat">
          <span className="schedule-stat-value" style={{ color: '#64748b' }}>
            {stats.tbc}
          </span>
          <span className="schedule-stat-label">TBC</span>
        </div>
        <div className="schedule-stat-divider" />
        <div className="schedule-progress-bar">
          <div className="schedule-detail-label" style={{ fontSize: 11, color: '#94a3b8' }}>
            {stats.pct}% confirmed
          </div>
          <div className="schedule-progress-track">
            <div
              className="schedule-progress-fill"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="schedule-toolbar">
        <div className="schedule-search">
          <Search size={14} className="schedule-search-icon" />
          <input
            type="text"
            placeholder="Search items, products, suppliers, model numbers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="schedule-filters">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              className={`schedule-filter-btn ${statusFilter === f.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.value === 'warranted' && (
                <Shield size={11} style={{ display: 'inline', marginRight: 4 }} />
              )}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section list */}
      {filteredSections.length === 0 ? (
        <div className="schedule-empty">
          No items match your search
        </div>
      ) : (
        filteredSections.map((section, idx) => (
          <ScheduleSection
            key={section.id}
            section={section}
            items={section.items}
            selections={selections}
            onSelectOption={selectOption}
            onUpdateStatus={updateStatus}
            onUpdateNote={updateNote}
            isAdmin={isAdmin}
            defaultOpen={idx === 0}
          />
        ))
      )}

      {/* Saving toast */}
      {saving && (
        <div className="schedule-saving-toast">
          <Loader size={13} className="spin" />
          Saving…
        </div>
      )}
    </div>
  )
}
