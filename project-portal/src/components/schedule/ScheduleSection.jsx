// ============================================================
// ScheduleSection.jsx
// Collapsible section group (Exterior, Kitchen, etc.)
// ============================================================

import React, { useState } from 'react';
import { CheckCircle, Lock } from 'lucide-react';

export default function ScheduleSection({ 
  section, 
  items = [], 
  selections = {}, 
  onSelectOption, 
  onUpdateNote,
  confirmSelection,
  isAdmin 
}) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ marginBottom: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '16px 20px',
          textAlign: 'left',
          background: '#f8fafc',
          border: 'none',
          fontSize: '17px',
          fontWeight: '600',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
      >
        {section.name}
        <span style={{ fontSize: '14px', color: '#64748b' }}>
          {items.length} items
        </span>
      </button>

      {open && (
        <div style={{ padding: '16px 20px' }}>
          {items.map(item => {
            const selection = selections[item.id] || {};
            const selectedOptionId = selection.option_id;
            const options = item.options || [];
            const currentOption = options.find(o => o.id === selectedOptionId) || options.find(o => o.is_default);
            const isConfirmed = selection.status === 'confirmed';

            return (
              <div key={item.id} style={{ 
                padding: '16px', 
                border: '1px solid #f1f5f9', 
                borderRadius: '10px', 
                marginBottom: '16px',
                background: '#fff',
                opacity: isConfirmed ? 0.95 : 1
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <strong>{item.label}</strong>
                    {item.cbi_code && <div style={{ fontSize: '12px', color: '#64748b' }}>CBI: {item.cbi_code}</div>}
                  </div>
                  {isConfirmed && <div style={{ color: '#166534' }}><CheckCircle size={18} /> Confirmed</div>}
                </div>

                <select
                  value={selectedOptionId || ''}
                  onChange={(e) => !isConfirmed && onSelectOption(item.id, e.target.value || null)}
                  disabled={isConfirmed && !isAdmin}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    marginBottom: '12px',
                    background: isConfirmed ? '#f9fafb' : '#fff'
                  }}
                >
                  <option value="">— Select option —</option>
                  {options.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label} {opt.supplier ? `(${opt.supplier})` : ''}
                    </option>
                  ))}
                </select>

                {currentOption && (
                  <div style={{ fontSize: '13px', color: '#166534', background: '#f0fdf4', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>
                    Selected: {currentOption.label}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Project-specific note (optional)"
                  value={selection.project_note || ''}
                  onChange={(e) => onUpdateNote(item.id, e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
                />

                {/* Confirm Button */}
                {!isConfirmed && (
                  <button 
                    onClick={() => confirmSelection(item.id)}
                    style={{ marginTop: '12px', padding: '6px 16px', background: '#166534', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px' }}
                  >
                    Confirm Selection
                  </button>
                )}

                {isConfirmed && isAdmin && (
                  <button 
                    onClick={() => onSelectOption(item.id, null)}
                    style={{ marginTop: '12px', padding: '6px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px' }}
                  >
                    <Lock size={14} style={{ marginRight: 6 }} /> Unlock for Edit
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
