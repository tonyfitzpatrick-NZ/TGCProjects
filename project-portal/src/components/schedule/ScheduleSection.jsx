// ============================================================
// ScheduleSection.jsx
// Collapsible section group (Exterior, Kitchen, etc.)
// ============================================================

import React, { useState } from 'react';
import { CheckCircle, Lock, Edit3 } from 'lucide-react';

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

  // Group items by CBI code within this section
  const groupedByCBI = items.reduce((acc, item) => {
    const key = item.cbi_code || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

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
        <span style={{ fontSize: '14px', color: '#64748b' }}>{items.length} items</span>
      </button>

      {open && (
        <div style={{ padding: '16px 20px' }}>
          {Object.keys(groupedByCBI).map(cbiCode => {
            const cbiItems = groupedByCBI[cbiCode];
            return (
              <div key={cbiCode} style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px', fontWeight: '500' }}>
                  CBI {cbiCode}
                </div>
                
                {cbiItems.map(item => {
                  const selection = selections[item.id] || {};
                  const selectedId = selection.option_id;
                  const options = item.options || [];
                  const currentOption = options.find(o => o.id === selectedId) || options.find(o => o.is_default);
                  const isConfirmed = selection.status === 'confirmed';

                  return (
                    <div key={item.id} style={{ 
                      padding: '16px', 
                      border: '1px solid #f1f5f9', 
                      borderRadius: '10px', 
                      marginBottom: '16px',
                      background: '#fff'
                    }}>
                      <div style={{ marginBottom: '12px' }}>
                        <strong>{item.label}</strong>
                      </div>

                      <select
                        value={selectedId || ''}
                        onChange={(e) => onSelectOption(item.id, e.target.value || null)}
                        disabled={isConfirmed && !isAdmin}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px' }}
                      >
                        <option value="">— Select option —</option>
                        {options.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
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

                      {!isConfirmed && (
                        <button onClick={() => confirmSelection(item.id)} style={{ marginTop: '12px', padding: '8px 20px', background: '#166534', color: '#fff', border: 'none', borderRadius: '6px' }}>
                          Confirm Selection
                        </button>
                      )}

                      {isConfirmed && isAdmin && (
                        <button onClick={() => onSelectOption(item.id, null)} style={{ marginTop: '12px', padding: '8px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px' }}>
                          <Edit3 size={16} style={{ marginRight: 6 }} /> Unlock & Edit
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
