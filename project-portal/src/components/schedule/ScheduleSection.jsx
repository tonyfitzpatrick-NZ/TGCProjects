// ============================================================
// ScheduleSection.jsx
// Polished version — cleaner cards, better spacing, improved links
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
    <div style={{ 
      marginBottom: '24px', 
      border: '1px solid #e2e8f0', 
      borderRadius: '12px', 
      background: '#fff', 
      overflow: 'hidden' 
    }}>
      {/* Section Header */}
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
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '400' }}>
          {items.length} items
        </span>
      </button>

      {open && (
        <div style={{ padding: '16px 20px' }}>
          {items.map(item => {
            const selection = selections[item.id] || {};
            const selectedId = selection.option_id;
            const options = item.options || [];
            const currentOption = options.find(o => o.id === selectedId);
            const hasSelection = !!selectedId;
            const isConfirmed = selection.status === 'confirmed';
            const showEditControls = !isConfirmed;

            return (
              <div 
                key={item.id} 
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '18px 20px',
                  marginBottom: '16px',
                  background: '#fff',
                  position: 'relative'
                }}
              >
                {/* Header row */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '12px' 
                }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                      {item.label}
                    </div>
                    {item.cbi_code && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        CBI: {item.cbi_code}
                      </div>
                    )}
                  </div>

                  {/* Small unlock icon for admins on confirmed items */}
                  {isConfirmed && isAdmin && (
                    <button
                      onClick={() => onSelectOption(item.id, null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        color: '#64748b',
                        opacity: 0.7
                      }}
                      title="Unlock for editing"
                    >
                      <Edit3 size={17} />
                    </button>
                  )}
                </div>

                {/* CONFIRMED VIEW MODE */}
                {!showEditControls && currentOption && (
                  <div style={{ 
                    background: '#f8fafc', 
                    borderRadius: '8px', 
                    padding: '16px', 
                    marginBottom: '12px' 
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '6px' }}>
                      {currentOption.label}
                    </div>

                    {currentOption.detail && (
                      <div style={{ fontSize: '14px', color: '#475569', marginBottom: '10px' }}>
                        {currentOption.detail}
                      </div>
                    )}

                    {/* Link Icons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                      {currentOption.product_link && (
                        <a 
                          href={currentOption.product_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={linkButtonStyle}
                        >
                          <ExternalLink size={14} /> Product
                        </a>
                      )}
                      {currentOption.branz_link && (
                        <a 
                          href={currentOption.branz_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={linkButtonStyle}
                        >
                          <Award size={14} /> BRANZ
                        </a>
                      )}
                      {currentOption.codemark_link && (
                        <a 
                          href={currentOption.codemark_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={linkButtonStyle}
                        >
                          <Shield size={14} /> CodeMark
                        </a>
                      )}
                    </div>

                    {selection.project_note && (
                      <div style={{ 
                        marginTop: '12px', 
                        fontSize: '13px', 
                        color: '#475569',
                        background: '#fff',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <strong style={{ color: '#334155' }}>Note:</strong> {selection.project_note}
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
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        marginBottom: '14px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">— Select an option —</option>
                      {options.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>

                    {currentOption && (
                      <div style={{ 
                        background: '#f0fdf4', 
                        border: '1px solid #86efac', 
                        borderRadius: '8px', 
                        padding: '14px', 
                        marginBottom: '14px',
                        fontSize: '14px'
                      }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{currentOption.label}</div>
                        {currentOption.detail && <div>{currentOption.detail}</div>}
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Add a project-specific note (optional)"
                      value={selection.project_note || ''}
                      onChange={(e) => onUpdateNote(item.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        marginBottom: '14px',
                        fontSize: '14px'
                      }}
                    />
                  </>
                )}

                {/* Confirm Button */}
                {!isConfirmed && (
                  <button
                    onClick={() => confirmSelection(item.id)}
                    style={{
                      padding: '10px 22px',
                      background: '#166534',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
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

// Shared link button style
const linkButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  background: '#fff',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '13px',
  color: '#1e40af',
  textDecoration: 'none',
  fontWeight: '500'
};
