// ============================================================
// ScheduleItem.jsx
// Expandable row for a single schedule item.
// Shows selected option summary collapsed; full option picker
// + status + note expanded.
// ============================================================

import React, { useState, useEffect } from 'react'
import { ChevronDown, ExternalLink, FileText } from 'lucide-react'
import { fetchOptionDocs } from '../../lib/scheduleQueries'

const STATUS_OPTIONS = [
  { value: 'specified',   label: 'Specified' },
  { value: 'confirmed',   label: 'Confirmed' },
  { value: 'substituted', label: 'Substituted' },
  { value: 'tbc',         label: 'TBC' },
  { value: 'n/a',         label: 'N/A' },
]

function StatusBadge({ status }) {
  const map = {
    confirmed:   'Confirmed',
    specified:   'Specified',
    substituted: 'Substituted',
    tbc:         'TBC',
    'n/a':       'N/A',
  }
  return (
    <span className={`status-badge ${status || 'tbc'}`}>
      {map[status] || 'TBC'}
    </span>
  )
}

export default function ScheduleItem({ item, selection, onSelectOption, onUpdateStatus, onUpdateNote, isAdmin }) {
  const [open, setOpen]       = useState(false)
  const [note, setNote]       = useState(selection?.project_note || '')
  const [docs, setDocs]       = useState([])
  const [docsLoaded, setDocsLoaded] = useState(false)

  // Selected option derived from selection or item default
  const selectedOptionId = selection?.option_id
  const selectedOption = item.sched_item_options?.find(o =>
    selectedOptionId ? o.id === selectedOptionId : o.is_default
  )
  const status = selection?.status || (selectedOption ? 'specified' : 'tbc')

  // Load docs when expanded
  useEffect(() => {
    if (open && selectedOptionId && !docsLoaded) {
      fetchOptionDocs(selectedOptionId)
        .then(d => { setDocs(d); setDocsLoaded(true) })
        .catch(() => setDocsLoaded(true))
    }
  }, [open, selectedOptionId, docsLoaded])

  // Reset note when selection changes
  useEffect(() => {
    setNote(selection?.project_note || '')
  }, [selection?.project_note])

  const handleOptionClick = (option) => {
    onSelectOption(item.id, option.id, note)
    setDocsLoaded(false) // reload docs for new option
    setDocs([])
  }

  const handleStatusChange = (e) => {
    onUpdateStatus(item.id, e.target.value)
  }

  const handleNoteSave = () => {
    onUpdateNote(item.id, note)
  }

  return (
    <div className="schedule-item">
      {/* Collapsed row */}
      <div
        className="schedule-item-header"
        onClick={() => setOpen(o => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
        aria-expanded={open}
      >
        <div>
          <div className="schedule-item-label">{item.label}</div>
          {item.cbi_code && (
            <div className="schedule-item-cbi">CBI {item.cbi_code}</div>
          )}
        </div>

        <div>
          <div className={`schedule-item-selected ${!selectedOption ? 'tbc' : ''}`}>
            {selectedOption ? selectedOption.label : 'Not yet selected'}
          </div>
          {selectedOption?.supplier && (
            <div className="schedule-item-supplier">{selectedOption.supplier}
              {selectedOption.model_ref ? ` — ${selectedOption.model_ref}` : ''}
            </div>
          )}
        </div>

        <div className="schedule-item-status-wrap">
          <StatusBadge status={status} />
        </div>

        <button
          className="schedule-item-expand"
          onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          aria-label={open ? 'Collapse item' : 'Expand item'}
        >
          <ChevronDown
            size={16}
            className={`schedule-section-chevron ${open ? 'open' : ''}`}
          />
        </button>
      </div>

      {/* Expanded detail panel */}
      {open && (
        <div className="schedule-item-detail">
          <div className="schedule-item-detail-grid">

            {/* Left: option picker */}
            <div className="schedule-detail-section">
              <div className="schedule-detail-label">Select option</div>
              <div className="schedule-options-list">
                {(item.sched_item_options || []).map(option => {
                  const isSelected = selectedOptionId
                    ? option.id === selectedOptionId
                    : option.is_default
                  return (
                    <button
                      key={option.id}
                      className={`schedule-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleOptionClick(option)}
                    >
                      <div className="schedule-option-radio">
                        <div className="schedule-option-radio-dot" />
                      </div>
                      <div className="schedule-option-body">
                        <div className="schedule-option-label">{option.label}</div>
                        <div className="schedule-option-detail">{option.detail}</div>
                        <div className="schedule-option-meta">
                          {option.supplier && (
                            <span className="schedule-option-tag">{option.supplier}</span>
                          )}
                          {option.model_ref && (
                            <span className="schedule-option-tag">{option.model_ref}</span>
                          )}
                          {option.warranty && (
                            <span className="schedule-option-tag warranty">
                              {option.warranty}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right: status, note, docs */}
            <div className="schedule-detail-section">

              {/* Status */}
              <div>
                <div className="schedule-detail-label" style={{ marginBottom: 6 }}>
                  Status
                </div>
                <select
                  className="schedule-status-select"
                  value={status}
                  onChange={handleStatusChange}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Project note */}
              <div>
                <div className="schedule-detail-label" style={{ marginBottom: 6 }}>
                  Project note
                </div>
                <textarea
                  className="schedule-note-area"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a project-specific note or substitution detail…"
                />
                <button
                  className="schedule-note-save"
                  onClick={handleNoteSave}
                  disabled={note === (selection?.project_note || '')}
                >
                  Save note
                </button>
              </div>

              {/* Certification docs */}
              {selectedOptionId && (
                <div>
                  <div className="schedule-detail-label" style={{ marginBottom: 6 }}>
                    <FileText size={12} style={{ display: 'inline', marginRight: 4 }} />
                    CodeMark / BRANZ / manuals
                  </div>
                  {!docsLoaded ? (
                    <div className="schedule-no-docs">Loading…</div>
                  ) : docs.length > 0 ? (
                    <div className="schedule-docs-list">
                      {docs.map(doc => (
                        <a
                          key={doc.id}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="schedule-doc-link"
                        >
                          <span className={`schedule-doc-type ${doc.doc_type}`}>
                            {doc.doc_type}
                          </span>
                          {doc.title}
                          <ExternalLink size={11} />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="schedule-no-docs">
                      No documents linked yet
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
