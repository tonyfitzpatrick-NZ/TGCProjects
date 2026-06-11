// ============================================================
// ScheduleSection.jsx
// Collapsible section group (Exterior, Kitchen, etc.)
// ============================================================

import React, { useState } from 'react';
import { Edit3, ExternalLink, Award, Shield } from 'lucide-react';

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
            const currentOption = options.find(o => o.id === selectedId);
            const hasSelection = !!selectedId;
            const isConfirmed = selection.status === 'confirmed';

            const showEditControls = !isConfirmed;

            return (
              <div key={item.id} style={{ 
                border: '1px solid #e2e8f0', 
                borderRadius: '12px', 
                padding: '20px', 
                marginBottom: '20px',
                background: '#fff',
                position: 'relative'
              }}>
                {/* Heading + small edit icon in top right */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div>
                    <strong style={{ fontSize: '17px' }}>{item.label}</strong>
                    {item.cbi_code && <div style={{ fontSize: '13px', color: '#64748b' }}>CBI: {item.cbi_code}</div>}
                  </div>

                  {/* Small edit icon - only for confirmed items (admin) */}
                  {isConfirmed && isAdmin && !showEditControls && (
                    <button 
                      onClick={() => onSelectOption(item.id, null)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        padding: '4px', 
                        cursor: 'pointer',
                        color: '#64748b'
                      }}
                      title="Unlock for Editing"
                    >
                      <Edit3 size={18} />
                    </button>
                  )}
                </div>

                {/* VIEW MODE */}
                {!showEditControls && currentOption && (
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '18px', marginBottom: '16px' }}>
                    <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '8px' }}>
                      {currentOption.label}
                    </div>
                    {currentOption.detail && <div style={{ fontSize: '14px', marginBottom: '10px' }}>{currentOption.detail}</div>}
                    {(currentOption.supplier || currentOption.warranty) && (
                      <div style={{ fontSize: '14px', marginBottom: '12px' }}>
                        {currentOption.supplier && <span>Supplier: {currentOption.supplier}</span>}
                        {currentOption.warranty && <span style={{ marginLeft: '16px' }}>Warranty: {currentOption.warranty}</span>}
                      </div>
                    )}

                    {/* Link Icons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {currentOption.product_link && (
                        <a href={currentOption.product_link} target="_blank" rel="noopener noreferrer"
                           style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', color: '#1e40af', textDecoration: 'none' }}>
                          <ExternalLink size={15} /> Product Page
                        </a>
                      )}
                      {currentOption.branz_link && (
                        <a href={currentOption.branz_link} target="_blank" rel="noopener noreferrer"
                           style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', color: '#1e40af', textDecoration: 'none' }}>
                          <Award size={15} /> BRANZ
                        </a>
                      )}
                      {currentOption.codemark_link && (
                        <a href={currentOption.codemark_link} target="_blank" rel="noopener noreferrer"
                           style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', color: '#1e40af', textDecoration: 'none' }}>
                          <Shield size={15} /> CodeMark
                        </a>
                      )}
                    </div>

                    {selection.project_note && (
                      <div style={{ marginTop: '14px', fontSize: '14px', color: '#475569' }}>
                        <strong>Note:</strong> {selection.project_note}
                      </div>
                    )}
                  </div>
                )}

                {/* EDIT MODE */}
                {showEditControls && (
                  <>
                    <select
                      value={selectedId || ''}
                      onChange={(e) => onSelectOption(item.id, e.target.value || null)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '16px' }}
                    >
                      <option value="">— Select option —</option>
                      {options.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>

                    {currentOption && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                        <div style={{ fontWeight: '600', marginBottom: '8px' }}>{currentOption.label}</div>
                        {currentOption.detail && <div style={{ fontSize: '14px' }}>{currentOption.detail}</div>}
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Project-specific note (optional)"
                      value={selection.project_note || ''}
                      onChange={(e) => onUpdateNote(item.id, e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '12px' }}
                    />
                  </>
                )}

                {/* Action Buttons */}
                {!isConfirmed && (
                  <button 
                    onClick={() => confirmSelection(item.id)}
                    style={{ padding: '10px 24px', background: '#166534', color: '#fff', border: 'none', borderRadius: '8px' }}
                  >
                    {hasSelection ? 'Save & Confirm' : 'Confirm Selection'}
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
