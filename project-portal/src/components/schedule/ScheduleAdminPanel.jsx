// ============================================================
// ScheduleAdminPanel.jsx
// Admin-only panel for adding/editing/deleting item options
// and linking CodeMark / BRANZ / manual documents.
// Only rendered when userRole === 'admin'
// ============================================================

import React, { useState } from 'react';
import { CheckCircle, Edit3, ExternalLink } from 'lucide-react';

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
    <div style={{ marginBottom: '28px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '18px 24px',
          textAlign: 'left',
          background: '#f8fafc',
          border: 'none',
          fontSize: '18px',
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
        <div style={{ padding: '20px' }}>
          {items.map(item => {
            const selection = selections[item.id] || {};
            const selectedId = selection.option_id;
            const options = item.options || [];
            const currentOption = options.find(o => o.id === selectedId) || options.find(o => o.is_default);
            const isConfirmed = selection.status === 'confirmed';

            return (
              <div key={item.id} style={{ 
                border: '1px solid #e2e8f0', 
                borderRadius: '12px', 
                padding: '20px', 
                marginBottom: '20px',
                background: '#fff'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ fontSize: '17px' }}>{item.label}</strong>
                  {item.cbi_code && <div style={{ fontSize: '13px', color: '#64748b' }}>CBI: {item.cbi_code}</div>}
                </div>

                <select
                  value={selectedId || ''}
                  onChange={(e) => onSelectOption(item.id, e.target.value || null)}
                  disabled={isConfirmed && !isAdmin}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    border: '1px solid #d1d5db',
                    marginBottom: '16px',
                    fontSize: '15px'
                  }}
                >
                  <option value="">— Select option —</option>
                  {options.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>

                {currentOption && (
                  <div style={{ 
                    background: '#f0fdf4', 
                    border: '1px solid #86efac', 
                    borderRadius: '10px', 
                    padding: '16px', 
                    marginBottom: '16px' 
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>{currentOption.label}</div>
                    
                    {currentOption.detail && <div style={{ fontSize: '14px', marginBottom: '8px' }}>{currentOption.detail}</div>}
                    
                    {currentOption.supplier && <div>Supplier: {currentOption.supplier}</div>}
                    {currentOption.warranty && <div>Warranty: {currentOption.warranty}</div>}
                    
                    {currentOption.product_link && (
                      <a href={currentOption.product_link} target="_blank" rel="noopener noreferrer" 
                         style={{ color: '#3b82f6', display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                        <ExternalLink size={16} /> View Product Page
                      </a>
                    )}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Project-specific note (optional)"
                  value={selection.project_note || ''}
                  onChange={(e) => onUpdateNote(item.id, e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '16px' }}
                />

                {!isConfirmed && (
                  <button 
                    onClick={() => confirmSelection(item.id)}
                    style={{ padding: '10px 24px', background: '#166534', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '500' }}
                  >
                    Confirm Selection
                  </button>
                )}

                {isConfirmed && isAdmin && (
                  <button 
                    onClick={() => onSelectOption(item.id, null)}
                    style={{ 
                      padding: '8px 20px', 
                      background: '#f3f4f6', 
                      color: '#4b5563', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <Edit3 size={16} style={{ marginRight: 6 }} /> Unlock for Editing
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
