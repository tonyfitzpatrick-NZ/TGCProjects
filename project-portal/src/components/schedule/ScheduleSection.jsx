// ============================================================
// ScheduleSection.jsx
// Collapsible section group (Exterior, Kitchen, etc.)
// ============================================================

import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Edit3 } from 'lucide-react';

export default function ScheduleSection({ 
  section, 
  items = [], 
  selections = {}, 
  onSelectOption, 
  onUpdateStatus, 
  onUpdateNote, 
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
            const currentOption = options.find(o => o.id === selectedOptionId) || 
                                 options.find(o => o.is_default);

            return (
              <div key={item.id} style={{ 
                padding: '16px', 
                border: '1px solid #f1f5f9', 
                borderRadius: '10px', 
                marginBottom: '16px',
                background: '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '15px' }}>{item.label}</strong>
                    {item.cbi_code && <div style={{ fontSize: '12px', color: '#64748b' }}>CBI: {item.cbi_code}</div>}
                  </div>
                  {currentOption && (
                    <div style={{ color: '#166534', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={16} /> Selected
                    </div>
                  )}
                </div>

                {/* Option Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {options.map(option => {
                    const isSelected = option.id === selectedOptionId;
                    return (
                      <div
                        key={option.id}
                        onClick={() => onSelectOption(item.id, option.id)}
                        style={{
                          padding: '14px',
                          border: isSelected ? '2px solid #1B2B4B' : '1px solid #e2e8f0',
                          borderRadius: '10px',
                          background: isSelected ? '#f0f4ff' : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontWeight: '500', marginBottom: '6px' }}>{option.label}</div>
                        {option.detail && <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.4' }}>{option.detail}</div>}
                        {option.supplier && <div style={{ fontSize: '12px', marginTop: '6px' }}>Supplier: {option.supplier}</div>}
                        {option.warranty && <div style={{ fontSize: '12px', color: '#166534' }}>Warranty: {option.warranty}</div>}
                      </div>
                    );
                  })}
                </div>

                {/* Note field */}
                <div style={{ marginTop: '12px' }}>
                  <input
                    type="text"
                    placeholder="Add project-specific note..."
                    value={selection.project_note || ''}
                    onChange={(e) => onUpdateNote(item.id, e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
