// ============================================================
// ScheduleSection.jsx
// Collapsible section group (Exterior, Kitchen, etc.)
// ============================================================

import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function ScheduleSection({ 
  section, 
  items = [], 
  selections = {}, 
  onSelectOption, 
  onUpdateStatus, 
  onUpdateNote, 
  isAdmin,
  defaultOpen = false 
}) {
  const [open, setOpen] = React.useState(defaultOpen);

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
          fontSize: '16px',
          fontWeight: '600',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
      >
        {section.name}
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          {items.length} items
        </span>
      </button>

      {open && (
        <div style={{ padding: '12px 20px' }}>
          {items.map(item => {
            const selection = selections[item.id] || {};
            const selectedOption = item.options?.find(o => o.id === selection.option_id) || 
                                  item.options?.find(o => o.is_default);

            return (
              <div key={item.id} style={{ 
                padding: '12px', 
                border: '1px solid #f1f5f9', 
                borderRadius: '8px', 
                marginBottom: '12px',
                background: '#fff'
              }}>
                <div style={{ fontWeight: '500', marginBottom: '6px' }}>{item.label}</div>
                {item.cbi_code && (
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                    CBI: {item.cbi_code}
                  </div>
                )}

                {selectedOption && (
                  <div style={{ fontSize: '13px', color: '#166534' }}>
                    ✓ {selectedOption.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
