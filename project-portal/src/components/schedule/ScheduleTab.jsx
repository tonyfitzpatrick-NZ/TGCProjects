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

const STATUS_FILTERS = [
  { value: 'all', label: 'All items' },
  { value: 'tbc', label: 'TBC only' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'warranted', label: 'Has warranty' },
]

export default function ScheduleTab({ projectId, userRole }) {
  const {
    itemsBySection,
    selections,
    templates,
    stats,
    loading,
    error,
    selectOption,
    updateNote,
    applyTemplateToProject,
    reload,
  } = useSchedule(projectId)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [applying, setApplying] = useState(false)

  const isAdmin = userRole === 'admin' || userRole === 'lead'

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return
    setApplying(true)
    try {
      await applyTemplateToProject(selectedTemplate)
      setSelectedTemplate('') // reset
    } catch (e) {
      console.error(e)
    } finally {
      setApplying(false)
    }
  }

  const filteredSections = useMemo(() => {
    if (!itemsBySection || !Array.isArray(itemsBySection)) return []
    return itemsBySection
      .map(section => {
        let items = section.items || []
        if (search.trim()) {
          const q = search.toLowerCase()
          items = items.filter(item => 
            item.label.toLowerCase().includes(q) ||
            (item.cbi_code || '').includes(q) ||
            (item.options || []).some(o => o.label.toLowerCase().includes(q))
          )
        }
        return { ...section, items }
      })
      .filter(s => s.items.length > 0)
  }, [itemsBySection, search])

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Loading schedule...</div>
  if (error) return <div style={{ padding: '40px', color: 'red' }}>Error: {error}</div>

  return (
    <div style={{ padding: '20px' }}>
      {/* Template Bar */}
      {isAdmin && templates.length > 0 && (
        <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <span style={{ fontWeight: '500' }}>Apply template:</span>
          <select
            value={selectedTemplate}
            onChange={e => setSelectedTemplate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
          >
            <option value="">Choose template...</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button 
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate || applying}
            style={{ 
              padding: '8px 20px', 
              background: '#1B2B4B', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px',
              fontWeight: '500'
            }}
          >
            {applying ? 'Applying...' : 'Apply Template'}
          </button>
        </div>
      )}

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: '30px', marginBottom: '20px', fontSize: '15px' }}>
        <div><strong>{stats.total}</strong> Total Items</div>
        <div><strong style={{ color: '#166534' }}>{stats.confirmed}</strong> Confirmed</div>
        <div><strong>{stats.specified}</strong> Specified</div>
        <div><strong style={{ color: '#64748b' }}>{stats.tbc}</strong> TBC</div>
      </div>

      {/* Sections */}
      {filteredSections.map((section, idx) => (
        <ScheduleSection
          key={section.id}
          section={section}
          items={section.items}
          selections={selections}
          onSelectOption={selectOption}
          onUpdateNote={updateNote}
          isAdmin={isAdmin}
          defaultOpen={idx === 0}
        />
      ))}
    </div>
  )
}
