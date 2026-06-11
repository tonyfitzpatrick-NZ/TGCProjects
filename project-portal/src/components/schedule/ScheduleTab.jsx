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
import { Search, Loader } from 'lucide-react'
import { useSchedule } from '../../hooks/useSchedule'
import ScheduleSection from './ScheduleSection'

export default function ScheduleTab({ projectId, userRole }) {
  const {
    itemsBySection,
    selections,
    loading,
    error,
    selectOption,
    updateNote,
    confirmSelection,
  } = useSchedule(projectId)

  const [search, setSearch] = useState('')

  const isAdmin = userRole === 'admin' || userRole === 'lead'

  const filteredSections = useMemo(() => {
    if (!itemsBySection || !Array.isArray(itemsBySection)) return []

    return itemsBySection
      .map(section => {
        let items = section.items || []
        if (search.trim()) {
          const q = search.toLowerCase()
          items = items.filter(item => 
            (item.label || '').toLowerCase().includes(q) ||
            (item.cbi_code || '').includes(q) ||
            (item.options || []).some(o => 
              (o.label || '').toLowerCase().includes(q)
            )
          )
        }
        return { ...section, items }
      })
      .filter(s => s.items && s.items.length > 0)
  }, [itemsBySection, search])

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center' }}><Loader size={24} className="spin" /> Loading schedule...</div>
  }

  if (error) {
    return <div style={{ padding: '40px', color: 'red' }}>Error loading schedule: {error}</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search items, products, suppliers, model numbers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '600px',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '15px'
          }}
        />
      </div>

      {/* Sections */}
      {filteredSections.length === 0 ? (
        <div style={{ padding: '80px', textAlign: 'center', color: '#888', fontSize: '17px' }}>
          No items match your search
        </div>
      ) : (
        filteredSections.map((section, idx) => (
          <ScheduleSection
            key={section.id || idx}
            section={section}
            items={section.items}
            selections={selections}
            onSelectOption={selectOption}
            onUpdateNote={updateNote}
            confirmSelection={confirmSelection}
            isAdmin={isAdmin}
            defaultOpen={idx === 0}
          />
        ))
      )}
    </div>
  )
}
