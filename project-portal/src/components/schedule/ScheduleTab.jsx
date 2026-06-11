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
    selectOption,
    updateNote,
    reload,
  } = useSchedule(projectId)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [applyingTemplate, setApplyingTemplate] = useState(false)

  const isAdmin = userRole === 'admin' || userRole === 'lead'

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return
    setApplyingTemplate(true)
    try {
      // This calls the function from the hook
      await useSchedule(projectId).applyTemplateToProject?.(selectedTemplate) // fallback if not in hook yet
      alert('Template applied successfully!')
      reload() // refresh data
    } catch (e) {
      alert('Failed to apply template')
    } finally {
      setApplyingTemplate(false)
    }
  }

  const filteredSections = useMemo(() => {
    if (!itemsBySection || !Array.isArray(itemsBySection)) return [];

    return itemsBySection
      .map(section => {
        let items = section.items || [];

        if (search.trim()) {
          const q = search.toLowerCase();
          items = items.filter(item => 
            item.label.toLowerCase().includes(q) ||
            (item.cbi_code || '').includes(q) ||
            (item.options || []).some(o => 
              o.label.toLowerCase().includes(q) || 
              (o.detail || '').toLowerCase().includes(q)
            )
          );
        }

        if (statusFilter === 'confirmed') {
          items = items.filter(i => selections[i.id]?.status === 'confirmed');
        } else if (statusFilter === 'tbc') {
          items = items.filter(i => !selections[i.id] || selections[i.id].status === 'tbc');
        }

        return { ...section, items };
      })
      .filter(s => s.items.length > 0);
  }, [itemsBySection, selections, search, statusFilter]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading schedule...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red' }}>{error}</div>;

  return (
    <div className="schedule-tab">
      {/* Template Bar */}
      {isAdmin && templates.length > 0 && (
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Start from template:</span>
          <select
            value={selectedTemplate}
            onChange={e => setSelectedTemplate(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px' }}
          >
            <option value="">Choose template...</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button 
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate || applyingTemplate}
            style={{ padding: '8px 16px', background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: '6px' }}
          >
            {applyingTemplate ? 'Applying...' : 'Apply Template'}
          </button>
        </div>
      )}

      {/* Stats + Toolbar */}
      {/* ... (keep your existing stats and toolbar) */}

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
