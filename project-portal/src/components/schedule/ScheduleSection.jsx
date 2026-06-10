// ============================================================
// ScheduleSection.jsx
// Collapsible section group (Exterior, Kitchen, etc.)
// ============================================================

import React, { useState } from 'react'
import { ChevronDown, Home, Layout, Utensils, Bath, Car, Archive, Trees, Building } from 'lucide-react'
import ScheduleItem from './ScheduleItem'

const SECTION_ICONS = {
  'Exterior':             Home,
  'Interior':             Layout,
  'Kitchen':              Utensils,
  'Bathroom & Ensuite':   Bath,
  'Garage & Laundry':     Car,
  'Storage':              Archive,
  'Exterior Landscaping': Trees,
  'Structure':            Building,
}

export default function ScheduleSection({
  section,
  items,
  selections,
  onSelectOption,
  onUpdateStatus,
  onUpdateNote,
  isAdmin,
  defaultOpen,
}) {
  const [open, setOpen] = useState(defaultOpen ?? true)

  const Icon = SECTION_ICONS[section.name] || Building

  // Count confirmed items in this section
  const confirmedCount = items.filter(i =>
    selections[i.id]?.status === 'confirmed'
  ).length

  return (
    <div className="schedule-section">
      <div
        className={`schedule-section-header ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
        aria-expanded={open}
      >
        <Icon size={16} className="schedule-section-icon" />
        <span className="schedule-section-name">{section.name}</span>
        <div className="schedule-section-meta">
          <span className="schedule-section-count">
            {confirmedCount}/{items.length} confirmed
          </span>
          <ChevronDown
            size={15}
            className={`schedule-section-chevron ${open ? 'open' : ''}`}
          />
        </div>
      </div>

      {open && (
        <div>
          {items.length === 0 ? (
            <div className="schedule-empty">No items in this section</div>
          ) : (
            items.map(item => (
              <ScheduleItem
                key={item.id}
                item={item}
                selection={selections[item.id]}
                onSelectOption={onSelectOption}
                onUpdateStatus={onUpdateStatus}
                onUpdateNote={onUpdateNote}
                isAdmin={isAdmin}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
